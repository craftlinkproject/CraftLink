import React from "react";
import { useProfileLogic } from "../functions";

// Components
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import AuthInput from "../../../components/AuthInput";
import LoadingDouble from "../../../components/LoadingDouble";
import CertificateModal from "../../../components/CertificateModal";
import PostCard from "./components/PostCard";
// Icons
import {
  AiOutlineMessage,
  VscSettings,
  RiVideoAiLine,
  RiEditCircleLine,
  LuWifiOff,
  BsFillCollectionPlayFill,
  BsCameraFill,
  BsPersonBoundingBox,
  MdEmail,
  FaInbox,
  FaSort,
  IoCloudDone,
  TbArrowLeftDashed,
  IoClose,
  FaSignature,
  TbPasswordFingerprint,
  BsFillShieldLockFill,
  FaEye,
  FaEyeLowVision,
  MdPassword,
  HiMiniLanguage,
} from "@icons";

import { ClipLoader } from "react-spinners";
import { ROLE_LABELS } from "@/constants/roles";
import userAvatar from "../../../assets/img/userAvatar.jpg";
import image from "../../../assets/img/image.png";
import { useTranslation } from "react-i18next";
const Profile = () => {
  const { i18n, t } = useTranslation();
  const [selectedCert, setSelectedCert] = React.useState(null);
  const [showCertModal, setShowCertModal] = React.useState(false);
  const {
    navigate,
    darkMode,
    setDarkMode,
    handleFocus,
    handleBlur,
    showPass,
    togglePass,
    inputType,
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
    userLoading,
    avatarLoading,
    error,
    firstName,
    lastName,
    bio,
    setFirstName,
    setLastName,
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
    filteredCourses,
    sortLabel,
    handleAvatarChange,
    handlePublishCourse,
    handleSaveProfile,
    handleCancelEdit,
    handleChangePassword,
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
    earningsData,
    earningsLoading,
    conversations,
    last3Conversations,
    conversationsLoading,
  } = useProfileLogic();
  const visibleCourses = isOwner
    ? filteredCourses
    : filteredCourses.filter(course => course.isPublished);

  const totalPaid = purchasedCourses.reduce(
    (sum, course) => sum + (course.paidAmount || course.price || 0),
    0,
  );

  const toggleProfileLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div>
      {/* SORTING & FILTERING MODAL */}
      {showSort && (
        <div className="sort-container">
          <div className="sort-wrapper">
            <div className="head">
              <h3>{t("Sorting & Filtering")}</h3>
              <IoClose
                className="icon-close"
                onClick={() => setShowSort(false)}
              />
            </div>
            {["all", "published", "unpublished"].map((key) => (
              <div className="sort-option" key={key}>
                <p>{t(key.charAt(0).toUpperCase() + key.slice(1))}</p>

                <label className="sort-switch">
                  <input
                    type="checkbox"
                    checked={sortFilter[key]}
                    onChange={() => handleSortChange(key)}
                  />

                  <span className="sort-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <SideBar
        sidebarHide={sidebarHide}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
      <section id="content">
        {/* NAVIGATION */}
        <Nav
          sidebarHide={sidebarHide}
          setSidebarHide={setSidebarHide}
          searchShow={searchShow}
          setSearchShow={setSearchShow}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main>
          <div className="profile-main">
            {/* LEFT SECTION - PROFILE INFO & CONTENT */}
            <div className="section">
              <div className="profile-container">
                <div className="profile-cover">
                  <img src={image} alt="cover" />
                </div>
                <div className="profile-info">
                  <div className="avatar">
                    {isMyProfile && (
                      <label className="change-avatar">
                        <BsCameraFill />
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleAvatarChange}
                        />
                      </label>
                    )}
                    <div className="profile-img">
                      {avatarLoading ? (
                        <ClipLoader size={30} />
                      ) : (
                        <img
                          src={displayedUser?.photoUrl || userAvatar}
                          alt="profile"
                        />
                      )}
                    </div>
                  </div>
                  <h2>
                    {firstName} {lastName}
                  </h2>
                  <span className="clamp-v clamp-v2">{t(bio)}</span>
                  <div className="actions">
                    <button onClick={() => navigate(`/message/${displayedUser._id}`)}>
                      <AiOutlineMessage />
                      <span>{t("Messages")}</span>
                    </button>
                    <VscSettings className="settings" onClick={() => {
                      setActiveTab("details");
                      setProfileTab("profile");
                    }} />
                  </div>
                </div>

                {isMyProfile && displayedUser?.role === 2 && (
                  <div className="stats-summary">
                    <div>
                      <p>{salesLoading ? "..." : salesData?.totalBuyers || 0}</p>
                      <span>{t("Craftsmen")}</span>
                    </div>
                    <span className="line"></span>
                    <div>
                      <p>{filteredCourses.length}</p>
                      <span>{t(sortLabel)}</span>

                    </div>
                    <span className="line"></span>
                    <div>
                      <p>
                        {earningsLoading ? "..." : (earningsData?.availableBalance || 0).toLocaleString()} {t("EGP")}
                      </p>
                      <span>{t("Available Balance")}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="courses-feed">
                <div className="content-header">
                  <div className="action-tab">
                    {isInstructor &&
                      <button
                        className={activeTab === "courses" ? "active" : ""}
                        onClick={() => {
                          setActiveTab("courses");
                          setProfileTab("profile");
                        }}
                      >
                        {t("Courses")}
                      </button>
                    }
                    {canShowPosts && (
                      <button
                        className={profileTab === "posts" ? "active" : ""}
                        onClick={() => {
                          setActiveTab("posts");
                          setProfileTab("posts")
                        }}
                      >
                        {t("Posts")}
                      </button>
                    )}
                    {isOwner && isCraftsman && (
                      <button
                        className={profileTab === "purchased" ? "active" : ""}
                        onClick={
                          () => {
                            setActiveTab("purchased");
                            setProfileTab("purchased")
                          }
                        }
                      >
                        {t("Purchased Courses")}
                      </button>
                    )}
                    {isCraftsman && (certificates.length > 0 || isMyProfile) && (
                      <button
                        className={profileTab === "certificates" ? "active" : ""}
                        onClick={() => {
                          setActiveTab("certificates");
                          setProfileTab("certificates");
                        }}
                      >
                        {t("Certificates")}
                      </button>
                    )}
                  </div>
                  {isInstructor && isOwner && (
                    <button className="sort" onClick={() => setShowSort(true)}>
                      <FaSort /> {t("Sort")}
                    </button>
                  )}
                </div>

                {/* POSTS TAB */}
                {profileTab === "posts" && canShowPosts && (
                  <div className="user-posts-tab">
                    {postsLoading ? (
                      <LoadingDouble />
                    ) : userPosts.length === 0 ? (
                      <p>{t("No posts yet.")}</p>
                    ) : (
                      userPosts.map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                          currentUserId={currentUser._id}
                          onPostDeleted={(id) => setUserPosts(prev => prev.filter(p => p._id !== id))}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* PURCHASED COURSES TAB */}
                {profileTab === "purchased" && isOwner && isCraftsman && (
                  <div className="purchased-courses-tab">
                    <div className="purchased-summary">
                      <div>
                        <p>{t("Amount Paid for Purchase")}</p>
                        <strong>{t("EGP")} {totalPaid}</strong>
                      </div>
                    </div>
                    {purchasedLoading ? (
                      <LoadingDouble />
                    ) : purchasedCourses.length === 0 ? (
                      <p>{t("No purchased courses yet.")}</p>
                    ) : (
                      purchasedCourses.map((course) => (
                        <div className="course-feed-card" key={course._id} onClick={() => navigate(`/playcourse/${course._id}`)}>
                          <div className="img-course">
                            <img src={course.thumbnail || image} alt={course.title} />
                          </div>
                          <div className="content">
                            <h2 className="clamp-v clamp-v1">{course.title}</h2>
                            <p className="clamp-v clamp-v2">{course.subTitle}</p>
                            <span onClick={() => navigate(`/profile/${course.creator._id}`)}>
                              By: {course.creator?.name || "You"}
                            </span>
                            <span>
                              {course.lecturesCount || 0} Lectures • {course.level}
                            </span>
                            <h2>EGP {course.price}</h2>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* CERTIFICATES TAB */}
                {profileTab === "certificates" && (
                  <div className="certificates-tab" style={{ flexDirection: "column", padding: "20px 0", flex: 1, justifyContent: "center", display: "flex" }}>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "var(--text-primary)" }}>
                      🎓 {t("Earned Certificates")}
                    </h3>
                    {certificatesLoading ? (
                      <LoadingDouble />
                    ) : certificates.length === 0 ? (
                      <div className="failed-load" style={{ padding: "40px 0" }}>
                        <span style={{ fontSize: "4rem" }}>🎓</span>
                        <p className="failed-text" style={{ marginTop: "10px" }}>
                          {t("No certificates earned yet.")}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                        {Object.values(
                          certificates.reduce((acc, cert) => {
                            const courseId = cert.course?._id;
                            if (!acc[courseId]) {
                              acc[courseId] = { ...cert, langs: [cert.language] };
                            } else {
                              acc[courseId].langs.push(cert.language);
                            }
                            return acc;
                          }, {})
                        ).map((group) => {
                          const hasAr = group.langs.includes("ar");
                          const hasEn = group.langs.includes("en");
                          return (
                            <div
                              key={group._id}
                              className="certificate-card"
                              style={{
                                background: "var(--card-bg)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "16px",
                                overflow: "hidden",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ padding: "20px" }}>
                                <div style={{ width: "100%", height: "140px", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
                                  <img
                                    src={group.course?.thumbnail || image}
                                    alt={group.course?.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                                  <h4 style={{ fontSize: "1.15rem", fontWeight: "bold", color: "var(--text-primary)", margin: 0, flex: 1 }}>
                                    {group.course?.title}
                                  </h4>
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    {hasAr && <span style={{ padding: "2px 8px", borderRadius: "6px", background: "rgba(212, 175, 55, 0.12)", color: "#b8860b", fontSize: "0.7rem", fontWeight: 700 }}>AR</span>}
                                    {hasEn && <span style={{ padding: "2px 8px", borderRadius: "6px", background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", fontSize: "0.7rem", fontWeight: 700 }}>EN</span>}
                                  </div>
                                </div>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                                  {t("Verification ID:")}{" "}
                                  <span style={{ fontFamily: "monospace", color: "var(--primary-color)", fontWeight: "bold" }}>
                                    {group.certificateId}
                                  </span>
                                </p>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  📅 {t("Date of Issue:")}{" "}
                                  <strong>{new Date(group.issueDate || group.createdAt).toLocaleDateString()}</strong>
                                </p>
                              </div>
                              <div style={{ padding: "0 20px 20px 20px", display: "flex", gap: "8px" }}>
                                {hasAr && (
                                  <button
                                    onClick={() => {
                                      const arCert = certificates.find(c => c.course?._id === group.course?._id && c.language === "ar");
                                      setSelectedCert(arCert);
                                      setShowCertModal(true);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "10px",
                                      background: "linear-gradient(135deg, #d4af37, #aa7c11)",
                                      color: "#fff",
                                      fontWeight: "bold",
                                      border: "none",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontSize: "0.82rem",
                                      fontFamily: "inherit",
                                    }}
                                  >
                                    🎓 {t("View & Print")} AR
                                  </button>
                                )}
                                {hasEn && (
                                  <button
                                    onClick={() => {
                                      const enCert = certificates.find(c => c.course?._id === group.course?._id && c.language === "en");
                                      setSelectedCert(enCert);
                                      setShowCertModal(true);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "10px",
                                      background: "linear-gradient(135deg, #2563eb, #1a4e9a)",
                                      color: "#fff",
                                      fontWeight: "bold",
                                      border: "none",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontSize: "0.82rem",
                                      fontFamily: "inherit",
                                    }}
                                  >
                                    🎓 {t("View & Print")} EN
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* COURSES TAB */}
                {profileTab === "profile" && activeTab === "courses" && isInstructor && (
                  <>
                    {coursesLoading ? (
                      <LoadingDouble />
                    ) : visibleCourses.length > 0 ? (
                      visibleCourses.map((course) => (
                        <div className="course-feed-card" key={course._id}>
                          <div className="img-course">
                            <img src={course.thumbnail || image} alt={course.title} />
                            <div className="bookmark-category-wrapper">
                              {isOwner && (
                                <label
                                  className="ui-bookmark"
                                  onClick={() => handlePublishCourse(course)}
                                >
                                  <input
                                    type="checkbox"
                                    readOnly
                                    checked={course.isPublished && course.lecturesCount > 0}
                                  />
                                  <div className="bookmark">
                                    <svg viewBox="0 0 32 32">
                                      <g>
                                        <path d="M27 4v27a1 1 0 0 1-1.625.781L16 24.281l-9.375 7.5A1 1 0 0 1 5 31V4a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4z"></path>
                                      </g>
                                    </svg>
                                  </div>
                                </label>
                              )}
                              {course.category && <span className="category">#{course.category}</span>}
                            </div>
                            {isOwner && (
                              <div className="edit-course"
                                onClick={() =>
                                  navigate(`/createcourse/${course._id}`)
                                }>
                                <RiEditCircleLine />
                                <span>{t("Edit")}</span>
                              </div>
                            )}
                          </div>
                          <div className="content">
                            <h2 className="clamp-v clamp-v1">{course.title}</h2>
                            <p className="clamp-v clamp-v2">{course.subTitle}</p>
                            <span onClick={() => navigate(`/profile/${course.creator._id}`)}>
                              {t("By")}: {course.creator?.name || "You"}
                            </span>
                            <span>
                              {course.lecturesCount || 0} Lectures • {course.level}
                            </span>
                            <h2>EGP {course.price}</h2>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="failed-load">
                        {error ? (
                          <>
                            <LuWifiOff className="icon" />
                            <p className="failed-text">{error}</p>
                          </>
                        ) : (
                          <>
                            <BsFillCollectionPlayFill className="icon" />
                            <p className="failed-text">{t("No courses created yet.")}</p>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* DETAILS TAB */}
                {profileTab === "profile" && activeTab === "details" && !editMode && !editPassword && (
                  <div className="profile-details">
                    <div className="head">
                      <h3>{t("Details")}</h3>
                      {isMyProfile && (
                        <button
                          className="edit"
                          onClick={() => setEditMode(true)}
                        >
                          <RiEditCircleLine />
                          <span>{t("Edit")}</span>
                        </button>
                      )}
                    </div>
                    <div className="info">
                      <BsPersonBoundingBox />
                      <p>{displayedUser?.name || "CraftLink User"}</p>
                    </div>
                    <div className="info">
                      <MdEmail />
                      <p>{displayedUser?.email || "example@email.com"}</p>
                    </div>
                    {isMyProfile && (
                      <div className="info">
                        <TbPasswordFingerprint />
                        <button
                          className="btn-pass"
                          onClick={() => setEditPassword(true)}
                        >
                          {t("Change Password")}
                        </button>
                      </div>
                    )}
                    <div className="info">
                      <FaSignature />
                      <p>{t(ROLE_LABELS[displayedUser?.role]) || "User"}</p>
                    </div>
                    <div className="info">
                      <HiMiniLanguage />
                      <div
                        onClick={toggleProfileLanguage}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <span>{t("Language")}: </span>
                        <span style={{ fontWeight: 600 }}>
                          {i18n.language === "en" ? t("English") : t("Arabic")}
                        </span>
                        <span style={{
                          background: "var(--primary-color)",
                          color: "#fff",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}>
                          {i18n.language === "en" ? "AR" : "EN"}
                        </span>
                      </div>
                    </div>
                    <div className="info">
                      <FaInbox />
                      <p>{bio}</p>
                    </div>
                  </div>
                )}

                {/* PASSWORD CHANGE FORM */}
                {activeTab === "details" && editPassword && (
                  <form
                    className="change-password"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="head">
                      <div className="head-info">
                        <TbArrowLeftDashed onClick={handleCancelEdit} />
                        <h3>{t("Change Password")}</h3>
                      </div>
                      <button
                        className="save"
                        type="button"
                        onClick={handleChangePassword}
                        disabled={userLoading}
                      >
                        <IoCloudDone />
                        <span>
                          {userLoading ?
                            t("Saving...")
                            :
                            t("Save")
                          }
                        </span>

                      </button>
                    </div>
                    <AuthInput
                      type={inputType}
                      label={t("Current Password")}
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      handleBlur={handleBlur}
                      handleFocus={handleFocus}
                      Icon={MdPassword}
                    />
                    <AuthInput
                      type={inputType}
                      label={t("New Password")}
                      value={newPassword}
                      onChange={setNewPassword}
                      Icon={BsFillShieldLockFill}
                    />
                    <AuthInput
                      type={inputType}
                      label={t("Confirm Password")}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      Icon={showPass ? FaEye : FaEyeLowVision}
                      onIconClick={togglePass}
                    />
                  </form>
                )}

                {/* EDIT PROFILE FORM */}
                {activeTab === "details" && editMode && (
                  <form
                    className="edit-profile"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="head">
                      <div className="head-info">
                        <TbArrowLeftDashed onClick={handleCancelEdit} />
                        <h3>{t("Edit Profile")}</h3>
                      </div>
                      <button
                        className="save"
                        type="button"
                        onClick={handleSaveProfile}
                      >
                        <IoCloudDone />
                        <span>
                          {userLoading ?
                            t("Saving...")
                            :
                            t("Save")
                          }
                        </span>
                      </button>
                    </div>
                    <AuthInput
                      type="text"
                      label={t("First Name")}
                      value={firstName}
                      onChange={setFirstName}
                      handleBlur={handleBlur}
                      handleFocus={handleFocus}
                      Icon={BsPersonBoundingBox}
                    />
                    <AuthInput
                      type="text"
                      label={t("Last Name")}
                      value={lastName}
                      onChange={setLastName}
                      Icon={BsPersonBoundingBox}
                    />
                    <AuthInput
                      type="text"
                      label={t("Email")}
                      value={displayedUser?.email || ""}
                      Icon={MdEmail}
                      disabled
                    />
                    <AuthInput
                      type="text"
                      label={t("Role")}
                      value={ROLE_LABELS[displayedUser?.role] || "User"}
                      Icon={FaSignature}
                      disabled
                    />
                    <AuthInput
                      textarea
                      label={t("Bio")}
                      value={bio}
                      onChange={setBio}
                      Icon={FaInbox}
                    />
                  </form>
                )}
              </div>
            </div>

            {/* RIGHT SECTION - SIDEBAR WIDGETS */}
            <div className="side-right">
              <div className="latest-purchases">
                <div className="head">
                  <h3>{t("Messages")}</h3>
                </div>
                <div className="content">
                  {conversationsLoading ? (
                    <p>{t("Loading...")}</p>
                  ) : last3Conversations.length === 0 ? (
                    <p>{t("No conversations yet.")}</p>
                  ) : (
                    last3Conversations.map((conv) => {
                      const otherUser = conv.members.find(
                        (m) => m._id !== currentUser._id
                      );
                      return (
                        <div
                          className="user"
                          key={conv._id}
                          onClick={() => navigate(`/message/${otherUser._id}`)}
                        >
                          <img src={otherUser?.photoUrl || userAvatar} alt="" />

                          <div className="info">
                            <h4>{otherUser?.name}</h4>

                            <span>
                              {conv.lastMessage?.text
                                ? conv.lastMessage.text.slice(0, 25) + "..."
                                : "No messages"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              {
                currentUser?.role === 2 &&
                <button
                  type="button"
                  className="join-button"
                  onClick={() => navigate("/createcourse")}
                >
                  <span className="fold"></span>
                  <div className="points_wrapper">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <i key={i} className="point"></i>
                    ))}
                  </div>
                  <span className="inner-btn">
                    <RiVideoAiLine className="icon" />
                    {t("Create New Course")}
                  </span>
                </button>
              }
            </div>
          </div>
        </main>
      </section>

      {/* 🏆 REUSABLE CERTIFICATE MODAL */}
      <CertificateModal
        isOpen={showCertModal}
        onClose={() => {
          setShowCertModal(false);
          setSelectedCert(null);
        }}
        certificate={selectedCert}
      />
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Profile;
