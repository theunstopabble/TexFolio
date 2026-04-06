import type { Context, Next } from "hono";

/**
 * Enterprise Structured Logging Middleware
 * Provides consistent log format with request correlation.
 * Logs all incoming requests with timing and status info.
 */
export const structuredLogger = async (c: Context, next: Next) => {
    const requestId = c.get("requestId") || "unknown";
    const startTime = Date.now();

    // Log request start
    log("info", "request_started", {
        requestId,
        method: c.req.method,
        path: c.req.path,
        userAgent: c.req.header("user-agent"),
        referer: c.req.header("referer"),
    });

    await next();

    // Log request completion
    const duration = Date.now() - startTime;
    const status = c.res.status;

    log(status >= 500 ? "error" : status >= 400 ? "warn" : "info", "request_completed", {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs: duration,
    });
};

/**
 * Structured logger function
 * Use this instead of console.log for consistent enterprise logging
 */
export const log = (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    data?: Record<string, unknown>
) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data }),
    };

    switch (level) {
        case "debug":
            console.debug(JSON.stringify(logEntry));
            break;
        case "info":
            console.info(JSON.stringify(logEntry));
            break;
        case "warn":
            console.warn(JSON.stringify(logEntry));
            break;
        case "error":
            console.error(JSON.stringify(logEntry));
            break;
    }
};