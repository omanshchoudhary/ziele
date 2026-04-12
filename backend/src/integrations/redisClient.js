import { createClient } from "redis";
import { env, getServiceReadinessSnapshot } from "../config/env.js";

let redisClientPromise = null;
let redisSubscriberPromise = null;

function hasUpstashRestConfig() {
  return Boolean(env.redis.upstashRestUrl && env.redis.upstashRestToken);
}

async function runUpstashCommand(command = []) {
  if (!hasUpstashRestConfig()) {
    throw new Error("Upstash REST credentials are not configured.");
  }

  const response = await fetch(env.redis.upstashRestUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.redis.upstashRestToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Upstash REST request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(`Upstash error: ${payload.error}`);
  }

  return payload?.result;
}

function toSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createUpstashRestClient() {
  return {
    incr: async (key) =>
      toSafeNumber(await runUpstashCommand(["INCR", String(key)]), 0),
    expire: async (key, seconds) =>
      toSafeNumber(
        await runUpstashCommand([
          "EXPIRE",
          String(key),
          String(Math.max(1, Number(seconds || 1))),
        ]),
        0,
      ),
    ttl: async (key) =>
      toSafeNumber(await runUpstashCommand(["TTL", String(key)]), -1),
    ping: async () => String(await runUpstashCommand(["PING"])),
    get: async (key) => {
      const result = await runUpstashCommand(["GET", String(key)]);
      return result === null ? null : String(result);
    },
    setEx: async (key, seconds, value) =>
      String(
        await runUpstashCommand([
          "SETEX",
          String(key),
          String(Math.max(1, Number(seconds || 1))),
          String(value ?? ""),
        ]),
      ),
    publish: async (channel, message) =>
      toSafeNumber(
        await runUpstashCommand([
          "PUBLISH",
          String(channel),
          String(message ?? ""),
        ]),
        0,
      ),
  };
}

export async function getRedisClient() {
  if (!getServiceReadinessSnapshot().redis.configured) {
    return null;
  }

  if (!redisClientPromise) {
    if (env.redis.url) {
      const client = createClient({
        url: env.redis.url,
      });

      client.on("error", (error) => {
        console.error("Redis client error:", error);
      });

      // We store the connection promise so repeated callers reuse the same client.
      redisClientPromise = client.connect().then(() => client);
    } else if (hasUpstashRestConfig()) {
      redisClientPromise = Promise.resolve(createUpstashRestClient());
    } else {
      redisClientPromise = Promise.resolve(null);
    }
  }

  return redisClientPromise;
}

export async function getRedisSubscriber() {
  if (!getServiceReadinessSnapshot().redis.configured) {
    return null;
  }

  if (!redisSubscriberPromise) {
    // Upstash REST is stateless HTTP and does not support long-lived SUBSCRIBE streams.
    if (!env.redis.url) {
      redisSubscriberPromise = Promise.resolve(null);
      return redisSubscriberPromise;
    }

    const baseClient = await getRedisClient();
    if (!baseClient) return null;

    const subscriber = baseClient.duplicate();
    subscriber.on("error", (error) => {
      console.error("Redis subscriber error:", error);
    });

    redisSubscriberPromise = subscriber.connect().then(() => subscriber);
  }

  return redisSubscriberPromise;
}

export async function publishRedisMessage(channel, payload) {
  const client = await getRedisClient().catch(() => null);
  if (!client) return false;

  await client.publish(channel, JSON.stringify(payload));

  // With Upstash REST there is no long-lived SUBSCRIBE bridge, so callers
  // should still execute their local fallback emitter path.
  if (!env.redis.url && hasUpstashRestConfig()) {
    return false;
  }

  return true;
}

export async function subscribeRedisChannel(channel, handler) {
  const subscriber = await getRedisSubscriber().catch(() => null);
  if (!subscriber) return false;

  await subscriber.subscribe(channel, (message) => {
    try {
      handler(JSON.parse(message));
    } catch {
      handler(message);
    }
  });

  return true;
}

export async function pingRedis() {
  const client = await getRedisClient().catch(() => null);

  if (!client) {
    return {
      configured: getServiceReadinessSnapshot().redis.configured,
      ok: false,
      message: getServiceReadinessSnapshot().redis.configured
        ? "Redis connection failed."
        : "Redis is not configured yet.",
    };
  }

  try {
    const result = await client.ping();
    return {
      configured: true,
      ok: String(result).toUpperCase() === "PONG",
      message: `Redis responded with ${result}.`,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : "Redis ping failed.",
    };
  }
}
