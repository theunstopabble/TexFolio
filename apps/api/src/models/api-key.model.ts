import mongoose, { Document, Schema } from "mongoose";

export type ApiKeyScope = "read:resumes" | "write:resumes" | "read:analytics" | "admin";

export interface IApiKey extends Document {
  keyHash: string; // SHA-256 hash of the key (the key itself is shown only once on creation)
  name: string;
  userId: string;
  organizationId?: string;
  scopes: ApiKeyScope[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    keyHash: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      index: true,
      sparse: true,
    },
    scopes: {
      type: [String],
      enum: ["read:resumes", "write:resumes", "read:analytics", "admin"],
      required: true,
      default: ["read:resumes"],
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast active key lookups
apiKeySchema.index({ keyHash: 1, revokedAt: 1 });
apiKeySchema.index({ userId: 1, createdAt: -1 });

export const ApiKey = mongoose.model<IApiKey>("ApiKey", apiKeySchema);
