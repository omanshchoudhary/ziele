import express from "express";
import { deleteComment } from "../controllers/commentController.js";
import {
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected: only authenticated users can delete comments
router.delete("/:id", requireAuthWithContext, requireUserId, deleteComment);

export default router;
