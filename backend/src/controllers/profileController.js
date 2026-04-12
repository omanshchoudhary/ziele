import {
  followProfileByIds,
  getProfileById,
  getProfiles,
  touchDailyStreak,
  unfollowProfileByIds,
} from "../models/profileModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import { notifyProfile } from "../services/notificationService.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  const profile = await getProfileForClerkUser(clerkUserId);
  req.resolvedProfile = profile || null;
  return profile;
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
    const authProfile = await resolveAuthProfile(req);

    if (!authProfile) {
      return res.status(404).json({
        error:
          "Authenticated user exists in Clerk but no local profile is synced yet.",
      });
    }

    await touchDailyStreak(authProfile.id);
    return res.json(await getProfileById(authProfile.id, authProfile.id));
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
      targetUser: profile?.id || req.params.id,
      type: "follow",
      sourceProfile: authProfile,
      metadata: {
        profileId: profile?.id || req.params.id,
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

export const updateCurrentProfile = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const { name, bio, handle } = req.body;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Check if handle is taken by another user
    if (handle && handle !== authProfile.handle) {
      const existing = await prisma.profile.findFirst({
        where: { handle }
      });
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    const updated = await prisma.profile.update({
      where: { id: authProfile.id },
      data: {
        name: name !== undefined ? name : authProfile.name,
        bio: bio !== undefined ? bio : authProfile.bio,
        handle: handle !== undefined ? handle : authProfile.handle,
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to update profile", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
