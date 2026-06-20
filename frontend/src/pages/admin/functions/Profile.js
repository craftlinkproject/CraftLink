// ============================================================================
// IMPORTS
// ============================================================================
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axios from "axios";

import { api } from "@services/api";
import { setCreatorCourseData } from "../../../redux/courseSlice";
import { setUserData, clearUserMessage, setUserCache } from "../../../redux/userSlice";
import { changePassword } from "../../../redux/userThunk";

import { useTheme } from "../../../context/ThemeContext";
import { useInputAnimation, usePasswordToggle } from "@hooks";
import { decrypt } from "@/utils/encryption";
// ============================================================================
// HOOK
// ============================================================================
export const useProfileLogic = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useParams();
  const encryptionKeysRef = useRef({});
  const lastLoadedUserIdRef = useRef(null);
  const { darkMode, setDarkMode } = useTheme();
  const { handleFocus, handleBlur } = useInputAnimation();
  const { showPass, togglePass, inputType } = usePasswordToggle();

  // ========================================================================
  // STATE - UI & LAYOUT
  // ========================================================================
  const [activeMenu, setActiveMenu] = useState(0);
  const [sidebarHide, setSidebarHide] = useState(false);
  const [searchShow, setSearchShow] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");
  const [showSort, setShowSort] = useState(false);

  // ========================================================================
  // STATE - LOADING & ERRORS
  // ========================================================================
  const [profileLoading, setProfileLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState(null);

  // ========================================================================
  // STATE - PROFILE DATA
  // ========================================================================
  const [profileUser, setProfileUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const originalProfile = useRef({ firstName: "", lastName: "", bio: "" });

  // ========================================================================
  // STATE - FORMS
  // ========================================================================
  const [editMode, setEditMode] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileTab, setProfileTab] = useState("profile");
  const [userPosts, setUserPosts] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  // ========================================================================
  // STATE - FORMS
  // ========================================================================
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalBuyers: 0,
    totalCourses: 0,
    totalCourseBuyers: 0,
  });

  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState(null);

  // Add earnings state
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    totalWithdrawn: 0,
    availableBalance: 0,
    computedAvailable: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    reservedAmount: 0,
  });
  const [earningsLoading, setEarningsLoading] = useState(false);

  // ========================================================================
  // STATE - FILTERS
  // ========================================================================
  const [sortFilter, setSortFilter] = useState({
    all: true,
    published: false,
    unpublished: false,
  });

  // ========================================================================
  // REDUX STATE
  // ========================================================================
  const { userData: currentUser, loading: userLoading, error: userError, successMessage } = useSelector(
    (state) => state.user
  );

  const userCache = useSelector((state) => state.user?.userCache || {});
  const cachedUser = useMemo(() => userCache[userId] || null, [userCache, userId]);

  // ========================================================================
  // DERIVED STATE
  // ========================================================================
  const isMyProfile = useMemo(() => currentUser && String(currentUser._id) === String(userId), [
    currentUser,
    userId,
  ]);

  const displayedUser = useMemo(() => {
    if (!userId) return currentUser;
    if (isMyProfile) return currentUser;
    return profileUser;
  }, [userId, isMyProfile, currentUser, profileUser]);

  const isInstructor = useMemo(() => displayedUser?.role === 2, [displayedUser]);
  const isCraftsman = useMemo(() => displayedUser?.role === 1, [displayedUser]);
  const canShowPosts = useMemo(() => {
    if (!isMyProfile) return false;
    if (isCraftsman) return certificates.length > 0;
    return true;
  }, [isMyProfile, isCraftsman, certificates]);
  const isOwner = useMemo(() => isMyProfile, [isMyProfile]);

  const EMPTY_ARRAY = [];
  const selectCreatorCourses = createSelector(
    (state) => state.course.creatorCourseData,
    (_, userId) => userId,
    (data, userId) => data[userId]?.courses || EMPTY_ARRAY
  );

  const creatorCourses = useSelector((state) => selectCreatorCourses(state, userId));

  const filterCourses = (course) => {
    if (isInstructor && !isOwner) return course.isPublished;
    if (sortFilter.all) return true;
    if (sortFilter.published && course.isPublished) return true;
    if (sortFilter.unpublished && !course.isPublished) return true;
    return false;
  };

  const filteredCourses = useMemo(
    () => creatorCourses.filter(filterCourses),
    [creatorCourses, sortFilter, isInstructor, isOwner]
  );

  const sortLabel = useMemo(() => {
    if (sortFilter.all || (sortFilter.published && sortFilter.unpublished)) return "Courses";
    if (sortFilter.published) return "Published Courses";
    return "Unpublished Courses";
  }, [sortFilter]);

  // ========================================================================
  // EFFECTS - RESPONSIVE BEHAVIOR
  // ========================================================================
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarHide(true);
      if (window.innerWidth > 576) setSearchShow(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ========================================================================
  // EFFECTS - DARK MODE
  // ========================================================================
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ========================================================================
  // EFFECTS - FETCH PROFILE USER
  // ========================================================================
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchProfileUser = async () => {
      setProfileLoading(true);
      setError(null);

      try {
        if (isMyProfile && currentUser) {
          if (isMounted) setProfileUser(currentUser);
          return;
        }

        if (cachedUser && Date.now() - cachedUser.lastUpdated < 5 * 60 * 1000) {
          if (isMounted) setProfileUser(cachedUser.user);
          return;
        }

        const res = await api.get(`/api/user/${userId}`, { withCredentials: true });
        if (isMounted) setProfileUser(res.data);

        dispatch(
          setUserCache({
            userId,
            user: res.data,
          })
        );
      } catch {
        if (isMounted) setError("Failed to load user profile");
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    fetchProfileUser();
    return () => (isMounted = false);
  }, [userId, currentUser, isMyProfile, cachedUser, dispatch]);

  // ========================================================================
  // EFFECTS - Conversation
  // ========================================================================
  useEffect(() => {
    if (!currentUser?._id) return;

    let isMounted = true;

    const fetchConversations = async () => {
      try {
        setConversationsLoading(true);

        const res = await api.get("/api/message/conversation", {
          withCredentials: true,
        });

        const convs = res.data;

        const processed = convs.map((conv) => {
          if (conv.encryptionKey) {
            encryptionKeysRef.current[conv._id] = conv.encryptionKey;
          }

          const lastMsg = conv.lastMessage;

          if (lastMsg?.text && encryptionKeysRef.current[conv._id]) {
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
              console.error("decrypt failed", err);
              return conv;
            }
          }

          return conv;
        });

        setConversations(processed);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setConversationsLoading(false);
      }
    };

    fetchConversations();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);
  const last3Conversations = useMemo(() => {
    return [...conversations]
      .sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0) -
          new Date(a.lastMessage?.createdAt || 0)
      )
      .slice(0, 3);
  }, [conversations]);
  // ========================================================================
  // EFFECTS - INITIALIZE PROFILE FIELDS
  // ========================================================================
  useEffect(() => {
    if (!displayedUser) return;

    const nameParts = (displayedUser.name || "").split(" ");
    const fName = nameParts[0] || "";
    const lName = nameParts.slice(1).join(" ") || "";
    const userBio = displayedUser.description?.trim() || displayedUser.roleDescription || "No description added yet.";

    setFirstName(fName);
    setLastName(lName);
    setBio(userBio);
    originalProfile.current = { firstName: fName, lastName: lName, bio: userBio };
  }, [displayedUser]);

  // ========================================================================
  // EFFECTS - INITIALIZE DEFAULT ACTIVE TAB BY ROLE
  // ========================================================================
  useEffect(() => {
    if (!displayedUser) return;

    if (lastLoadedUserIdRef.current !== displayedUser._id) {
      lastLoadedUserIdRef.current = displayedUser._id;
      if (displayedUser.role === 2) { // 2 = Instructor / Trainer
        setActiveTab("courses");
        setProfileTab("profile");
      } else if (displayedUser.role === 1) { // 1 = Craftsman / Professional
        setActiveTab("purchased");
        setProfileTab("purchased");
      } else { // 0 = Admin, 3 = Client
        setActiveTab("posts");
        setProfileTab("posts");
      }
    }
  }, [displayedUser]);

  // ========================================================================
  // EFFECTS - PASSWORD CHANGE FEEDBACK
  // ========================================================================
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setEditPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      dispatch(clearUserMessage());
    }
    if (userError) {
      toast.error(userError);
      dispatch(clearUserMessage());
    }
  }, [successMessage, userError, dispatch]);

  // ========================================================================
  // EFFECTS - FETCH INSTRUCTOR COURSES
  // ========================================================================
  useEffect(() => {
    if (!userId) return;

    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);

        let res;

        if (isOwner) {
          res = await api.get(`/api/course/getcreator`, {
            withCredentials: true,
          });
        } else {
          res = await api.get(`/api/course/instructor/${userId}`);
        }

        dispatch(
          setCreatorCourseData({
            userId,
            courses: res.data || [],
          })
        );

        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses");
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [userId, isOwner, dispatch]);

  // ========================================================================
  // EFFECTS - FETCH INSTRUCTOR SALES DATA
  useEffect(() => {
    if (!isOwner || currentUser?.role !== 2) return;

    let isMounted = true;

    const fetchSalesData = async () => {
      try {
        setSalesLoading(true);
        setSalesError(null);

        const res = await api.get("/api/course/sales", {
          withCredentials: true,
        });

        if (!isMounted) return;

        if (res.data?.success) {
          const data = res.data.data;
          setSalesData({
            totalRevenue: data.totalRevenue || 0,
            totalBuyers: data.totalBuyers || 0,
            totalCourses: data.totalCourses || 0,
            totalCourseBuyers: data.totalCourseBuyers || 0,
          });
        } else {
          throw new Error(res.data?.message || "Failed");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load instructor sales", err?.message || err);
        setSalesError("Failed to load instructor sales data");
        setSalesData({ totalRevenue: 0, totalBuyers: 0, totalCourses: 0, totalCourseBuyers: 0 });
      } finally {
        if (isMounted) setSalesLoading(false);
      }
    };

    fetchSalesData();
    return () => { isMounted = false; };

  }, [isOwner, currentUser]);
  // ========================================================================
  // EFFECTS - FETCH INSTRUCTOR EARNINGS DATA
  // ========================================================================
  // EFFECTS - FETCH INSTRUCTOR EARNINGS DATA
  // ========================================================================
  useEffect(() => {
    if (!isOwner || currentUser?.role !== 2) return;

    const fetchEarningsData = async () => {
      try {
        setEarningsLoading(true);

        const res = await api.get("/api/withdrawal/earnings", {
          withCredentials: true,
        });

        if (res.data?.success) {
          const data = {
            totalEarnings: res.data.totalEarnings || 0,
            totalWithdrawn: res.data.totalWithdrawn || 0,
            availableBalance: res.data.availableBalance || 0,
            computedAvailable: res.data.computedAvailable || 0,
            pendingAmount: res.data.pendingAmount || 0,
            approvedAmount: res.data.approvedAmount || 0,
            reservedAmount: res.data.reservedAmount || 0,
          };

          setEarningsData(data);

          if (data.availableBalance !== data.computedAvailable) {
            console.warn("⚠️ Balance mismatch detected!", {
              dbBalance: data.availableBalance,
              computedBalance: data.computedAvailable,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load instructor earnings", err?.message || err);
      } finally {
        setEarningsLoading(false);
      }
    };

    fetchEarningsData();
  }, [isOwner, currentUser]);

  // ========================================================================
  // EFFECTS - FETCH USER POSTS
  // ========================================================================
  useEffect(() => {
    if (!userId) return;

    const fetchUserPosts = async () => {
      try {
        setPostsLoading(true);
        const res = await api.get(`/api/post/user/${userId}`, {
          withCredentials: true,
        });
        setUserPosts(res.data || []);
      } catch (err) {
        console.error("Failed to load user posts", err?.message || err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId]);

  // ========================================================================
  // EFFECTS - FETCH PURCHASED COURSES
  // ========================================================================
  useEffect(() => {
    if (!isOwner) return;

    const fetchPurchasedCourses = async () => {
      try {
        setPurchasedLoading(true);
        const res = await api.get(`/api/user/purchased`, {
          withCredentials: true,
        });
        setPurchasedCourses(res.data || []);
      } catch (err) {
        console.error("Failed to load purchased courses", err?.message || err);
      } finally {
        setPurchasedLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, [isOwner]);

  // ========================================================================
  // EFFECTS - FETCH USER CERTIFICATES
  // ========================================================================
  useEffect(() => {
    if (!userId) return;

    const fetchCertificates = async () => {
      try {
        setCertificatesLoading(true);
        const res = await api.get(`/api/user/${userId}/certificates`, {
          withCredentials: true,
        });
        setCertificates(res.data || []);
      } catch (err) {
        console.error("Failed to load user certificates", err?.message || err);
      } finally {
        setCertificatesLoading(false);
      }
    };

    fetchCertificates();
  }, [userId]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) return toast.error("Please select an image");

    try {
      setAvatarLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "CraftLink_Avatar");
      formData.append("folder", "craftlink/avatar");

      const resUpload = await axios.post(
        "https://api.cloudinary.com/v1_1/dhynqaw42/image/upload",
        formData
      );

      const res = await api.patch(
        "/api/user/profile",
        { photoUrl: resUpload.data.secure_url },
        { withCredentials: true }
      );

      dispatch(setUserData(res.data));
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to update avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePublishCourse = async (course) => {
    if (!course.lecturesCount) return toast.error("Add lectures before publishing");

    try {
      const res = await api.patch(
        `/api/course/publish/${course._id}`,
        { isPublished: !course.isPublished },
        { withCredentials: true }
      );

      const updatedCourse = { ...course, ...res.data };

      dispatch(
        setCreatorCourseData({
          userId,
          courses: creatorCourses.map((c) => (c._id === course._id ? updatedCourse : c)),
        })
      );

      toast.success(res.data.isPublished ? "Course published successfully 🎉" : "Course unpublished");
    } catch {
      toast.error("Failed to update course status");
    }
  };

  const handleSortChange = (key) => {
    setSortFilter((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (key !== "all" && updated[key]) updated.all = false;
      if (!updated.published && !updated.unpublished) updated.all = true;
      return updated;
    });
  };

  const handleSaveProfile = async () => {
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      const cleanedBio =
        bio === currentUser.roleDescription || bio === "No description added yet." ? "" : bio.trim();

      const res = await api.patch("/api/user/profile", { name: fullName, description: cleanedBio }, { withCredentials: true });
      dispatch(setUserData(res.data));

      setBio(res.data.description || "");
      originalProfile.current.bio = res.data.description || "";
      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setFirstName(originalProfile.current.firstName);
    setLastName(originalProfile.current.lastName);
    setBio(originalProfile.current.bio);
    setEditMode(false);
    setEditPassword(false);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error("All fields are required");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    dispatch(changePassword({ currentPassword, newPassword }));
  };

  useEffect(() => {
    if (activeTab !== "details" && (editMode || editPassword)) handleCancelEdit();
  }, [activeTab]);

  // ========================================================================
  // RETURN
  // ========================================================================
  return {
    // UI
    navigate,
    darkMode,
    setDarkMode,
    handleFocus,
    handleBlur,
    showPass,
    togglePass,
    inputType,

    // STATES
    activeMenu,
    setActiveMenu,
    sidebarHide,
    setSidebarHide,
    searchShow,
    setSearchShow,
    activeTab,
    setActiveTab,
    showSort,
    setShowSort,
    profileLoading,
    coursesLoading,
    avatarLoading,
    error,
    profileUser,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    bio,
    setBio,
    editMode,
    setEditMode,
    editPassword,
    setEditPassword,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    sortFilter,
    handleSortChange,
    isMyProfile,
    displayedUser,
    isInstructor,
    isCraftsman,
    canShowPosts,
    isOwner,
    creatorCourses,
    filteredCourses,
    sortLabel,
    profileTab,
    setProfileTab,
    userPosts,
    purchasedCourses,
    postsLoading,
    purchasedLoading,
    certificates,
    certificatesLoading,
    currentUser,
    salesData,
    salesLoading,
    salesError,
    earningsData,
    earningsLoading,
    // HANDLERS
    handleAvatarChange,
    handlePublishCourse,
    handleSaveProfile,
    handleCancelEdit,
    handleChangePassword,
    // Conversation
    conversations,
    last3Conversations,
    conversationsLoading,
  };
};

export default useProfileLogic;