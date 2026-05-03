import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";
import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiKey } from "../models/api-key.model.js";

/**
 * API Key Authentication Middleware.
 * Accepts keys via `X-API-Key` header or `Authorization: ApiKey <key>`.
 * Verifies HMAC signature and checks scopes.
 */
export const apiKeyMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const headerKey = c.req.header("x-api-key");
  const authHeader = c.req.header("authorization");

  let rawKey: string | undefined;

  if (headerKey) {
    rawKey = headerKey;
  } else if (authHeader && authHeader.toLowerCase().startsWith("apikey ")) {
    rawKey = authHeader.slice(7).trim();
  }

  if (!rawKey) {
    return c.json({ success: false, error: "Unauthorized: API key required" }, 401);
  }

  const secret = env.API_KEY_SECRET;
  if (!secret) {
    return c.json({ success: false, error: "Server misconfiguration: API key signing secret not set" }, 500);
  }

  // Validate key format: prefix.signature
  const parts = rawKey.split(".");
  if (parts.length !== 2) {
    return c.json({ success: false, error: "Unauthorized: Invalid API key format" }, 401);
  }

  const [prefix, providedSig] = parts;

  // Recompute HMAC to verify integrity
  const expectedSig = crypto.createHmac("sha256", secret).update(prefix).digest("hex");
  const sigValid = crypto.timingSafeEqual(
    Buffer.from(providedSig, "hex"),
    Buffer.from(expectedSig, "hex"),
  );

  if (!sigValid) {
    return c.json({ success: false, error: "Unauthorized: Invalid API key" }, 401);
  }

  // Hash the prefix for DB lookup
  const keyHash = crypto.createHash("sha256").update(prefix).digest("hex");

  const apiKey = await ApiKey.findOne({ keyHash, revokedAt: { $exists: false } });

  if (!apiKey) {
    return c.json({ success: false, error: "Unauthorized: API key revoked or not found" }, 401);
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return c.json({ success: false, error: "Unauthorized: API key expired" }, 401);
  }

  // Update last used time (fire-and-forget)
  ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch(() => {
    // ignore update failures
  });

  // Attach API key metadata to context for downstream scope checks
  c.set("apiKey", {
    userId: apiKey.userId,
    organizationId: apiKey.organizationId,
    scopes: apiKey.scopes,
  });

  // Also set standard user context for compatibility with auth-required routes
  c.set("user", {
    userId: apiKey.userId,
    organizationId: apiKey.organizationId,
    isPro: true, // API keys are treated as pro-tier
  });

  await next();
});

/**
 * Scope-guard middleware. Must be used AFTER apiKeyMiddleware.
 */
export function requireScope(...requiredScopes: string[]) {
  return createMiddleware(async (c: Context, next: Next) => {
    const apiKey = c.get("apiKey") as { scopes: string[] } | undefined;

    if (!apiKey) {
      return c.json({ success: false, error: "Forbidden: API key context required" }, 403);
    }

    const hasScope = requiredScopes.some((scope) =>
      apiKey.scopes.includes(scope) || apiKey.scopes.includes("admin"),
    );

    if (!hasScope) {
      return c.json(
        {
          success: false,
          error: `Forbidden: Requires one of scopes [${requiredScopes.join(", ")}]`,
        },
        403,
      );
    }

    await next();
  });
}
