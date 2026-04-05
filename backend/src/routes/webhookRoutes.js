import express from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import {
  deleteUserByClerkId,
  patchUserByClerkId,
  upsertUserFromClerk,
} from "../models/clerkSyncModel.js";

const router = express.Router();

/**
 * Clerk webhooks:
 * https://clerk.com/docs/webhooks/sync-data
 */
router.post(
  "/",
  express.raw({ type: "*/*" }), // 🔥 FIXED HERE
  async (req, res) => {
    try {
      const event = await verifyWebhook(req);
      const { type, data } = event || {};

      console.log("✅ Webhook received:", type); // helpful debug

      if (!type) {
        return res.status(400).json({
          error: "Invalid webhook payload: missing event type",
        });
      }

      switch (type) {
        case "user.created": {
          const created = await upsertUserFromClerk(data || {});
          return res.status(200).json({
            ok: true,
            action: "user.created",
            clerkId: created?.clerkId || null,
          });
        }

        case "user.updated": {
          const updated = await upsertUserFromClerk(data || {});

          await patchUserByClerkId(updated?.clerkId || data?.id, {
            username: data?.username || updated?.username || "",
            imageUrl: data?.image_url || updated?.imageUrl || "",
          });

          return res.status(200).json({
            ok: true,
            action: "user.updated",
            clerkId: updated?.clerkId || data?.id || null,
          });
        }

        case "user.deleted": {
          const clerkId = data?.id || null;
          const removed = clerkId
            ? await deleteUserByClerkId(clerkId)
            : false;

          return res.status(200).json({
            ok: true,
            action: "user.deleted",
            clerkId,
            removed,
          });
        }

        default:
          return res.status(200).json({
            ok: true,
            ignored: true,
            action: type,
          });
      }
    } catch (error) {
      console.error("❌ Webhook error:", error.message);

      return res.status(400).json({
        error: "Webhook verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;