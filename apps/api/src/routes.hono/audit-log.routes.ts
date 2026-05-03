import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { auditService } from "../services/audit.service.js";

export const auditLogRoutes = new Hono();

// Protect all audit log routes
auditLogRoutes.use("/*", authMiddleware);

const querySchema = z.object({
  action: z.enum(["CREATE", "UPDATE", "DELETE", "READ", "SHARE", "EXPORT", "LOGIN", "PAYMENT"]).optional(),
  resourceType: z.enum(["Resume", "User", "Payment", "Template", "System"]).optional(),
  resourceId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * GET /api/audit-logs
 * Query own audit logs with optional filters.
 */
auditLogRoutes.get("/", zValidator("query", querySchema), async (c) => {
  try {
    const user = c.get("user");
    if (!user?.userId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const params = c.req.valid("query");
    const { logs, total } = await auditService.query(user.userId, {
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      limit: params.limit,
      offset: params.offset,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    return c.json({
      success: true,
      data: {
        logs,
        total,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
    });
  } catch (error) {
    console.error("Audit Log Query Error:", error);
    return c.json(
      { success: false, error: "Failed to query audit logs" },
      500,
    );
  }
});

/**
 * GET /api/audit-logs/activity
 * Get recent activity summary (last 24h).
 */
auditLogRoutes.get("/activity", async (c) => {
  try {
    const user = c.get("user");
    if (!user?.userId) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const activity = await auditService.getRecentActivity(user.userId);
    return c.json({ success: true, data: activity });
  } catch (error) {
    console.error("Audit Activity Error:", error);
    return c.json(
      { success: false, error: "Failed to fetch activity" },
      500,
    );
  }
});
