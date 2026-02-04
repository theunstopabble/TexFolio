import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { aiService } from "../services/ai.service.js";

// Create AI router
export const aiRoutes = new Hono();

// ============================================
// Validation Schemas
// ============================================
const analyzeSchema = z
  .object({
    personalInfo: z
      .object({
        fullName: z.string().optional(),
      })
      .optional(),
  })
  .passthrough(); // Allow additional fields

const coverLetterSchema = z.object({
  resume: z.record(z.unknown()),
  jobDescription: z.string().min(1, "Job description is required"),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
});

const improveTextSchema = z.object({
  text: z.string().min(1, "Text is required"),
  type: z.enum(["grammar", "professional"]).optional(),
});

const generateBulletsSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  skills: z.array(z.string()).optional(),
});

const atsCheckSchema = z.object({
  resumeData: z.record(z.unknown()),
  jobDescription: z.string().optional(),
});

// ============================================
// Protected Routes (auth required)
// ============================================

// Apply auth middleware to all routes
aiRoutes.use("/*", authMiddleware);

// Analyze resume
aiRoutes.post("/analyze", zValidator("json", analyzeSchema), async (c) => {
  try {
    const resumeData = c.req.valid("json");

    console.log(
      "🤖 AI Analysis requested for:",
      resumeData.personalInfo?.fullName,
    );

    // Cast to any since AI service accepts flexible resume format
    const result = await aiService.analyzeResume(resumeData as any);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("AI Controller Error:", error);
    return c.json(
      {
        success: false,
        error: error.message || "Internal AI Error",
      },
      500,
    );
  }
});

// Generate cover letter
aiRoutes.post(
  "/cover-letter",
  zValidator("json", coverLetterSchema),
  async (c) => {
    try {
      const { resume, jobDescription } = c.req.valid("json");

      console.log("✍️ AI Cover Letter requested");

      // Cast to any since AI service accepts flexible resume format
      const coverLetter = await aiService.generateCoverLetter(
        resume as any,
        jobDescription,
      );

      return c.json({
        success: true,
        data: { coverLetter },
      });
    } catch (error: any) {
      console.error("AI Controller Error:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Internal AI Error",
        },
        500,
      );
    }
  },
);

// Improve text
aiRoutes.post("/improve", zValidator("json", improveTextSchema), async (c) => {
  try {
    const { text, type } = c.req.valid("json");

    const improvedText = await aiService.improveText(text, type);

    return c.json({ success: true, data: { improvedText } });
  } catch (error) {
    return c.json({ success: false, error: "Failed to improve text" }, 500);
  }
});

// Generate bullets
aiRoutes.post(
  "/generate-bullets",
  zValidator("json", generateBulletsSchema),
  async (c) => {
    try {
      const { jobTitle, skills } = c.req.valid("json");

      const bullets = await aiService.generateBullets(jobTitle, skills);

      return c.json({ success: true, data: { bullets } });
    } catch (error) {
      return c.json(
        { success: false, error: "Failed to generate bullets" },
        500,
      );
    }
  },
);

// ATS score check
aiRoutes.post("/ats-check", zValidator("json", atsCheckSchema), async (c) => {
  try {
    const { resumeData, jobDescription } = c.req.valid("json");

    const analysis = await aiService.calculateATSScore(
      resumeData,
      jobDescription,
    );

    return c.json({ success: true, data: analysis });
  } catch (error) {
    console.error("ATS Check Error:", error);
    return c.json({ success: false, message: "ATS analysis failed" }, 500);
  }
});
