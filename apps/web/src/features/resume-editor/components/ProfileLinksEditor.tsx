import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormGetValues,
  FieldErrors,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import {
  PROFILE_PLATFORMS,
  PLATFORM_META,
  normalizeProfileLink,
} from "@texfolio/shared";
import type { ResumeFormData } from "../types";
import {
  LABEL_CLASS,
  INPUT_CLASS,
  ERROR_CLASS,
  HELP_CLASS,
  inputError,
} from "./sections/formStyles";
import { requireIfStarted } from "../../create-resume/entryValidation";

interface ProfileLinksEditorProps {
  register: UseFormRegister<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  getValues: UseFormGetValues<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  fields: FieldArrayWithId<ResumeFormData, "profileLinks", "id">[];
  append: UseFieldArrayAppend<ResumeFormData, "profileLinks">;
  remove: UseFieldArrayRemove;
}

/**
 * Extra developer-platform handles (LeetCode, CodeChef, Codeforces, …).
 *
 * The input asks for a username; on blur it is expanded to the platform's
 * exact canonical URL in place — the user sees `gautam-kr` become
 * `https://leetcode.com/u/gautam-kr` before moving on, which is what makes the
 * stored link trustworthy. The zod schema runs the same normaliser at write,
 * so an imported or hand-edited value cannot bypass this.
 *
 * Shared by the create wizard's Basics step and the editor's Basic section.
 */
export const ProfileLinksEditor = ({
  register,
  setValue,
  getValues,
  errors,
  fields,
  append,
  remove,
}: ProfileLinksEditorProps) => {
  const normalizeOnBlur = (index: number) => {
    const platform = getValues(`profileLinks.${index}.platform`);
    // No platform yet → nothing to expand the handle into; the row's own
    // "Choose a platform" validation reports it.
    if (!platform) return;
    const path = `profileLinks.${index}.url` as const;
    const raw = getValues(path);
    const normalized = normalizeProfileLink(platform, raw);
    if (normalized !== raw) {
      setValue(path, normalized, { shouldDirty: true });
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <span className={LABEL_CLASS}>
          More profiles{" "}
          <span className="font-normal text-slate-400">
            (LeetCode, CodeChef, Custom, …)
          </span>
        </span>
        <button
          type="button"
          onClick={() => append({ platform: "", url: "" })}
          className="btn btn-secondary text-sm"
        >
          + Add
        </button>
      </div>

      {fields.length === 0 && (
        <p className={HELP_CLASS}>
          Optional — type a username or link and it turns into the real profile link.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => {
          const platform = getValues(`profileLinks.${index}.platform`) || field.platform;
          const isOther = platform === "other";
          const platformError = errors.profileLinks?.[index]?.platform;
          const urlError = errors.profileLinks?.[index]?.url;
          const error = platformError || urlError;
          return (
            <div key={field.id}>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <select
                  id={`crt-plat-${index}`}
                  {...register(`profileLinks.${index}.platform`, {
                    validate: requireIfStarted(
                      "profileLinks",
                      index,
                      "Choose a platform",
                    ),
                    onChange: () => {
                      // Trigger re-render so custom name field appears
                      setValue(`profileLinks.${index}.platform`, getValues(`profileLinks.${index}.platform`), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    },
                  })}
                  className={`form-select sm:w-40 shrink-0 ${
                    inputError(INPUT_CLASS, !!platformError)
                  }`}
                  aria-invalid={platformError ? true : undefined}
                  aria-label="Profile platform"
                >
                  <option value="">Platform…</option>
                  {PROFILE_PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>
                      {PLATFORM_META[plat].label}
                    </option>
                  ))}
                </select>

                {isOther && (
                  <input
                    id={`crt-plat-label-${index}`}
                    type="text"
                    {...register(`profileLinks.${index}.label`)}
                    className="form-input sm:w-36 shrink-0"
                    placeholder="Name (e.g. Medium)"
                    aria-label="Custom platform name"
                  />
                )}

                <input
                  id={`crt-plat-url-${index}`}
                  type="text"
                  {...register(`profileLinks.${index}.url`, {
                    validate: requireIfStarted(
                      "profileLinks",
                      index,
                      "Enter a username or link",
                    ),
                    onBlur: () => normalizeOnBlur(index),
                  })}
                  className={`form-input flex-1 ${
                    inputError(INPUT_CLASS, !!urlError)
                  }`}
                  placeholder={isOther ? "https://your-profile-url.com" : "username (or paste the full link)"}
                  aria-invalid={urlError ? true : undefined}
                  aria-describedby={
                    error ? `crt-plat-${index}-err` : undefined
                  }
                />

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="btn btn-secondary text-red-600 sm:w-auto justify-center shrink-0"
                  aria-label={`Remove profile link ${index + 1}`}
                >
                  Remove
                </button>
              </div>

              {error && (
                <p
                  id={`crt-plat-${index}-err`}
                  role="alert"
                  className={ERROR_CLASS}
                >
                  {platformError?.message || urlError?.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
