import { Redis } from "@upstash/redis";
import "dotenv/config";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testRedis() {
  try {
    // Set value
    await redis.set("test_key", "Hello Redis");

    // Get value
    const value = await redis.get("test_key");

    console.log("Redis Value:", value);
  } catch (error) {
    console.error("Redis Error:", error);
  }
  console.log("URL:", process.env.UPSTASH_REDIS_REST_URL);
console.log("TOKEN:", process.env.UPSTASH_REDIS_REST_TOKEN);
}

testRedis();