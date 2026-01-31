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
  async improveText(req: Request, res: Response) {
    try {
      const { text, type } = req.body;
      if (!text) return res.status(400).json({ error: "Text is required" });

      const improvedText = await aiService.improveText(text, type);
      res.json({ success: true, data: { improvedText } });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to improve text" });
    }
  }

  async generateBullets(req: Request, res: Response) {
    try {
      const { jobTitle, skills } = req.body;
      if (!jobTitle)
        return res.status(400).json({ error: "Job Title is required" });

      const bullets = await aiService.generateBullets(jobTitle, skills);
      res.json({ success: true, data: { bullets } });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Failed to generate bullets" });
    }
  }
  async checkATSScore(req: Request, res: Response) {
    try {
      const { resumeData, jobDescription } = req.body;
      if (!resumeData)
        return res
          .status(400)
          .json({ success: false, message: "Resume data is required" });

      const analysis = await aiService.calculateATSScore(
        resumeData,
        jobDescription,
      );
      res.json({ success: true, data: analysis });
    } catch (error) {
      console.error("ATS Check Error:", error);
      res.status(500).json({ success: false, message: "ATS analysis failed" });
    }
  }
}

export const aiController = new AIController();
