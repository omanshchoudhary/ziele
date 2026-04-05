import { getRedisClient } from "../integrations/redisClient.js";

const inMemoryWindows = new Map();

function resolveActorKey(req) {
  const profileId = req?.resolvedProfile?.id;
  const authUserId = req?.authContext?.userId;
  const ip = req.ip || req.get("x-forwarded-for") || "anonymous";
  return profileId || authUserId || String(ip).split(",")[0].trim();
}

function checkInMemoryWindow(key, windowMs) {
  const now = Date.now();
  const current = inMemoryWindows.get(key);

  if (!current || now >= current.expiresAt) {
    const nextValue = {
      count: 1,
      expiresAt: now + windowMs,
    };
    inMemoryWindows.set(key, nextValue);
    return nextValue;
  }

  current.count += 1;
  inMemoryWindows.set(key, current);
  return current;
}

async function checkRedisWindow(key, windowSeconds) {
  const redis = await getRedisClient().catch(() => null);
  if (!redis) return null;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttlSeconds = await redis.ttl(key);
  return {
    count,
    expiresAt: Date.now() + Math.max(1, ttlSeconds) * 1000,
  };
}

export function createRateLimiter({
  keyPrefix,
  limit = 30,
  windowMs = 60_000,
  message = "Too many requests. Please try again shortly.",
}) {
  const safePrefix = String(keyPrefix || "general");
  const safeLimit = Math.max(1, Number(limit || 1));
  const safeWindowMs = Math.max(1_000, Number(windowMs || 60_000));

  return async (req, res, next) => {
    const actor = resolveActorKey(req);
    const baseKey = `${safePrefix}:${actor}`;

    let result = await checkRedisWindow(baseKey, Math.ceil(safeWindowMs / 1000));
    if (!result) {
      result = checkInMemoryWindow(baseKey, safeWindowMs);
    }

    const remaining = Math.max(0, safeLimit - result.count);
    res.setHeader("X-RateLimit-Limit", String(safeLimit));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (result.count > safeLimit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.expiresAt - Date.now()) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ error: message });
    }

    return next();
  };
}
