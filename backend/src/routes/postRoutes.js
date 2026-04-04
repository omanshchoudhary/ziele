import express from "express";
import {
  createPostComment,
  createPostItem,
  getAllPosts,
  getPostById,
  getPostComments,
  getRandomPostItem,
  getRelatedPostItems,
} from "../controllers/postController.js";
import {
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public read routes
router.get("/random", getRandomPostItem);
router.get("/", getAllPosts);
router.get("/:id/comments", getPostComments);
router.get("/:id/related", getRelatedPostItems);
router.get("/:id", getPostById);

// Protected write routes (Clerk auth required)
router.post("/", requireAuthWithContext, requireUserId, createPostItem);
router.post(
  "/:id/comments",
  requireAuthWithContext,
  requireUserId,
  createPostComment,
);

export default router;
