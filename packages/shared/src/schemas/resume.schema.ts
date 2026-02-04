import { z } from "zod";

// ============================================
// Personal Information Schema
// ============================================
export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().min(1, "Location is required"),
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
});

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
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  link: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  sourceCode: z.string().url().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
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
  summary: z.string().max(500, "Summary too long").optional(),
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
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Customization = z.infer<typeof customizationSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
