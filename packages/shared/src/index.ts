// Main entry point for @texfolio/shared package
// Zod Schemas are the single source of truth — use inferred types from schemas.
// Legacy types/ directory is deprecated and no longer re-exported.

// Zod Schemas (single source of truth)
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
  type PersonalInfo,
  type Experience,
  type Education,
  type Project,
  type SkillCategory,
  type Certification,
  type Resume,
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
  type PaginationParams,
  type GenerateResumeRequest,
  type GenerateResumeResponse,
  type ATSScoreResult,
  type ATSCheckRequest,
} from "./schemas/index.js";
