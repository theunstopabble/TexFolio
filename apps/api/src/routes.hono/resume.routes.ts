import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { resumeService } from "../services/resume.service.js";
import { sendEmail } from "../services/email.service.js";
import { auditService } from "../services/audit.service.js";
import { pdfQueue } from "../queues/pdf.queue.js";

// Helper to extract audit metadata from Hono context
const getAuditMeta = (c: Context, statusCode: number) => ({
  requestId: (c.get("requestId") as string) || "unknown",
  ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
  userAgent: c.req.header("user-agent") || "unknown",
  method: c.req.method,
  path: c.req.path,
  statusCode,
});

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
        description: z.string().default(""),
        technologies: z.array(z.string()).default([]),
        sourceCode: z.string().default(""),
        liveUrl: z.string().default(""),
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
  } catch (error) {
    console.error("Error in getById:", error);
    if (error instanceof Error && error.message === "Invalid resume ID") {
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

    const resume = await resumeService.create(body, user.userId);

    await auditService.log({
      actorId: user.userId,
      action: "CREATE",
      resourceType: "Resume",
      resourceId: String(resume._id),
      after: resume.toObject() as unknown as Record<string, unknown>,
      metadata: getAuditMeta(c, 201),
    });

    return c.json(
      {
        success: true,
        message: "Resume created successfully",
        data: resume,
      },
      201,
    );
  } catch (error) {
    console.error("Error in create:", error);
    if (error instanceof Error && error.name === "ValidationError") {
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

    const existing = await resumeService.findById(id, user.userId);
    const resume = await resumeService.update(id, user.userId, body);

    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    await auditService.log({
      actorId: user.userId,
      action: "UPDATE",
      resourceType: "Resume",
      resourceId: String(resume._id),
      before: existing ? (existing.toObject() as unknown as Record<string, unknown>) : undefined,
      after: resume.toObject() as unknown as Record<string, unknown>,
      metadata: getAuditMeta(c, 200),
    });

    return c.json({
      success: true,
      message: "Resume updated successfully",
      data: resume,
    });
  } catch (error) {
    console.error("Error in update:", error);
    if (error instanceof Error && error.message === "Invalid resume ID") {
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

    await auditService.log({
      actorId: user.userId,
      action: "DELETE",
      resourceType: "Resume",
      resourceId: String(resume._id),
      before: resume.toObject() as unknown as Record<string, unknown>,
      metadata: getAuditMeta(c, 200),
    });

    return c.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete:", error);
    if (error instanceof Error && error.message === "Invalid resume ID") {
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

    await auditService.log({
      actorId: user.userId,
      action: "SHARE",
      resourceType: "Resume",
      resourceId: String(resume._id),
      after: { isPublic: resume.isPublic, shareId: resume.shareId } as Record<string, unknown>,
      metadata: getAuditMeta(c, 200),
    });

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
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle visibility",
      },
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

    // Sanitize filename to prevent header injection
    const sanitizeFilename = (name: string) =>
      name.replace(/[^a-zA-Z0-9\u00C0-\u017F\s._-]/g, "").trim() || "Resume";

    const filename = resume
      ? `${sanitizeFilename(resume.personalInfo.fullName)}_Resume.pdf`
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
  } catch (error) {
    console.error("Error in generatePdf:", error);
    if (error instanceof Error && error.message === "Invalid resume ID") {
      return c.json({ success: false, error: "Invalid resume ID" }, 400);
    }
    if (error instanceof Error && error.message === "Resume not found") {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }
    return c.json({ success: false, error: "Failed to generate PDF" }, 500);
  }
});

// Async PDF Generation via BullMQ Queue
resumeRoutes.post("/:id/pdf/queue", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    // Verify resume exists and belongs to user
    const resume = await resumeService.findById(id, user.userId);
    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    const job = await pdfQueue.add("generate-pdf", {
      resumeId: id,
      userId: user.userId,
    });

    return c.json({
      success: true,
      message: "PDF generation queued",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error queuing PDF:", error);
    return c.json({ success: false, error: "Failed to queue PDF generation" }, 500);
  }
});

// Check async PDF job status
resumeRoutes.get("/:id/pdf/queue/:jobId", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const jobId = c.req.param("jobId");

    const job = await pdfQueue.getJob(jobId);
    if (!job) {
      return c.json({ success: false, error: "Job not found" }, 404);
    }

    // Verify job data matches resume and user
    if (job.data.resumeId !== id || job.data.userId !== user.userId) {
      return c.json({ success: false, error: "Unauthorized" }, 403);
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    return c.json({
      success: true,
      jobId: job.id,
      status: state,          // e.g. "waiting", "active", "completed", "failed"
      progress,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return c.json({ success: false, error: "Failed to fetch job status" }, 500);
  }
});

// Download completed queued PDF
resumeRoutes.get("/:id/pdf/queue/:jobId/download", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const jobId = c.req.param("jobId");

    const job = await pdfQueue.getJob(jobId);
    if (!job) {
      return c.json({ success: false, error: "Job not found" }, 404);
    }

    // Verify ownership
    if (job.data.resumeId !== id || job.data.userId !== user.userId) {
      return c.json({ success: false, error: "Unauthorized" }, 403);
    }

    const state = await job.getState();
    if (state !== "completed") {
      return c.json(
        { success: false, error: `Job is ${state}. Wait for completion before downloading.` },
        409,
      );
    }

    const result = job.returnvalue as { outputPath: string } | undefined;
    if (!result?.outputPath) {
      return c.json({ success: false, error: "Job completed but no file was produced" }, 500);
    }

    // Read and return PDF
    const fs = await import("fs/promises");
    const pdfBuffer = await fs.readFile(result.outputPath);

    const resume = await resumeService.findById(id, user.userId);
    const sanitizeFilename = (name: string) =>
      name.replace(/[^a-zA-Z0-9\u00C0-\u017F\s._-]/g, "").trim() || "Resume";
    const filename = resume
      ? `${sanitizeFilename(resume.personalInfo.fullName)}_Resume.pdf`
      : "Resume.pdf";

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading queued PDF:", error);
    return c.json({ success: false, error: "Failed to download PDF" }, 500);
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
      const fullName = resume.personalInfo?.fullName || "User";
      await sendEmail({
        to: email,
        subject: `Your Resume: ${fullName}`,
        htmlContent: `
        <h1>Here is your requested resume</h1>
        <p>Hi ${fullName},</p>
        <p>Please find your generated resume attached.</p>
        <p>Best,<br>TexFolio Team</p>
      `,
        pdfBuffer: pdfBuffer,
        pdfName: `${fullName.replace(/\s+/g, "_")}_Resume.pdf`,
      });

      return c.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to send email" },
        500,
      );
    }
  },
);
