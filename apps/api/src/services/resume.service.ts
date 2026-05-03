import { Resume, IResume } from "../models/resume.model.js";
import { generatePDF as generatePdfService } from "./pdf.service.js"; // Alias to avoid naming conflict
import mongoose from "mongoose";
import type { OrgRole } from "../models/organization.model.js";
import { hasMinimumRole } from "../models/organization.model.js";

interface OrgContext {
  orgId?: string;
  role?: OrgRole;
}

export class ResumeService {
  /**
   * Find all resumes accessible to a user.
   * Returns personal resumes + organization resumes the user can view.
   */
  async findAll(userId: string, orgCtx?: OrgContext) {
    const orConditions: Record<string, unknown>[] = [{ userId }];

    if (orgCtx?.orgId) {
      // Organization resumes: any member can see org/public visibility
      orConditions.push({
        organizationId: orgCtx.orgId,
        visibility: { $in: ["organization", "public"] },
      });
    }

    return await Resume.find({ $or: orConditions }).sort({ createdAt: -1 });
  }

  /**
   * Find a single resume by ID with ownership or organization access check.
   */
  async findById(id: string, userId: string, orgCtx?: OrgContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid resume ID");
    }

    const resume = await Resume.findById(id);
    if (!resume) return null;

    // Personal ownership
    if (resume.userId === userId) {
      return resume;
    }

    // Organization access
    if (
      orgCtx?.orgId &&
      resume.organizationId === orgCtx.orgId &&
      resume.visibility !== "private"
    ) {
      return resume;
    }

    return null;
  }

  /**
   * Strict ownership/org-editor check for mutating operations.
   */
  private async assertWriteAccess(
    id: string,
    userId: string,
    orgCtx?: OrgContext,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid resume ID");
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      throw new Error("Resume not found");
    }

    // Personal owner
    if (resume.userId === userId) {
      return resume;
    }

    // Organization editor or higher
    if (
      orgCtx?.orgId &&
      resume.organizationId === orgCtx.orgId &&
      orgCtx.role &&
      hasMinimumRole(orgCtx.role, "editor")
    ) {
      return resume;
    }

    throw new Error("Access denied: You do not have permission to modify this resume");
  }

  /**
   * Create a new resume.
   * If organization context is present and user has editor+ role, creates org-owned resume.
   */
  async create(data: Partial<IResume>, userId: string, orgCtx?: OrgContext) {
    const payload: Partial<IResume> = { ...data, userId };

    if (orgCtx?.orgId && orgCtx.role && hasMinimumRole(orgCtx.role, "editor")) {
      payload.organizationId = orgCtx.orgId;
      // Default to organization visibility for org resumes
      if (!payload.visibility) {
        payload.visibility = "organization";
      }
    }

    return await Resume.create(payload);
  }

  /**
   * Update a resume with ownership or org-editor access.
   */
  async update(id: string, userId: string, data: Partial<IResume>, orgCtx?: OrgContext) {
    const resume = await this.assertWriteAccess(id, userId, orgCtx);

    // Prevent ownership transfer or injected fields
    const safeData = { ...data };
    delete (safeData as Record<string, unknown>).userId;
    delete (safeData as Record<string, unknown>).clerkId;
    delete (safeData as Record<string, unknown>)._id;
    delete (safeData as Record<string, unknown>).shareId;
    delete (safeData as Record<string, unknown>).createdAt;
    delete (safeData as Record<string, unknown>).updatedAt;
    delete (safeData as Record<string, unknown>).organizationId;

    return await Resume.findByIdAndUpdate(
      id,
      safeData,
      { new: true, runValidators: true },
    );
  }

  /**
   * Delete a resume with ownership or org-admin access.
   * Note: admin+ required for org resumes (stricter than edit).
   */
  async delete(id: string, userId: string, orgCtx?: OrgContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid resume ID");
    }

    const resume = await Resume.findById(id);
    if (!resume) {
      throw new Error("Resume not found");
    }

    // Personal owner
    if (resume.userId === userId) {
      return await Resume.findByIdAndDelete(id);
    }

    // Organization admin/owner can delete org resumes
    if (
      orgCtx?.orgId &&
      resume.organizationId === orgCtx.orgId &&
      orgCtx.role &&
      hasMinimumRole(orgCtx.role, "admin")
    ) {
      return await Resume.findByIdAndDelete(id);
    }

    throw new Error("Access denied: You do not have permission to delete this resume");
  }

  /**
   * Generate PDF for a resume.
   */
  async generatePdf(id: string, userId: string, orgCtx?: OrgContext) {
    const resume = await this.findById(id, userId, orgCtx);
    if (!resume) {
      throw new Error("Resume not found");
    }
    return await generatePdfService(resume);
  }
}

export const resumeService = new ResumeService();
