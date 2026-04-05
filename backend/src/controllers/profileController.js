import {
  followProfileByIds,
  getProfileById,
  getProfiles,
  unfollowProfileByIds,
} from "../models/profileModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import { notifyProfile } from "../services/notificationService.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  return getProfileForClerkUser(clerkUserId);
}

export const getAllProfiles = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    res.json(await getProfiles(authProfile?.id || null));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const profile = await getProfileById(
      req.params.id || "omansh",
      authProfile?.id || null,
    );
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const getCurrentProfile = async (req, res) => {
  try {
    const profile = await resolveAuthProfile(req);

    if (!profile) {
      return res.status(404).json({
        error:
          "Authenticated user exists in Clerk but no local profile is synced yet.",
      });
    }

    return res.json(await getProfileById(profile.id, profile.id));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch current profile" });
  }
};

export const followProfile = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);

    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await followProfileByIds(authProfile.id, req.params.id);
    const profile = await getProfileById(req.params.id, authProfile.id);

    await notifyProfile({
      targetUser: req.params.id,
      type: "follow",
      sourceProfile: authProfile,
      metadata: {
        profileId: req.params.id,
      },
    });

    return res.json({
      ok: true,
      isFollowing: true,
      profile,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to follow profile.",
    });
  }
};

export const unfollowProfile = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);

    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await unfollowProfileByIds(authProfile.id, req.params.id);
    const profile = await getProfileById(req.params.id, authProfile.id);

    return res.json({
      ok: true,
      isFollowing: false,
      profile,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to unfollow profile.",
    });
  }
};
