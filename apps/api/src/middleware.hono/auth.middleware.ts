import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";

// User interface for Hono context
interface HonoUser {
  userId: string;
  mongoUserId?: string;
  email?: string;
  isPro?: boolean;
}

// Extend Hono context variables
declare module "hono" {
  interface ContextVariableMap {
    user: HonoUser;
  }
}

/**
 * Hono Auth Middleware using Clerk
 * Verifies JWT token and syncs user with MongoDB
 */
export const authMiddleware = createMiddleware(
  async (c: Context, next: Next) => {
    // Get authorization header
    const authHeader = c.req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        { success: false, error: "Unauthorized: No token provided" },
        401,
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      // Use Clerk SDK to verify token
      const { clerkClient } = await import("@clerk/clerk-sdk-node");

      // Get session claims from token
      const sessionToken = await clerkClient.verifyToken(token);

      if (!sessionToken || !sessionToken.sub) {
        return c.json(
          { success: false, error: "Unauthorized: Invalid token" },
          401,
        );
      }

      const clerkId = sessionToken.sub;

      // Lazy load models to avoid circular imports
      const { User } = await import("../models/user.model.js");

      // Try to find user by clerkId
      let user = await User.findOne({ clerkId });

      if (!user) {
        // Fetch details from Clerk to link/create
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (email) {
          // Try to link by email (legacy user)
          user = await User.findOne({ email });

          if (user) {
            user.clerkId = clerkId;
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              clerkId,
              email,
              fullName:
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                "User",
              password: "clerk-authenticated-" + Math.random().toString(36),
              isPro: false,
            });
          }
        }
      }

      // Set user in context
      c.set("user", {
        userId: clerkId,
        mongoUserId: user?._id?.toString(),
        email: user?.email,
        isPro: user?.isPro || false,
      });

      await next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return c.json(
        { success: false, error: "Unauthorized: Token verification failed" },
        401,
      );
    }
  },
);

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = createMiddleware(
  async (c: Context, next: Next) => {
    const authHeader = c.req.header("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const { clerkClient } = await import("@clerk/clerk-sdk-node");
        const sessionToken = await clerkClient.verifyToken(token);

        if (sessionToken && sessionToken.sub) {
          c.set("user", { userId: sessionToken.sub });
        }
      } catch {
        // Token invalid, but continue without auth
      }
    }

    await next();
  },
);
