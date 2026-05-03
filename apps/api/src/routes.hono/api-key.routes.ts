import { Hono } from "hono";
import crypto from "crypto";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { ApiKey, type ApiKeyScope } from "../models/api-key.model.js";
import { env } from "../config/env.js";

export const apiKeyRoutes = new Hono();

// All API key routes require Clerk authentication
apiKeyRoutes.use("/*", authMiddleware);

/**
 * Generate a new API key.
 * The raw key (prefix.signature) is returned ONLY in this response.
 * The prefix is hashed for storage.
 */
apiKeyRoutes.post("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { name, scopes, organizationId, expiresInDays } = body as {
      name?: string;
      scopes?: ApiKeyScope[];
      organizationId?: string;
      expiresInDays?: number;
    };

    if (!name || !scopes || scopes.length === 0) {
      return c.json({ success: false, error: "Missing required fields: name, scopes" }, 400);
    }

    const secret = env.API_KEY_SECRET;
    if (!secret) {
      return c.json({ success: false, error: "Server misconfiguration: API_KEY_SECRET not set" }, 500);
    }

    // Generate random 32-byte prefix (hex = 64 chars)
    const prefix = crypto.randomBytes(32).toString("hex");
    const signature = crypto.createHmac("sha256", secret).update(prefix).digest("hex");
    const rawKey = `${prefix}.${signature}`;

    // Store only the hash
    const keyHash = crypto.createHash("sha256").update(prefix).digest("hex");

    await ApiKey.create({
      keyHash,
      name,
      userId: user.userId,
      organizationId,
      scopes,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
    });

    return c.json(
      {
        success: true,
        message: "API key created. Store it securely — it will not be shown again.",
        data: {
          key: rawKey,
          name,
          scopes,
          expiresAt: expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : null,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create API key" },
      500,
    );
  }
});

/**
 * List all active API keys for the authenticated user.
 * Raw keys are never returned — only metadata.
 */
apiKeyRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const keys = await ApiKey.find({
      userId: user.userId,
      revokedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    return c.json({
      success: true,
      count: keys.length,
      data: keys.map((k) => ({
        id: String(k._id),
        name: k.name,
        scopes: k.scopes,
        organizationId: k.organizationId,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return c.json({ success: false, error: "Failed to list API keys" }, 500);
  }
});

/**
 * Revoke an API key by ID.
 */
apiKeyRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const key = await ApiKey.findOneAndUpdate(
      { _id: id, userId: user.userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
      { new: true },
    );

    if (!key) {
      return c.json({ success: false, error: "API key not found or already revoked" }, 404);
    }

    return c.json({ success: true, message: "API key revoked successfully" });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return c.json({ success: false, error: "Failed to revoke API key" }, 500);
  }
});
