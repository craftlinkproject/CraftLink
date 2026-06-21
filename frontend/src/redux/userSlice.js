import { createSlice } from "@reduxjs/toolkit";
import { changePassword } from "./userThunk";

const savedUser = localStorage.getItem("userData");

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: savedUser ? JSON.parse(savedUser) : null,
    userCache: {},
    loading: false,
    error: null,
    successMessage: null,
  },

  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;

      localStorage.setItem(
        "userData",
        JSON.stringify(action.payload)
      );
    },

    logout: (state) => {
      state.userData = null;
      localStorage.removeItem("userData");
      sessionStorage.removeItem("token");
    },

    setUserCache: (state, action) => {
      const { userId, user } = action.payload;
      state.userCache[userId] = {
        user,
        lastUpdated: Date.now(),
      };
    },

    clearUserMessage: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage =
          action.payload?.message ||
          "Password changed successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setUserData,
  logout,
  clearUserMessage,
  setUserCache,
} = userSlice.actions;

export default userSlice.reducer;