import mongoose, { Document, Schema } from "mongoose";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export const ORG_ROLE_WEIGHT: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function hasMinimumRole(actual: OrgRole, required: OrgRole): boolean {
  return ORG_ROLE_WEIGHT[actual] >= ORG_ROLE_WEIGHT[required];
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  ownerId: string;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
    lockedTemplateId?: string;
  };
  settings?: {
    disableAI?: boolean;
    enforceCompanyFont?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"],
    },
    ownerId: {
      type: String,
      required: [true, "Owner ID is required"],
      index: true,
    },
    branding: {
      primaryColor: { type: String, default: "#2563EB" },
      logoUrl: { type: String },
      lockedTemplateId: { type: String },
    },
    settings: {
      disableAI: { type: Boolean, default: false },
      enforceCompanyFont: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

organizationSchema.index({ slug: 1 });
organizationSchema.index({ ownerId: 1 });

export const Organization = mongoose.model<IOrganization>("Organization", organizationSchema);
