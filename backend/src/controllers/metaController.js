import {
  getAnalyticsData,
  getCommunitiesData,
  getDiscoverData,
  getRecommendationsData,
  getSidebarData,
  getTrendingData,
} from "../models/metaModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  const profile = await getProfileForClerkUser(clerkUserId);
  req.resolvedProfile = profile || null;
  return profile;
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
    res.json(
      await getDiscoverData(
        req.validatedQuery || req.query || {},
        authProfile?.id || null,
      ),
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch discover data" });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    res.json(
      await getRecommendationsData(
        authProfile?.id || null,
        req.validatedQuery || req.query || {},
      ),
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

export const getTrending = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    res.json(
      await getTrendingData(
        req.validatedQuery || req.query || {},
        authProfile?.id || null,
      ),
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending data" });
  }
};

export const getCommunities = async (req, res) => {
  try {
    res.json(await getCommunitiesData(req.validatedQuery || req.query || {}));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch communities data" });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json(
      await getAnalyticsData(
        authProfile.id,
        req.validatedQuery || req.query || {},
      ),
    );
  } catch (error) {
    const status = Number(error?.statusCode || 500);
    res.status(status).json({ error: error.message || "Failed to fetch analytics" });
  }
};
