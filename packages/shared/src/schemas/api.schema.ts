import { z } from "zod";

// ============================================
// Generic API Response Schema
// ============================================
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// ============================================
// Pagination Schema
// ============================================
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

// ============================================
// Resume Generation Request/Response
// ============================================
export const generateResumeRequestSchema = z.object({
  resumeId: z.string().min(1, "Resume ID is required"),
  templateId: z.string().default("classic"),
  format: z.enum(["pdf", "latex"]).default("pdf"),
});

export const generateResumeResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresAt: z.coerce.date(),
});

// ============================================
// AI/ATS Schemas
// ============================================
export const atsCheckRequestSchema = z.object({
  resumeData: z.record(z.unknown()), // Flexible for resume JSON
  jobDescription: z.string().optional(),
});

export const atsScoreResultSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  keywords_found: z.array(z.string()),
  keywords_missing: z.array(z.string()),
  formatting_issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const aiAnalyzeRequestSchema = z.object({
  resumeData: z.record(z.unknown()),
});

export const aiAnalyzeResponseSchema = z.object({
  atsScore: z.number().min(0).max(100),
  summaryFeedback: z.string(),
  improvements: z.array(
    z.object({
      section: z.string(),
      tip: z.string(),
    }),
  ),
});

export const aiImproveTextRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  type: z.enum(["grammar", "professional"]).default("professional"),
});

export const aiGenerateBulletsRequestSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  skills: z.array(z.string()).optional(),
});

export const aiCoverLetterRequestSchema = z.object({
  resume: z.record(z.unknown()),
  jobDescription: z.string().min(1, "Job description is required"),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
});

// ============================================
// Payment Schemas
// ============================================
export const createOrderRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

export const verifyPaymentRequestSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// ============================================
// Inferred Types
// ============================================
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type GenerateResumeRequest = z.infer<typeof generateResumeRequestSchema>;
export type GenerateResumeResponse = z.infer<
  typeof generateResumeResponseSchema
>;
export type ATSCheckRequest = z.infer<typeof atsCheckRequestSchema>;
export type ATSScoreResult = z.infer<typeof atsScoreResultSchema>;
export type AIAnalyzeRequest = z.infer<typeof aiAnalyzeRequestSchema>;
export type AIAnalyzeResponse = z.infer<typeof aiAnalyzeResponseSchema>;
export type AIImproveTextRequest = z.infer<typeof aiImproveTextRequestSchema>;
export type AIGenerateBulletsRequest = z.infer<
  typeof aiGenerateBulletsRequestSchema
>;
export type AICoverLetterRequest = z.infer<typeof aiCoverLetterRequestSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentRequestSchema>;
