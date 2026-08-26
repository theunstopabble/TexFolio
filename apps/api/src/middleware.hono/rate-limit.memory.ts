import type { Context, Next } from "hono";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface TieredRateLimitOptions {
  windowMs: number;
  freeMax: number;
  proMax: number;
  message?: string;
  unauthenticatedMax?: number;
}

interface WindowEntry {
  timestamps: number[];
  count: number;
}

const store = new Map<string, WindowEntry>();
const CLEANUP_INTERVAL_MS = 60_000;
const MAX_ENTRIES = 10_000;
const MAX_WINDOW_MS = 5 * 60 * 1000; // 5 minutes - max window for cleanup threshold

function cleanupExpiredEntries(): void {
  const now = Date.now();
  let removed = 0;
  for (const [key, entry] of store.entries()) {
    // Remove entries where the most recent timestamp is older than MAX_WINDOW_MS
    // (i.e., no requests for this key in the last 5 minutes)
    if (entry.count === 0 || now - entry.timestamps[entry.count - 1] > MAX_WINDOW_MS) {
      store.delete(key);
      removed++;
    }
  }
  if (removed > 0 || store.size > MAX_ENTRIES) {
    console.log(`[RateLimit] Cleanup: removed ${removed} expired entries, store size: ${store.size}`);
  }
}

setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);

function incrementWindow(key: string, windowMs: number): { hits: number; ttlMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [], count: 0 };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
  entry.timestamps.push(now);
  entry.count = entry.timestamps.length;

  const elapsed = now % windowMs;
  const ttlMs = windowMs - elapsed;

  return { hits: entry.count, ttlMs };
}

function generateDefaultKey(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    const clientIp = ips[ips.length - 1];
    if (clientIp && clientIp !== "unknown") {
      return `ip:${clientIp}`;
    }
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return `ip:${c.env?.REMOTE_ADDR || "unknown-ip"}`;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = "Too many requests from this IP, please try again later",
    keyGenerator = generateDefaultKey,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const { hits, ttlMs } = incrementWindow(key, windowMs);
    const resetTime = Date.now() + ttlMs;

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

    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalNext = next;
      await next();
      const status = c.res.status;
      const isSuccess = status >= 200 && status < 400;
      if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && !isSuccess)) {
        const entry = store.get(key);
        if (entry && entry.count > 0) {
          entry.count--;
          entry.timestamps.pop();
        }
      }
    } else {
      await next();
    }
  };
};

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

    const { hits, ttlMs } = incrementWindow(key, windowMs);
    const resetTime = Date.now() + ttlMs;

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