import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "@services/api";
import { toast } from "react-toastify";
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import CertificateModal from "../../../components/CertificateModal";
import { useTheme } from "../../../context/ThemeContext";
import { MdVideoLibrary } from "react-icons/md";
import { TiFlash } from "react-icons/ti";
import { MdCurrencyPound } from "react-icons/md";
import { BiLike, BiSolidLike, BiComment, SiTelegram, BsThreeDots } from "@icons";
import userAvatar from "../../../assets/img/userAvatar.jpg"
import { useTranslation } from "react-i18next";
// ============================================================================
// FORMAT DURATION HELPER
// ============================================================================
function formatDuration(seconds) {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ============================================================================
// PLAY COURSE PAGE
// ============================================================================
const PlayCourse = () => {
  const { courseId } = useParams();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useTheme();
  const userData = useSelector((state) => state.user?.userData);

  // State
  const [course, setCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHide, setSidebarHide] = useState(false);
  const [searchShow, setSearchShow] = useState(false);
  const [activeMenu, setActiveMenu] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [watchedTime, setWatchedTime] = useState({});
  const [currentLectureProgress, setCurrentLectureProgress] = useState(0);
  const [certificate, setCertificate] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const claimTriggeredRef = useRef(false);

  const commentsContainerRef = useRef(null);
  const sidebarRef = useRef(null);
  const activeLectureRef = useRef(null);
  const videoRef = useRef(null);
  const videoInitializedRef = useRef(null);
  const scrollToBottom = () => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop =
        commentsContainerRef.current.scrollHeight;
    }
  };
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    scrollToBottom();
  }, [comments]);

  // ========================================================================
  // CLAIM CERTIFICATE
  // ========================================================================
  const handleClaimCertificate = async (silent = false) => {
    if (claimTriggeredRef.current) return;
    claimTriggeredRef.current = true;
    try {
      setClaiming(true);
      // Flush all pending progress to backend before claiming
      await Promise.all(
        Object.entries(watchedTime).map(([lectureId, secondsWatched]) =>
          api.post("/api/user/progress", {
            courseId,
            lectureId,
            secondsWatched: Math.floor(secondsWatched),
          }).catch(() => {})
        )
      );
      const res = await api.post("/api/user/certificate/claim", { courseId });
      const certs = res.data.certificates || [];
      setCertificates(certs);
      const firstCert = certs.find(c => c.language === i18n.language) || certs[0] || null;
      setCertificate(firstCert);
      if (!silent) {
        toast.success(t("Certificates claimed successfully!"));
      }
      if (!res.data.alreadyClaimed) {
        setShowCelebration(true);
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error(err.response?.data?.message || t("Failed to claim certificate"));
      }
    } finally {
      setClaiming(false);
    }
  };

  // ========================================================================
  // FETCH COURSE & LECTURES
  // ========================================================================
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/course/getcourse/${courseId}`);
        setCourse(res.data);
        setLectures(res.data.lectures || []);

        // Fetch user progress for this course
        try {
          const progressRes = await api.get(`/api/user/progress/${courseId}`);
          setWatchedTime(progressRes.data || {});
        } catch (progressErr) {
          console.log("No progress found for this course");
        }

        // Fetch user certificates
        try {
          const certRes = await api.get("/api/user/certificates");
          const foundCert = certRes.data?.find((c) => c.course?._id === courseId);
          if (foundCert) {
            setCertificate(foundCert);
          }
        } catch (certErr) {
          console.log("No certificates found");
        }

        // Set first unlocked lecture
        const firstUnlocked =
          res.data.lectures?.find((l) => !l.isLocked) || res.data.lectures?.[0];
        if (firstUnlocked) {
          setCurrentLecture(firstUnlocked);
        }
      } catch (err) {
        console.error("Failed to load course:", err?.message);
        toast.error("Failed to load course");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  // ========================================================================
  // FETCH LECTURE COMMENTS
  // ========================================================================
  useEffect(() => {
    if (!currentLecture) return;

    const fetchComments = async () => {
      try {
        setCommentLoading(true);
        const res = await api.get(
          `/api/course/lecture/${currentLecture._id}/comments`
        );
        setComments(res.data || []);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setCommentLoading(false);
      }
    };

    fetchComments();
  }, [currentLecture]);

  // ========================================================================
  // ADD COMMENT
  // ========================================================================
  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = e.target.elements.comment?.value?.trim();
    if (!text || !currentLecture) return;

    try {
      const res = await api.post(
        `/api/course/lecture/${currentLecture._id}/comments`,
        {
          text,
        },
      );
      setComments((prev) => [
        ...prev,
        {
          ...res.data,
          userId: {
            ...userData,
          },
        },
      ]);
      e.target.reset();
      toast.success("Comment added successfully");
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error("Failed to add comment");
    }
  };

  // ========================================================================
  // SCROLL TO ACTIVE LECTURE
  // ========================================================================
  useEffect(() => {
    if (sidebarRef.current && activeLectureRef.current) {
      const sidebar = sidebarRef.current;
      const active = activeLectureRef.current;
      sidebar.scrollTo({
        top: active.offsetTop - sidebar.offsetTop - 24,
        behavior: "smooth",
      });
    }
  }, [currentLecture, sidebarOpen]);

  // ========================================================================
  // VIDEO ENDED - AUTO-PLAY NEXT
  // ========================================================================
  const handleVideoEnd = () => {
    if (!currentLecture) return;

    if (!completed.includes(currentLecture._id)) {
      setCompleted((prev) => [...prev, currentLecture._id]);
    }

    const idx = lectures.findIndex((l) => l._id === currentLecture._id);
    if (idx !== -1 && idx < lectures.length - 1) {
      const next = lectures[idx + 1];
      setCurrentLecture(next);
    }
  };

  // ========================================================================
  // PLAYBACK RATE
  // ========================================================================
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentLecture]);

  // ========================================================================
  // SET VIDEO POSITION ON LECTURE CHANGE
  // ========================================================================
  useEffect(() => {
    if (!videoRef.current || !currentLecture) return;

    const handleLoadedMetadata = () => {
      const watched = watchedTime[currentLecture._id] || 0;
      const duration = currentLecture.duration || 1;

      // If lecture is fully watched (100%), start from beginning
      if (watched >= duration) {
        videoRef.current.currentTime = 0;
      } else if (watched > 0) {
        // Otherwise, resume from last watched position
        videoRef.current.currentTime = watched;
      }
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentLecture, watchedTime]);

  // ========================================================================
  // VIDEO TIME UPDATE - TRACK WATCHED TIME
  // ========================================================================
  const handleTimeUpdate = () => {
    if (videoRef.current && currentLecture) {
      const currentTime = videoRef.current.currentTime;
      const duration = currentLecture.duration;
      const previousWatched = watchedTime[currentLecture._id] || 0;

      // Only update if current time is greater than previous watched time (prevent seeking back)
      if (currentTime > previousWatched) {
        // Update local state
        setWatchedTime((prev) => ({
          ...prev,
          [currentLecture._id]: currentTime,
        }));

        // Update current lecture progress
        const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
        setCurrentLectureProgress(progress);

        // Send progress to backend (debounced)
        updateProgressToBackend(courseId, currentLecture._id, currentTime);
      }
    }
  };

  // ========================================================================
  // UPDATE PROGRESS TO BACKEND (debounced)
  // ========================================================================
  const updateProgressToBackend = (() => {
    let timeoutId;
    return (courseId, lectureId, secondsWatched) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await api.post("/api/user/progress", {
            courseId,
            lectureId,
            secondsWatched: Math.floor(secondsWatched),
          });
        } catch (err) {
          console.error("Failed to save progress:", err);
        }
      }, 2000); // Save every 2 seconds
    };
  })();

  // ========================================================================
  // SAVE PROGRESS ON LECTURE CHANGE OR UNLOAD
  // ========================================================================
  useEffect(() => {
    const saveProgress = async () => {
      if (currentLecture && watchedTime[currentLecture._id]) {
        try {
          await api.post("/api/user/progress", {
            courseId,
            lectureId: currentLecture._id,
            secondsWatched: Math.floor(watchedTime[currentLecture._id]),
          });
        } catch (err) {
          console.error("Failed to save progress on change:", err);
        }
      }
    };

    const sendProgressBeacon = () => {
      if (!currentLecture || !watchedTime[currentLecture._id]) {
        return;
      }

      const payload = JSON.stringify({
        courseId,
        lectureId: currentLecture._id,
        secondsWatched: Math.floor(watchedTime[currentLecture._id]),
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/user/progress", blob);
      } else {
        saveProgress();
      }
    };

    // Save when lecture changes
    if (currentLecture) {
      saveProgress();
    }

    // Save on page unload
    const handleBeforeUnload = () => {
      sendProgressBeacon();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      sendProgressBeacon();
    };
  }, [currentLecture, courseId, watchedTime]);

  // ========================================================================
  // UPDATE CURRENT LECTURE PROGRESS WHEN LECTURE CHANGES
  // ========================================================================
  useEffect(() => {
    if (currentLecture) {
      const watched = watchedTime[currentLecture._id] || 0;
      const duration = currentLecture.duration || 1;
      const progress = duration > 0 ? (watched / duration) * 100 : 0;
      setCurrentLectureProgress(progress);
    }
  }, [currentLecture, watchedTime]);

  // Progress percentages
  const courseProgressPercent =
    lectures.length > 0
      ? Math.round(
        lectures.reduce((sum, lec) => {
          const watched = watchedTime[lec._id] || 0;
          const total = lec.duration || 1;
          return sum + Math.min((watched / total) * 100, 100);
        }, 0) / lectures.length,
      )
      : 0;

  const currentLectureProgressPercent = Math.round(currentLectureProgress);

  // ========================================================================
  // AUTO-CLAIM CERTIFICATE ON COMPLETION
  // ========================================================================
  useEffect(() => {
    if (courseProgressPercent >= 90 && !certificate && !claiming && !claimTriggeredRef.current) {
      handleClaimCertificate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseProgressPercent]);

  // ========================================================================
  // RESPONSIVE
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

  if (loading) {
    return (
      <div className="play-course-root">
        <SideBar
          sidebarHide={sidebarHide}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <section id="content">
          <Nav
            sidebarHide={sidebarHide}
            setSidebarHide={setSidebarHide}
            searchShow={searchShow}
            setSearchShow={setSearchShow}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          <main style={{ padding: "40px", textAlign: "center" }}>
            Loading course...
          </main>
        </section>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="play-course-root">
        <SideBar
          sidebarHide={sidebarHide}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <section id="content">
          <Nav
            sidebarHide={sidebarHide}
            setSidebarHide={setSidebarHide}
            searchShow={searchShow}
            setSearchShow={setSearchShow}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          <main style={{ padding: "40px", textAlign: "center" }}>
            Course not found
          </main>
        </section>
      </div>
    );
  }

  return (
    <div className="play-course-root">
      <SideBar
        sidebarHide={sidebarHide}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <section id="content">
        <Nav
          sidebarHide={sidebarHide}
          setSidebarHide={setSidebarHide}
          searchShow={searchShow}
          setSearchShow={setSearchShow}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main>
          <div className="table-data aside-data">
            {/* MAIN CONTENT */}
            <div
              style={{
                flex: 1,
                flexBasis: "500px",
                background: "transparent",
                padding: 0,
              }}
              className="aside-data-lec"
            >
              {/* VIDEO PLAYER */}
              <div
                style={{
                  background: "var(--nav-bg)",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    background: "#000",
                    borderRadius: "8px",
                    overflow: "hidden",
                    marginBottom: "16px",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  {currentLecture &&
                    currentLecture.videoUrl &&
                    !currentLecture.isLocked ? (
                    <video
                      key={currentLecture._id}
                      ref={videoRef}
                      src={currentLecture.videoUrl}
                      controls
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        margin: "auto",
                      }}
                      onEnded={handleVideoEnd}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  ) : (
                    <div
                      style={{
                        height: "80vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#e53935",
                        flex: 1
                      }}
                    >
                      <span style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🔒
                      </span>
                      <p>This lecture is locked</p>
                    </div>
                  )}
                </div>

                <h1
                  style={{
                    margin: "12px 0",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    wordBreak: "break-all",
                  }}
                >
                  {currentLecture?.lectureTitle || "Select a lecture"}
                </h1>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",

                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <img src={course.creator?.photoUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50px" }} />
                    <span>By: {course.creator?.name}</span>
                  </div>
                </div>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.6, wordBreak: "break-all" }}>
                  {currentLecture?.description}
                </p>
              </div>

              {/* COURSE INFO */}
              <div
                style={{
                  background: "var(--nav-bg)",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {course.title}
                </h2>
                <p style={{ margin: "0 0 12px 0", color: "var(--text-muted)" }}>
                  {course.subTitle}
                </p>
              </div>

              {/* COMMENTS */}
              <div
                style={{
                  background: "var(--nav-bg)",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <h3
                  style={{
                    marginBottom: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Comments
                </h3>
                <div
                  className="lec-comments"
                  style={{
                    marginBottom: "16px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                  ref={commentsContainerRef}
                >
                  {commentLoading ? (
                    <p style={{ color: "#999" }}>Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p style={{ color: "#999" }}>No comments yet</p>
                  ) : (
                    comments.map((c, index) => (
                      <div key={`${c.userId?._id}-${c.createdAt}-${index}`} className="comment">
                        <img
                          src={c.userId?.photoUrl || userAvatar}
                          alt="user"
                          className="comment-avatar"
                        />
                        <div className="comment-content">
                          <div className="comment-text">
                            <div className="comment-user-container">
                              <div className="comment-user">
                                <strong>{c.userName}</strong>
                                <span className="stat">•</span>
                                <span className="comment-time">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p>{c.text}</p>
                          </div>

                        </div>
                      </div>
                    ))
                  )}

                </div>
                <form onSubmit={handleAddComment} className="comment-form">
                  <input
                    name="comment"
                    type="text"
                    placeholder="Write your comment..."
                    className="comment-input"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="comment-submit-btn"
                    disabled={commentLoading}
                  >
                    {commentLoading ?
                      <BsThreeDots />
                      :
                      <SiTelegram />
                    }
                  </button>
                </form>
              </div>
            </div>


            {/* SIDEBAR LECTURES */}
            <div className="aside-lecture">
              <aside ref={sidebarRef}>
                <div>
                  <h2>{t("Lectures")}</h2>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginBottom: "24px",
                  }}
                >
                  {lectures.length === 3 ? (
                    <p className="text">No lectures available</p>
                  ) : (
                    lectures.map((lec, index) => {
                      const isActive =
                        currentLecture && lec._id === currentLecture._id;
                      const isCompleted = completed.includes(lec._id);

                      return (
                        <div
                          key={`${lec._id}-${lec.createdAt}-${index}`}
                          ref={isActive ? activeLectureRef : null}
                          onClick={() => {
                            if (!lec.isLocked) setCurrentLecture(lec);
                          }}
                          style={{
                            background: isActive
                              ? "var(--border-color)"
                              : "var(--bg-color)",
                            color: isActive
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                            borderRadius: "10px",
                            cursor: lec.isLocked ? "not-allowed" : "pointer",
                            opacity: lec.isLocked ? 0.6 : 1,
                            transition: "all 0.2s",
                            display: "flex",
                          }}
                        >
                          <div style={{ width: "100px", borderRadius: "6px" }}>
                            <img src={course.thumbnail} alt="" style={{ width: "100%", height: "100%", borderRadius: "6px", }} />
                            <span>{formatDuration(lec.duration)}</span>
                          </div>

                          <div>
                            <div style={{ fontWeight: 600, wordBreak: "break-all", }} className="clamp-v clamp-v1">
                              {lec.lectureTitle}
                            </div>
                            <div className="clamp-v clamp-v1" style={{ wordBreak: "break-all", }}>
                              {lec.description}
                            </div>
                            {!lec.isLocked && (
                              <div
                                style={{
                                  width: "100%",
                                  height: "4px",
                                  background: "#fff",
                                  borderRadius: "2px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    background: isActive ? "var(--main-color)" : "#2b7cff",
                                    width: `${Math.min(((watchedTime[lec._id] || 0) / (lec.duration || 1)) * 100, 100)}%`,
                                    transition: "width 0.3s",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              opacity: 0.8,
                              display: "flex",
                              gap: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            {lec.isLocked && <span>🔒</span>}
                            {isCompleted && <span>✔</span>}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  style={{ paddingTop: "12px" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "#e0e0e0",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "#2b7cff",
                        width: `${courseProgressPercent}%`,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "#999" }}>
                    {courseProgressPercent}% completed
                  </span>

                {courseProgressPercent >= 90 && !certificate && (
                  <button
                    onClick={() => handleClaimCertificate(false)}
                    disabled={claiming}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #d4af37, #aa7c11)",
                      color: "#fff",
                      fontWeight: 700,
                      border: "none",
                      borderRadius: "8px",
                      cursor: claiming ? "not-allowed" : "pointer",
                      fontSize: "0.8rem",
                      fontFamily: "inherit",
                      opacity: claiming ? 0.7 : 1,
                      width: "100%",
                    }}
                  >
                    {claiming ? t("Claiming...") : t("Claim Certificate")}
                  </button>
                )}

                </div>
              </aside>

              <div className="course-summary-footer">
                <span>
                  <MdVideoLibrary /> {lectures.length} Lectures
                </span>
                <span>•</span>
                <span>
                  <TiFlash /> {course.level}
                </span>
                <span>•</span>
                <span>
                  <MdCurrencyPound /> EGP {course.price}
                </span>
              </div>
            </div>
          </div>
        </main>
      </section>
      {/* 🎉 CELEBRATION POPUP */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-particles">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="celebration-particle" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  fontSize: `${1 + Math.random() * 1.5}rem`,
                }}>
                  {["🎉", "🎊", "✨", "🏆", "⭐", "💫", "🌟", "🎓"][i % 8]}
                </span>
              ))}
            </div>
            <div className="celebration-body">
              <div className="celebration-icon">🏆</div>
              <h2>{t("Congratulations!")}</h2>
              <p>{t("You have successfully completed the course and earned your certificate!")}</p>
              <div className="celebration-actions">
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setShowCertModal(true);
                  }}
                  className="celebration-btn-primary"
                >
                  🎓 {t("View Certificate")}
                </button>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="celebration-btn-secondary"
                >
                  {t("Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏆 CERTIFICATE MODAL */}
      <CertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        certificate={certificate}
        certificates={certificates}
        courseFallback={course}
      />
    </div>
  );
};

export default PlayCourse;
