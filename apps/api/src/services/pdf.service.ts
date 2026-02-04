import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import Mustache from "mustache";
import { IResume } from "../models/index.js";
import { fileURLToPath } from "url";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec for async/await
const execAsync = promisify(exec);

// Path to pdflatex
// In Docker/Linux, it's typically in /usr/bin/pdflatex which is in global PATH.
// On Local Windows, use the specified path.
const IS_WINDOWS = process.platform === "win32";
const PDFLATEX_PATH = IS_WINDOWS
  ? "C:\\Users\\gauta\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe"
  : "pdflatex";

// Templates directory
const TEMPLATES_DIR = path.join(__dirname, "../templates");

// Temp directory for generated files
const TEMP_DIR = path.join(__dirname, "../../temp");

// Escape special LaTeX characters
const escapeLatex = (text: string): string => {
  if (!text) return "";

  // First decode any weird encodings and HTML entities
  let decoded = text
    // Fix various URL-like encodings for forward slash (case insensitive, all variations)
    .replace(/0x2F;?/gi, "/")
    .replace(/x2F;?/gi, "/")
    .replace(/%2F/gi, "/")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/gi, "/")
    .replace(/\u002F/g, "/")
    // Fix HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  // Double-check for any remaining weird patterns
  decoded = decoded.replace(/x2F/gi, "/");

  // Then escape for LaTeX
  return decoded
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
};

// Transform resume data to template variables
const transformResumeData = (resume: IResume) => {
  // Default Blue (#2563EB) if not set
  const primaryColor = resume.customization?.primaryColor || "#2563EB";
  const primaryColorHex = primaryColor.replace("#", ""); // LaTeX xcolor HTML model needs "RRGGBB"

  // Font Family
  const fontFamily = resume.customization?.fontFamily || "serif";
  const isSans = fontFamily === "sans";

  // Section Data Builders
  const buildExperience = () => ({
    IS_EXPERIENCE: true,
    TITLE: "Experience",
    EXPERIENCE: resume.experience?.map((exp) => ({
      COMPANY: escapeLatex(exp.company),
      POSITION: escapeLatex(exp.position),
      LOCATION: escapeLatex(exp.location || ""),
      START_DATE: escapeLatex(exp.startDate),
      END_DATE: escapeLatex(exp.endDate),
      DESCRIPTION: exp.description?.map((d) => escapeLatex(d)) || [],
    })),
  });

  const buildEducation = () => ({
    IS_EDUCATION: true,
    TITLE: "Education",
    EDUCATION: resume.education?.map((edu) => ({
      INSTITUTION: escapeLatex(edu.institution),
      DEGREE: escapeLatex(edu.degree),
      FIELD: escapeLatex(edu.field),
      LOCATION: escapeLatex(edu.location || ""),
      START_DATE: escapeLatex(edu.startDate),
      END_DATE: escapeLatex(edu.endDate),
      GPA: edu.gpa ? escapeLatex(edu.gpa) : null,
    })),
  });

  const buildSkills = () => ({
    IS_SKILLS: true,
    TITLE: "Technical Skills",
    SKILLS: resume.skills?.map((skill) => ({
      CATEGORY: escapeLatex(skill.category),
      SKILLS_LIST: escapeLatex(
        Array.isArray(skill.skills) ? skill.skills.join(", ") : skill.skills,
      ),
    })),
  });

  const buildProjects = () => ({
    IS_PROJECTS: true,
    TITLE: "Projects",
    PROJECTS: resume.projects?.map((proj) => ({
      NAME: escapeLatex(proj.name),
      DESCRIPTION: proj.description ? escapeLatex(proj.description) : null,
      TECHNOLOGIES: escapeLatex(
        Array.isArray(proj.technologies)
          ? proj.technologies.join(", ")
          : proj.technologies,
      ),
      SOURCE_CODE: proj.sourceCode || null,
      LIVE_URL: proj.liveUrl || null,
    })),
  });

  const buildCertifications = () => ({
    IS_CERTIFICATIONS: true,
    TITLE: "Certifications",
    CERTIFICATIONS: resume.certifications?.map((cert) => ({
      NAME: escapeLatex(cert.name),
      ISSUER: cert.issuer ? escapeLatex(cert.issuer) : null,
    })),
  });

  const buildSummary = () => ({
    IS_SUMMARY: true,
    TITLE: "Professional Summary",
    SUMMARY: resume.summary ? escapeLatex(resume.summary) : null,
  });

  // Default Order
  const defaultOrder = [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ];
  const order =
    resume.sectionOrder && resume.sectionOrder.length > 0
      ? resume.sectionOrder
      : defaultOrder;

  const dynamicSections: any[] = [];

  order.forEach((section) => {
    switch (section) {
      case "summary":
        if (resume.summary) dynamicSections.push(buildSummary());
        break;
      case "experience":
        if (resume.experience?.length) dynamicSections.push(buildExperience());
        break;
      case "education":
        if (resume.education?.length) dynamicSections.push(buildEducation());
        break;
      case "skills":
        if (resume.skills?.length) dynamicSections.push(buildSkills());
        break;
      case "projects":
        if (resume.projects?.length) dynamicSections.push(buildProjects());
        break;
      case "certifications":
        if (resume.certifications?.length)
          dynamicSections.push(buildCertifications());
        break;
    }
  });

  return {
    PRIMARY_COLOR: primaryColorHex,
    IS_SANS: isSans,
    FULL_NAME: escapeLatex(resume.personalInfo.fullName),
    EMAIL: escapeLatex(resume.personalInfo.email),
    EMAIL_RAW: resume.personalInfo.email, // Raw email for mailto:
    PHONE: escapeLatex(resume.personalInfo.phone),
    LOCATION: escapeLatex(resume.personalInfo.location),
    LINKEDIN: resume.personalInfo.linkedin || null, // Raw URL for href
    GITHUB: resume.personalInfo.github || null, // Raw URL for href

    // Dynamic Sections
    DYNAMIC_SECTIONS: dynamicSections,
  };
};

// Generate PDF from resume
export const generatePDF = async (
  resume: IResume,
  templateId: string = "classic",
): Promise<string> => {
  // Ensure temp directory exists
  await fs.mkdir(TEMP_DIR, { recursive: true });

  // Use resume's templateId if available, otherwise use parameter
  const template_id = resume.templateId || templateId;

  // Read template
  const templatePath = path.join(TEMPLATES_DIR, `${template_id}.tex`);
  const template = await fs.readFile(templatePath, "utf-8");

  // Transform data and render template
  const data = transformResumeData(resume);
  const renderedLatex = Mustache.render(template, data, {}, ["<<", ">>"]);

  // Generate unique filename
  const timestamp = Date.now();
  const texFilename = `resume_${timestamp}.tex`;
  const pdfFilename = `resume_${timestamp}.pdf`;
  const texFile = path.join(TEMP_DIR, texFilename);
  const pdfFile = path.join(TEMP_DIR, pdfFilename);

  // Write rendered LaTeX to file
  await fs.writeFile(texFile, renderedLatex);

  try {
    const useDocker = process.env.USE_DOCKER_LATEX === "true";

    if (useDocker) {
      console.log("🐳 Generating PDF using Docker (texfolio-latex)...");
      try {
        // Execute inside the container
        // Container working dir is /app/temp, which maps to TEMP_DIR
        await execAsync(
          `docker exec texfolio-latex pdflatex -interaction=nonstopmode ${texFilename}`,
        );
      } catch (error: any) {
        console.warn("Docker pdflatex warning:", error.message);
        // Continue to check if PDF was created
      }
    } else {
      console.log("🖥️ Generating PDF using local pdflatex...");
      // Compile LaTeX to PDF (local)
      try {
        await execAsync(
          `"${PDFLATEX_PATH}" -interaction=nonstopmode -output-directory="${TEMP_DIR}" "${texFile}"`,
          { cwd: TEMP_DIR },
        );
      } catch {
        // pdflatex may return non-zero exit code even on success (warnings)
      }
    }

    // Check if PDF was created
    await fs.access(pdfFile);

    // Clean up auxiliary files
    const auxFiles = [".aux", ".log", ".out", ".tex"];
    for (const ext of auxFiles) {
      try {
        await fs.unlink(path.join(TEMP_DIR, `resume_${timestamp}${ext}`));
      } catch {
        // Ignore if file doesn't exist
      }
    }

    return pdfFile;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error}`);
  }
};
