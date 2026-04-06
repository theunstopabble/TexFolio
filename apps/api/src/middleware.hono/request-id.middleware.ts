import type { Context, Next } from "hono";

// Extend Hono context variables
declare module "hono" {
    interface ContextVariableMap {
        requestId: string;
        startTime: number;
    }
}

/**
 * Enterprise Request ID Middleware
 * Assigns a unique ID to every request and propagates it via headers.
 * Essential for tracing requests across distributed systems.
 */
export const requestIdMiddleware = async (c: Context, next: Next) => {
    // Check if request ID already exists (from reverse proxy/load balancer)
    let requestId = c.req.header("x-request-id") || c.req.header("x-correlation-id");

    // Generate new ID if not present
    if (!requestId) {
        const { nanoid } = await import("nanoid");
        requestId = nanoid(16);
    }

    // Set on response headers for client-side correlation
    c.header("x-request-id", requestId);
    c.header("x-response-time", String(Date.now()));

    // Store in context for downstream use
    c.set("requestId", requestId);
    c.set("startTime", Date.now());

    await next();

    // Calculate and log response time
    const duration = Date.now() - (c.get("startTime") || Date.now());
    c.header("x-response-time", `${duration}ms`);
};