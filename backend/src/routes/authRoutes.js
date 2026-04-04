import express from "express";
import { getAuth } from "@clerk/express";
import {
  optionalAuth,
  requireAuthWithContext,
  requireUserId,
} from "../middleware/authMiddleware.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";

const router = express.Router();

/**
 * GET /api/auth/status
 * Public debug endpoint:
 * - If signed in, returns Clerk auth context
 * - If signed out, returns unauthenticated status
 */
router.get("/status", optionalAuth, (req, res) => {
  const auth = getAuth(req);
  const context = req.authContext || {
    isAuthenticated: false,
    userId: null,
    sessionId: null,
    orgId: null,
    actor: null,
  };

  return res.json({
    ok: true,
    authenticated: context.isAuthenticated,
    auth: {
      userId: context.userId,
      sessionId: context.sessionId,
      orgId: context.orgId,
      actor: context.actor,
      // helpful debug metadata from Clerk
      claims: auth?.sessionClaims || null,
    },
  });
});

/**
 * GET /api/auth/me
 * Protected endpoint to validate Clerk middleware wiring.
 * Requires a valid Clerk session token.
 */
router.get(
  "/me",
  requireAuthWithContext,
  requireUserId,
  (req, res) => {
    const clerkId = req.authContext.userId;
    const profile = getProfileForClerkUser(clerkId);

    if (!profile) {
      return res.status(404).json({
        ok: false,
        error:
          "Authenticated user exists in Clerk but no local profile is synced yet.",
        clerkId,
      });
    }

    return res.json({
      ok: true,
      clerkId,
      profile,
    });
  },
);

export default router;
