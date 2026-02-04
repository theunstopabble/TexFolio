export interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Skill {
  category: string;
  skills: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  sourceCode?: string;
  liveUrl?: string;
}

export interface Certification {
  name: string;
  issuer: string;
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
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

export interface ATSAnalysisResult {
  score: number;
  summary: string;
  keywords_found: string[];
  keywords_missing: string[];
  formatting_issues: string[];
  suggestions: string[];
}
