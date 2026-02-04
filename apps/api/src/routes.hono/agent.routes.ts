import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { runResumeCoach } from "../agents/resume-coach.agent.js";

// Create agent router
export const agentRoutes = new Hono();

// ============================================
// Validation Schemas
// ============================================

const coachAnalysisSchema = z.object({
  resumeData: z.record(z.unknown()),
  jobDescription: z.string().optional(),
});

// ============================================
// Protected Routes
// ============================================

// Apply auth middleware
agentRoutes.use("/*", authMiddleware);

/**
 * POST /api/agents/coach
 * Run the Resume Coach Agent for comprehensive analysis
 */
agentRoutes.post(
  "/coach",
  zValidator("json", coachAnalysisSchema),
  async (c) => {
    try {
      const { resumeData, jobDescription } = c.req.valid("json");

      console.log("🤖 Resume Coach Agent invoked");

      const result = await runResumeCoach({
        resumeData,
        jobDescription,
      });

      return c.json({
        success: true,
        data: {
          finalScore: result.finalScore,
          breakdown: {
            content: result.analysisResults.contentAnalysis,
            ats: result.analysisResults.atsAnalysis,
            format: result.analysisResults.formatAnalysis,
            impact: result.analysisResults.impactAnalysis,
          },
          recommendations: result.recommendations,
        },
      });
    } catch (error: any) {
      console.error("Resume Coach Agent Error:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Agent execution failed",
        },
        500,
      );
    }
  },
);

/**
 * POST /api/agents/quick-score
 * Get a quick ATS score without full agent analysis
 */
agentRoutes.post(
  "/quick-score",
  zValidator("json", coachAnalysisSchema),
  async (c) => {
    try {
      const { resumeData, jobDescription } = c.req.valid("json");

      console.log("⚡ Quick Score requested");

      // Run full agent but return simplified response
      const result = await runResumeCoach({
        resumeData,
        jobDescription,
      });

      return c.json({
        success: true,
        data: {
          score: result.finalScore,
          atsScore: result.analysisResults.atsAnalysis?.score || 0,
          topRecommendations: result.recommendations.slice(0, 3),
        },
      });
    } catch (error: any) {
      console.error("Quick Score Error:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Quick score failed",
        },
        500,
      );
    }
  },
);

/**
 * POST /api/agents/import/linkedin
 * Parse LinkedIn PDF export into Resume Data
 */
agentRoutes.post("/import/linkedin", async (c) => {
  try {
    const { parseLinkedInPdf } =
      await import("../services/linkedin.service.js");

    // Parse multipart form
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    if (file.type !== "application/pdf") {
      return c.json(
        { success: false, error: "Only PDF files are supported" },
        400,
      );
    }

    console.log(
      `📄 Processing LinkedIn PDF: ${file.name} (${file.size} bytes)`,
    );

    // Hono File -> ArrayBuffer -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // AI Parsing
    const resumeData = await parseLinkedInPdf(buffer);

    return c.json({
      success: true,
      message: "LinkedIn parsed successfully",
      data: resumeData,
    });
  } catch (error: any) {
    console.error("LinkedIn Import Error:", error);
    return c.json(
      { success: false, error: error.message || "Import failed" },
      500,
    );
  }
});
