import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import type { HonoUser } from "../middleware.hono/auth.middleware.js";
import { resumeService } from "../services/resume.service.js";
import type { IResume } from "../models/resume.model.js";
import { sendEmail } from "../services/email.service.js";
import { auditService } from "../services/audit.service.js";
import { pdfQueue } from "../queues/pdf.queue.js";
import {
  createResumeSchema,
  updateResumeSchema,
  isProTemplate,
} from "@texfolio/shared";

/**
 * Server-side entitlement check for Pro templates.
 *
 * `TemplateSelector` only disables the buttons, so this is the real gate —
 * previously nothing on the server looked at `templateId` at all, and a crafted
 * request could persist (and later compile) a locked design on a free account.
 *
 * Returns the response body+status when the check fails, `null` when it passes,
 * so callers can `if (gate) return gate;` without duplicating the message.
 *
 * `orgCtx` is what exempts organization resumes: a org's own plan — not any
 * individual member's personal Pro flag — is the relevant entitlement there,
 * and `branding.lockedTemplateId` is documented (docs/API.md) as being able to
 * force e.g. `faangpath` org-wide. Gating those on `user.isPro` would have
 * turned a supported feature into a 403.
 */
const proTemplateGate = (
  user: HonoUser,
  templateId?: string | null,
  orgCtx?: { orgId: string; role: string },
): { body: { success: false; error: string }; status: 403 } | null =>
  !orgCtx && isProTemplate(templateId) && !user.isPro
    ? {
        body: {
          success: false,
          error: "Premium templates require a Pro subscription",
        },
        status: 403,
      }
    : null;

/**
 * Error payload for a failed PDF compile.
 *
 * The LaTeX pipeline throws descriptive messages ("LaTeX compile failed and no
 * PDF was produced: …") that were being swallowed by a bare `Failed to generate
 * PDF`, so the client could not tell a bad template from a missing binary. The
 * message is only passed through outside production — the same rule the global
 * handler in `hono.ts` applies — so file paths and stack-derived detail never
 * reach a production client.
 */
const pdfErrorResponse = (c: Context, error: unknown) => {
  console.error("Error in generatePdf:", error);
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Failed to generate PDF";
  return c.json(
    {
      success: false,
      error: isProduction ? "Failed to generate PDF" : message,
    },
    500,
  );
};

// Helper to extract audit metadata from Hono context
const getAuditMeta = (c: Context, statusCode: number) => ({
  requestId: (c.get("requestId") as string) || "unknown",
  ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
  userAgent: c.req.header("user-agent") || "unknown",
  method: c.req.method,
  path: c.req.path,
  statusCode,
});

// Helper to build organization context from authenticated user
const getOrgCtx = (user: HonoUser) =>
  user.organizationId && user.role
    ? { orgId: user.organizationId, role: user.role }
    : undefined;

// Create resume router
export const resumeRoutes = new Hono();

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
    const resumes = await resumeService.findAll(user.userId, getOrgCtx(user));

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

    const resume = await resumeService.findById(id, user.userId, getOrgCtx(user));

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

    const gate = proTemplateGate(user, body.templateId, getOrgCtx(user));
    if (gate) return c.json(gate.body, gate.status);

    const resume = await resumeService.create(body, user.userId, getOrgCtx(user));

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

    const existing = await resumeService.findById(id, user.userId, getOrgCtx(user));

    // Updates are partial: an absent `templateId` keeps the stored one, so gate
    // on the value that will actually be in effect — otherwise a PUT that omits
    // the field would still have to be treated as "not changing the template",
    // and a PUT that sets it was unchecked.
    const gate = proTemplateGate(user, body.templateId ?? existing?.templateId, getOrgCtx(user));
    if (gate) return c.json(gate.body, gate.status);

    const resume = await resumeService.update(id, user.userId, body, getOrgCtx(user));

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

    const resume = await resumeService.delete(id, user.userId, getOrgCtx(user));

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

    const resume = await resumeService.findById(id, user.userId, getOrgCtx(user));

    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    const isPublic = !resume.isPublic;
    let shareId = resume.shareId;

    // Generate shareId if making public
    if (isPublic && !shareId) {
      const { nanoid } = await import("nanoid");
      shareId = nanoid(10);
    }

    const updated = await resumeService.update(
      id,
      user.userId,
      { isPublic, shareId } as Partial<IResume>,
      getOrgCtx(user),
    );

    if (!updated) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }

    await auditService.log({
      actorId: user.userId,
      action: "SHARE",
      resourceType: "Resume",
      resourceId: String(updated._id),
      after: { isPublic: updated.isPublic, shareId: updated.shareId } as Record<string, unknown>,
      metadata: getAuditMeta(c, 200),
    });

    return c.json({
      success: true,
      data: {
        isPublic: updated.isPublic,
        shareId: updated.shareId,
        url: updated.isPublic ? `/r/${updated.shareId}` : null,
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

// Persist the latest ATS score (set by the client after a successful check).
resumeRoutes.patch(
  "/:id/ats-score",
  zValidator("json", z.object({ atsScore: z.number().min(0).max(100) })),
  async (c) => {
    try {
      const user = c.get("user");
      const id = c.req.param("id");
      const { atsScore } = c.req.valid("json");

      const updated = await resumeService.update(
        id,
        user.userId,
        { atsScore } as Partial<IResume>,
        getOrgCtx(user),
      );

      if (!updated) {
        return c.json({ success: false, error: "Resume not found" }, 404);
      }

      return c.json({ success: true, data: { atsScore: updated.atsScore } });
    } catch (error) {
      console.error("Error persisting ATS score:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to save ATS score",
        },
        500,
      );
    }
  },
);

// Generate PDF
resumeRoutes.get("/:id/pdf", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    // Fetched before compiling so a locked template is refused without paying
    // for a LaTeX run first (and so the not-found error surfaces here rather
    // than out of the compiler).
    const resume = await resumeService.findById(id, user.userId, getOrgCtx(user));
    const gate = proTemplateGate(user, resume?.templateId, getOrgCtx(user));
    if (gate) return c.json(gate.body, gate.status);

    const pdfPath = await resumeService.generatePdf(id, user.userId, getOrgCtx(user));

    // Asynchronously notify founder via Telegram of PDF generation
    import("../services/telegram.service.js")
      .then(({ telegramService }) => {
        telegramService.notifyPdfGenerated({
          resumeTitle: resume?.title || "Untitled Resume",
          email: user.email,
          templateId: resume?.templateId,
        });
      })
      .catch(() => {});

    // Sanitize filename to prevent header injection
    const sanitizeFilename = (name: string) =>
      name.replace(/[^a-zA-Z0-9\u00C0-\u017F\s._-]/g, "").trim() || "Resume";

    const filename = resume
      ? `${sanitizeFilename(resume.personalInfo.fullName)}_Resume.pdf`
      : "Resume.pdf";

    // Read file and return as response
    const fs = await import("fs/promises");
    const pdfBuffer = await fs.readFile(pdfPath);

    // Clean up the generated PDF to avoid unbounded temp-file growth
    // (non-blocking — never fail the response over cleanup)
    fs.unlink(pdfPath).catch(() => {});

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid resume ID") {
      return c.json({ success: false, error: "Invalid resume ID" }, 400);
    }
    if (error instanceof Error && error.message === "Resume not found") {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }
    // Real cause out of dev, generic text out of production — was a hardcoded
    // "Failed to generate PDF" for every non-404 failure.
    return pdfErrorResponse(c, error);
  }
});

// Async PDF Generation via BullMQ Queue
resumeRoutes.post("/:id/pdf/queue", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    // Verify resume exists and belongs to user/org
    const resume = await resumeService.findById(id, user.userId, getOrgCtx(user));
    if (!resume) {
      return c.json({ success: false, error: "Resume not found" }, 404);
    }
    const queueGate = proTemplateGate(user, resume.templateId, getOrgCtx(user));
    if (queueGate) return c.json(queueGate.body, queueGate.status);

    if (!pdfQueue) {
      return c.json({ success: false, error: "PDF generation not available (local development)" }, 503);
    }
    const job = await pdfQueue.add("generate-pdf", {
      resumeId: id,
      userId: user.userId,
      organizationId: user.organizationId,
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

    if (!pdfQueue) {
      return c.json({ success: false, error: "PDF generation not available (local development)" }, 503);
    }
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

    if (!pdfQueue) {
      return c.json({ success: false, error: "PDF generation not available (local development)" }, 503);
    }
    const job = await pdfQueue.getJob(jobId);
    if (!job) {
      return c.json({ success: false, error: "Job not found" }, 404);
    }

    // Verify ownership
    if (job.data.resumeId !== id || job.data.userId !== user.userId) {
      return c.json({ success: false, error: "Unauthorized" }, 403);
    }

    // Resolve (and gate) before touching the temp file: a resume can be moved
    // onto a Pro template between enqueue and download, and the queued PDF is
    // deleted as soon as it is served.
    const resume = await resumeService.findById(id, user.userId, getOrgCtx(user));
    const downloadGate = proTemplateGate(user, resume?.templateId, getOrgCtx(user));
    if (downloadGate) return c.json(downloadGate.body, downloadGate.status);

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

    // Clean up the generated PDF after serving (non-blocking cleanup)
    fs.unlink(result.outputPath).catch(() => {});

    const sanitizeFilename = (name: string) =>
      name.replace(/[^a-zA-Z0-9\u00C0-\u017F\s._-]/g, "").trim() || "Resume";
    const filename = resume
      ? `${sanitizeFilename(resume.personalInfo.fullName)}_Resume.pdf`
      : "Resume.pdf";

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
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

      // Resolve before compiling: a locked template must be refused before the
      // LaTeX run, and `findById` already throws on a missing resume.
      const resume = await resumeService.findById(id, user.userId, getOrgCtx(user));
      if (!resume) {
        return c.json({ success: false, error: "Resume not found" }, 404);
      }
      const emailGate = proTemplateGate(user, resume.templateId, getOrgCtx(user));
      if (emailGate) return c.json(emailGate.body, emailGate.status);

      // 1. Generate PDF
      const pdfPath = await resumeService.generatePdf(id, user.userId, getOrgCtx(user));

      // 2. Read PDF Buffer
      const fs = await import("fs/promises");
      const pdfBuffer = await fs.readFile(pdfPath);

      // 3. Clean up temp PDF after reading (non-blocking — never fail over cleanup)
      fs.unlink(pdfPath).catch(() => {});

      // 4. Send Email via Brevo
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
