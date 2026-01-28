// Personal information section of the resume
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

// Work experience entry
export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | 'Present';
  description: string[];
  location?: string;
}

// Education entry
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  location?: string;
}

// Project entry
export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
}

// Skill category
export interface SkillCategory {
  category: string;
  skills: string[];
}

// Complete resume structure
export interface Resume {
  id: string;
  userId: string;
  templateId: string;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: SkillCategory[];
  certifications?: string[];
  languages?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ATS Score result from AI analysis
export interface ATSScoreResult {
  overallScore: number;
  breakdown: {
    keywords: number;
    formatting: number;
    sections: number;
    readability: number;
  };
  suggestions: string[];
  missingKeywords: string[];
}