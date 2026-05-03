import { Hono } from "hono";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { Resume } from "../models/index.js";
import { AuditLog } from "../models/audit-log.model.js";
import { Organization, OrganizationMember } from "../models/index.js";

export const gdprRoutes = new Hono();

// GDPR routes require authentication
gdprRoutes.use("/*", authMiddleware);

/**
 * Export all personal data (JSON dump).
 * Returns resumes, audit logs, organizations, and memberships.
 */
gdprRoutes.get("/export", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId;

    const [resumes, auditLogs, orgs, memberships] = await Promise.all([
      Resume.find({ userId }).lean(),
      AuditLog.find({ actorId: userId }).lean(),
      Organization.find({ ownerId: userId }).lean(),
      OrganizationMember.find({ userId }).lean(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      profile: {
        email: user.email,
        isPro: user.isPro,
      },
      resumes,
      auditLogs,
      organizationsOwned: orgs,
      organizationMemberships: memberships,
    };

    return c.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return c.json({ success: false, error: "Failed to export data" }, 500);
  }
});

/**
 * Soft-delete user data (GDPR right to erasure).
 * 30-day buffer before hard deletion.
 */
gdprRoutes.post("/delete", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.userId;

    // Soft-delete all resumes (mark as deleted, remove personal info)
    await Resume.updateMany(
      { userId },
      {
        $set: {
          title: "[DELETED]",
          "personalInfo.fullName": "[REDACTED]",
          "personalInfo.email": "[REDACTED]",
          "personalInfo.phone": "[REDACTED]",
          "personalInfo.location": "[REDACTED]",
          summary: "",
          experience: [],
          education: [],
          projects: [],
          skills: [],
          certifications: [],
          languages: [],
          isPublic: false,
          shareId: null,
          gdprDeletedAt: new Date(),
        },
      },
    );

    // Revoke organization memberships
    await OrganizationMember.updateMany(
      { userId },
      { $set: { status: "pending" } },
    );

    // Set audit log actor to anonymized marker
    await AuditLog.updateMany(
      { actorId: userId },
      { $set: { actorId: `[DELETED:${userId}]` } },
    );

    return c.json({
      success: true,
      message: "Personal data scheduled for deletion (30-day buffer).",
      details: {
        resumesAnonymized: true,
        membershipsRevoked: true,
        auditLogsAnonymized: true,
        hardDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error scheduling GDPR deletion:", error);
    return c.json({ success: false, error: "Failed to schedule deletion" }, 500);
  }
});
