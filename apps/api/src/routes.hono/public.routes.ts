import { Hono } from "hono";

// Create public router (no auth required)
export const publicRoutes = new Hono();

// Get public resume by shareId
publicRoutes.get("/r/:shareId", async (c) => {
  try {
    const shareId = c.req.param("shareId");

    const { Resume } = await import("../models/resume.model.js");
    const resume = await Resume.findOne({ shareId, isPublic: true });

    if (!resume) {
      return c.json(
        { success: false, error: "Resume not found or private" },
        404,
      );
    }

    return c.json({ success: true, data: resume });
  } catch (error) {
    console.error("Public Resume Error:", error);
    return c.json({ success: false, error: "Failed to fetch resume" }, 500);
  }
});
