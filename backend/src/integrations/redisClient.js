import { createClient } from "redis";
import { env, getServiceReadinessSnapshot } from "../config/env.js";

let redisClientPromise = null;
let redisSubscriberPromise = null;

export async function getRedisClient() {
  if (!getServiceReadinessSnapshot().redis.configured) {
    return null;
  }

  if (!redisClientPromise) {
    const client = createClient({
      url: env.redis.url,
    });

    client.on("error", (error) => {
      console.error("Redis client error:", error);
    });

    // We store the connection promise so repeated callers reuse the same client.
    redisClientPromise = client.connect().then(() => client);
  }

  return redisClientPromise;
}

export async function getRedisSubscriber() {
  if (!getServiceReadinessSnapshot().redis.configured) {
    return null;
  }

  if (!redisSubscriberPromise) {
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
      ok: result === "PONG",
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
