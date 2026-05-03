import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import Mustache from "mustache";
import { IResume } from "../models/index.js";
import { env } from "../config/env.js";
import { fileURLToPath } from "url";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to pdflatex
// In Docker/Linux, it's typically in /usr/bin/pdflatex which is in global PATH.
// On Local Windows, configure via PDFLATEX_PATH env var or it defaults to pdflatex in PATH.
const PDFLATEX_PATH = env.PDFLATEX_PATH || "pdflatex";

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
      START_DATE: escapeLatex(exp.startDate || ""),
      END_DATE: escapeLatex(exp.endDate || ""),
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
      START_DATE: escapeLatex(edu.startDate || ""),
      END_DATE: escapeLatex(edu.endDate || ""),
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

  const dynamicSections: Record<string, unknown>[] = [];

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

  // Helper to clean URL for display (remove https://, http://, www.)
  const cleanUrlForDisplay = (
    url: string | null | undefined,
  ): string | null => {
    if (!url) return null;
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  };

  // Helper to ensure URL has https:// prefix (for hyperref to recognize as URL)
  const ensureUrlPrefix = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return "https://" + url;
  };

  return {
    PRIMARY_COLOR: primaryColorHex,
    IS_SANS: isSans,
    FULL_NAME: escapeLatex(resume.personalInfo.fullName),
    EMAIL: escapeLatex(resume.personalInfo.email),
    EMAIL_RAW: resume.personalInfo.email, // Raw email for mailto:
    PHONE: escapeLatex(resume.personalInfo.phone),
    LOCATION: escapeLatex(resume.personalInfo.location),
    LINKEDIN: ensureUrlPrefix(resume.personalInfo.linkedin), // URL with https:// for href
    LINKEDIN_DISPLAY: cleanUrlForDisplay(resume.personalInfo.linkedin), // Clean URL for display
    GITHUB: ensureUrlPrefix(resume.personalInfo.github), // URL with https:// for href
    GITHUB_DISPLAY: cleanUrlForDisplay(resume.personalInfo.github), // Clean URL for display

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
  const rawTemplateId = resume.templateId || templateId;
  // Prevent path traversal: only allow alphanumeric, hyphen, underscore
  const template_id = path.basename(rawTemplateId).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!template_id) {
    throw new Error("Invalid template ID");
  }

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

  // Copy resume.cls to temp directory if using faangpath template
  if (template_id === "faangpath") {
    const clsSource = path.join(TEMPLATES_DIR, "resume.cls");
    const clsDest = path.join(TEMP_DIR, "resume.cls");
    try {
      await fs.copyFile(clsSource, clsDest);
    } catch (e) {
      console.warn("Could not copy resume.cls:", e);
    }
  }

  try {
    const useDocker = process.env.USE_DOCKER_LATEX === "true";

    // SECURITY FIX: Use spawn instead of exec to prevent command injection
    console.log(useDocker ? "🐳 Generating PDF using Docker (texfolio-latex)..." : "🖥️ Generating PDF using local pdflatex...");
    
    const pdflatexPromise = new Promise<void>((resolve, reject) => {
      let childProcess: ReturnType<typeof spawn>;
      
      if (useDocker) {
        // Sanitize filename - only allow alphanumeric, underscore, hyphen, dot
        const sanitizedFilename = texFilename.replace(/[^a-zA-Z0-9._-]/g, "");
        if (sanitizedFilename !== texFilename) {
          reject(new Error("Invalid filename detected"));
          return;
        }
        childProcess = spawn("docker", ["exec", "texfolio-latex", "pdflatex", "-interaction=nonstopmode", sanitizedFilename], {
          cwd: TEMP_DIR,
        });
      } else {
        childProcess = spawn(PDFLATEX_PATH, [
          "-interaction=nonstopmode",
          "-output-directory",
          TEMP_DIR,
          texFilename, // Use basename since output-dir is set
        ], {
          cwd: TEMP_DIR,
          env: { ...process.env, TEXINPUTS: `${TEMPLATES_DIR}:` },
        });
      }

      const MAX_OUTPUT = 50000; // Cap stdout/stderr to prevent memory exhaustion
      let stdout = "";
      let stderr = "";
      let settled = false;

      childProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
        if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(-MAX_OUTPUT);
      });
      childProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
        if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(-MAX_OUTPUT);
      });

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          childProcess.kill("SIGKILL");
          reject(new Error("PDF generation timed out after 60 seconds"));
        }
      }, 60000);

      childProcess.on("close", (code) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (code === 0) resolve();
          else reject(new Error(`pdflatex exited with code ${code}. Stderr: ${stderr.slice(-500)}`));
        }
      });

      childProcess.on("error", (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
    });

    try {
      await pdflatexPromise;
    } catch (err) {
      console.warn("pdflatex warning:", err instanceof Error ? err.message : String(err));
      // Continue to check if PDF was created (pdflatex may return non-zero even on success)
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
