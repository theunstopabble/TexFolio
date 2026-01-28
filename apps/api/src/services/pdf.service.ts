import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Mustache from 'mustache';
import { IResume } from '../models/index.js';
import { fileURLToPath } from 'url';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec for async/await
const execAsync = promisify(exec);

// Path to pdflatex (your MiKTeX installation)
const PDFLATEX_PATH = 'C:\\Users\\gauta\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe';

// Templates directory
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Temp directory for generated files
const TEMP_DIR = path.join(__dirname, '../../temp');

// Escape special LaTeX characters
const escapeLatex = (text: string): string => {
  if (!text) return '';
  
  // First decode any weird encodings and HTML entities
  let decoded = text
    // Fix various URL-like encodings for forward slash (case insensitive, all variations)
    .replace(/0x2F;?/gi, '/')
    .replace(/x2F;?/gi, '/')
    .replace(/%2F/gi, '/')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/gi, '/')
    .replace(/\u002F/g, '/')
    // Fix HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  
  // Double-check for any remaining weird patterns
  decoded = decoded.replace(/x2F/gi, '/');
  
  // Then escape for LaTeX
  return decoded
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

// Transform resume data to template variables
const transformResumeData = (resume: IResume) => {
  return {
    FULL_NAME: escapeLatex(resume.personalInfo.fullName),
    EMAIL: escapeLatex(resume.personalInfo.email),
    PHONE: escapeLatex(resume.personalInfo.phone),
    LOCATION: escapeLatex(resume.personalInfo.location),
    LINKEDIN: resume.personalInfo.linkedin ? escapeLatex(resume.personalInfo.linkedin) : null,
    GITHUB: resume.personalInfo.github ? escapeLatex(resume.personalInfo.github) : null,
    SUMMARY: resume.summary ? escapeLatex(resume.summary) : null,
    
    HAS_EXPERIENCE: resume.experience && resume.experience.length > 0,
    EXPERIENCE: resume.experience?.map(exp => ({
      COMPANY: escapeLatex(exp.company),
      POSITION: escapeLatex(exp.position),
      LOCATION: escapeLatex(exp.location || ''),
      START_DATE: escapeLatex(exp.startDate),
      END_DATE: escapeLatex(exp.endDate),
      DESCRIPTION: exp.description?.map(d => escapeLatex(d)) || [],
    })),
    
    HAS_EDUCATION: resume.education && resume.education.length > 0,
    EDUCATION: resume.education?.map(edu => ({
      INSTITUTION: escapeLatex(edu.institution),
      DEGREE: escapeLatex(edu.degree),
      FIELD: escapeLatex(edu.field),
      LOCATION: escapeLatex(edu.location || ''),
      START_DATE: escapeLatex(edu.startDate),
      END_DATE: escapeLatex(edu.endDate),
      GPA: edu.gpa ? escapeLatex(edu.gpa) : null,
    })),
    
    HAS_PROJECTS: resume.projects && resume.projects.length > 0,
    PROJECTS: resume.projects?.map(proj => ({
      NAME: escapeLatex(proj.name),
      DESCRIPTION: escapeLatex(proj.description),
      TECHNOLOGIES: escapeLatex(proj.technologies?.join(', ') || ''),
    })),
    
    HAS_SKILLS: resume.skills && resume.skills.length > 0,
    SKILLS: resume.skills?.map(skill => ({
      CATEGORY: escapeLatex(skill.category),
      SKILLS_LIST: escapeLatex(skill.skills?.join(', ') || ''),
    })),
        HAS_CERTIFICATIONS: resume.certifications && resume.certifications.length > 0,
    CERTIFICATIONS: resume.certifications?.map(cert => ({
      NAME: escapeLatex(cert.name),
      ISSUER: cert.issuer ? escapeLatex(cert.issuer) : null,
    })),
  };
};

// Generate PDF from resume
export const generatePDF = async (resume: IResume, templateId: string = 'classic'): Promise<string> => {
  // Ensure temp directory exists
  await fs.mkdir(TEMP_DIR, { recursive: true });
  
  // Use resume's templateId if available, otherwise use parameter
  const template_id = resume.templateId || templateId;
  
  // Read template
  const templatePath = path.join(TEMPLATES_DIR, `${template_id}.tex`);
  const template = await fs.readFile(templatePath, 'utf-8');
  
  // Transform data and render template
  const data = transformResumeData(resume);
  const renderedLatex = Mustache.render(template, data, {}, ['<<', '>>']);
  
  // Generate unique filename
  const timestamp = Date.now();
  const texFile = path.join(TEMP_DIR, `resume_${timestamp}.tex`);
  const pdfFile = path.join(TEMP_DIR, `resume_${timestamp}.pdf`);
  
  // Write rendered LaTeX to file
  await fs.writeFile(texFile, renderedLatex);
  
    try {
    // Compile LaTeX to PDF (ignore exit code, check file instead)
    try {
      await execAsync(
        `"${PDFLATEX_PATH}" -interaction=nonstopmode -output-directory="${TEMP_DIR}" "${texFile}"`,
        { cwd: TEMP_DIR }
      );
    } catch {
      // pdflatex may return non-zero exit code even on success (warnings)
      // We'll check if PDF file exists instead
    }
    
    // Check if PDF was created
    await fs.access(pdfFile);
    
    // Clean up auxiliary files
    const auxFiles = ['.aux', '.log', '.out', '.tex'];
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