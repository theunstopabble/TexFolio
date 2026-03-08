import type { Context, Next } from "hono";

interface RateLimitStore {
    hits: number;
    resetTime: number;
}

const store = new Map<string, RateLimitStore>();

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
    keyGenerator?: (c: Context) => string;
}

export const rateLimiter = (options: RateLimitOptions) => {
    const {
        windowMs,
        max,
        message = "Too many requests from this IP, please try again later",
        keyGenerator = (c) => {
            // Get IP address from Cloudflare/Vercel headers or fallback
            return c.req.header("x-forwarded-for") ||
                c.req.header("x-real-ip") ||
                "unknown-ip";
        },
    } = options;

    return async (c: Context, next: Next) => {
        const key = keyGenerator(c);
        const now = Date.now();

        let record = store.get(key);

        // Clean up expired records occasionally
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
