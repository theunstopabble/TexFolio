import mongoose, { Document, Schema } from "mongoose";
import type { OrgRole } from "./organization.model.js";

export interface IOrganizationMember extends Document {
  organizationId: string;
  userId: string;
  role: OrgRole;
  invitedBy: string;
  status: "active" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: {
      type: String,
      required: [true, "Organization ID is required"],
      index: true,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      required: true,
      default: "viewer",
    },
    invitedBy: {
      type: String,
      required: [true, "Inviter ID is required"],
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast membership lookups
organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationMemberSchema.index({ userId: 1, status: 1 });

export const OrganizationMember = mongoose.model<IOrganizationMember>(
  "OrganizationMember",
  organizationMemberSchema,
);
