import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";
import { hasMinimumRole, type OrgRole } from "../models/organization.model.js";

/**
 * Resolve organization role for the current request.
 * Priority:
 *  1. Already set by auth middleware (X-Organization-Id header present)
 *  2. Route param :id on /organizations/:id/* routes — look up membership
 */
async function resolveOrgRole(
  c: Context,
): Promise<{ organizationId: string; role: OrgRole } | null> {
  const user = c.get("user");

  // Already resolved by auth middleware via X-Organization-Id header
  if (user.organizationId && user.role) {
    return { organizationId: user.organizationId, role: user.role };
  }

  // Try route parameter (e.g. /organizations/:id)
  const routeOrgId = c.req.param("id");
  if (!routeOrgId) return null;

  const { OrganizationMember } = await import("../models/organization-member.model.js");
  const membership = await OrganizationMember.findOne({
    organizationId: routeOrgId,
    userId: user.userId,
    status: "active",
  });

  if (!membership) return null;

  return {
    organizationId: routeOrgId,
    role: membership.role as OrgRole,
  };
}

/**
 * Role-based access control middleware for organization-scoped routes.
 * Role hierarchy: owner > admin > editor > viewer
 */
export function requireRole(minRole: OrgRole) {
  return createMiddleware(async (c: Context, next: Next) => {
    const user = c.get("user");

    const resolved = await resolveOrgRole(c);

    if (!resolved) {
      return c.json(
        { success: false, error: "Forbidden: Organization access required" },
        403,
      );
    }

    if (!hasMinimumRole(resolved.role, minRole)) {
      return c.json(
        {
          success: false,
          error: `Forbidden: Requires ${minRole} role or higher in this organization`,
        },
        403,
      );
    }

    // Enrich user context for downstream handlers
    c.set("user", {
      ...user,
      organizationId: resolved.organizationId,
      role: resolved.role,
    });

    await next();
  });
}
