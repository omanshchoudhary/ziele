import {
  getAnalyticsData,
  getCommunitiesData,
  getDiscoverData,
  getRecommendationsData,
  getSidebarData,
  getTrendingData,
} from "../models/metaModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import { getRedisClient } from "../integrations/redisClient.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  const profile = await getProfileForClerkUser(clerkUserId);
  req.resolvedProfile = profile || null;
  return profile;
}

async function withCache(key, ttlSeconds, fetcher) {
  try {
    const client = await getRedisClient();
    if (!client) return await fetcher();

    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetcher();
    await client.setEx(key, ttlSeconds, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    return fetcher();
  }
}

export const getSidebar = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const cacheKey = `sidebar:${authProfile?.id || "public"}`;
    const data = await withCache(cacheKey, 60, () => getSidebarData(authProfile?.id || null));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sidebar data' });
  }
};

export const getDiscover = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const query = req.validatedQuery || req.query || {};
    const cacheKey = `discover:${authProfile?.id || "public"}:${JSON.stringify(query)}`;
    const data = await withCache(cacheKey, 60, () => getDiscoverData(query, authProfile?.id || null));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch discover data" });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const query = req.validatedQuery || req.query || {};
    const cacheKey = `recs:${authProfile?.id || "public"}:${JSON.stringify(query)}`;
    const data = await withCache(cacheKey, 60, () => getRecommendationsData(authProfile?.id || null, query));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

export const getTrending = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const query = req.validatedQuery || req.query || {};
    const cacheKey = `trending:${authProfile?.id || "public"}:${JSON.stringify(query)}`;
    const data = await withCache(cacheKey, 120, () => getTrendingData(query, authProfile?.id || null));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trending data" });
  }
};

export const getCommunities = async (req, res) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const cacheKey = `communities:${JSON.stringify(query)}`;
    const data = await withCache(cacheKey, 120, () => getCommunitiesData(query));
    res.json(data);
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

    const query = req.validatedQuery || req.query || {};
    const cacheKey = `analytics:${authProfile.id}:${JSON.stringify(query)}`;
    const data = await withCache(cacheKey, 300, () => getAnalyticsData(authProfile.id, query));
    res.json(data);
  } catch (error) {
    const status = Number(error?.statusCode || 500);
    res.status(status).json({ error: error.message || "Failed to fetch analytics" });
  }
};
