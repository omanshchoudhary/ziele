import express from "express";
import { deleteComment } from "../controllers/commentController.js";
import {
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();
const deleteCommentLimiter = createRateLimiter({
  keyPrefix: "comments:delete",
  limit: 25,
  windowMs: 10 * 60_000,
});

// Protected: only authenticated users can delete comments
router.delete(
  "/:id",
  requireAuthWithContext,
  requireUserId,
  deleteCommentLimiter,
  deleteComment,
);

export default router;
