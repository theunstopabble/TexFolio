import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actorId: string; // Clerk user ID
  action: "CREATE" | "UPDATE" | "DELETE" | "READ" | "SHARE" | "EXPORT" | "LOGIN" | "PAYMENT" | "INVITE_MEMBER" | "UPDATE_MEMBER_ROLE" | "REMOVE_MEMBER";
  resourceType: "Resume" | "User" | "Payment" | "Template" | "System" | "Organization";
  resourceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata: {
    requestId: string;
    ip?: string;
    userAgent?: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs?: number;
  };
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "READ", "SHARE", "EXPORT", "LOGIN", "PAYMENT", "INVITE_MEMBER", "UPDATE_MEMBER_ROLE", "REMOVE_MEMBER"],
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["Resume", "User", "Payment", "Template", "System", "Organization"],
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
      sparse: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      requestId: { type: String, required: true, index: true },
      ip: { type: String },
      userAgent: { type: String },
      method: { type: String, required: true },
      path: { type: String, required: true },
      statusCode: { type: Number, required: true },
      durationMs: { type: Number },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for common query patterns
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// TTL: auto-delete logs older than 90 days to prevent unbounded growth
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
