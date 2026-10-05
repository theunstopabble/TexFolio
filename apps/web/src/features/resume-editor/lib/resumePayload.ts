import type { ResumeFormData } from "../types";
import type { Experience, Skill, Project } from "../types";

/**
 * Hard limits — these MUST stay equal to the corresponding rules in
 * `packages/shared/src/schemas/resume.schema.ts`. Keeping them here (instead of
 * per-section literals) is what stops the client counter and the server zod
 * limit from drifting apart, which used to make long summaries fail to save.
 * `resumePayload.test.ts` asserts the parity, so either side moving alone fails.
 */
export const MAX_SUMMARY_CHARS = 1500;
export const MAX_TITLE_CHARS = 100;

/**
 * Experience descriptions: the schema puts no length limit on these, so this is
 * a client-side readability cap only — nothing on the server rejects a longer
 * string. Deliberately *not* a parity constant, despite sitting next to two
 * that are.
 */
export const MAX_DESCRIPTION_CHARS = 2000;

/** Soft guidance only — never enforced. */
export const RECOMMENDED_SUMMARY_CHARS = 600;

type Raw = Record<string, unknown>;

/**
 * Count visible words, so an empty/whitespace-only field reports 0 instead of 1
 * (`"".split(/\s+/)` returns `[""]`).
 */
export const countWords = (text: string | undefined | null): number => {
  const trimmed = (text ?? "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

/** Split a comma/newline separated string (or pass an array through) into a list. */
const splitList = (value: unknown, separator: string): string[] => {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (typeof value === "string") {
    return value
      .split(separator)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

/** Join a list with a separator; existing strings (mid-typing form state) pass through. */
const joinList = (value: unknown, separator: string): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string").join(separator);
  }
  return "";
};

/**
 * Server shape → form shape.
 *
 * The API stores `description`/`skills`/`technologies` as arrays, while the
 * editor binds them to single text fields (newline- or comma-separated).
 * Used for BOTH `reset()` and the saved snapshot, so the two can never drift
 * (the dirty-check compares them as JSON).
 */
export const toFormShapeFromApi = (
  apiResume: Raw,
): Pick<ResumeFormData, "experience" | "education" | "skills" | "projects" | "certifications"> => {
  const experience = Array.isArray(apiResume.experience)
    ? (apiResume.experience as Raw[]).map((exp: Raw) => ({
        ...exp,
        description: joinList(exp.description, "\n"),
      }))
    : [];

  const skills = Array.isArray(apiResume.skills)
    ? (apiResume.skills as Raw[]).map((skill: Raw) => ({
        ...skill,
        skills: joinList(skill.skills, ", "),
      }))
    : [];

  const projects = Array.isArray(apiResume.projects)
    ? (apiResume.projects as Raw[]).map((project: Raw) => ({
        ...project,
        technologies: joinList(project.technologies, ", "),
      }))
    : [];

  return {
    experience: experience as unknown as ResumeFormData["experience"],
    education: (Array.isArray(apiResume.education) ? apiResume.education : []) as unknown as ResumeFormData["education"],
    skills: skills as unknown as ResumeFormData["skills"],
    projects: projects as unknown as ResumeFormData["projects"],
    certifications: (Array.isArray(apiResume.certifications)
      ? apiResume.certifications
      : []) as unknown as ResumeFormData["certifications"],
  };
};

/**
 * Form shape → server shape. Mirrors `toFormShapeFromApi` exactly, which is what
 * makes an untouched load→save round-trip byte-identical.
 */
export const toApiPayload = (
  formData: ResumeFormData,
): Pick<ResumeFormData, "experience" | "skills" | "projects"> => ({
  experience: formData.experience.map((exp: Experience) => ({
    ...exp,
    description: splitList(exp.description, "\n"),
  })) as ResumeFormData["experience"],
  skills: formData.skills.map((skill: Skill) => ({
    category: skill.category,
    skills: splitList(skill.skills, ",") as unknown as string[],
  })) as unknown as ResumeFormData["skills"],
  projects: formData.projects.map((project: Project) => ({
    ...project,
    technologies: splitList(project.technologies, ",") as unknown as string[],
  })) as unknown as ResumeFormData["projects"],
});
