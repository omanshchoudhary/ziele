import express from "express";
import {
  createPostComment,
  createPostItem,
  deletePostItem,
  getMyBookmarks,
  getAllPosts,
  getPostById,
  getPostComments,
  getRandomPostItem,
  getRelatedPostItems,
  reactToPostItem,
  togglePostBookmarkItem,
  uploadPostMediaItem,
  updatePostItem,
  validatePostMediaUrlItem,
} from "../controllers/postController.js";
import {
  optionalAuth,
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";
import { mediaUploadMiddleware } from "../middleware/uploadMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";
import {
  postCommentSchema,
  postCreateSchema,
  postMediaUrlSchema,
  postReactionSchema,
  postUpdateSchema,
} from "../validation/contentSchemas.js";

const router = express.Router();
const createOrUpdatePostLimiter = createRateLimiter({
  keyPrefix: "posts:write",
  limit: 15,
  windowMs: 10 * 60_000,
  message: "Post write rate limit reached. Please wait before publishing again.",
});
const commentLimiter = createRateLimiter({
  keyPrefix: "posts:comments",
  limit: 30,
  windowMs: 10 * 60_000,
});
const reactionLimiter = createRateLimiter({
  keyPrefix: "posts:reactions",
  limit: 80,
  windowMs: 10 * 60_000,
});

// Public read routes
router.get("/random", optionalAuth, getRandomPostItem);
router.get("/", optionalAuth, getAllPosts);
router.get(
  "/bookmarks/list",
  requireAuthWithContext,
  requireUserId,
  getMyBookmarks,
);
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
  validateBody(postMediaUrlSchema),
  validatePostMediaUrlItem,
);
router.post(
  "/",
  requireAuthWithContext,
  requireUserId,
  createOrUpdatePostLimiter,
  validateBody(postCreateSchema),
  createPostItem,
);
router.put(
  "/:id",
  requireAuthWithContext,
  requireUserId,
  createOrUpdatePostLimiter,
  validateBody(postUpdateSchema),
  updatePostItem,
);
router.delete(
  "/:id",
  requireAuthWithContext,
  requireUserId,
  createOrUpdatePostLimiter,
  deletePostItem,
);
router.post(
  "/:id/reaction",
  requireAuthWithContext,
  requireUserId,
  reactionLimiter,
  validateBody(postReactionSchema),
  reactToPostItem,
);
router.post(
  "/:id/bookmark",
  requireAuthWithContext,
  requireUserId,
  reactionLimiter,
  togglePostBookmarkItem,
);
router.post(
  "/:id/comments",
  requireAuthWithContext,
  requireUserId,
  commentLimiter,
  validateBody(postCommentSchema),
  createPostComment,
);

export default router;
