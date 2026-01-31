import { z } from "zod";

export const resumeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  templateId: z.string().default("classic"),
  personalInfo: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    location: z.string().min(1, "Location is required"),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
  }),
  summary: z.string().max(500).optional(),
  experience: z
    .array(
      z.object({
        company: z.string().min(1, "Company is required"),
        position: z.string().min(1, "Position is required"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.array(z.string()).optional(),
        location: z.string().optional(),
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string().min(1, "Institution is required"),
        degree: z.string().min(1, "Degree is required"),
        field: z.string().min(1, "Field of study is required"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        gpa: z.string().optional(),
        location: z.string().optional(),
      }),
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        technologies: z.array(z.string()).optional(),
        link: z.string().optional(),
        sourceCode: z.string().optional(),
        liveUrl: z.string().optional(),
      }),
    )
    .optional(),
  skills: z
    .array(
      z.object({
        category: z.string().min(1, "Category is required"),
        skills: z.array(z.string()).min(1, "At least one skill is required"),
      }),
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string().min(1, "Certification name is required"),
        issuer: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .optional(),
});

export const updateResumeSchema = resumeSchema.partial();
