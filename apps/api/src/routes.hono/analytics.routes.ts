import { Hono } from "hono";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { analyticsService } from "../services/analytics.service.js";

// Create analytics router
export const analyticsRoutes = new Hono();

// Apply auth middleware
analyticsRoutes.use("/*", authMiddleware);

// Get analytics stats
analyticsRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const stats = await analyticsService.getStats(user.userId);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return c.json({ success: false, error: "Failed to fetch analytics" }, 500);
  }
});
