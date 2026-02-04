// Main entry point for @texfolio/shared package
// All exports from this package are re-exported here

// Legacy TypeScript interfaces (for backward compatibility)
export * from "./types/index.js";

// Zod Schemas (new - single source of truth)
// Re-export schemas with explicit names to avoid conflicts
export {
  // Resume Schemas
  personalInfoSchema,
  experienceSchema,
  educationSchema,
  projectSchema,
  skillCategorySchema,
  certificationSchema,
  customizationSchema,
  resumeSchema,
  createResumeSchema,
  updateResumeSchema,
  // API Schemas
  apiResponseSchema,
  paginationParamsSchema,
  paginatedResponseSchema,
  generateResumeRequestSchema,
  generateResumeResponseSchema,
  atsCheckRequestSchema,
  atsScoreResultSchema,
  aiAnalyzeRequestSchema,
  aiAnalyzeResponseSchema,
  aiImproveTextRequestSchema,
  aiGenerateBulletsRequestSchema,
  aiCoverLetterRequestSchema,
  createOrderRequestSchema,
  verifyPaymentRequestSchema,
  // Zod-inferred types (use these for new code)
  type Customization,
  type CreateResumeInput,
  type UpdateResumeInput,
  type AIAnalyzeRequest,
  type AIAnalyzeResponse,
  type AIImproveTextRequest,
  type AIGenerateBulletsRequest,
  type AICoverLetterRequest,
  type CreateOrderRequest,
  type VerifyPaymentRequest,
} from "./schemas/index.js";
