import { Organization, type IOrganization } from "../models/organization.model.js";
import { OrganizationMember, type IOrganizationMember } from "../models/organization-member.model.js";
import { Resume } from "../models/resume.model.js";
import mongoose from "mongoose";

interface CreateOrgInput {
  name: string;
  slug: string;
  ownerId: string;
  branding?: IOrganization["branding"];
  settings?: IOrganization["settings"];
}

interface InviteMemberInput {
  organizationId: string;
  userId: string;
  role: IOrganizationMember["role"];
  invitedBy: string;
}

export class OrganizationService {
  /**
   * Create a new organization and set the creator as owner.
   */
  async create(input: CreateOrgInput) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const org = await Organization.create([input], { session });
      const orgId = org[0]._id.toString();

      await OrganizationMember.create(
        [
          {
            organizationId: orgId,
            userId: input.ownerId,
            role: "owner",
            invitedBy: input.ownerId,
            status: "active",
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return org[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Find all organizations where the user is an active member.
   */
  async findByUser(userId: string) {
    const memberships = await OrganizationMember.find({
      userId,
      status: "active",
    });

    if (memberships.length === 0) return [];

    const orgIds = memberships.map((m) => m.organizationId);
    const orgs = await Organization.find({ _id: { $in: orgIds } });

    // Attach role to each org
    return orgs.map((org) => {
      const member = memberships.find(
        (m) => m.organizationId === org._id.toString(),
      );
      return {
        ...org.toObject(),
        role: member?.role ?? "viewer",
      };
    });
  }

  /**
   * Get a single organization by ID (if user is a member).
   */
  async findById(orgId: string, userId: string) {
    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
      status: "active",
    });

    if (!member) return null;

    const org = await Organization.findById(orgId);
    if (!org) return null;

    return { ...org.toObject(), role: member.role };
  }

  /**
   * Update organization details (admin+ only).
   */
  async update(orgId: string, userId: string, data: Partial<IOrganization>) {
    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
      status: "active",
    });

    if (!member || !["owner", "admin"].includes(member.role)) {
      throw new Error("Access denied: Admin or owner role required");
    }

    // Prevent slug change if org already exists
    const safeData = { ...data };
    delete (safeData as Record<string, unknown>)._id;
    delete (safeData as Record<string, unknown>).ownerId;
    delete (safeData as Record<string, unknown>).createdAt;

    return await Organization.findByIdAndUpdate(orgId, safeData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete an organization and all related data (owner only).
   */
  async delete(orgId: string, userId: string) {
    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
      status: "active",
      role: "owner",
    });

    if (!member) {
      throw new Error("Access denied: Only the owner can delete the organization");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Organization.findByIdAndDelete(orgId, { session });
      await OrganizationMember.deleteMany({ organizationId: orgId }, { session });
      // Soft-delete org resumes by removing organizationId reference
      await Resume.updateMany(
        { organizationId: orgId },
        { $unset: { organizationId: 1 }, visibility: "private" },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Invite a member to the organization (admin+).
   */
  async inviteMember(input: InviteMemberInput) {
    const inviter = await OrganizationMember.findOne({
      organizationId: input.organizationId,
      userId: input.invitedBy,
      status: "active",
    });

    if (!inviter || !["owner", "admin"].includes(inviter.role)) {
      throw new Error("Access denied: Admin or owner role required to invite members");
    }

    // Cannot invite owner (there can only be one owner)
    if (input.role === "owner") {
      throw new Error("Cannot assign owner role via invite. Transfer ownership instead.");
    }

    const existing = await OrganizationMember.findOne({
      organizationId: input.organizationId,
      userId: input.userId,
    });

    if (existing) {
      if (existing.status === "active") {
        throw new Error("User is already a member of this organization");
      }
      // Re-activate pending member
      existing.status = "active";
      existing.role = input.role;
      existing.invitedBy = input.invitedBy;
      return await existing.save();
    }

    return await OrganizationMember.create({
      ...input,
      status: "active",
    });
  }

  /**
   * List all members of an organization.
   */
  async listMembers(orgId: string, userId: string) {
    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
      status: "active",
    });

    if (!member) {
      throw new Error("Access denied: You are not a member of this organization");
    }

    return await OrganizationMember.find({ organizationId: orgId }).sort({
      createdAt: -1,
    });
  }

  /**
   * Update a member's role (admin+).
   */
  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    newRole: IOrganizationMember["role"],
    actingUserId: string,
  ) {
    const actor = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: actingUserId,
      status: "active",
    });

    if (!actor || !["owner", "admin"].includes(actor.role)) {
      throw new Error("Access denied: Admin or owner role required");
    }

    const target = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: targetUserId,
    });

    if (!target) {
      throw new Error("Member not found");
    }

    // Only owner can promote to owner or demote an owner
    if (target.role === "owner" || newRole === "owner") {
      if (actor.role !== "owner") {
        throw new Error("Only the owner can transfer ownership");
      }
      // If promoting someone to owner, demote current owner to admin
      if (newRole === "owner") {
        await OrganizationMember.updateOne(
          { organizationId: orgId, role: "owner" },
          { role: "admin" },
        );
        await Organization.findByIdAndUpdate(orgId, { ownerId: targetUserId });
      }
    }

    target.role = newRole;
    return await target.save();
  }

  /**
   * Remove a member from the organization (admin+; self-removal allowed).
   */
  async removeMember(orgId: string, targetUserId: string, actingUserId: string) {
    const actor = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: actingUserId,
      status: "active",
    });

    // Self-removal is always allowed
    if (actingUserId !== targetUserId) {
      if (!actor || !["owner", "admin"].includes(actor.role)) {
        throw new Error("Access denied: Admin or owner role required to remove members");
      }
    }

    const target = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: targetUserId,
    });

    if (!target) {
      throw new Error("Member not found");
    }

    if (target.role === "owner") {
      throw new Error("Cannot remove the owner. Transfer ownership first.");
    }

    return await OrganizationMember.findByIdAndDelete(target._id);
  }

  /**
   * Get all resumes belonging to an organization.
   */
  async getOrgResumes(orgId: string, userId: string) {
    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
      status: "active",
    });

    if (!member) {
      throw new Error("Access denied: You are not a member of this organization");
    }

    return await Resume.find({ organizationId: orgId }).sort({ createdAt: -1 });
  }
}

export const organizationService = new OrganizationService();
