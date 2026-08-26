import { Redis } from "ioredis";
import { env } from "./env.js";

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(env.REDIS_URL || "redis://localhost:6379", {
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
  if (redis.status === "wait") {
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