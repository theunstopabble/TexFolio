import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import Mustache from "mustache";
import {
  PLATFORM_META,
  normalizeProfileLink,
  type ProfilePlatform,
} from "@texfolio/shared";
import { IResume } from "../models/index.js";
import { env } from "../config/env.js";
import { fileURLToPath } from "url";

import fsSync from "fs";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to pdflatex
// In Docker/Linux, it's typically in /usr/bin/pdflatex which is in global PATH.
// On Local Windows, configure via PDFLATEX_PATH env var or it defaults to pdflatex in PATH.
const PDFLATEX_PATH = env.PDFLATEX_PATH || "pdflatex";

// Templates directory (handles both src/services and dist/services execution)
const resolveTemplatesDir = (): string => {
  const localDir = path.join(__dirname, "../templates");
  if (fsSync.existsSync(localDir)) return localDir;
  const srcDir = path.join(__dirname, "../../src/templates");
  if (fsSync.existsSync(srcDir)) return srcDir;
  return localDir;
};
const TEMPLATES_DIR = resolveTemplatesDir();

// Temp directory for generated files
const TEMP_DIR = path.join(__dirname, "../../temp");

const escapeLatexSimple = (str: string): string => {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}");
};

// Escape special LaTeX characters (also drops emoji/control chars pdflatex can't render)
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

  // Drop characters pdflatex (utf8 inputenc) cannot render: emoji, symbols,
  // and non-Latin-1 unicode. Allows Latin-1 supplement (é, ü, …) + Latin Extended-A.
  // eslint-disable-next-line no-control-regex -- intentional \u0000 lower bound
  decoded = decoded.replace(/[^\u0000-\u017F]/g, "?");

  // Extract bold formatting tokens: both markdown **text** and \textbf{text}
  const bolds: string[] = [];
  let tokenized = decoded
    .replace(/\\textbf\{([^}]+)\}/g, (_, m) => {
      bolds.push(m);
      return `TOKENBOLD${bolds.length - 1}END`;
    })
    .replace(/\*\*([^*]+)\*\*/g, (_, m) => {
      bolds.push(m);
      return `TOKENBOLD${bolds.length - 1}END`;
    });

  // Extract italic formatting tokens: \textit{text}
  const italics: string[] = [];
  tokenized = tokenized
    .replace(/\\textit\{([^}]+)\}/g, (_, m) => {
      italics.push(m);
      return `TOKENITALIC${italics.length - 1}END`;
    });

  // Then escape for LaTeX
  let escaped = tokenized
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}");

  // Re-inject bold and italic
  bolds.forEach((b, i) => {
    escaped = escaped.replace(`TOKENBOLD${i}END`, `\\textbf{${escapeLatexSimple(b)}}`);
  });
  italics.forEach((it, i) => {
    escaped = escaped.replace(`TOKENITALIC${i}END`, `\\textit{${escapeLatexSimple(it)}}`);
  });

  return escaped;
};

// Escape a URL for use inside \href{...}: strip chars LaTeX can't handle,
// %-encode the ones that break compilation (& % # _ { } ^ ~ and spaces).
const escapeLatexUrl = (url: string): string => {
  if (!url) return "";
  return encodeURI(url)
    .replace(/&/g, "%26")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23");
};

// Some rows (legacy/imported resumes) may hold a comma- or newline-separated
// string where the schema expects an array of strings. Normalise before
// escaping so one odd row can never 500 the whole PDF job.
const toStringList = (value: unknown, separator: string): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(separator)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

// Transform resume data to template variables
const transformResumeData = (resume: IResume) => {
  // Default Blue (#2563EB) if not set
  const primaryColor = resume.customization?.primaryColor || "#2563EB";
  const primaryColorHex = primaryColor.replace("#", ""); // LaTeX xcolor HTML model needs "RRGGBB"

  // Font Family
  const fontFamily = resume.customization?.fontFamily || "serif";
  const isSans = fontFamily === "sans";

  // Guard against missing personalInfo to avoid crash during PDF generation
  const personalInfo = resume.personalInfo ?? {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
  };

  // Section Data Builders
  const buildExperience = () => ({
    IS_EXPERIENCE: true,
    TITLE: "Experience",
    EXPERIENCE: resume.experience?.map((exp) => ({
      COMPANY: escapeLatex(exp.company),
      POSITION: escapeLatex(exp.position),
      LOCATION: escapeLatex(exp.location || ""),
      START_DATE: escapeLatex(exp.startDate || ""),
      END_DATE: escapeLatex(
        exp.isCurrent
          ? "Present"
          : exp.endDate
            ? exp.endDate
            : exp.startDate
              ? "Present"
              : "",
      ),
      DESCRIPTION: toStringList(exp.description, "\n").map((d) => escapeLatex(d)),
    })),
  });

  const buildEducation = () => ({
    IS_EDUCATION: true,
    TITLE: "Education",
    EDUCATION: resume.education?.map((edu) => {
      const gpaRaw = (edu.gpa || "").trim();
      const isCoursework = /^coursework/i.test(gpaRaw);
      const cleanGpa = gpaRaw.replace(/^(gpa|coursework)[:\s]*/i, "");
      return {
        INSTITUTION: escapeLatex(edu.institution),
        DEGREE: escapeLatex(edu.degree),
        FIELD: escapeLatex(edu.field),
        LOCATION: escapeLatex(edu.location || ""),
        START_DATE: escapeLatex(edu.startDate || ""),
        END_DATE: escapeLatex(
          edu.endDate
            ? edu.endDate
            : edu.startDate
              ? "Present"
              : "",
        ),
        GPA: gpaRaw ? escapeLatex(cleanGpa || gpaRaw) : null,
        GPA_LABEL: isCoursework ? "Coursework:" : "GPA:",
      };
    }),
  });

  const buildSkills = () => ({
    IS_SKILLS: true,
    TITLE: "Technical Skills",
    SKILLS: resume.skills?.map((skill) => ({
      CATEGORY: escapeLatex(skill.category),
      SKILLS_LIST: escapeLatex(toStringList(skill.skills, ",").join(", ")),
    })),
  });

  const buildProjects = () => ({
    IS_PROJECTS: true,
    TITLE: "Projects",
    PROJECTS: resume.projects?.map((proj) => {
      const descItems = toStringList(proj.description, "\n").map((d) =>
        escapeLatex(d),
      );
      return {
        NAME: escapeLatex(proj.name),
        DESCRIPTION: proj.description ? escapeLatex(proj.description) : null,
        DESCRIPTION_ITEMS: descItems,
        HAS_DESCRIPTION_ITEMS: descItems.length > 0,
        TECHNOLOGIES: escapeLatex(
          toStringList(proj.technologies, ",").join(", "),
        ),
        SOURCE_CODE: escapeLatexUrl(proj.sourceCode || ""),
        LIVE_URL: escapeLatexUrl(proj.liveUrl || ""),
        HAS_LINKS: Boolean(proj.sourceCode || proj.liveUrl),
      };
    }),
  });

  const buildCertifications = () => ({
    IS_CERTIFICATIONS: true,
    TITLE: "Certifications",
    CERTIFICATIONS: resume.certifications?.map((cert) => ({
      NAME: escapeLatex(cert.name),
      ISSUER: cert.issuer ? escapeLatex(cert.issuer) : null,
      DATE: cert.date ? escapeLatex(cert.date) : null,
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

  // Link rows built once as `{ URL, LABEL }` so every template renders them
  // with the same `\href` shape — no per-template link maths to drift.
  const profileLinks = (resume.profileLinks ?? [])
    .filter((link) => Boolean(link.platform && link.url))
    .map((link) => {
      const platform = link.platform as ProfilePlatform;
      const url = normalizeProfileLink(platform, link.url);
      if (!url) return null;
      return {
        URL: ensureUrlPrefix(escapeLatexUrl(url)),
        LABEL: escapeLatex(link.label || (PLATFORM_META[platform]?.label ?? platform)),
      };
    })
    .filter((link): link is { URL: string; LABEL: string } => link !== null);

  const linkedinUrl = ensureUrlPrefix(
    escapeLatexUrl(normalizeProfileLink("linkedin", personalInfo.linkedin || "")),
  );
  const linkedinDisplay = cleanUrlForDisplay(
    escapeLatex(normalizeProfileLink("linkedin", personalInfo.linkedin || "")),
  );
  const githubUrl = ensureUrlPrefix(
    escapeLatexUrl(normalizeProfileLink("github", personalInfo.github || "")),
  );
  const githubDisplay = cleanUrlForDisplay(
    escapeLatex(normalizeProfileLink("github", personalInfo.github || "")),
  );
  const portfolioUrl = ensureUrlPrefix(
    escapeLatexUrl(normalizeProfileLink("portfolio", personalInfo.portfolio || "")),
  );
  const portfolioDisplay = cleanUrlForDisplay(
    escapeLatex(normalizeProfileLink("portfolio", personalInfo.portfolio || "")),
  );

  const secondaryLinks: { URL: string; DISPLAY: string; SEPARATOR: string }[] = [];
  if (linkedinDisplay && linkedinUrl) {
    secondaryLinks.push({
      URL: linkedinUrl,
      DISPLAY: linkedinDisplay,
      SEPARATOR: "",
    });
  }
  if (githubDisplay && githubUrl) {
    secondaryLinks.push({
      URL: githubUrl,
      DISPLAY: githubDisplay,
      SEPARATOR: secondaryLinks.length > 0 ? " $|$ " : "",
    });
  }
  if (portfolioDisplay && portfolioUrl) {
    secondaryLinks.push({
      URL: portfolioUrl,
      DISPLAY: portfolioDisplay,
      SEPARATOR: secondaryLinks.length > 0 ? " $|$ " : "",
    });
  }
  profileLinks.forEach((link) => {
    secondaryLinks.push({
      URL: link.URL,
      DISPLAY: link.LABEL,
      SEPARATOR: secondaryLinks.length > 0 ? " $|$ " : "",
    });
  });

  return {
    PRIMARY_COLOR: primaryColorHex,
    IS_SANS: isSans,
    FULL_NAME: escapeLatex(personalInfo.fullName),
    RESUME_TITLE: escapeLatex(resume.title || "").replace(
      /\s*\|\s*/g,
      " $\\mid$ ",
    ),
    EMAIL: escapeLatex(personalInfo.email),
    EMAIL_RAW: escapeLatexUrl(personalInfo.email), // Raw email for mailto:
    PHONE: escapeLatex(personalInfo.phone),
    PHONE_RAW: escapeLatexUrl((personalInfo.phone || "").replace(/\s+/g, "")),
    LOCATION: escapeLatex(personalInfo.location),
    LINKEDIN: linkedinUrl,
    LINKEDIN_DISPLAY: linkedinDisplay,
    GITHUB: githubUrl,
    GITHUB_DISPLAY: githubDisplay,
    PORTFOLIO: portfolioUrl,
    PORTFOLIO_DISPLAY: portfolioDisplay,
    SECONDARY_LINKS: secondaryLinks,
    HAS_SECONDARY_LINKS: secondaryLinks.length > 0,
    // LeetCode, CodeChef, … — normalised username → canonical URL
    PROFILE_LINKS: profileLinks,

    // Dynamic Sections
    DYNAMIC_SECTIONS: dynamicSections,
  };
};

// Generate PDF from resume
export const generatePDF = async (
  resume: IResume,
  templateId: string = "classic",
  orgBranding?: {
    lockedTemplateId?: string;
    primaryColor?: string;
    enforceCompanyFont?: boolean;
  },
): Promise<string> => {
  // Ensure temp directory exists
  await fs.mkdir(TEMP_DIR, { recursive: true });

  // Resolve template: org-locked template takes precedence
  const effectiveTemplateId =
    orgBranding?.lockedTemplateId || resume.templateId || templateId;
  // Prevent path traversal: only allow alphanumeric, hyphen, underscore
  const template_id = path
    .basename(effectiveTemplateId)
    .replace(/[^a-zA-Z0-9_-]/g, "");
  if (!template_id) {
    throw new Error("Invalid template ID");
  }

  // Read template
  const templatePath = path.join(TEMPLATES_DIR, `${template_id}.tex`);
  const template = await fs.readFile(templatePath, "utf-8");

  // Apply org branding overrides before transforming
  const brandedResume = { ...resume };
  if (orgBranding?.primaryColor || orgBranding?.enforceCompanyFont) {
    brandedResume.customization = {
      primaryColor: "#2563EB",
      ...brandedResume.customization,
      ...(orgBranding?.primaryColor && { primaryColor: orgBranding.primaryColor }),
      ...(orgBranding?.enforceCompanyFont && { fontFamily: "sans" as const }),
    };
  }

  // Transform data and render template
  const data = transformResumeData(brandedResume as IResume);
  console.log(`Template: ${template_id}, Sections: ${JSON.stringify(data.DYNAMIC_SECTIONS?.length || 0)} sections, Name: ${data.FULL_NAME}`);
  const renderedLatex = Mustache.render(template, data, {}, ["<<", ">>"]);
  console.log(`Rendered LaTeX length: ${renderedLatex.length} chars`);

  // Generate unique filename (UUID prevents collisions between concurrent generations)
  const uuid = randomUUID();
  const texFilename = `resume_${uuid}.tex`;
  const pdfFilename = `resume_${uuid}.pdf`;
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
    const useDocker = (env.USE_DOCKER_LATEX ?? process.env.USE_DOCKER_LATEX) === "true";

    // SECURITY FIX: Use spawn instead of exec to prevent command injection
    console.log(
      useDocker
        ? "🐳 Generating PDF using Docker (texfolio-latex)..."
        : "🖥️ Generating PDF using local pdflatex...",
    );

    const pdflatexPromise = new Promise<void>((resolve, reject) => {
      let childProcess: ReturnType<typeof spawn>;

      if (useDocker) {
        // Sanitize filename - only allow alphanumeric, underscore, hyphen, dot
        const sanitizedFilename = texFilename.replace(/[^a-zA-Z0-9._-]/g, "");
        if (sanitizedFilename !== texFilename) {
          reject(new Error("Invalid filename detected"));
          return;
        }
        childProcess = spawn(
          "docker",
          [
            "exec",
            "texfolio-latex",
            "pdflatex",
            "-interaction=nonstopmode",
            sanitizedFilename,
          ],
          {
            cwd: TEMP_DIR,
          },
        );
      } else {
        childProcess = spawn(
          PDFLATEX_PATH,
          [
            "-interaction=nonstopmode",
            "-output-directory",
            TEMP_DIR,
            texFilename, // Use basename since output-dir is set
          ],
          {
            cwd: TEMP_DIR,
            env: { ...process.env, TEXINPUTS: `${TEMPLATES_DIR}:` },
          },
        );
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
          else {
            // Log full output for debugging blank PDFs
            console.error(`pdflatex exit code ${code}:`);
            console.error("STDOUT (last 2000):", stdout.slice(-2000));
            console.error("STDERR (last 1000):", stderr.slice(-1000));
            reject(
              new Error(
                `pdflatex exited with code ${code}. Stderr: ${stderr.slice(-500)}`,
              ),
            );
          }
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
      console.log("pdflatex completed successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("pdflatex warning:", message);
      try {
        await fs.access(pdfFile);
        console.log("PDF exists despite pdflatex warning, continuing");
      } catch {
        throw new Error(
          `LaTeX compile failed and no PDF was produced: ${message}`,
        );
      }
    }

    // Check if PDF was created and has content
    const pdfStats = await fs.stat(pdfFile);
    console.log(`PDF generated: ${pdfStats.size} bytes at ${pdfFile}`);
    if (pdfStats.size < 500) {
      // PDF is suspiciously small — likely corrupted or blank
      // Run pdflatex a second time to resolve cross-references (common fix)
      console.warn(`PDF too small (${pdfStats.size} bytes), running pdflatex second pass...`);
      try {
        const secondPassPromise = new Promise<void>((resolve, reject) => {
          const childProcess2 = spawn(
            PDFLATEX_PATH,
            [
              "-interaction=nonstopmode",
              "-output-directory",
              TEMP_DIR,
              texFilename,
            ],
            {
              cwd: TEMP_DIR,
              env: { ...process.env, TEXINPUTS: `${TEMPLATES_DIR}:` },
            },
          );
          let settled2 = false;
          const timer2 = setTimeout(() => {
            if (!settled2) { settled2 = true; childProcess2.kill("SIGKILL"); reject(new Error("Second pass timed out")); }
          }, 60000);
          childProcess2.on("close", () => {
            if (!settled2) { settled2 = true; clearTimeout(timer2); resolve(); }
          });
          childProcess2.on("error", (err) => {
            if (!settled2) { settled2 = true; clearTimeout(timer2); reject(err); }
          });
        });
        await secondPassPromise;
      } catch (e) {
        console.warn("Second pass failed:", e);
      }
    }

    await fs.access(pdfFile);

    // Clean up auxiliary files
    const auxFiles = [".aux", ".log", ".out", ".tex"];
    for (const ext of auxFiles) {
      try {
        await fs.unlink(path.join(TEMP_DIR, `resume_${uuid}${ext}`));
      } catch {
        // Ignore if file doesn't exist
      }
    }

    return pdfFile;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error}`);
  }
};
