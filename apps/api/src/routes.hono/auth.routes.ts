import { Hono } from "hono";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";

// Create auth router
export const authRoutes = new Hono();

// Apply auth middleware
authRoutes.use("/*", authMiddleware);

// Get current user
authRoutes.get("/me", async (c) => {
  try {
    const user = c.get("user");

    // User data is already populated by auth middleware
    // If we reach here, auth succeeded and user exists
    if (!user.mongoUserId) {
      // Fallback: fetch from DB if middleware didn't set it
      const { User } = await import("../models/user.model.js");
      const dbUser = await User.findOne({ clerkId: user.userId });

      if (!dbUser) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      return c.json({
        success: true,
        data: {
          id: dbUser._id,
          clerkId: dbUser.clerkId,
          email: dbUser.email,
          fullName: dbUser.fullName,
          isPro: dbUser.isPro,
        },
      });
    }

    // Return user data from context (set by middleware)
    return c.json({
      success: true,
      data: {
        clerkId: user.userId,
        email: user.email,
        isPro: user.isPro,
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return c.json({ success: false, error: "Failed to fetch user" }, 500);
  }
});
