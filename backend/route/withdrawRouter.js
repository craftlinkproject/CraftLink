import express from "express";
import {
  getInstructorEarnings,
  requestWithdrawal,
  getWithdrawalHistory,
  getDashboardStats,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  getAllUsers,
  toggleUserStatus,
} from "../controller/withdrawController.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";

const withdrawRouter = express.Router();

// Instructor routes
withdrawRouter.get("/earnings", authMiddleware, getInstructorEarnings);
withdrawRouter.post("/request", authMiddleware, requestWithdrawal);
withdrawRouter.get("/history", authMiddleware, getWithdrawalHistory);

// Admin routes
withdrawRouter.get("/admin/dashboard-stats", authMiddleware, adminOnly, getDashboardStats);
withdrawRouter.get("/admin/withdrawals", authMiddleware, adminOnly, getAllWithdrawals);
withdrawRouter.post("/admin/approve/:withdrawalId", authMiddleware, adminOnly, approveWithdrawal);
withdrawRouter.post("/admin/reject/:withdrawalId", authMiddleware, adminOnly, rejectWithdrawal);
withdrawRouter.post("/admin/complete/:withdrawalId", authMiddleware, adminOnly, completeWithdrawal);
withdrawRouter.get("/admin/users", authMiddleware, adminOnly, getAllUsers);
withdrawRouter.post("/admin/toggle-user/:userId", authMiddleware, adminOnly, toggleUserStatus);

export default withdrawRouter;
