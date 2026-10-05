import type { ResumeFormData } from "../types";
import { toApiPayload } from "./resumePayload";

/**
 * Normalise the editor's form shape into the server's expected AI payload shape.
 *
 * The editor keeps array fields as strings (newline- or comma-separated) for
 * textarea/input binding. The AI endpoints, however, expect the canonical
 * `Resume` shape where:
 *   - `experience[].description` is `string[]`
 *   - `skills[].skills` is `string[]`
 *   - `projects[].technologies` is `string[]`
 *
 * This function is the **single source of truth** for that conversion.
 * It fixes the B5 "double-wrap" bug by returning the *raw* resume object
 * (not wrapped in `{ resumeData: ... }`), which is what the AI endpoints
 * actually expect.
 */
export function normalizeResumeForAI(formState: ResumeFormData): ResumeFormData {
  const payload = toApiPayload(formState);

  // Return the full form state with the three array fields normalised.
  // Other fields (personalInfo, summary, education, certifications, etc.)
  // are already in the correct shape for the API.
  return {
    ...formState,
    ...payload,
  };
}

/**
 * Convenience helper for endpoints that only need the normalised arrays
 * (e.g. `/ai/ats-check` with an optional job description).
 */
export function normalizeForATSCheck(
  formState: ResumeFormData,
  jobDescription?: string,
): { resumeData: ResumeFormData; jobDescription?: string } {
  return {
    resumeData: normalizeResumeForAI(formState),
    jobDescription,
  };
}

/**
 * Convenience helper for `/ai/cover-letter`.
 */
export function normalizeForCoverLetter(
  formState: ResumeFormData,
  jobDescription: string,
  jobTitle?: string,
  company?: string,
): { resume: ResumeFormData; jobDescription: string; jobTitle?: string; company?: string } {
  return {
    resume: normalizeResumeForAI(formState),
    jobDescription,
    jobTitle,
    company,
  };
}

/**
 * Convenience helper for `/agents/coach` and `/agents/quick-score`.
 */
export function normalizeForAgent(
  formState: ResumeFormData,
  jobDescription?: string,
): { resumeData: ResumeFormData; jobDescription?: string } {
  return {
    resumeData: normalizeResumeForAI(formState),
    jobDescription,
  };
}