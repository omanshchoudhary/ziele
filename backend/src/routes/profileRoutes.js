import express from "express";
import {
  getAllProfiles,
  getCurrentProfile,
  getProfile,
} from "../controllers/profileController.js";
import {
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public profile endpoints
router.get("/", getAllProfiles);

// Protected endpoint: only authenticated Clerk users can access current profile
// IMPORTANT: define /current BEFORE /:id so it isn't shadowed.
router.get(
  "/current",
  requireAuthWithContext,
  requireUserId,
  getCurrentProfile,
);

// Public profile by id
router.get("/:id", getProfile);

export default router;
