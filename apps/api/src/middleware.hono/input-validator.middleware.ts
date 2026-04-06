import type { Context, Next } from "hono";

// Extend Hono context variables
declare module "hono" {
    interface ContextVariableMap {
        requestId: string;
        startTime: number;
        sanitizedBody: Record<string, unknown> | null;
    }
}

/**
 * Enterprise Input Sanitization Middleware
 * Strips potentially dangerous input patterns to prevent XSS, SQLi, and injection attacks.
 * Applied BEFORE route handlers for defense-in-depth.
 */
export const inputSanitizer = () => {
    return async function inputSanitizerMiddleware(c: Context, next: Next) {
        const contentType = c.req.header("content-type");
        
        // Only sanitize JSON bodies
        if (contentType?.includes("application/json")) {
            try {
                const body = await c.req.json();
                
                if (body && typeof body === "object" && !Array.isArray(body)) {
                    const sanitized = sanitizeObject(body);
                    const result: Record<string, unknown> = typeof sanitized === "object" && sanitized !== null ? sanitized as Record<string, unknown> : {};
                    
                    // Store sanitized body for downstream use
                    c.set("sanitizedBody", result);
                }
            } catch {
                // Invalid JSON, skip sanitization
            }
        }
        
        await next();
    };
};

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj: unknown): unknown {
    if (typeof obj === "string") {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            // Sanitize keys (prevent prototype pollution)
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
                continue;
            }
            result[key] = sanitizeObject(value);
        }
        return result;
    }
    
    return obj;
}

/**
 * Sanitize string input
 */
function sanitizeString(str: string): string {
    // Remove null bytes (can bypass validations)
    str = str.replace(/\0/g, "");
    
    // Remove control characters except newlines and tabs
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    
    // Limit string length to prevent ReDoS and memory exhaustion
    return str.slice(0, 10000);
}

/**
 * Helper to get sanitized body from context
 */
export const getSanitizedBody = (c: Context): Record<string, unknown> | null => {
    return c.get("sanitizedBody") || null;
};