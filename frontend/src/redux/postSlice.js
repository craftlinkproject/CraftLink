import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../services/api";

// Fetch all posts (timeline)
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/post");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const deleteComment = createAsyncThunk(
  "posts/deleteComment",
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/api/post/${postId}/comment/${commentId}`
      );
      return response.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// Create a new post
export const createPost = createAsyncThunk(
  "posts/createPost",
  async ({ content, images }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/post", {
        content,
        images,
      });
      return response.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Like / Unlike a post
export const toggleLike = createAsyncThunk(
  "posts/toggleLike",
  async ({ postId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/post/${postId}/like`);
      return response.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add comment
export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/post/${postId}/comment`, { text });
      return response.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete post
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async ({ postId }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/post/${postId}`);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const postSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    status: "idle",
    error: null,
    createStatus: "idle",
    createError: null,
  },
  reducers: {
    clearPosts: (state) => {
      state.posts = [];
      state.status = "idle";
      state.error = null;
      state.createStatus = "idle";
      state.createError = null;
    },
    updatePost: (state, action) => {
      const updatedPost = action.payload;
      const index = state.posts.findIndex((p) => p._id === updatedPost._id);
      if (index !== -1) {
        state.posts[index] = updatedPost;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPosts
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // createPost
      .addCase(createPost.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload || action.error.message;
      })

      // toggleLike
      .addCase(toggleLike.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex((p) => p._id === updatedPost._id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
      })

      // addComment
      .addCase(addComment.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex((p) => p._id === updatedPost._id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex((p) => p._id === updatedPost._id);

        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
      })
      // deletePost
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearPosts, updatePost } = postSlice.actions;

export default postSlice.reducer;
