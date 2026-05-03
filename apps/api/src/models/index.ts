// Export all models from a single entry point
export { User } from './user.model.js';
export { Resume } from './resume.model.js';
export { AuditLog } from './audit-log.model.js';

// Re-export types (use 'type' keyword for interface exports)
export type { IUser } from './user.model.js';
export type { IResume } from './resume.model.js';
export type { IAuditLog } from './audit-log.model.js';