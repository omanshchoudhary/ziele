import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import { listNotificationsForProfile } from "../services/notificationService.js";

export const getAllNotifications = async (req, res) => {
  try {
    const clerkUserId = req?.authContext?.userId || null;
    const profile = clerkUserId
      ? await getProfileForClerkUser(clerkUserId)
      : null;

    if (!profile?.id) {
      return res.status(404).json({
        error: "Authenticated user does not have a synced local profile yet.",
      });
    }

    const notifications = await listNotificationsForProfile(profile.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
