import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@services/api";

export const fetchEarnings = createAsyncThunk(
  "wallet/fetchEarnings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/withdrawal/earnings", {
        withCredentials: true,
      });
      if (response.data?.success) {
        return response.data;
      }
      return rejectWithValue("Failed to fetch earnings");
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    earnings: null,
    withdrawals: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearWallet: (state) => {
      state.earnings = null;
      state.withdrawals = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEarnings.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEarnings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.earnings = action.payload;
        state.withdrawals = action.payload.withdrawals || [];
      })
      .addCase(fetchEarnings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearWallet } = walletSlice.actions;
export default walletSlice.reducer;
