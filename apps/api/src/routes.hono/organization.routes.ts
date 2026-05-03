import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { requireRole } from "../middleware.hono/rbac.middleware.js";
import { organizationService } from "../services/organization.service.js";
import { auditService } from "../services/audit.service.js";
import type { IAuditLog } from "../models/audit-log.model.js";

const getAuditMeta = (c: Context, statusCode: number) => ({
  requestId: (c.get("requestId") as string) || "unknown",
  ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
  userAgent: c.req.header("user-agent") || "unknown",
  method: c.req.method,
  path: c.req.path,
  statusCode,
});

export const organizationRoutes = new Hono();

// All org routes require authentication
organizationRoutes.use("/*", authMiddleware);

// ============================================
// Organization CRUD
// ============================================

organizationRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(100),
      slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
      branding: z
        .object({
          primaryColor: z.string().optional(),
          logoUrl: z.string().optional(),
          lockedTemplateId: z.string().optional(),
        })
        .optional(),
      settings: z
        .object({
          disableAI: z.boolean().optional(),
          enforceCompanyFont: z.boolean().optional(),
        })
        .optional(),
    }),
  ),
  async (c) => {
    try {
      const user = c.get("user");
      const body = c.req.valid("json");

      const org = await organizationService.create({
        ...body,
        ownerId: user.userId,
      });

      await auditService.log({
        actorId: user.userId,
        action: "CREATE",
        resourceType: "Organization",
        resourceId: String(org._id),
        after: org.toObject() as unknown as Record<string, unknown>,
        metadata: getAuditMeta(c, 201),
      });

      return c.json(
        {
          success: true,
          message: "Organization created successfully",
          data: org,
        },
        201,
      );
    } catch (error) {
      console.error("Error creating organization:", error);
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return c.json({ success: false, error: "Organization slug already taken" }, 409);
      }
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to create organization" },
        500,
      );
    }
  },
);

organizationRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const orgs = await organizationService.findByUser(user.userId);

    return c.json({
      success: true,
      count: orgs.length,
      data: orgs,
    });
  } catch (error) {
    console.error("Error listing organizations:", error);
    return c.json({ success: false, error: "Failed to fetch organizations" }, 500);
  }
});

organizationRoutes.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ success: false, error: "Invalid organization ID" }, 400);
    }

    const org = await organizationService.findById(id, user.userId);
    if (!org) {
      return c.json({ success: false, error: "Organization not found or access denied" }, 404);
    }

    return c.json({ success: true, data: org });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return c.json({ success: false, error: "Failed to fetch organization" }, 500);
  }
});

organizationRoutes.put(
  "/:id",
  requireRole("admin"),
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(100).optional(),
      branding: z
        .object({
          primaryColor: z.string().optional(),
          logoUrl: z.string().optional(),
          lockedTemplateId: z.string().optional(),
        })
        .optional(),
      settings: z
        .object({
          disableAI: z.boolean().optional(),
          enforceCompanyFont: z.boolean().optional(),
        })
        .optional(),
    }),
  ),
  async (c) => {
    try {
      const user = c.get("user");
      const id = c.req.param("id");
      if (!id) {
        return c.json({ success: false, error: "Invalid organization ID" }, 400);
      }
      const body = c.req.valid("json");

      const org = await organizationService.update(id, user.userId, body);
      if (!org) {
        return c.json({ success: false, error: "Organization not found" }, 404);
      }

      await auditService.log({
        actorId: user.userId,
        action: "UPDATE",
        resourceType: "Organization",
        resourceId: String(org._id),
        after: org.toObject() as unknown as Record<string, unknown>,
        metadata: getAuditMeta(c, 200),
      });

      return c.json({
        success: true,
        message: "Organization updated successfully",
        data: org,
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      if (error instanceof Error && error.message.startsWith("Access denied")) {
        return c.json({ success: false, error: error.message }, 403);
      }
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to update organization" },
        500,
      );
    }
  },
);

organizationRoutes.delete("/:id", requireRole("owner"), async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ success: false, error: "Invalid organization ID" }, 400);
    }

    await organizationService.delete(id, user.userId);

    await auditService.log({
      actorId: user.userId,
      action: "DELETE",
      resourceType: "Organization",
      resourceId: id,
      metadata: getAuditMeta(c, 200),
    });

    return c.json({ success: true, message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    if (error instanceof Error && error.message.startsWith("Access denied")) {
      return c.json({ success: false, error: error.message }, 403);
    }
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete organization" },
      500,
    );
  }
});

// ============================================
// Member Management
// ============================================

organizationRoutes.get("/:id/members", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ success: false, error: "Invalid organization ID" }, 400);
    }

    const members = await organizationService.listMembers(id, user.userId);

    return c.json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error("Error listing members:", error);
    if (error instanceof Error && error.message.startsWith("Access denied")) {
      return c.json({ success: false, error: error.message }, 403);
    }
    return c.json({ success: false, error: "Failed to list members" }, 500);
  }
});

organizationRoutes.post(
  "/:id/members",
  requireRole("admin"),
  zValidator(
    "json",
    z.object({
      userId: z.string().min(1),
      role: z.enum(["admin", "editor", "viewer"]),
    }),
  ),
  async (c) => {
    try {
      const user = c.get("user");
      const id = c.req.param("id");
      if (!id) {
        return c.json({ success: false, error: "Invalid organization ID" }, 400);
      }
      const body = c.req.valid("json");

      const member = await organizationService.inviteMember({
        organizationId: id,
        userId: body.userId,
        role: body.role,
        invitedBy: user.userId,
      });

      await auditService.log({
        actorId: user.userId,
        action: "INVITE_MEMBER",
        resourceType: "Organization",
        resourceId: id,
        after: member.toObject() as unknown as Record<string, unknown>,
        metadata: getAuditMeta(c, 201),
      });

      return c.json(
        {
          success: true,
          message: "Member invited successfully",
          data: member,
        },
        201,
      );
    } catch (error) {
      console.error("Error inviting member:", error);
      if (error instanceof Error && error.message.startsWith("Access denied")) {
        return c.json({ success: false, error: error.message }, 403);
      }
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to invite member" },
        500,
      );
    }
  },
);

organizationRoutes.put(
  "/:id/members/:userId",
  requireRole("admin"),
  zValidator("json", z.object({ role: z.enum(["admin", "editor", "viewer", "owner"]) })),
  async (c) => {
    try {
      const user = c.get("user");
      const orgId = c.req.param("id");
      const targetUserId = c.req.param("userId");
      if (!orgId || !targetUserId) {
        return c.json({ success: false, error: "Invalid parameters" }, 400);
      }
      const { role } = c.req.valid("json");

      const member = await organizationService.updateMemberRole(
        orgId,
        targetUserId,
        role,
        user.userId,
      );

      await auditService.log({
        actorId: user.userId,
        action: "UPDATE_MEMBER_ROLE",
        resourceType: "Organization",
        resourceId: orgId,
        after: member.toObject() as unknown as Record<string, unknown>,
        metadata: getAuditMeta(c, 200),
      });

      return c.json({
        success: true,
        message: "Member role updated successfully",
        data: member,
      });
    } catch (error) {
      console.error("Error updating member role:", error);
      if (error instanceof Error && error.message.startsWith("Access denied")) {
        return c.json({ success: false, error: error.message }, 403);
      }
      return c.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to update role" },
        500,
      );
    }
  },
);

organizationRoutes.delete("/:id/members/:userId", async (c) => {
  try {
    const user = c.get("user");
    const orgId = c.req.param("id");
    const targetUserId = c.req.param("userId");
    if (!orgId || !targetUserId) {
      return c.json({ success: false, error: "Invalid parameters" }, 400);
    }

    await organizationService.removeMember(orgId, targetUserId, user.userId);

    await auditService.log({
      actorId: user.userId,
      action: "REMOVE_MEMBER",
      resourceType: "Organization",
      resourceId: orgId,
      metadata: getAuditMeta(c, 200),
    });

    return c.json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    if (error instanceof Error && error.message.startsWith("Access denied")) {
      return c.json({ success: false, error: error.message }, 403);
    }
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to remove member" },
      500,
    );
  }
});

// ============================================
// Organization Resumes
// ============================================

organizationRoutes.get("/:id/resumes", async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ success: false, error: "Invalid organization ID" }, 400);
    }

    const resumes = await organizationService.getOrgResumes(id, user.userId);

    return c.json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    console.error("Error fetching org resumes:", error);
    if (error instanceof Error && error.message.startsWith("Access denied")) {
      return c.json({ success: false, error: error.message }, 403);
    }
    return c.json({ success: false, error: "Failed to fetch organization resumes" }, 500);
  }
});
