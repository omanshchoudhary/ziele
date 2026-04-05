import express from "express";
import {
  getAllNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";
import {
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected: user must be authenticated via Clerk
router.get("/", requireAuthWithContext, requireUserId, getAllNotifications);
router.get(
  "/unread-count",
  requireAuthWithContext,
  requireUserId,
  getUnreadNotificationCount,
);
router.post(
  "/mark-read",
  requireAuthWithContext,
  requireUserId,
  markAllNotificationsAsRead,
);

export default router;
