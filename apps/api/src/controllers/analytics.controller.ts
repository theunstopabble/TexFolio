import { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service.js";

export const analyticsController = {
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const stats = await analyticsService.getStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Analytics Error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch analytics",
      });
    }
  },
};
