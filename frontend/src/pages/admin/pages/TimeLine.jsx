// ============================================================================
// IMPORTS
// ============================================================================
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import { useTheme } from "../../../context/ThemeContext";
import CreatePost from "./components/CreatePost";
import PostCard from "./components/PostCard";
import { fetchPosts, deletePost } from "../../../redux/postSlice";
import userAvatar from "../../../assets/img/userAvatar.jpg";
import { TbExternalLink, FaBuysellads, SiGoogleadsense, FaRegNewspaper, IoClose } from "@icons";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../../context/NotificationContext";
// ============================================================================
// MAIN COMPONENT
// ============================================================================
const TimeLine = () => {
  const { darkMode, setDarkMode } = useTheme();
  const dispatch = useDispatch();
  const [activeMenu, setActiveMenu] = useState(0);
  const [sidebarHide, setSidebarHide] = useState(false);
  const [searchShow, setSearchShow] = useState(false);
  const { i18n, t } = useTranslation();
  const posts = useSelector((state) => state.posts.posts);
  const postsStatus = useSelector((state) => state.posts.status);
  const createStatus = useSelector((state) => state.posts.createStatus);
  const currentUser = useSelector((state) => state.user.userData);
  const postsError = useSelector((state) => state.posts.error);
  const createError = useSelector((state) => state.posts.createError);

  const { newPostAvailable, dismissNewPost } = useNotifications();

  const handleRefreshPosts = () => {
    dispatch(fetchPosts());
    dismissNewPost();
  };

  // ==================== RESIZE LISTENER ====================
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarHide(true);
      if (window.innerWidth > 576) setSearchShow(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ==================== FETCH POSTS ====================
  useEffect(() => {
    if (postsStatus === "idle") {
      dispatch(fetchPosts());
    }
  }, [dispatch, postsStatus]);

  // ==================== HANDLE POST DELETED ====================
  const handlePostDeleted = (postId) => {
    dispatch(deletePost({ postId }));
  };

  return (
    <div className="message-container">
      <SideBar
        sidebarHide={sidebarHide}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <section id="content" className="chat-page">
        <Nav
          sidebarHide={sidebarHide}
          setSidebarHide={setSidebarHide}
          searchShow={searchShow}
          setSearchShow={setSearchShow}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main>
          <div className="table-data">
            <div className="order timeline">
              <CreatePost
                userPhoto={currentUser?.photoUrl || userAvatar}
                userName={currentUser?.name || "User"}
              />

              {newPostAvailable && (
                <div className="new-post-banner">
                  <span>{t("New posts available")}</span>
                  <button onClick={handleRefreshPosts}>{t("Refresh")}</button>
                  <button className="new-post-banner-close" onClick={dismissNewPost}>
                    <IoClose />
                  </button>
                </div>
              )}

              {postsStatus === "loading" && posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p>Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="empty-posts">
                  <FaRegNewspaper />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                <div>
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUserId={currentUser?._id}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="todo ads">
              <div className="head">
                <FaBuysellads />
                <h3> {t("Ads")}</h3>
              </div>
              <div className="todo-list">
                <div class="card sweeperCard o-hidden">
                  <div class="containers">
                    <div class="icon">
                      <SiGoogleadsense />
                    </div>
                    <div class="title my-3">{t("Easy For Everyone")}</div>
                    <div class="subtitle">
                      {t("Craftsmen Jobs Ad")}
                    </div>
                    <div class="linkMore mt-3">
                      {t("Learn More")}
                      <TbExternalLink />
                    </div>
                  </div>
                </div>
                <div class="card sweeperCard o-hidden">
                  <div class="containers">
                    <div class="icon">
                      <SiGoogleadsense />
                    </div>
                    <div class="title my-3">{t("Easy For Everyone")}</div>
                    <div class="subtitle">
                      {t("Craftsmen Jobs Ad")}
                    </div>
                    <div class="linkMore mt-3">
                      {t("Learn More")}
                      <TbExternalLink />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
};

export default TimeLine; 