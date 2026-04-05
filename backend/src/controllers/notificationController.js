import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import {
  getUnreadNotificationsCount,
  listNotificationsForProfile,
  markNotificationsRead,
} from "../services/notificationService.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  const profile = clerkUserId
    ? await getProfileForClerkUser(clerkUserId)
    : null;
  req.resolvedProfile = profile || null;
  return profile;
}

export const getAllNotifications = async (req, res) => {
  try {
    const profile = await resolveAuthProfile(req);

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

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const profile = await resolveAuthProfile(req);
    if (!profile?.id) {
      return res.status(404).json({
        error: "Authenticated user does not have a synced local profile yet.",
      });
    }

    const unreadCount = await getUnreadNotificationsCount(profile.id);
    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const profile = await resolveAuthProfile(req);
    if (!profile?.id) {
      return res.status(404).json({
        error: "Authenticated user does not have a synced local profile yet.",
      });
    }

    await markNotificationsRead(profile.id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};
