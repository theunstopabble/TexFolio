import { Router, Request, Response } from "express";
import { Resume } from "../models/index.js";
import mongoose from "mongoose";
import { generatePDF } from "../services/index.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(authMiddleware);

// GET /api/resumes - Get current user's resumes
router.get("/", async (req: Request, res: Response) => {
  try {
    const resumes = await Resume.find({ userId: (req as any).userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch resumes",
    });
  }
});

// GET /api/resumes/:id - Get single resume
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid resume ID",
      });
      return;
    }

    const resume = await Resume.findOne({
      _id: id,
      userId: (req as any).userId,
    });

    if (!resume) {
      res.status(404).json({
        success: false,
        error: "Resume not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch resume",
    });
  }
});

// POST /api/resumes - Create new resume
router.post("/", async (req: Request, res: Response) => {
  try {
    // console.log('📥 Received resume data:', JSON.stringify(req.body, null, 2));

    const resumeData = {
      ...req.body,
      userId: (req as any).userId,
    };

    const resume = await Resume.create(resumeData);

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      data: resume,
    });
  } catch (error) {
    console.error("❌ Resume creation error:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: "Failed to create resume",
    });
  }
});

// PUT /api/resumes/:id - Update resume
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid resume ID",
      });
      return;
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: id, userId: (req as any).userId },
      { ...req.body },
      { new: true, runValidators: true },
    );

    if (!resume) {
      res.status(404).json({
        success: false,
        error: "Resume not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Resume updated successfully",
      data: resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update resume",
    });
  }
});

// DELETE /api/resumes/:id - Delete resume
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid resume ID",
      });
      return;
    }

    const resume = await Resume.findOneAndDelete({
      _id: id,
      userId: (req as any).userId,
    });

    if (!resume) {
      res.status(404).json({
        success: false,
        error: "Resume not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete resume",
    });
  }
});

// GET /api/resumes/:id/pdf - Generate and download PDF
// Note: We might want to allow this without auth if sharing is enabled,
// but for now let's strict it to the owner or maybe check token if provided.
// Since it's an API call from frontend with token, authMiddleware will work.
// If opening in new tab, token handling is trickier (cookies or query param).
// For now, let's keep it protected and assume the frontend handles it properly
// or the user uses the download button which triggers a blob fetch with headers.
router.get("/:id/pdf", async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid resume ID",
      });
      return;
    }

    // Allow fetching PDF if user owns it.
    // If we want public sharing, we'd need a separate "public" flag or route.
    const resume = await Resume.findOne({
      _id: id,
      userId: (req as any).userId,
    });

    if (!resume) {
      res.status(404).json({
        success: false,
        error: "Resume not found",
      });
      return;
    }

    // Generate PDF
    const pdfPath = await generatePDF(resume);

    // Send PDF file
    res.download(
      pdfPath,
      `${resume.personalInfo.fullName}_Resume.pdf`,
      (err) => {
        if (err) {
          console.error("Error sending PDF:", err);
        }
      },
    );
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      error: `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

export default router;
