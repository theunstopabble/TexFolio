import { Request, Response } from "express";
import { resumeService } from "../services/resume.service.js";

export class ResumeController {
  // Get all resumes
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const resumes = await resumeService.findAll(userId);
      res.status(200).json({
        success: true,
        count: resumes.length,
        data: resumes,
      });
    } catch (error) {
      console.error("Error in getAll:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch resumes" });
    }
  }

  // Get single resume
  async getById(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params as { id: string };

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const resume = await resumeService.findById(id, userId);
      if (!resume) {
        return res
          .status(404)
          .json({ success: false, error: "Resume not found" });
      }

      res.status(200).json({ success: true, data: resume });
    } catch (error: any) {
      console.error("Error in getById:", error);
      if (error.message === "Invalid resume ID") {
        return res
          .status(400)
          .json({ success: false, error: "Invalid resume ID" });
      }
      res.status(500).json({ success: false, error: "Failed to fetch resume" });
    }
  }

  // Create resume
  async create(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const resume = await resumeService.create(req.body, userId);
      res.status(201).json({
        success: true,
        message: "Resume created successfully",
        data: resume,
      });
    } catch (error: any) {
      console.error("Error in create:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.message,
        });
      }
      res
        .status(500)
        .json({ success: false, error: "Failed to create resume" });
    }
  }

  // Update resume
  async update(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params as { id: string };

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const resume = await resumeService.update(id, userId, req.body);
      if (!resume) {
        return res
          .status(404)
          .json({ success: false, error: "Resume not found" });
      }

      res.status(200).json({
        success: true,
        message: "Resume updated successfully",
        data: resume,
      });
    } catch (error: any) {
      console.error("Error in update:", error);
      if (error.message === "Invalid resume ID") {
        return res
          .status(400)
          .json({ success: false, error: "Invalid resume ID" });
      }
      res
        .status(500)
        .json({ success: false, error: "Failed to update resume" });
    }
  }

  // Delete resume
  async delete(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params as { id: string };

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const resume = await resumeService.delete(id, userId);
      if (!resume) {
        return res
          .status(404)
          .json({ success: false, error: "Resume not found" });
      }

      res.status(200).json({
        success: true,
        message: "Resume deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in delete:", error);
      if (error.message === "Invalid resume ID") {
        return res
          .status(400)
          .json({ success: false, error: "Invalid resume ID" });
      }
      res
        .status(500)
        .json({ success: false, error: "Failed to delete resume" });
    }
  }

  // Generate PDF
  async generatePdf(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params as { id: string };

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const pdfPath = await resumeService.generatePdf(id, userId);

      // We need to fetch the resume name specifically for the filename
      // This is a small redundancy but safer for separation
      const resume = await resumeService.findById(id, userId);
      const filename = resume
        ? `${resume.personalInfo.fullName}_Resume.pdf`
        : "Resume.pdf";

      res.download(pdfPath, filename, (err) => {
        if (err) console.error("Error sending PDF:", err);
      });
    } catch (error: any) {
      console.error("Error in generatePdf:", error);
      if (error.message === "Invalid resume ID") {
        return res
          .status(400)
          .json({ success: false, error: "Invalid resume ID" });
      }
      if (error.message === "Resume not found") {
        return res
          .status(404)
          .json({ success: false, error: "Resume not found" });
      }
      res.status(500).json({ success: false, error: "Failed to generate PDF" });
    }
  }

  // Toggle visibility
  async toggleVisibility(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params as { id: string };

      if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const resume = await resumeService.findById(id, userId);
      if (!resume) {
        return res
          .status(404)
          .json({ success: false, error: "Resume not found" });
      }

      // Toggle
      resume.isPublic = !resume.isPublic;

      // Generate shareId if making public and doesn't exist
      if (resume.isPublic && !resume.shareId) {
        const { nanoid } = await import("nanoid");
        resume.shareId = nanoid(10); // 10 char unique ID
      }

      await resume.save();

      res.status(200).json({
        success: true,
        data: {
          isPublic: resume.isPublic,
          shareId: resume.shareId,
          url: resume.isPublic ? `/r/${resume.shareId}` : null,
        },
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update visibility" });
    }
  }

  // Get public resume
  async getPublicResume(req: Request, res: Response) {
    try {
      const { shareId } = req.params;

      const { Resume } = await import("../models/resume.model.js"); // Lazy load to avoid circular dependency if any
      const resume = await Resume.findOne({ shareId, isPublic: true });

      if (!resume) {
        return res
          .status(404)
          .json({ success: false, error: "Resume not found or private" });
      }

      res.status(200).json({ success: true, data: resume });
    } catch (error) {
      console.error("Error fetching public resume:", error);
      res.status(500).json({ success: false, error: "Failed to fetch resume" });
    }
  }
}

export const resumeController = new ResumeController();
