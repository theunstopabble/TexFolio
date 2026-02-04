import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { resumeService } from "../services/resume.service.js";
import { sendEmail } from "../services/email.service.js";

// Create resume router
export const resumeRoutes = new Hono();

// ============================================
// Validation Schemas
// ============================================
const createResumeSchema = z.object({
  title: z.string().min(1).max(100),
  templateId: z.string().default("classic"),
  personalInfo: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string(),
    location: z.string(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
  }),
  summary: z.string().optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        gpa: z.string().optional(),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string(),
        skills: z.array(z.string()),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        technologies: z.array(z.string()).default([]),
        sourceCode: z.string().optional(),
        liveUrl: z.string().optional(),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .default([]),
  customization: z
    .object({
      primaryColor: z.string().default("#2563EB"),
      fontFamily: z.enum(["serif", "sans"]).default("serif"),
    })
    .optional(),
  sectionOrder: z.array(z.string()).optional(),
});

const updateResumeSchema = createResumeSchema.partial();

// ============================================
// Public Routes (no auth required)
// ============================================

// Get public resume by shareId
resumeRoutes.get("/public/:shareId", async (c) => {
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
    console.error("Error fetching public resume:", error);
    return c.json({ success: false, error: "Failed to fetch resume" }, 500);
  }
});

// ============================================
// Protected Routes (auth required)
// ============================================

// Apply auth middleware to all routes below
resumeRoutes.use("/*", authMiddleware);

// Get all resumes for user
resumeRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const resumes = await resumeService.findAll(user.userId);

    return c.json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    console.error("Error in getAll:", error);
    return c.json({ success: false, error: "Failed to fetch resumes" }, 500);
  }
});

// Get single resume by ID
resumeRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const resume = await resumeService.findById(id, user.userId);

    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    return c.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("Error in getById:", error);
    if (error.message === "Invalid resume ID") {
      return c.json({ success: false, error: "Invalid resume ID" }, 400);
    }
    return c.json({ success: false, error: "Failed to fetch resume" }, 500);
  }
});

// Create new resume
resumeRoutes.post("/", zValidator("json", createResumeSchema), async (c) => {
  try {
    const user = c.get("user");
    const body = c.req.valid("json");

    const resume = await resumeService.create(body as any, user.userId);

    return c.json(
      {
        success: true,
        message: "Resume created successfully",
        data: resume,
      },
      201,
    );
  } catch (error: any) {
    console.error("Error in create:", error);
    if (error.name === "ValidationError") {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: error.message,
        },
        400,
      );
    }
    return c.json({ success: false, error: "Failed to create resume" }, 500);
  }
});

// Update resume
resumeRoutes.put("/:id", zValidator("json", updateResumeSchema), async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const resume = await resumeService.update(id, user.userId, body as any);

    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Resume updated successfully",
      data: resume,
    });
  } catch (error: any) {
    console.error("Error in update:", error);
    if (error.message === "Invalid resume ID") {
      return c.json({ success: false, error: "Invalid resume ID" }, 400);
    }
    return c.json({ success: false, error: "Failed to update resume" }, 500);
  }
});

// Delete resume
resumeRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const resume = await resumeService.delete(id, user.userId);

    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in delete:", error);
    if (error.message === "Invalid resume ID") {
      return c.json({ success: false, error: "Invalid resume ID" }, 400);
    }
    return c.json({ success: false, error: "Failed to delete resume" }, 500);
  }
});

// Toggle visibility
resumeRoutes.patch("/:id/visibility", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const resume = await resumeService.findById(id, user.userId);

    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    // Toggle
    resume.isPublic = !resume.isPublic;

    // Generate shareId if making public
    if (resume.isPublic && !resume.shareId) {
      const { nanoid } = await import("nanoid");
      resume.shareId = nanoid(10);
    }

    await resume.save();

    return c.json({
      success: true,
      data: {
        isPublic: resume.isPublic,
        shareId: resume.shareId,
        url: resume.isPublic ? `/r/${resume.shareId}` : null,
      },
    });
  } catch (error) {
    console.error("Error toggling visibility:", error);
    return c.json(
      { success: false, error: "Failed to update visibility" },
      500,
    );
  }
});

// Generate PDF
resumeRoutes.get("/:id/pdf", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const pdfPath = await resumeService.generatePdf(id, user.userId);
    const resume = await resumeService.findById(id, user.userId);

    const filename = resume
      ? `${resume.personalInfo.fullName}_Resume.pdf`
      : "Resume.pdf";

    // Read file and return as response
    const fs = await import("fs/promises");
    const pdfBuffer = await fs.readFile(pdfPath);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error in generatePdf:", error);
    if (error.message === "Invalid resume ID") {
      return c.json({ success: false, error: "Invalid resume ID" }, 400);
    }
    if (error.message === "Resume not found") {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }
    return c.json({ success: false, error: "Failed to generate PDF" }, 500);
  }
});

// Email Resume
resumeRoutes.post(
  "/:id/email",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    try {
      const user = c.get("user");
      const id = c.req.param("id");
      const { email } = c.req.valid("json");

      // 1. Generate PDF
      const pdfPath = await resumeService.generatePdf(id, user.userId);
      const resume = await resumeService.findById(id, user.userId);

      if (!resume) {
        return c.json({ success: false, error: "Resume not found" }, 404);
      }

      // 2. Read PDF Buffer
      const fs = await import("fs/promises");
      const pdfBuffer = await fs.readFile(pdfPath);

      // 3. Send Email via Brevo
      await sendEmail({
        to: email,
        subject: `Your Resume: ${resume.personalInfo.fullName}`,
        htmlContent: `
        <h1>Here is your requested resume</h1>
        <p>Hi ${resume.personalInfo.fullName},</p>
        <p>Please find your generated resume attached.</p>
        <p>Best,<br>TexFolio Team</p>
      `,
        pdfBuffer: pdfBuffer,
        pdfName: `${resume.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`,
      });

      return c.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Error sending email:", error);
      return c.json(
        { success: false, error: error.message || "Failed to send email" },
        500,
      );
    }
  },
);
