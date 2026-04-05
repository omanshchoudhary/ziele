import { getProfileById, getProfiles } from "../models/profileModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";

export const getAllProfiles = async (req, res) => {
  try {
    res.json(await getProfiles());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await getProfileById(req.params.id || "omansh");
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
    const clerkUserId = req?.authContext?.userId || null;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await getProfileForClerkUser(clerkUserId);

    if (!profile) {
      return res.status(404).json({
        error:
          "Authenticated user exists in Clerk but no local profile is synced yet.",
      });
    }

    return res.json(profile);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch current profile" });
  }
};
