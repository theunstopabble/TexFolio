import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

// ============================================
// Resume Form Data Types
// ============================================
interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface Skill {
  category: string;
  skills: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  sourceCode?: string;
  liveUrl?: string;
}

interface Certification {
  name: string;
  issuer: string;
  date?: string;
}

interface Customization {
  primaryColor: string;
  fontFamily: "serif" | "sans";
}

export interface ResumeData {
  _id?: string;
  title: string;
  templateId: string;
  customization: Customization;
  sectionOrder: string[];
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  isPublic?: boolean;
  shareId?: string;
}

// ============================================
// Store State & Actions
// ============================================
interface ResumeState {
  // Current resume being edited
  resume: ResumeData;
  isDirty: boolean;

  // Actions
  setResume: (resume: ResumeData) => void;
  updateField: <K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K],
  ) => void;
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;
  updateCustomization: (field: keyof Customization, value: string) => void;
  setSectionOrder: (order: string[]) => void;

  // Array field actions
  addExperience: (exp: Experience) => void;
  updateExperience: (index: number, exp: Experience) => void;
  removeExperience: (index: number) => void;

  addEducation: (edu: Education) => void;
  updateEducation: (index: number, edu: Education) => void;
  removeEducation: (index: number) => void;

  addSkill: (skill: Skill) => void;
  updateSkill: (index: number, skill: Skill) => void;
  removeSkill: (index: number) => void;

  addProject: (project: Project) => void;
  updateProject: (index: number, project: Project) => void;
  removeProject: (index: number) => void;

  addCertification: (cert: Certification) => void;
  updateCertification: (index: number, cert: Certification) => void;
  removeCertification: (index: number) => void;

  // Utility
  resetResume: () => void;
  markClean: () => void;
}

// ============================================
// Default Resume State
// ============================================
const defaultResume: ResumeData = {
  title: "My Resume",
  templateId: "classic",
  customization: {
    primaryColor: "#2563EB",
    fontFamily: "serif",
  },
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ],
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

// ============================================
// Zustand Store
// ============================================
export const useResumeStore = create<ResumeState>()(
  devtools(
    persist(
      (set) => ({
        resume: defaultResume,
        isDirty: false,

        setResume: (resume) => set({ resume, isDirty: false }),

        updateField: (field, value) =>
          set((state) => ({
            resume: { ...state.resume, [field]: value },
            isDirty: true,
          })),

        updatePersonalInfo: (field, value) =>
          set((state) => ({
            resume: {
              ...state.resume,
              personalInfo: { ...state.resume.personalInfo, [field]: value },
            },
            isDirty: true,
          })),

        updateCustomization: (field, value) =>
          set((state) => ({
            resume: {
              ...state.resume,
              customization: { ...state.resume.customization, [field]: value },
            },
            isDirty: true,
          })),

        setSectionOrder: (order) =>
          set((state) => ({
            resume: { ...state.resume, sectionOrder: order },
            isDirty: true,
          })),

        // Experience
        addExperience: (exp) =>
          set((state) => ({
            resume: {
              ...state.resume,
              experience: [...state.resume.experience, exp],
            },
            isDirty: true,
          })),
        updateExperience: (index, exp) =>
          set((state) => ({
            resume: {
              ...state.resume,
              experience: state.resume.experience.map((e, i) =>
                i === index ? exp : e,
              ),
            },
            isDirty: true,
          })),
        removeExperience: (index) =>
          set((state) => ({
            resume: {
              ...state.resume,
              experience: state.resume.experience.filter((_, i) => i !== index),
            },
            isDirty: true,
          })),

        // Education
        addEducation: (edu) =>
          set((state) => ({
            resume: {
              ...state.resume,
              education: [...state.resume.education, edu],
            },
            isDirty: true,
          })),
        updateEducation: (index, edu) =>
          set((state) => ({
            resume: {
              ...state.resume,
              education: state.resume.education.map((e, i) =>
                i === index ? edu : e,
              ),
            },
            isDirty: true,
          })),
        removeEducation: (index) =>
          set((state) => ({
            resume: {
              ...state.resume,
              education: state.resume.education.filter((_, i) => i !== index),
            },
            isDirty: true,
          })),

        // Skills
        addSkill: (skill) =>
          set((state) => ({
            resume: {
              ...state.resume,
              skills: [...state.resume.skills, skill],
            },
            isDirty: true,
          })),
        updateSkill: (index, skill) =>
          set((state) => ({
            resume: {
              ...state.resume,
              skills: state.resume.skills.map((s, i) =>
                i === index ? skill : s,
              ),
            },
            isDirty: true,
          })),
        removeSkill: (index) =>
          set((state) => ({
            resume: {
              ...state.resume,
              skills: state.resume.skills.filter((_, i) => i !== index),
            },
            isDirty: true,
          })),

        // Projects
        addProject: (project) =>
          set((state) => ({
            resume: {
              ...state.resume,
              projects: [...state.resume.projects, project],
            },
            isDirty: true,
          })),
        updateProject: (index, project) =>
          set((state) => ({
            resume: {
              ...state.resume,
              projects: state.resume.projects.map((p, i) =>
                i === index ? project : p,
              ),
            },
            isDirty: true,
          })),
        removeProject: (index) =>
          set((state) => ({
            resume: {
              ...state.resume,
              projects: state.resume.projects.filter((_, i) => i !== index),
            },
            isDirty: true,
          })),

        // Certifications
        addCertification: (cert) =>
          set((state) => ({
            resume: {
              ...state.resume,
              certifications: [...state.resume.certifications, cert],
            },
            isDirty: true,
          })),
        updateCertification: (index, cert) =>
          set((state) => ({
            resume: {
              ...state.resume,
              certifications: state.resume.certifications.map((c, i) =>
                i === index ? cert : c,
              ),
            },
            isDirty: true,
          })),
        removeCertification: (index) =>
          set((state) => ({
            resume: {
              ...state.resume,
              certifications: state.resume.certifications.filter(
                (_, i) => i !== index,
              ),
            },
            isDirty: true,
          })),

        // Utility
        resetResume: () => set({ resume: defaultResume, isDirty: false }),
        markClean: () => set({ isDirty: false }),
      }),
      {
        name: "texfolio-resume-store",
        partialize: (state) => ({ resume: state.resume }), // Only persist resume data
      },
    ),
    { name: "ResumeStore" },
  ),
);
