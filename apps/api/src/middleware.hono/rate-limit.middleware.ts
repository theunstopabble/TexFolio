import type { Context, Next } from "hono";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

// Dedicated Redis client for distributed rate limiting
const redis = new Redis(env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("[RateLimit Redis] error:", err.message);
});

const redisReady = redis.connect().catch(() => {
  console.warn("[RateLimit Redis] initial connection failed — will retry on demand");
});

/**
 * Atomic fixed-window counter backed by Redis.
 * Returns current hit count and remaining TTL for the window.
 */
async function incrementWindow(key: string, windowMs: number): Promise<{ hits: number; ttlMs: number }> {
  const now = Date.now();
  const windowId = Math.floor(now / windowMs);
  const redisKey = `ratelimit:${key}:${windowId}`;

  try {
    await redisReady;
    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.pexpire(redisKey, windowMs);
    const results = await pipeline.exec();

    // Pipeline returns array of [error, result] tuples
    const hits = results?.[0]?.[1] as number | undefined;
    if (hits === undefined || hits === null) {
      throw new Error("Redis pipeline returned unexpected result");
    }

    // Approximate remaining TTL for headers
    const elapsed = now % windowMs;
    const ttlMs = windowMs - elapsed;

    return { hits, ttlMs };
  } catch (err) {
    console.error("[RateLimit] Redis error, failing open:", err instanceof Error ? err.message : err);
    // Fail open — allow request to prevent total outage if Redis is down
    return { hits: 0, ttlMs: windowMs };
  }
}

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    keyGenerator?: (c: Context) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

export const rateLimiter = (options: RateLimitOptions) => {
    const {
        windowMs,
        max,
        message = "Too many requests from this IP, please try again later",
        keyGenerator = (c) => {
            // Use the LAST IP in x-forwarded-for chain (the actual client IP, not a proxy)
            const forwardedFor = c.req.header("x-forwarded-for");
            if (forwardedFor) {
                const ips = forwardedFor.split(",").map(ip => ip.trim());
                const clientIp = ips[ips.length - 1];
                if (clientIp && clientIp !== "unknown") {
                    return clientIp;
                }
            }

            // Fallback to x-real-ip (set by trusted reverse proxies like nginx)
            const realIp = c.req.header("x-real-ip");
            if (realIp) return realIp;

            // Last resort: use connection remote address
            return c.env?.REMOTE_ADDR || "unknown-ip";
        },
    } = options;

    return async (c: Context, next: Next) => {
        const key = keyGenerator(c);
        const { hits, ttlMs } = await incrementWindow(key, windowMs);
        const resetTime = Date.now() + ttlMs;

        // Add rate limit headers
        c.header("X-RateLimit-Limit", max.toString());
        c.header("X-RateLimit-Remaining", Math.max(0, max - hits).toString());
        c.header("X-RateLimit-Reset", new Date(resetTime).toISOString());

        if (hits > max) {
            c.header("Retry-After", Math.ceil(ttlMs / 1000).toString());
            return c.json(
                {
                    success: false,
                    error: "Rate limit exceeded",
                    message,
                },
                429,
            );
        }

        await next();
    };
};

// ============================================
// Tiered Rate Limiter (Enterprise)
// ============================================

interface TieredRateLimitOptions {
    windowMs: number;
    freeMax: number;
    proMax: number;
    message?: string;
    unauthenticatedMax?: number;
}

/**
 * Distributed tiered rate limiter backed by Redis.
 * Pro users get higher limits. Unauthenticated requests fall back to IP.
 * Survives server restarts and works across horizontal instances.
 */
export const tieredRateLimiter = (options: TieredRateLimitOptions) => {
    const {
        windowMs,
        freeMax,
        proMax,
        message = "Rate limit exceeded for your plan. Please upgrade or try again later.",
        unauthenticatedMax = Math.min(freeMax, 10),
    } = options;

    return async (c: Context, next: Next) => {
        const user = c.get("user");
        const isPro = user?.isPro === true;
        const max = isPro ? proMax : freeMax;

        // Primary key: userId for authenticated, IP for anonymous
        let key: string;
        if (user?.userId) {
            key = `user:${user.userId}`;
        } else {
            const forwardedFor = c.req.header("x-forwarded-for");
            const clientIp = forwardedFor
                ? forwardedFor.split(",").map((ip) => ip.trim()).pop()
                : c.req.header("x-real-ip");
            key = `ip:${clientIp || c.env?.REMOTE_ADDR || "unknown"}`;
        }

        const { hits, ttlMs } = await incrementWindow(key, windowMs);
        const resetTime = Date.now() + ttlMs;

        // Add rate limit headers
        c.header("X-RateLimit-Limit", max.toString());
        c.header("X-RateLimit-Remaining", Math.max(0, max - hits).toString());
        c.header("X-RateLimit-Reset", new Date(resetTime).toISOString());
        if (isPro) {
            c.header("X-RateLimit-Tier", "pro");
        } else if (user?.userId) {
            c.header("X-RateLimit-Tier", "free");
        } else {
            c.header("X-RateLimit-Tier", "anonymous");
        }

        const effectiveMax = user?.userId ? max : unauthenticatedMax;
        if (hits > effectiveMax) {
            c.header("Retry-After", Math.ceil(ttlMs / 1000).toString());
            return c.json(
                {
                    success: false,
                    error: "Rate limit exceeded",
                    message,
                    tier: isPro ? "pro" : user?.userId ? "free" : "anonymous",
                },
                429,
            );
        }

        await next();
    };
};