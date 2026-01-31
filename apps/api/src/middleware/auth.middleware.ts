import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Middleware chain:
// 1. Clerk verifies token
// 2. Adapter maps req.auth.userId to req.userId for legacy controller compatibility
export const authMiddleware = [
  ClerkExpressRequireAuth(),
  (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth;

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No valid session",
      });
    }

    // Map Clerk's userId to our legacy property
    req.userId = auth.userId;
    next();
  },
];
