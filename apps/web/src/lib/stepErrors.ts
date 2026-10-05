/**
 * Mapping helpers for multi-step forms that keep every step mounted.
 *
 * Inactive steps are hidden with CSS rather than unmounted, because
 * react-hook-form skips validation for a field whose ref has detached — its
 * `validateField` bails with `if (!mount || disabled.has(name)) return {}` —
 * and then *deletes* the stale error. Mounting only the visible step therefore
 * validated a fraction of the payload and shipped the rest unchecked: the API
 * answered 400 with no field ever marked red.
 *
 * Because every step is mounted, a submit can fail on a field the user cannot
 * see, so the caller must reveal the owning step first — focusing a control
 * inside `display:none` is a silent no-op.
 */

/**
 * Dotted paths of every leaf error in react-hook-form's nested `errors` tree:
 * `title`, `personalInfo.email`, `education.0.degree`.
 */
export const errorPaths = (errors: unknown, prefix = ""): string[] => {
  if (errors === null || typeof errors !== "object") return [];
  const paths: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (value === null || typeof value !== "object") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    // A leaf carries `type`/`message`/`types`; a container (nested object or
    // array) carries none of them, so keep descending until one does.
    if ("type" in value || "message" in value || "types" in value) {
      paths.push(path);
    } else {
      paths.push(...errorPaths(value, path));
    }
  }
  return paths;
};

/**
 * Index of the *earliest* step that owns an error, given each step's declared
 * field paths (the wizard passes `STEPS.map((s) => s.fields)`).
 *
 * Matching is by root segment, so an error on `personalInfo.email` is claimed
 * by a step that declares `personalInfo.fullName` — a declaration is a scope,
 * not an exact list of failing inputs. Earliest, not first-by-path: the user
 * then fixes steps in the order they fill them in.
 *
 * Returns `null` when nothing claims it (no errors, or a synthetic `root`
 * error such as a failed server-side cross-field rule).
 */
export const firstErrorStep = (
  errors: unknown,
  stepFields: readonly (readonly string[])[],
): number | null => {
  const roots = new Set(errorPaths(errors).map((path) => path.split(".")[0]));
  if (roots.size === 0) return null;
  for (let step = 0; step < stepFields.length; step++) {
    if (stepFields[step].some((field) => roots.has(field.split(".")[0]))) {
      return step;
    }
  }
  return null;
};
