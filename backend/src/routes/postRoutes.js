import express from "express";
import {
  createPostComment,
  createPostItem,
  getAllPosts,
  getPostById,
  getPostComments,
  getRandomPostItem,
  getRelatedPostItems,
  uploadPostMediaItem,
  validatePostMediaUrlItem,
} from "../controllers/postController.js";
import {
  optionalAuth,
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";
import { mediaUploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public read routes
router.get("/random", optionalAuth, getRandomPostItem);
router.get("/", optionalAuth, getAllPosts);
router.get("/:id/comments", getPostComments);
router.get("/:id/related", optionalAuth, getRelatedPostItems);
router.get("/:id", optionalAuth, getPostById);

// Protected write routes (Clerk auth required)
router.post(
  "/media/upload",
  requireAuthWithContext,
  requireUserId,
  mediaUploadMiddleware.single("media"),
  uploadPostMediaItem,
);
router.post(
  "/media/validate",
  requireAuthWithContext,
  requireUserId,
  validatePostMediaUrlItem,
);
router.post("/", requireAuthWithContext, requireUserId, createPostItem);
router.post(
  "/:id/comments",
  requireAuthWithContext,
  requireUserId,
  createPostComment,
);

export default router;
