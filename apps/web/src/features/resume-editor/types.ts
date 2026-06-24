import type {
  ATSScoreResult,
  Experience,
  Education,
  SkillCategory,
  Project,
  Certification,
} from "@texfolio/shared";

export type ATSAnalysisResult = ATSScoreResult;
export type Skill = SkillCategory;
export type { Experience, Education, Project, Certification };

export interface ResumeFormData {
  title: string;
  templateId: string;
  customization: {
    primaryColor: string;
    fontFamily: string;
  };
  sectionOrder: string[];
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}
