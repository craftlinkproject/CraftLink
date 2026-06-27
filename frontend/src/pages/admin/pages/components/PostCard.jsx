import React, { useEffect, useState, memo, useCallback } from "react";
import api from "@services/api";
import userAvatar from "../../../../assets/img/userAvatar.jpg";
import { BiLike, BiSolidLike, BiComment, SiTelegram, BsThreeDots } from "@icons";
import { PhotoView, PhotoProvider } from "react-photo-view";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../../../components/ConfirmModal";

const PostCard = ({ post, currentUserId, onPostDeleted }) => {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes.length);
    const visibleImages = post.images.slice(0, 2);
    const remainingCount = post.images.length - 2;
    useEffect(() => {
        if (currentUserId) {
            const isLiked = post.likes.some((like) => like._id === currentUserId);
            setLiked(isLiked);
            setLikes(post.likes.length);
        }
        setComments(post.comments);
    }, [post, currentUserId]);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState(post.comments);
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isAuthor = post.author?._id === currentUserId;

    const handleLike = async () => {
        try {
            const response = await api.patch(`/api/post/${post._id}/like`);

            const updatedLikes = response.data.post.likes;

            setLikes(updatedLikes.length);
            setLiked(updatedLikes.some((like) => like._id === currentUserId));
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();

        if (!commentText.trim()) return;

        try {
            setLoading(true);
            const response = await api.post(`/api/post/${post._id}/comment`, {
                text: commentText,
            });
            setComments(response.data.post.comments);
            setCommentText("");
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await api.delete(
                `/api/post/${post._id}/comment/${commentId}`,
            );
            setComments(response.data.post.comments);
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment");
        }
    };

    const handleDeletePost = useCallback(async () => {
        setShowMenu(false);
        setShowDeleteModal(true);
    }, []);

    const confirmDeletePost = useCallback(async () => {
        try {
            await api.delete(`/api/post/${post._id}`);
            onPostDeleted(post._id);
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post");
        } finally {
            setShowDeleteModal(false);
        }
    }, [post._id, onPostDeleted]);

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

    return (
        <><div className="post-card">
            <div className="post-card-header">
                <div className="post-user-info">
                    <img
                        src={post.author?.photoUrl || userAvatar}
                        alt="user"
                        className="post-user-avatar"
                        onClick={() => navigate(`/profile/${post.author?.id || post.userId}`)}
                    />
                    <div className="user-details">
                        <h3 className="post-author-name" onClick={() => navigate(`/profile/${post.author?.id || post.userId}`)} >{post.author?.name || "Deleted User"}</h3>
                        <p className="post-time" onClick={() => navigate(`/timeline/post/${post._id}`)}>{formatDate(post.createdAt)}</p>
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
                                        className="post-image-wrapper"
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
                <span className="stat">{likes} likes</span>
                <span className="stat">•</span>
                <span className="stat">{comments.length} Comments</span>
            </div>

            <div className="post-actions-container">
                <button
                    className={`post-action ${liked ? "active" : ""}`}
                    onClick={handleLike}
                >
                    {liked ? <BiSolidLike /> : <BiLike />}
                </button>
                <button
                    className="post-action"
                    onClick={() => setShowComments(!showComments)}
                >
                    <BiComment />
                </button>
            </div>

            {showComments && (
                <div className="comments-section">
                    <form onSubmit={handleAddComment} className="comment-form">
                        <input
                            type="text"
                            placeholder="Write your comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="comment-input"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="comment-submit-btn"
                            disabled={loading || !commentText.trim()}
                        >
                            {loading ?
                                <BsThreeDots />
                                :
                                <SiTelegram />
                            }
                        </button>
                    </form>

                    <div className="comments-list">
                        {comments.map((comment) => (
                            <div key={comment._id} className="comment">
                                <img
                                    src={comment.userPhoto || userAvatar}
                                    alt="user"
                                    className="comment-avatar"
                                     onClick={()=> navigate(`/profile/${comment.userId._id}`)}
                                />
                                <div className="comment-content">
                                    <div className="comment-text">
                                        <div className="comment-user-container">
                                            <div className="comment-user">
                                                <strong onClick={()=> navigate(`/profile/${comment.userId._id}`)}>{comment.userName}</strong>
                                                <span className="stat">•</span>
                                                <span className="comment-time">
                                                    {formatDate(comment.createdAt)}
                                                </span>
                                            </div>
                                            <div className="comment-actions">
                                                {comment.userId._id === currentUserId && (
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
            )}
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

const areEqual = (prevProps, nextProps) => {
    if (prevProps.currentUserId !== nextProps.currentUserId) return false;
    if (prevProps.post._id !== nextProps.post._id) return false;
    // If the reference is the same, avoid re-render
    if (prevProps.post === nextProps.post) return true;
    // Otherwise, compare a small set of fields that affect rendering
    return (
        prevProps.post.likes?.length === nextProps.post.likes?.length &&
        prevProps.post.comments?.length === nextProps.post.comments?.length &&
        prevProps.post.content === nextProps.post.content
    );
};

export default memo(PostCard, areEqual);
