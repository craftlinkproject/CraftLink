import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import { useTheme } from "../../../context/ThemeContext";
import { fetchPosts, toggleLike, addComment, deletePost, deleteComment } from "../../../redux/postSlice";
import userAvatar from "../../../assets/img/userAvatar.jpg";
import { BiLike, FaBuysellads, SiGoogleadsense, TbExternalLink, BiSolidLike, BiComment, SiTelegram, BsThreeDots, BiArrowBack } from "@icons";
import { PhotoView, PhotoProvider } from "react-photo-view";
import api from "@services/api";
import ConfirmModal from "../../../components/ConfirmModal";

// ============================================================================
// SINGLE POST PAGE COMPONENT
// ============================================================================
const SinglePost = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { darkMode, setDarkMode } = useTheme();

    const [activeMenu, setActiveMenu] = useState(0);
    const [sidebarHide, setSidebarHide] = useState(false);
    const [searchShow, setSearchShow] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const posts = useSelector((state) => state.posts.posts);
    const postsStatus = useSelector((state) => state.posts.status);
    const currentUser = useSelector((state) => state.user.userData);

    // Find the current post
    const post = posts.find((p) => p._id === postId);

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

    // ==================== FETCH POSTS ON MOUNT / POST CHANGE ====================
    useEffect(() => {
        if (postId) {
            dispatch(fetchPosts());
        }
    }, [dispatch, postId]);

    // ==================== REDIRECT IF POST NOT FOUND ====================
    useEffect(() => {
        if (postsStatus === "succeeded" && !post) {
            navigate("/timeline");
        }
    }, [postsStatus, post, navigate]);

    // ==================== LIKE HANDLER ====================
    const handleLike = async () => {
        if (!post) return;
        dispatch(toggleLike({ postId: post._id }));
    };

    // ==================== ADD COMMENT ====================
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !post) return;

        try {
            setLoading(true);
            await dispatch(addComment({ postId: post._id, text: commentText })).unwrap();
            setCommentText("");
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment");
        } finally {
            setLoading(false);
        }
    };

    // ==================== DELETE POST ====================
    const handleDeletePost = () => {
        setShowMenu(false);
        setShowDeleteModal(true);
    };

    const confirmDeletePost = async () => {
        try {
            await dispatch(deletePost({ postId: post._id })).unwrap();
            navigate("/timeline");
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post");
        } finally {
            setShowDeleteModal(false);
        }
    };
    const handleDeleteComment = async (commentId) => {
        try {
            await dispatch(deleteComment({ postId: post._id, commentId })).unwrap();
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment");
        }
    };
    // ==================== FORMAT DATE ====================
    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    // ==================== LOADING / NOT FOUND ====================
    if (!post) {
        if (postsStatus === "loading" || postsStatus === "idle") {
            return (
                <div className="message-container">
                    <SideBar sidebarHide={sidebarHide} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
                    <section id="content" className="chat-page">
                        <Nav
                            sidebarHide={sidebarHide}
                            setSidebarHide={setSidebarHide}
                            searchShow={searchShow}
                            setSearchShow={setSearchShow}
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                        />
                        <main style={{ textAlign: "center", padding: "50px" }}>
                            <p>Loading post...</p>
                        </main>
                    </section>
                </div>
            );
        }
        if (postsStatus === "succeeded") {
            navigate("/timeline");
            return null;
        }
    }

    const isAuthor = post.author._id === currentUser?._id;
    const isLiked = post.likes.some((like) => like._id === currentUser?._id);

    return (
        <><div className="message-container">
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
                            {/* Back Button */}
                            {/* Single Post Card - Larger */}
                            <div className="post-card">
                                <div className="post-card-header">
                                    <div className="post-user-info">
                                        <img
                                            src={post.author.photoUrl || userAvatar}
                                            alt="user"
                                            className="post-user-avatar"
                                            onClick={()=>navigate(`/profile/${post.author._id}`)}
                                        />
                                        <div className="user-details">
                                            <h3 className="post-author-name" onClick={()=>navigate(`/profile/${post.author._id}`)}>{post.author.name}</h3>
                                            <p className="post-time">{formatDate(post.createdAt)}</p>
                                        </div>
                                    </div>
                                    {isAuthor && (
                                        <div className="post-menu-container">
                                            <button
                                                className="post-menu-btn"
                                                onClick={() => setShowMenu(!showMenu)}
                                            >
                                                ⋮
                                            </button>
                                            {showMenu && (
                                                <div className="post-menu">
                                                    <button onClick={handleDeletePost} className="menu-item delete">
                                                        Delete Post
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="post-content">
                                    <p style={{ whiteSpace: "pre-line" }}>{post.content}</p>
                                    {post.images?.length > 0 && (
                                        <div className={`post-images ${post.images.length === 1 ? "single" : "multiple"}`}>
                                            <PhotoProvider maskOpacity={0.8} speed={() => 300}>
                                                {post.images.map((image, index) => {
                                                    const isVisible = index < 2;

                                                    return (
                                                        <div
                                                            className="image-wrapper"
                                                            key={image}
                                                            style={{ display: isVisible ? "block" : "none" }}
                                                        >
                                                            <PhotoView src={image}>
                                                                <img src={image} alt={`post-${index}`} />
                                                            </PhotoView>
                                                            {index === 1 && post.images.length > 2 && (
                                                                <div className="more-overlay">+{post.images.length - 2}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </PhotoProvider>
                                        </div>
                                    )}
                                </div>

                                <div className="post-stats">
                                    <span className="stat">{post.likes.length} likes</span>
                                    <span className="stat">•</span>
                                    <span className="stat">{post.comments.length} comments</span>
                                </div>

                                <div className="post-actions-container">
                                    <button
                                        className={`post-action ${isLiked ? "active" : ""}`}
                                        onClick={handleLike}
                                    >
                                        {isLiked ? <BiSolidLike /> : <BiLike />}
                                    </button>
                                    <button className="post-action">
                                        <BiComment />
                                    </button>
                                </div>

                                {/* Comments Section - Expanded */}
                                <div className="comments-section expanded">
                                    <form onSubmit={handleAddComment} className="comment-form">
                                        <img
                                            src={currentUser?.photoUrl || userAvatar}
                                            alt="user"
                                            className="comment-avatar"
                                            style={{ width: "32px", height: "32px", marginRight: "10px" }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="comment-input"
                                            disabled={loading}
                                            style={{ flex: 1, marginRight: "10px" }}
                                        />
                                        <button
                                            type="submit"
                                            className="comment-submit-btn"
                                            disabled={loading || !commentText.trim()}
                                        >
                                            {loading ? <BsThreeDots /> : <SiTelegram />}
                                        </button>
                                    </form>

                                    <div className="comments-list">
                                        {post.comments.map((comment) => (
                                            <div key={comment._id} className="comment expanded">
                                                <img
                                                    src={comment.userPhoto || userAvatar}
                                                    alt="user"
                                                    className="comment-avatar"
                                                    onClick={()=>navigate(`/profile/${comment.userId._id}`)}
                                                />
                                                <div className="comment-content">
                                                    <div className="comment-text">
                                                        <div className="comment-user-container">
                                                            <div className="comment-user">
                                                                <strong onClick={()=>navigate(`/profile/${comment.userId._id}`)}>{comment.userName}</strong>
                                                                <span className="stat">•</span>
                                                                <span className="comment-time">
                                                                    {formatDate(comment.createdAt)}
                                                                </span>
                                                            </div>
                                                            <div className="comment-actions">
                                                                {comment.userId._id === currentUser?.id && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(comment._id)}
                                                                        className="delete-comment-btn"
                                                                    >
                                                                        <BsThreeDots />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p>{comment.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="todo ads">
                            <div className="head">
                                <FaBuysellads />
                                <h3> Ads</h3>
                            </div>
                            <div className="todo-list">
                                <div class="card sweeperCard o-hidden">
                                    <div class="containers">
                                        <div class="icon">
                                            <SiGoogleadsense />
                                        </div>
                                        <div class="title my-3">Easy For Everyone</div>
                                        <div class="subtitle">
                                            Every year, we award travelers’ favorite destinations, hotels,
                                            restaurants, and things to
                                        </div>
                                        <div class="linkMore mt-3">
                                            Learn More
                                            <TbExternalLink />
                                        </div>
                                    </div>
                                </div>
                                <div class="card sweeperCard o-hidden">
                                    <div class="containers">
                                        <div class="icon">
                                            <SiGoogleadsense />
                                        </div>
                                        <div class="title my-3">Easy For Everyone</div>
                                        <div class="subtitle">
                                            Every year, we award travelers’ favorite destinations, hotels,
                                            restaurants, and things to
                                        </div>
                                        <div class="linkMore mt-3">
                                            Learn More
                                            <TbExternalLink />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div></div>
                </main>
            </section>
        </div>
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDeletePost}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
            />
        </>
    );
};

export default SinglePost;
