import express from "express";
import {
  followProfile,
  getAllProfiles,
  getCurrentProfile,
  getProfile,
  unfollowProfile,
} from "../controllers/profileController.js";
import {
  optionalAuth,
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public profile endpoints
router.get("/", optionalAuth, getAllProfiles);

// Protected endpoint: only authenticated Clerk users can access current profile
// IMPORTANT: define /current BEFORE /:id so it isn't shadowed.
router.get(
  "/current",
  requireAuthWithContext,
  requireUserId,
  getCurrentProfile,
);

router.post(
  "/:id/follow",
  requireAuthWithContext,
  requireUserId,
  followProfile,
);
router.delete(
  "/:id/follow",
  requireAuthWithContext,
  requireUserId,
  unfollowProfile,
);

// Public profile by id
router.get("/:id", optionalAuth, getProfile);

export default router;
