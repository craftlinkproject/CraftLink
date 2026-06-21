import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

import {
    fetchMessages,
    sendMessage,
    clearUnreadForConversation,
    fetchUnreadCount,
    addMessage,
    setMessageFailed,
    updateMessagesStatus,
    deleteConversationThunk,
} from "../../../redux/messageSlice";
import { api } from "@services/api";
import { compressImage } from "@hooks";
import { decrypt } from "@/utils/encryption.js";

/**
 * useMessageLogic
 * ----------------
 * Central hook encapsulating messaging behavior for the admin message page.
 * - Loads/saves conversations and messages (local storage + server)
 * - Manages a persistent socket connection for realtime messaging
 * - Exposes helpers for sending, resending, typing, and deleting
 * - Produces derived display data for the UI
 *
 * NOTE: This file contains imperative logic and refs by design. Keep
 * functionality intact when editing — prefer adding comments/clarity
 * rather than changing behavior.
 */
import {
    saveConversations,
    getConversations,
    saveMessages,
    getMessagesForConversation,
    clearMessagesForConversation,
    getAllMessageKeys,
} from "@/utils/storage.js";
export const useMessageLogic = () => {
    const navigate = useNavigate();
    const { userId: receiverId } = useParams();
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.user?.userData);
    const messages = useSelector((state) => state.messages?.messages || []);
    // -------------------- Refs (mutable, non-rendering) --------------------
    // Hold mutable handles that should NOT trigger re-renders.
    // These refs are used for low-level, persistent state such as the
    // socket instance, DOM refs, and transient bookkeeping (typing timers,
    // initialization guards). Keep them out of React state to avoid
    // unnecessary renders.
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef("");
    const inputElementRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeConversationRef = useRef(null);
    const currentOtherUserRef = useRef(null);
    const conversationInitRef = useRef(false);
    const typingUsersRef = useRef({});
    const typingTimeoutRef = useRef(null);
    const encryptionKeysRef = useRef({});
    // -------------------- Local state (affects rendering) --------------------
    // UI-facing state (kept in React) — controls rendering and should be
    // updated with setState helpers. Avoid heavy computation in render;
    // derive expensive values with useMemo/useCallback below.
    const [activeMenu, setActiveMenu] = useState(0);
    const [sidebarHide, setSidebarHide] = useState(false);
    const [searchShow, setSearchShow] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isLocalLoaded, setIsLocalLoaded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [otherUser, setOtherUser] = useState({
        online: false,
        typing: false,
        _id: null,
        name: "",
        avatar: "",
    });
    const isLoading = useMemo(
        () => !currentUser?._id || !isLocalLoaded,
        [currentUser?._id, isLocalLoaded],
    );
    const [screenLoaded, setScreenLoaded] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const checkScreen = () => setIsMobileView(window.innerWidth <= 768);

        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);
    const currentOtherUser = useMemo(() => {
        if (!activeConversation?.members) return null;
        return (
            activeConversation.members.find((m) => m._id !== currentUser._id) || null
        );
    }, [activeConversation, currentUser?._id]);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
        currentOtherUserRef.current = currentOtherUser;
    }, [activeConversation, currentOtherUser]);
    // Load persisted conversations and messages from local storage.
    // - Adds locally-saved messages into Redux so the UI can render
    //   immediately while server reconciliation happens.
    // - Sets `isLocalLoaded` and triggers server fetch afterwards.
    useEffect(() => {
        const loadLocalData = async () => {
            const localConvs = await getConversations();
            setConversations(localConvs);
            for (const conv of localConvs) {
                const localMsgs = await getMessagesForConversation(conv._id);
                localMsgs.forEach((msg) => dispatch(addMessage(msg)));
            }
            setIsLocalLoaded(true);
            await fetchConversationsFn();
        };

        loadLocalData();
    }, []);
    // Persist conversation list whenever it changes. This lets the app
    // restore local state quickly on reload or when offline.
    useEffect(() => {
        saveConversations(conversations).catch((err) =>
            console.error("Failed to save conversations locally:", err),
        );
    }, [conversations]);
    // Sync in-memory Redux messages back to local storage. Runs after
    // local load completes to ensure server fetch/merge doesn't clobber
    // recent local-only messages. Also clears stale message keys.
    useEffect(() => {
        if (!isLocalLoaded) return;
        const saveAllMessagesByConversation = async () => {
            const grouped = messages.reduce((acc, msg) => {
                if (!msg.conversationId) return acc;
                if (!acc[msg.conversationId]) acc[msg.conversationId] = [];
                acc[msg.conversationId].push(msg);
                return acc;
            }, {});
            for (const convId in grouped) {
                await saveMessages(convId, grouped[convId]);
            }
            const allKeys = await getAllMessageKeys();
            for (const key of allKeys) {
                const convId = key.replace("messages_", "");
                if (!grouped[convId]) {
                    await clearMessagesForConversation(convId);
                }
            }
        };
        saveAllMessagesByConversation();
    }, [messages, isLocalLoaded]);
    // Fetch conversations from the server and attempt to decrypt the
    // `lastMessage` for display. Does not mutate Redux messages — only
    // updates the conversations list used by the sidebar and header.

    const fetchConversationsFn = async () => {
        try {
            const res = await api.get("/api/message/conversation");
            const convs = res.data;
            const processedConvs = convs.map((conv) => {
                if (conv.encryptionKey) {
                    encryptionKeysRef.current[conv._id] =
                        conv.encryptionKey;
                }
                const lastMsg = conv.lastMessage;
                if (
                    lastMsg?.text &&
                    encryptionKeysRef.current[conv._id]
                ) {
                    try {
                        return {
                            ...conv,
                            lastMessage: {
                                ...lastMsg,
                                text: decrypt(
                                    lastMsg.text,
                                    encryptionKeysRef.current[conv._id]
                                ),
                            },
                        };
                    } catch (err) {
                        console.error(
                            "Failed to decrypt lastMessage:",
                            err
                        );
                        return conv;
                    }
                }
                return conv;
            });

            setConversations(
                processedConvs.sort(
                    (a, b) =>
                        new Date(b.lastMessage?.createdAt || 0) -
                        new Date(a.lastMessage?.createdAt || 0)
                )
            );
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        }
    };
    // Respond to `receiverId` route param changes.
    // - Re-uses an existing conversation if present.
    // - Creates a new conversation via API when necessary.
    // - Initiates fetching of messages for the active conversation.
    useEffect(() => {
        if (!receiverId || !isLocalLoaded || !currentUser?._id) return;
        if (receiverId === currentUser._id) {
            navigate("/message", { replace: true });
            return;
        }
        const existingConv = conversations.find((c) =>
            c.members.some((m) => m._id === receiverId),
        );
        if (existingConv) {
            if (!activeConversation || activeConversation._id !== existingConv._id) {
                setActiveConversation(existingConv);
            }
            if (existingConv._id) dispatch(fetchMessages(existingConv._id));
            return;
        }
        const createConversation = async () => {
            try {
                const res = await api.post("/api/message/conversation", { receiverId });
                const conversation = res.data;
                if (!conversation) return;
                setActiveConversation(conversation);
                setConversations((prev) =>
                    prev.some((c) => c._id === conversation._id)
                        ? prev
                        : [conversation, ...prev],
                );
                if (conversation._id) dispatch(fetchMessages(conversation._id));
            } catch (err) {
                console.error("Failed to create/init conversation:", err);
            }
        };
        createConversation();
    }, [receiverId, currentUser?._id, dispatch, isLocalLoaded]);
    // Derive the list of conversations that should be shown in the
    // sidebar. Filters out deleted conversations and singleton drafts.
    const visibleConversations = useMemo(() => {
        return (
            conversations?.filter(
                (c) =>
                    !c.deletedFor?.includes(currentUser._id) &&
                    !c.members.some(
                        (m) => m._id === currentUser._id && c.members.length === 1,
                    ) &&
                    (c.lastMessage || c.createdBy === currentUser._id),
            ) || []
        );
    }, [conversations, currentUser._id]);
    // Keep `otherUser` UI state in sync with the currently active
    // conversation member and the online user list reported by the
    // server. This controls the presence/typing indicators in the UI.
    useEffect(() => {
        if (currentOtherUser) {
            setOtherUser((prev) => ({
                ...prev,
                _id: currentOtherUser._id,
                name: currentOtherUser.name,
                avatar: currentOtherUser.avatar,
                online: onlineUsers.includes(currentOtherUser._id),
                typing: false,
            }));
        } else {
            setOtherUser({
                online: false,
                typing: false,
                _id: null,
                name: "",
                avatar: "",
            });
        }
    }, [currentOtherUser, onlineUsers]);
    // Socket lifecycle and event handlers.
    // - Establishes a socket.io connection and registers all handlers
    //   for incoming messages, typing, status updates and presence.
    // - Keeps `conversations` and Redux `messages` in sync with
    //   real-time events without requiring a full page refresh.
    useEffect(() => {
        if (!currentUser._id) return;
        const socket = io("https://craftlink-production.up.railway.app", {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;
        const joinSocket = () => {
            socket.emit("addUser", String(currentUser._id));
        };
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            fetchConversationsFn();
            joinSocket();
            setIsConnected(true);
        });
        socket.on("reconnect", () => {
            console.log("Socket reconnected:", socket.id);
            fetchConversationsFn();
            joinSocket();
        });
        // Handler: new incoming message. Responsibilities:
        // 1. Resolve or fetch an encryption key if necessary.
        // 2. Decrypt message text when possible (safe fallback if not).
        // 3. Upsert the conversation in local `conversations` and
        //    dispatch the message into Redux so the chat UI updates.
        socket.on("getMessage", async (message) => {
            if (!message) return;

            let encryptionKey =
                encryptionKeysRef.current[message.conversationId] ||
                message.conversation?.encryptionKey;
            if (!encryptionKey) {
                try {
                    const res = await api.get("/api/message/conversation");
                    const conv = res.data.find(
                        (c) => c._id === message.conversationId
                    );
                    if (!conv?.encryptionKey) {
                        console.warn("Encryption key not found.");
                        return;
                    }
                    encryptionKey = conv.encryptionKey;
                    encryptionKeysRef.current[message.conversationId] =
                        encryptionKey;

                } catch (err) {
                    console.error("Failed to fetch encryption key:", err);
                    return;
                }
            }
            try {
                if (message.text && encryptionKey) {
                    message = {
                        ...message,
                        text: decrypt(message.text, encryptionKey),
                    };
                }
            } catch (err) {
                console.error("Decrypt failed:", err);
                return;
            }
            setConversations((prev) => {
                let convExists = prev.find(
                    (c) => c._id === message.conversationId
                );
                if (convExists) {
                    const updatedConv = {
                        ...convExists,
                        deletedFor: convExists.deletedFor?.filter(
                            (id) => id !== currentUser._id
                        ),
                        lastMessage: message,
                    };

                    return prev
                        .map((c) =>
                            c._id === updatedConv._id ? updatedConv : c
                        )
                        .sort(
                            (a, b) =>
                                new Date(b.lastMessage?.createdAt || 0) -
                                new Date(a.lastMessage?.createdAt || 0)
                        );
                }
                const newConv = {
                    _id: message.conversationId,
                    members: [currentUser, message.sender],
                    lastMessage: message,
                    deletedFor: [],
                };

                return [newConv, ...prev].sort(
                    (a, b) =>
                        new Date(b.lastMessage?.createdAt || 0) -
                        new Date(a.lastMessage?.createdAt || 0)
                );
            });
            dispatch(addMessage({ ...message, status: "sent" }));
            dispatch(fetchUnreadCount());
            if (message.conversationId === activeConversationRef.current?._id) {
                socketRef.current?.emit("markAsSeen", {
                    conversationId: message.conversationId,
                    userId: currentUser._id,
                });
            }
            socketRef.current?.emit("messageDelivered", {
                messageId: message._id,
                conversationId: message.conversationId,
            });
        });
        socket.on("typing", (data) => {
            const from = data?.from;
            if (!from) return;
            if (from === currentOtherUserRef.current?._id) {
                setOtherUser((prev) => ({ ...prev, typing: true }));
            }
            if (typingUsersRef.current[from])
                clearTimeout(typingUsersRef.current[from]);
            typingUsersRef.current[from] = setTimeout(() => {
                if (from === currentOtherUserRef.current?._id) {
                    setOtherUser((prev) => ({ ...prev, typing: false }));
                }
                delete typingUsersRef.current[from];
            }, 1500);
        });
        socket.on("stopTyping", (data) => {
            const from = data?.from;
            if (!from) return;
            if (typingUsersRef.current[from]) {
                clearTimeout(typingUsersRef.current[from]);
                delete typingUsersRef.current[from];
            }
            setOtherUser((prev) => ({ ...prev, typing: false }));
        });
        socket.on("allOnlineUsers", (users) => {
            setOnlineUsers(users);
            setOtherUser((prev) =>
                prev._id ? { ...prev, online: users.includes(prev._id) } : prev,
            );
        });
        // Handler: message delivery/read status updates. This keeps
        // the Redux slice authoritative for message `status` values so
        // message bubbles re-render with up-to-date state.
        socket.on("updateMessageStatus", ({ messageIds, status }) => {
            if (!messageIds || messageIds.length === 0) return;
            dispatch(updateMessagesStatus({ messageIds, status }));
        });
        // Handler: messageSeen events emitted by the server when the
        // remote user reads messages. Only update local UI for the
        // currently-active conversation to avoid irrelevant changes.
        socket.on("messageSeen", ({ conversationId, messageIds }) => {
            if (conversationId === activeConversationRef.current?._id) {
                dispatch(
                    updateMessagesStatus({ conversationId, messageIds, status: "seen" }),
                );
            }
        });
        socket.on("deleteConversationForAll", ({ conversationId }) => {
            setConversations((prev) => prev.filter((c) => c._id !== conversationId));
            if (activeConversationRef.current?._id === conversationId) {
                setActiveConversation(null);
                navigate("/message");
            }
        });
        // Connection lifecycle events: reconnect and disconnect.
        socket.on("disconnect", () => {
            console.log("Socket disconnect:", socket.id);
            setIsConnected(false);
        });
        return () => {
            socket.disconnect();
        };
    }, [currentUser._id]);
    const handleTyping = (text) => {
        const trimmed = text.trim();
        if (!trimmed) {
            socketRef.current?.emit("stopTyping", {
                id: currentUser._id,
                to: currentOtherUserRef.current?._id,
            });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            return;
        }
        socketRef.current?.emit("typing", {
            from: currentUser._id,
            to: currentOtherUserRef.current?._id,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("stopTyping", {
                from: currentUser._id,
                to: currentOtherUserRef.current?._id,
            });
        }, 1500);
    };
    // Upload helper with basic retry logic. Returns the hosted image URL
    // from Cloudinary or throws if all attempts fail.
    const uploadImageWithRetry = async (file, maxRetries = 3) => {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", "CraftLink_Chat");
                formData.append("folder", "craftlink/messages");
                const res = await fetch(
                    "https://api.cloudinary.com/v1_1/dhynqaw42/image/upload",
                    { method: "POST", body: formData },
                );
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();
                return data.secure_url;
            } catch (err) {
                attempt++;
                if (attempt >= maxRetries) throw err;
                console.warn(`Upload failed, retrying (${attempt}/${maxRetries})`);
                await new Promise((r) => setTimeout(r, 1000));
            }
        }
    };
    // Convert a File to a base64 data URL (used when saving offline).
    const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    // Primary send flow (optimistic):
    // - Create and dispatch a temporary message for instant UI feedback.
    // - Ensure conversation exists (create if necessary).
    // - Upload image if present, send the message to server, decrypt
    //   returned content if needed, then replace the temp message with
    //   the persisted server message.
    const handleSendMessage = async () => {
        const messageText = inputRef.current?.trim();
        if (!messageText && !image) return;
        const tempId =
            "temp_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        const tempPreviewUrl = previewUrl;
        let imageToUpload = image;
        if (!navigator.onLine) {
            let base64Image = null;
            if (image) {
                base64Image = await fileToBase64(image);
            }
            dispatch(
                addMessage({
                    _id: tempId,
                    sender: currentUser,
                    text: messageText || "",
                    image: base64Image,
                    status: "failed",
                    conversationId: activeConversation?._id,
                    createdAt: new Date().toISOString(),
                }),
            );
            return;
        }
        setIsSending(true);
        try {
            let conversationId = activeConversation?._id;
            let conversationObject = activeConversation;
            if (conversationObject?.encryptionKey) {
                encryptionKeysRef.current[conversationId] =
                    conversationObject.encryptionKey;
            }
            if (!conversationId) {
                const existingConversation = conversations.find((c) =>
                    c.members.some((m) => m._id === currentOtherUserRef.current?._id),
                );
                if (existingConversation) {
                    conversationId = existingConversation._id;
                    conversationObject = existingConversation;
                    setActiveConversation(existingConversation);
                } else {
                    const res = await api.post("/api/message/conversation", {
                        receiverId: currentOtherUserRef.current?._id,
                    });
                    conversationObject = res.data;
                    conversationId = res.data._id;
                    setActiveConversation(res.data);
                    setConversations((prev) => [res.data, ...prev]);
                }
            }
            const tempMessage = {
                _id: tempId,
                sender: currentUser,
                text: messageText || "",
                image: tempPreviewUrl || null,
                imagePreview: tempPreviewUrl,
                imageFile: imageToUpload,
                status: "sending",
                conversationId,
                createdAt: new Date().toISOString(),
            };
            dispatch(addMessage(tempMessage));
            setConversations((prev) =>
                prev
                    .map((c) =>
                        c._id === conversationId
                            ? { ...c, lastMessage: { ...tempMessage } }
                            : c,
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.lastMessage?.createdAt || 0) -
                            new Date(a.lastMessage?.createdAt || 0),
                    ),
            );
            if (inputElementRef.current) inputElementRef.current.value = "";
            inputRef.current = "";
            if (fileInputRef.current) fileInputRef.current.value = "";
            setImage(null);
            setPreviewUrl(null);
            let imageUrl = null;
            if (imageToUpload) {
                imageToUpload = await compressImage(imageToUpload);
                imageUrl = await uploadImageWithRetry(imageToUpload);
            }
            const receiverId =
                currentOtherUserRef.current?._id ||
                conversationObject.members.find((m) => m._id !== currentUser._id)?._id;
            if (!receiverId) throw new Error("Receiver not found");
            const messageData = {
                conversationId,
                text: messageText || "",
                image: imageUrl,
                receiverId,
            };
            let savedMessage = await dispatch(sendMessage(messageData)).unwrap();
            if (savedMessage.text) {
                try {
                    const encryptionKey =
                        encryptionKeysRef.current[conversationId] ||
                        conversationObject?.encryptionKey;

                    if (encryptionKey) {
                        savedMessage.text = decrypt(
                            savedMessage.text,
                            encryptionKey
                        );
                    }
                } catch (err) {
                    console.error("Decrypt after send failed:", err);
                }
            }
            socketRef.current?.emit("sendMessage", { ...savedMessage, receiverId });
            const finalMessage = {
                ...savedMessage,
                replaceId: tempId,
                status: "sent",
                image: imageUrl,
                imagePreview: tempPreviewUrl,
                imageFile: imageToUpload,
            };
            dispatch(addMessage(finalMessage));
        } catch (err) {
            console.error("Send message failed:", err);
            dispatch(setMessageFailed({ tempId }));
        } finally {
            setIsSending(false);
        }
    };
    // Retry logic for messages previously marked as `failed`.
    // Attempts to re-upload images and resend the message via the
    // existing sendMessage thunk + socket emission.
    const resendMessage = useCallback(
        async (failedMessage) => {
            const tempId = failedMessage._id;
            dispatch(
                updateMessagesStatus({
                    messageIds: tempId,
                    status: "sending",
                }),
            );
            try {
                let imageUrl = failedMessage.image;
                if (imageUrl?.startsWith("data:image") || failedMessage.imageFile) {
                    const fileToUpload = failedMessage.imageFile
                        ? failedMessage.imageFile
                        : await (async () => {
                            const res = await fetch(imageUrl);
                            const blob = await res.blob();
                            return new File([blob], `image-${Date.now()}.png`, { type: blob.type });
                        })();
                    imageUrl = await uploadImageWithRetry(fileToUpload);
                }
                if (!imageUrl && failedMessage.imageFile) {
                    imageUrl = await uploadImageWithRetry(failedMessage.imageFile);
                }
                const receiverIdForMessage = currentOtherUserRef.current?._id;
                if (!receiverIdForMessage) throw new Error("Receiver not found");
                const messageData = {
                    conversationId: failedMessage.conversationId,
                    text: failedMessage.text,
                    image: imageUrl,
                    receiverId: receiverIdForMessage,
                };
                if (!socketRef.current?.connected) {
                    console.warn("Socket not connected, waiting for reconnect...");
                    await new Promise((resolve) => {
                        const onConnect = () => {
                            socketRef.current?.off("connect", onConnect);
                            resolve();
                        };
                        socketRef.current?.on("connect", onConnect);
                    });
                }
                const savedMessage = await dispatch(sendMessage(messageData)).unwrap();
                if (savedMessage.text) {
                    let encryptionKey =
                        encryptionKeysRef.current[failedMessage.conversationId] ||
                        activeConversationRef.current?.encryptionKey;
                    if (encryptionKey) {
                        try {
                            savedMessage.text = decrypt(savedMessage.text, encryptionKey);
                        } catch (err) {
                            console.error("Decrypt after send failed:", err);
                        }
                    }
                }
                dispatch(
                    addMessage({
                        ...savedMessage,
                        replaceId: tempId,
                        status: "sent",
                        image: imageUrl,
                        imageFile: failedMessage.imageFile || null,
                    }),
                );
                socketRef.current.emit("sendMessage", {
                    ...savedMessage,
                    receiverId: receiverIdForMessage,
                });
                console.log(
                    "Resent message via socket:",
                    savedMessage,
                    "receiver:",
                    receiverIdForMessage,
                );
            } catch (err) {
                console.error("Resend message failed:", err);
                dispatch(setMessageFailed({ tempId }));
            }
        },
        [dispatch],
    );
    // Delete conversation (local and optionally for all participants).
    // Updates both server state via thunk and local `conversations`.
    const handleDeleteConversation = async (convId) => {
        const deleteForAll = window.confirm(
            "Do you want to delete this conversation for everyone? Click Cancel to delete only for you.",
        );
        const convToDelete = conversations.find((c) => c._id === convId);
        if (!convToDelete) return;
        try {
            await dispatch(
                deleteConversationThunk({
                    conversationId: convId,
                    forAll: deleteForAll,
                }),
            ).unwrap();
            setConversations(
                (prev) =>
                    prev
                        .map((c) =>
                            c._id === convId
                                ? {
                                    ...c,
                                    deletedFor: [...(c.deletedFor || []), currentUser._id],
                                }
                                : c,
                        )
                        .filter((c) => !c.deletedFor?.includes(currentUser._id)),
            );
            if (activeConversation?._id === convId) {
                setActiveConversation(null);
                navigate("/message");
            }
            console.log("Chat render");
        } catch (err) {
            console.error("Failed to delete conversation:", err);
            alert("Failed to delete conversation. Please try again.");
        }
    };
    // Derive the message list to render for the active conversation.
    // - Filters messages belonging to the conversation
    // - Hides messages the current user deleted
    // - Sorts by creation date and injects date separators
    const displayMessages = useMemo(() => {
        if (!activeConversation?._id) return [];
        const msgs = messages
            .filter(
                (msg) =>
                    String(msg.conversationId) === String(activeConversation._id) &&
                    !(msg.deletedFor || []).includes(currentUser._id),
            )
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return msgs.map((msg, index) => {
            const currentDate = new Date(msg.createdAt).toDateString();
            const prevDate =
                index > 0 ? new Date(msgs[index - 1].createdAt).toDateString() : null;
            return {
                ...msg,
                text: msg.text || "",
                showDateSeparator: currentDate !== prevDate,
                formattedDate: new Date(msg.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
            };
        });
    }, [messages, activeConversation?._id]);
    // When a conversation row is clicked in the sidebar, make it the
    // active conversation and navigate to the conversation route.
    const handleConversationClick = useCallback(
        (conv) => {
            setActiveConversation(conv);
            dispatch(clearUnreadForConversation(conv._id));
            socketRef.current?.emit("markAsSeen", {
                conversationId: conv._id,
                userId: currentUser._id,
            });
            const otherId = conv.members?.find((m) => m._id !== currentUser._id)?._id;
            if (otherId) requestAnimationFrame(() => navigate(`/message/${otherId}`));
        },
        [navigate, currentUser._id],
    );
    // Cleanup on unmount: revoke any object URLs and clear timers.
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            Object.values(typingUsersRef.current).forEach(clearTimeout);
        };
    }, []);
    // When the app regains network connectivity, attempt to resend any
    // locally-failed messages to avoid data loss.
    useEffect(() => {
        const handleOnline = async () => {
            console.log("Back online 🚀");
            const failedMessages = messages.filter((msg) => msg.status === "failed");
            for (const msg of failedMessages) {
                try {
                    await resendMessage(msg);
                } catch (err) {
                    console.error("Auto resend failed:", err);
                }
            }
        };
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("online", handleOnline);
        };
    }, [messages, resendMessage]);
    // Auto-scroll the chat view to the bottom when `displayMessages`
    // changes. Uses the `messagesEndRef` sentinel to find the scroll
    // container and set its scroll position.
    useEffect(() => {
        if (!messagesEndRef.current) return;
        const container = messagesEndRef.current.parentElement;
        if (!container) return;
        requestAnimationFrame(() => {
            container.scrollTop = 0;
        });
    }, [displayMessages]);
    return {
        navigate,
        receiverId,
        dispatch,
        currentUser,
        messages,
        visibleConversations,
        socketRef,
        messagesEndRef,
        inputRef,
        inputElementRef,
        fileInputRef,
        activeConversationRef,
        currentOtherUserRef,
        conversationInitRef,
        typingUsersRef,
        typingTimeoutRef,
        activeMenu,
        setActiveMenu,
        sidebarHide,
        setSidebarHide,
        searchShow,
        setSearchShow,
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
        image,
        setImage,
        previewUrl,
        setPreviewUrl,
        isSending,
        setIsSending,
        onlineUsers,
        setOnlineUsers,
        otherUser,
        setOtherUser,
        currentOtherUser,
        handleDeleteConversation,
        displayMessages,
        isLoading,
        fetchConversationsFn,
        handleSendMessage,
        resendMessage,
        handleTyping,
        handleConversationClick,
        uploadImageWithRetry,
        isMobileView,
        screenLoaded,
    };
};
export default useMessageLogic;
