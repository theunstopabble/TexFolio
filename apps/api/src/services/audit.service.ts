import { AuditLog } from "../models/audit-log.model.js";
import type { IAuditLog } from "../models/audit-log.model.js";

interface LogEntry {
  actorId: string;
  action: IAuditLog["action"];
  resourceType: IAuditLog["resourceType"];
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
}

export class AuditService {
  /**
   * Create a single audit log entry.
   * Fails silently to avoid breaking business logic on audit write failure.
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      // Strip sensitive fields from before/after snapshots
      const sanitizeSnapshot = (snapshot?: Record<string, unknown>): Record<string, unknown> | undefined => {
        if (!snapshot || typeof snapshot !== "object") return snapshot;
        const clone = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
        const sensitiveKeys = ["password", "token", "secret", "apiKey", "creditCard", "cvv"];
        for (const key of sensitiveKeys) {
          if (key in clone) {
            clone[key] = "[REDACTED]";
          }
        }
        return clone;
      };

      await AuditLog.create({
        ...entry,
        before: sanitizeSnapshot(entry.before),
        after: sanitizeSnapshot(entry.after),
      });
    } catch (err) {
      // Audit logging must never break the main transaction
      console.error("Audit log write failed:", err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Query audit logs for an actor (user).
   * Supports pagination and filtering by action/resource.
   */
  async query(
    actorId: string,
    options: {
      action?: IAuditLog["action"];
      resourceType?: IAuditLog["resourceType"];
      resourceId?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ logs: IAuditLog[]; total: number }> {
    const {
      action,
      resourceType,
      resourceId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
    } = options;

    const query: Record<string, unknown> = { actorId };
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) (query.createdAt as Record<string, Date>).$gte = startDate;
      if (endDate) (query.createdAt as Record<string, Date>).$lte = endDate;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(Math.min(limit, 100))
        .lean()
        .exec(),
      AuditLog.countDocuments(query).exec(),
    ]);

    return { logs: logs as unknown as IAuditLog[], total };
  }

  /**
   * Get recent activity summary for a user (last 24h).
   */
  async getRecentActivity(actorId: string): Promise<{
    totalActions: number;
    lastActivity: Date | null;
    actionBreakdown: Record<string, number>;
  }> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await AuditLog.find({ actorId, createdAt: { $gte: since } })
      .select("action createdAt")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const actionBreakdown: Record<string, number> = {};
    for (const log of logs) {
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    }

    return {
      totalActions: logs.length,
      lastActivity: logs.length > 0 ? new Date(logs[0].createdAt) : null,
      actionBreakdown,
    };
  }
}

export const auditService = new AuditService();
