import {
  followProfileByIds,
  getProfileById,
  getProfiles,
  touchDailyStreak,
  unfollowProfileByIds,
} from "../models/profileModel.js";
import { prisma } from "../models/prismaClient.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import { notifyProfile } from "../services/notificationService.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  const profile = await getProfileForClerkUser(clerkUserId);
  req.resolvedProfile = profile || null;
  return profile;
}

function normalizeUsername(value = "") {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

function toHandle(username = "") {
  const normalized = normalizeUsername(username);
  return normalized ? `@${normalized}` : "";
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
    const [profile, user] = await Promise.all([
      getProfileById(authProfile.id, authProfile.id),
      prisma.user.findUnique({
        where: { clerkId: authProfile.clerkId },
        select: {
          email: true,
          username: true,
        },
      }),
    ]);

    return res.json({
      ...profile,
      email: user?.email || null,
      username:
        user?.username ||
        normalizeUsername(profile?.handle || authProfile.handle || ""),
    });
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

    const payload = req.validatedBody || req.body || {};
    const nextName =
      typeof payload.name === "string" ? payload.name.trim() : undefined;
    const nextBio =
      typeof payload.bio === "string" ? payload.bio.trim() : undefined;
    const nextHandleValue =
      typeof payload.handle === "string" ? payload.handle : undefined;
    const nextHandle =
      nextHandleValue !== undefined ? toHandle(nextHandleValue) : undefined;

    // Check if handle is taken by another user
    if (nextHandle && nextHandle !== authProfile.handle) {
      const existing = await prisma.profile.findFirst({
        where: {
          handle: nextHandle,
          id: { not: authProfile.id },
        },
      });
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: authProfile.id },
        data: {
          name: nextName !== undefined ? nextName : authProfile.name,
          bio: nextBio !== undefined ? nextBio : authProfile.bio,
          handle: nextHandle !== undefined ? nextHandle : authProfile.handle,
        },
      });

      if (nextHandle !== undefined) {
        await tx.user.update({
          where: { clerkId: authProfile.clerkId },
          data: {
            username: normalizeUsername(nextHandle),
          },
        });
      }
    });

    const [updatedProfile, updatedUser] = await Promise.all([
      getProfileById(authProfile.id, authProfile.id),
      prisma.user.findUnique({
        where: { clerkId: authProfile.clerkId },
        select: {
          email: true,
          username: true,
        },
      }),
    ]);

    res.json({
      ...updatedProfile,
      email: updatedUser?.email || null,
      username:
        updatedUser?.username ||
        normalizeUsername(updatedProfile?.handle || authProfile.handle || ""),
    });
  } catch (error) {
    console.error("Failed to update profile", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
