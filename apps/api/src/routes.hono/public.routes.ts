import { Hono } from "hono";

// Create public router (no auth required)
export const publicRoutes = new Hono();

// Get public resume by shareId
publicRoutes.get("/r/:shareId", async (c) => {
  try {
    const shareId = c.req.param("shareId");

    // Validate shareId format (alphanumeric, hyphens, underscores only; max 32 chars)
    if (!shareId || !/^[a-zA-Z0-9_-]{1,32}$/.test(shareId)) {
      return c.json(
        { success: false, error: "Invalid share link" },
        400,
      );
    }

    const { Resume } = await import("../models/resume.model.js");
    const resume = await Resume.findOne({ shareId, isPublic: true });

    if (!resume) {
      return c.json(
        { success: false, error: "Resume not found or private" },
        404,
      );
    }

    // Asynchronously notify founder via Telegram with recruiter/device context
    const referer = c.req.header("referer");
    const userAgent = c.req.header("user-agent");
    const ip = c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip");

    import("../services/telegram.service.js")
      .then(({ telegramService }) => {
        telegramService.notifyPublicResumeView({
          shareId,
          resumeTitle: resume.title,
          referer,
          userAgent,
          ip,
        });
      })
      .catch(() => {});

    return c.json({ success: true, data: resume });
  } catch (error) {
    console.error("Public Resume Error:", error);
    return c.json({ success: false, error: "Failed to fetch resume" }, 500);
  }
});
