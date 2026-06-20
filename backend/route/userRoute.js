import express from "express"
import {
  getCurrentUser,
  updateProfile,
  changePassword,
  getPurchasedCourses,
  getUserById,
  getProgress,
  updateProgress,
  claimCertificate,
  getUserCertificates,
  verifyCertificate,
  getPublicCertificates,
  searchUsers
} from "../controller/userController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
const userRouter = express.Router()
userRouter.get("/search", searchUsers);
userRouter.get("/getcurrentuser", authMiddleware, getCurrentUser)
userRouter.get("/purchased", authMiddleware, getPurchasedCourses);
userRouter.get("/progress/:courseId", authMiddleware, getProgress);
userRouter.post("/progress", authMiddleware, updateProgress);
userRouter.patch("/profile", authMiddleware, updateProfile)
userRouter.patch("/changepassword", authMiddleware, changePassword);

// Certificates routes
userRouter.post("/certificate/claim", authMiddleware, claimCertificate);
userRouter.get("/certificates", authMiddleware, getUserCertificates);
userRouter.get("/certificate/verify/:key", verifyCertificate);
userRouter.get("/:id/certificates", getPublicCertificates);
userRouter.get("/:id", authMiddleware, getUserById);

export default userRouter