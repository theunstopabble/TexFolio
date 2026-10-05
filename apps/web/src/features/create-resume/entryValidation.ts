import type { ResumeFormData } from "../resume-editor/types";

/**
 * The repeatable sections the wizard lets a user leave alone.
 */
export type EntryArray = Extract<
  keyof ResumeFormData,
  | "education"
  | "experience"
  | "skills"
  | "projects"
  | "certifications"
  | "profileLinks"
>;

type AnyEntry = Record<string, unknown>;

const asEntry = (value: unknown): AnyEntry =>
  value && typeof value === "object" ? (value as AnyEntry) : {};

const hasText = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

/** Keys `onSubmit` requires before it will send a repeatable entry. */
const REQUIRED: Record<EntryArray, readonly string[]> = {
  education: ["institution", "degree", "field"],
  experience: ["company", "position"],
  skills: ["category"],
  projects: ["name"],
  certifications: ["name"],
  // A half-typed link row would otherwise reach the API and fail zod with a
  // 400; both halves are what makes the entry resolvable to a URL.
  profileLinks: ["platform", "url"],
};

/**
 * An entry counts as "started" once any of its text fields has content or any
 * of its list fields holds a non-blank item.
 *
 * A started entry must be complete before the wizard advances: `onSubmit`
 * drops incomplete entries before the API call, so letting Next pass would
 * push the user to Review with data that is then discarded without a word.
 * Fully blank entries stay skippable — that is how the user says "I have
 * nothing for this section".
 */
export const entryStarted = (entry: unknown): boolean =>
  Object.values(asEntry(entry)).some((value) =>
    typeof value === "string"
      ? value.trim().length > 0
      : Array.isArray(value)
        ? value.some((item) => typeof item === "string" && item.trim().length > 0)
        : false,
  );

/**
 * Every required key has content — the entry survives to the API. Kept here
 * rather than inlined so the Review list and `onSubmit` can never disagree
 * about what the user is about to submit.
 */
export const entryComplete = (array: EntryArray, entry: unknown): boolean => {
  const value = asEntry(entry);
  return REQUIRED[array].every((key) => hasText(value[key]));
};

/** `onSubmit`'s own keep-predicate, hoisted for reuse by Review. */
export const survivingEntries = <T,>(
  array: EntryArray,
  entries: readonly T[],
): T[] => entries.filter((entry) => entryComplete(array, entry));

/**
 * `validate` rule for a required field inside a repeatable entry. RHF hands
 * the whole form value object to the rule as its second argument, so this can
 * see whether the rest of the entry was touched without threading `getValues`
 * through every step.
 */
export const requireIfStarted =
  (array: EntryArray, index: number, message: string) =>
  (value: unknown, formValues: ResumeFormData): true | string => {
    if (!entryStarted(formValues[array]?.[index])) return true;
    return hasText(value) ? true : message;
  };
