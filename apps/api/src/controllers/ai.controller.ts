import { Request, Response } from "express";
import { aiService } from "../services/ai.service.js";

class AIController {
  async analyze(req: Request, res: Response) {
    try {
      const resumeData = req.body;

      if (!resumeData) {
        return res
          .status(400)
          .json({ success: false, error: "Missing resume data" });
      }

      console.log(
        "🤖 AI Analysis requested for:",
        resumeData.personalInfo?.fullName,
      );

      const result = await aiService.analyzeResume(resumeData);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("AI Controller Error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal AI Error",
      });
    }
  }

  async generateCoverLetter(req: Request, res: Response) {
    try {
      const { resume, jobDescription } = req.body;

      if (!resume || !jobDescription) {
        return res.status(400).json({
          success: false,
          error: "Missing resume data or job description",
        });
      }

      console.log("✍️ AI Cover Letter requested");

      const coverLetter = await aiService.generateCoverLetter(
        resume,
        jobDescription,
      );

      return res.status(200).json({
        success: true,
        data: { coverLetter },
      });
    } catch (error: any) {
      console.error("AI Controller Error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal AI Error",
      });
    }
  }
}

export const aiController = new AIController();
