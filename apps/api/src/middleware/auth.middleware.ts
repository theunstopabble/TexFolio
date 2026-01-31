import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Middleware chain:
// 1. Clerk verifies token
// 2. Adapter maps req.auth.userId to req.userId for legacy controller compatibility
export const authMiddleware = [
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth;

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No valid session",
      });
    }

    try {
      // Lazy load Clerk Client to avoid import issues if not set up
      const { clerkClient } = await import("@clerk/clerk-sdk-node");
      const { User } = await import("../models/user.model.js");

      const clerkId = auth.userId;

      // 1. Try to find user by clerkId
      let user = await User.findOne({ clerkId });

      if (!user) {
        // 2. Not found? Fetch details from Clerk to link/create
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (email) {
          // 3. Try to link by email (legacy user)
          user = await User.findOne({ email });

          if (user) {
            user.clerkId = clerkId;
            await user.save();
          } else {
            // 4. Create new user
            user = await User.create({
              clerkId,
              email,
              fullName:
                `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
                "User",
              password: "clerk-authenticated-" + Math.random().toString(36), // Dummy password
              isPro: false,
            });
          }
        }
      }

      if (user) {
        // Map Clerk ID to req.userId (RESTORES RESUMES)
        req.userId = clerkId;
        // Map MongoDB _id to req.mongoUserId (FOR PAYMENTS/PROFILE)
        (req as any).mongoUserId = user._id.toString();
        // Optionally attach full user
        (req as any).user = user;
      } else {
        console.warn("Could not sync user: Email missing from Clerk?");
        req.userId = clerkId;
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Sync Error:", error);
      res.status(500).json({ success: false, error: "Auth Sync Failed" });
    }
  },
];
