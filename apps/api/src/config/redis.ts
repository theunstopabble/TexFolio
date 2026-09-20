import { Redis } from "ioredis";
import { env } from "./env.js";

let redisConnection: Redis | null = null;

function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

export function getRedisConnection(): Redis | null {
  // Skip Redis connection in local development to preserve Upstash free tier
  if (!isProduction()) {
    return null;
  }

  if (!redisConnection) {
    const redisUrl = env.REDIS_URL;
    if (!redisUrl) {
      console.warn("[Redis] REDIS_URL not set, skipping Redis connection");
      return null;
    }

    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisConnection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }
  return redisConnection;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedisConnection();
  if (redis && redis.status === "wait") {
    await redis.connect();
  }
}

export async function closeRedis(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}

export { Redis } from "ioredis";