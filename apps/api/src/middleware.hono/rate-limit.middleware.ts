import type { Context, Next } from "hono";

interface RateLimitStore {
    hits: number;
    resetTime: number;
}

// In-memory store (for production with multiple instances, use Redis)
const store = new Map<string, RateLimitStore>();

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
        const now = Date.now();

        let record = store.get(key);

        // Clean up expired records occasionally (1% chance per request)
        if (Math.random() < 0.01) {
            for (const [k, v] of store.entries()) {
                if (now > v.resetTime) {
                    store.delete(k);
                }
            }
        }

        if (!record || now > record.resetTime) {
            record = {
                hits: 1,
                resetTime: now + windowMs,
            };
            store.set(key, record);
        } else {
            record.hits++;
        }

        // Add rate limit headers
        c.header("X-RateLimit-Limit", max.toString());
        c.header("X-RateLimit-Remaining", Math.max(0, max - record.hits).toString());
        c.header("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

        if (record.hits > max) {
            c.header("Retry-After", Math.ceil(windowMs / 1000).toString());
            return c.json(
                {
                    success: false,
                    error: "Rate limit exceeded",
                    message,
                },
                429
            );
        }

        await next();
    };
};

// Memory usage monitoring for rate limiter
export const getRateLimiterStats = () => ({
    activeIps: store.size,
});