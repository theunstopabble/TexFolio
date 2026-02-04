import mongoose, { Document, Schema, Types } from "mongoose";

// Sub-document interfaces
interface IExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string[];
  location?: string;
}

interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  location?: string;
}

interface IProject {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string; // Keeping for backward compatibility
  sourceCode?: string; // New field
  liveUrl?: string; // New field
}

interface ISkillCategory {
  category: string;
  skills: string[];
}

interface ICertification {
  name: string;
  issuer?: string;
  date?: string;
}

// Main Resume interface
export interface IResume extends Document {
  userId: string;
  title: string;
  templateId: string;
  customization?: {
    primaryColor: string;
    fontFamily?: string;
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
  summary?: string;
  experience: IExperience[];
  education: IEducation[];
  projects: IProject[];
  skills: ISkillCategory[];
  certifications: ICertification[];
  languages: string[];
  atsScore?: number;
  isPublic: boolean;
  shareId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const experienceSchema = new Schema<IExperience>(
  {
    company: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    description: [{ type: String }],
    location: { type: String },
  },
  { _id: false },
);

const educationSchema = new Schema<IEducation>(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    gpa: { type: String },
    location: { type: String },
  },
  { _id: false },
);

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    technologies: [{ type: String }],
    link: { type: String },
    github: { type: String },
    sourceCode: { type: String },
    liveUrl: { type: String },
  },
  { _id: false },
);

const skillCategorySchema = new Schema<ISkillCategory>(
  {
    category: { type: String, required: true },
    skills: [{ type: String }],
  },
  { _id: false },
);

const certificationSchema = new Schema<ICertification>(
  {
    name: { type: String, required: true },
    issuer: { type: String },
    date: { type: String },
  },
  { _id: false },
);

// Main Resume schema
const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Resume title is required"],
      default: "My Resume",
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    templateId: {
      type: String,
      default: "classic",
    },
    sectionOrder: {
      type: [String],
      default: [
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
      ],
    },
    customization: {
      primaryColor: { type: String, default: "#2563EB" }, // Default Blue
      fontFamily: { type: String, default: "serif" }, // serif | sans
    },
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      location: { type: String, required: true },
      linkedin: { type: String },
      github: { type: String },
      portfolio: { type: String },
    },
    summary: { type: String, maxlength: 2000 },
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    skills: [skillCategorySchema],
    certifications: [certificationSchema],
    languages: [{ type: String }],
    atsScore: { type: Number, min: 0, max: 100 },
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
  },
);

// Index for faster user resume queries
resumeSchema.index({ userId: 1, createdAt: -1 });

// Create and export the model
export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
