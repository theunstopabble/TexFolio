import { z } from "zod";
import {
  PROFILE_PLATFORMS,
  isHttpUrl,
  isPhone,
  normalizeProfileLink,
  type ProfilePlatform,
} from "../developerLinks.js";

// ============================================
// Personal Information Schema
// ============================================

/**
 * Username-or-link field: stores the canonical URL for the platform, whether
 * the user typed `gautam-kr`, `github.com/gautam-kr` or the full address.
 * The same function the form's blur handler runs, so what the user sees in the
 * input is byte-for-byte what gets stored.
 */
const profileUrlField = (platform: ProfilePlatform, label: string) =>
  z
    .string()
    .optional()
    .transform((value) => normalizeProfileLink(platform, value))
    .refine((value) => value === "" || isHttpUrl(value), {
      message: `${label}: enter a username or a full link`,
    });

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    // Domain part only — `Ada@Example.COM` and `ada@example.com` are the same
    // inbox, and comparisons (auth sync, GDPR export) should not split on case
    // in the part where case does not exist.
    .transform((value) => {
      const at = value.lastIndexOf("@");
      return at === -1
        ? value
        : value.slice(0, at) + value.slice(at).toLowerCase();
    }),
  // Validated, not rewritten: spacing is presentation, the digits are the
  // number. `isPhone` only rejects strings with no phone number in them.
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(isPhone, "Enter a valid phone number (7-15 digits)"),
  location: z.string().min(1, "Location is required"),
  linkedin: profileUrlField("linkedin", "LinkedIn"),
  github: profileUrlField("github", "GitHub"),
  portfolio: profileUrlField("portfolio", "Portfolio"),
});

// ============================================
// Developer platform links (LeetCode, CodeChef, …)
// ============================================
export const profileLinkSchema = z
  .object({
    platform: z.enum(PROFILE_PLATFORMS),
    url: z.string(),
    label: z.string().optional(),
  })
  .superRefine((entry, ctx) => {
    if (!isHttpUrl(normalizeProfileLink(entry.platform, entry.url))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Enter a username or a full link for this platform",
      });
    }
  })
  .transform((entry) => ({
    platform: entry.platform,
    url: normalizeProfileLink(entry.platform, entry.url),
    ...(entry.label && entry.label.trim() ? { label: entry.label.trim() } : {}),
  }));

// ============================================
// Experience Schema
// ============================================
export const experienceSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.array(z.string()).default([]),
  location: z.string().optional(),
  isCurrent: z.boolean().default(false),
});

// ============================================
// Education Schema
// ============================================
export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  location: z.string().optional(),
});

// ============================================
// Project Schema
// ============================================
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  link: z.string().optional().or(z.literal("")),
  github: z.string().optional().or(z.literal("")),
  sourceCode: z.string().optional().or(z.literal("")),
  liveUrl: z.string().optional().or(z.literal("")),
});

// ============================================
// Skill Category Schema
// ============================================
export const skillCategorySchema = z.object({
  category: z.string().min(1, "Category is required"),
  skills: z.array(z.string()).default([]),
});

// ============================================
// Certification Schema
// ============================================
export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

// ============================================
// Customization Schema
// ============================================
export const customizationSchema = z.object({
  primaryColor: z.string().default("#2563EB"),
  fontFamily: z.enum(["serif", "sans"]).default("serif"),
});

// ============================================
// Complete Resume Schema
// ============================================
export const resumeSchema = z.object({
  _id: z.string().optional(), // MongoDB ID (optional for create)
  userId: z.string().min(1, "User ID is required"),
  title: z
    .string()
    .min(1, "Resume title is required")
    .max(100, "Title too long"),
  templateId: z.string().default("classic"),
  customization: customizationSchema.optional(),
  sectionOrder: z
    .array(z.string())
    .default([
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
    ]),
  personalInfo: personalInfoSchema,
  // Extra developer-platform handles (LeetCode, CodeChef, …). Blank entries
  // are filtered client-side before submit; the entry schema rejects any row
  // whose username/link does not resolve to a URL.
  profileLinks: z.array(profileLinkSchema).default([]),
  // 1500 characters (~250 words) is generous enough for a pasted summary while
  // keeping the editor/PDF readable. The UI counter MUST use the same number —
  // a mismatch here is what made long summaries silently fail to save.
  summary: z.string().max(1500, "Summary too long (max 1500 characters)").optional(),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillCategorySchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages: z.array(z.string()).default([]),
  atsScore: z.number().min(0).max(100).optional(),
  isPublic: z.boolean().default(false),
  shareId: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// ============================================
// Create/Update Schemas (without system fields)
// ============================================
export const createResumeSchema = resumeSchema.omit({
  _id: true,
  userId: true, // Will be set from auth context
  atsScore: true,
  shareId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateResumeSchema = createResumeSchema.partial();

// ============================================
// Inferred Types (Single Source of Truth)
// ============================================
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type ProfileLink = z.infer<typeof profileLinkSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Customization = z.infer<typeof customizationSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
