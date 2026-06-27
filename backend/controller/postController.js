import Post from "../model/postModel.js";
import User from "../model/userModel.js";
import Certificate from "../model/certificateModel.js";
import { createNotification } from "./notificationController.js";

// ==================== CREATE POST ====================
export const createPost = async (req, res) => {
  try {
    const { content, images } = req.body;
    const userId = req.userId;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Post content is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = new Post({
      author: userId,
      content,
      images: images || [],
    });

    await post.save();
    await post.populate("author", "name photoUrl");

    // Notify all online users about the new post
    const io = req.app.get("io");
    if (io) {
      io.emit("newPost", {
        postId: post._id,
        authorId: userId,
        authorName: post.author.name,
      });
    }

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

// ==================== GET ALL POSTS ====================
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "name photoUrl")
      .populate("likes", "name photoUrl")
      .populate("comments.userId", "name photoUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

// ==================== GET USER POSTS ====================
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .populate("author", "name photoUrl")
      .populate("likes", "name photoUrl")
      .populate("comments.userId", "name photoUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user posts",
      error: error.message,
    });
  }
};

// ==================== LIKE POST ====================
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => !id.equals(userId));
    } else {
      post.likes.push(userId);
    }

    await post.save();
    await post.populate("author", "name photoUrl");
    await post.populate("likes", "name photoUrl");

    // Broadcast updated post to all users for real-time sync
    const io = req.app.get("io");
    if (io) {
      io.emit("postUpdated", post);
    }

    // Notify post author on new like
    if (!isLiked && post.author._id.toString() !== userId) {
      const liker = await User.findById(userId).select("name photoUrl");
      const likerName = liker?.name || "Someone";
      createNotification({
        recipient: post.author._id,
        type: "like",
        title: "New Like",
        titleAr: "إعجاب جديد",
        message: `${likerName} liked your post`,
        messageAr: `${likerName} أعجب بمنشورك`,
        link: `/timeline/post/${postId}`,
        actor: userId,
        io,
        dedupKey: { link: `/timeline/post/${postId}` },
      });
    }

    return res.status(200).json({
      message: isLiked ? "Post unliked" : "Post liked",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error liking post",
      error: error.message,
    });
  }
};

// ==================== ADD COMMENT ====================
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Rule: Craftsman (role === 1) must have at least one course completion certificate to comment
    if (user.role === 1) {
      const certificateCount = await Certificate.countDocuments({ user: userId });
      if (certificateCount === 0) {
        return res.status(403).json({
          message: "عذراً، يجب الحصول على شهادة إتمام كورس واحد على الأقل لتتمكن من التعليق على المنشورات.",
          messageEn: "Sorry, you must obtain at least one course completion certificate to comment on posts."
        });
      }
    }

    const comment = {
      userId,
      userName: user.name,
      userPhoto: user.photoUrl,
      text,
    };

    post.comments.push(comment);
    await post.save();
    await post.populate("author", "name photoUrl");
    await post.populate("comments.userId", "name photoUrl");

    // Broadcast updated post to all users for real-time sync
    const io = req.app.get("io");
    if (io) {
      io.emit("postUpdated", post);
    }

    // Notify post author on new comment
    if (post.author._id.toString() !== userId) {
      const commentCount = post.comments.filter((c) => c.userId.toString() === userId).length;
      const msg = commentCount > 1
        ? `${user.name} commented again on your post (${commentCount} comments)`
        : `${user.name} commented on your post: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`;
      const msgAr = commentCount > 1
        ? `${user.name} علق مرة أخرى على منشورك (${commentCount} تعليقات)`
        : `${user.name} علق على منشورك: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`;
      createNotification({
        recipient: post.author._id,
        type: "comment",
        title: "New Comment",
        titleAr: "تعليق جديد",
        message: msg,
        messageAr: msgAr,
        link: `/timeline/post/${postId}`,
        actor: userId,
        io,
        dedupKey: { link: `/timeline/post/${postId}` },
      });
    }

    return res.status(201).json({
      message: "Comment added successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error adding comment",
      error: error.message,
    });
  }
};

// ==================== DELETE COMMENT ====================
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.userId.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    post.comments.id(commentId).deleteOne();
    await post.save();
    await post.populate("author", "name photoUrl");
    await post.populate("comments.userId", "name photoUrl");

    return res.status(200).json({
      message: "Comment deleted successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting comment",
      error: error.message,
    });
  }
};

// ==================== DELETE POST ====================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.author.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting post",
      error: error.message,
    });
  }
};

// ==================== UPDATE POST ====================
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, images } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.author.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized to update this post" });
    }

    if (content) post.content = content;
    if (images) post.images = images;

    await post.save();
    await post.populate("author", "name photoUrl");
    await post.populate("likes", "name photoUrl");
    await post.populate("comments.userId", "name photoUrl");

    return res.status(200).json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating post",
      error: error.message,
    });
  }
};
