import { getDiscoverData, getSidebarData } from '../models/metaModel.js';
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  return getProfileForClerkUser(clerkUserId);
}

export const getSidebar = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    res.json(await getSidebarData(authProfile?.id || null));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sidebar data' });
  }
};

export const getDiscover = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    res.json(await getDiscoverData(req.query || {}, authProfile?.id || null));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discover data' });
  }
};
