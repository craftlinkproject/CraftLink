import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { api } from "@services/api";
import { serverUrl } from "../../config/server";
import notificationSound from "../assets/start.mp3";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { userData } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const audioRef = useRef(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userData) return;
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    } catch {
      // silently fail
    }
  }, [userData]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket connection
  useEffect(() => {
    if (!userData?._id) return;

    const s = io(serverUrl, {
      withCredentials: true,
      reconnection: true,
    });

    s.on("connect", () => {
      s.emit("addUser", userData._id);
    });

    s.on("newNotification", (data) => {
      setNotifications((prev) => {
        const idx = prev.findIndex((n) => n._id === data.notification._id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = data.notification;
          return next;
        }
        return [data.notification, ...prev];
      });
      setUnreadCount(data.unread);

      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [userData?._id]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await api.delete("/api/notifications");
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      const res = await api.put(`/api/notifications/read/${id}`);
      if (id === "all") {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
      }
      setUnreadCount(res.data.unread);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, fetchNotifications, deleteAllNotifications }}
    >
      <audio ref={audioRef} src={notificationSound} preload="none" />
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
