import express from "express";
import { getAllNotifications } from "../controllers/notificationController.js";
import {
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected: user must be authenticated via Clerk
router.get("/", requireAuthWithContext, requireUserId, getAllNotifications);

export default router;
