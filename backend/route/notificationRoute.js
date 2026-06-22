import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getNotifications, markAsRead, deleteAllNotifications } from "../controller/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/read/:id", authMiddleware, markAsRead);
router.delete("/", authMiddleware, deleteAllNotifications);

export default router;
