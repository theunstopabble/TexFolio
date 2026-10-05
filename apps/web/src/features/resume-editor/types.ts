import type {
  ATSScoreResult,
  Experience,
  Education,
  SkillCategory,
  Project,
  Certification,
  ProfilePlatform,
} from "@texfolio/shared";

export type ATSAnalysisResult = ATSScoreResult;
export type Skill = SkillCategory;
export type { Experience, Education, Project, Certification };

/**
 * Form-state shape of a developer-platform link. `platform: ""` exists only
 * while a freshly-added row sits unselected — `entryValidation` treats that
 * row as untouched, and both submit paths drop it before the API (whose
 * `ProfileLink.platform` is the strict union) ever sees it.
 */
export interface ProfileLinkEntry {
  platform: ProfilePlatform | "";
  url: string;
  label?: string;
}

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
    portfolio?: string;
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  profileLinks: ProfileLinkEntry[];
}
