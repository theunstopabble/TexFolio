import type {
  UseFormRegister,
  UseFormWatch,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldErrors,
} from "react-hook-form";
import type { ResumeFormData } from "../../types";
import { MAX_DESCRIPTION_CHARS } from "../../lib/resumePayload";
import {
  SECTION_WRAPPER_CLASS,
  CARD_CLASS,
  HEADING_CLASS,
  BODY_CLASS,
  ADD_ROW_CLASS,
  ADD_BTN_CLASS,
  ENTRY_LIST_CLASS,
  ENTRY_CARD_CLASS,
  ENTRY_GRID_CLASS,
  REMOVE_ROW_CLASS,
  REMOVE_BTN_CLASS,
  EMPTY_CLASS,
  HELP_CLASS,
  INPUT_CLASS,
  TEXTAREA_CLASS,
  SELECT_CLASS,
  LABEL_CLASS,
  ERROR_CLASS,
  inputError,
} from "./formStyles";

// Helpers for per-bullet ATS hints (advisory only, no limits enforced)
const ACTION_VERBS = [
  "led",
  "built",
  "increased",
  "reduced",
  "shipped",
  "designed",
  "migrated",
  "launched",
  "delivered",
  "optimized",
  "automated",
  "scaled",
  "improved",
  "created",
  "developed",
  "architected",
];

const hasActionVerb = (text: string) =>
  ACTION_VERBS.some((v) => new RegExp(`\\b${v}\\b`, "i").test(text));

const hasMetric = (text: string) =>
  /\d+(\.\d+)?%|\$\d+|\d+[kK]|\d+[mM]|\d{3,}/.test(text);

interface ExperienceSectionProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  expFields: FieldArrayWithId<ResumeFormData, "experience", "id">[];
  appendExp: UseFieldArrayAppend<ResumeFormData, "experience">;
  removeExp: UseFieldArrayRemove;
}

export const ExperienceSection = ({
  register,
  watch,
  errors,
  expFields,
  appendExp,
  removeExp,
}: ExperienceSectionProps) => {
  const experienceValues = watch("experience") as
    | Array<{ description?: string | string[] }>
    | undefined;

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <div className={CARD_CLASS}>
        <h2 className={HEADING_CLASS}>💼 Experience</h2>

        <div className={BODY_CLASS}>
          <div className={ADD_ROW_CLASS}>
            <button
              type="button"
              onClick={() =>
                appendExp({
                  company: "",
                  position: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  description: [],
                  isCurrent: false,
                })
              }
              className={ADD_BTN_CLASS}
            >
              + Add Job
            </button>
          </div>

          <div className={ENTRY_LIST_CLASS}>
            {expFields.map((field, index) => {
              const rawDescription = experienceValues?.[index]?.description;
              const descriptionText = Array.isArray(rawDescription)
                ? rawDescription.join("\n")
                : rawDescription || "";
              const companyInvalid = !!errors.experience?.[index]?.company;
              const positionInvalid = !!errors.experience?.[index]?.position;

              return (
              <div
                key={field.id}
                className={ENTRY_CARD_CLASS}
                role="group"
                aria-label={`Experience entry ${index + 1}`}
              >
                  <div className={ENTRY_GRID_CLASS}>
                    <div>
                      <label htmlFor={`exp-company-${index}`} className={LABEL_CLASS}>
                        Company
                      </label>
                      <input
                        id={`exp-company-${index}`}
                        {...register(`experience.${index}.company`, {
                          required: "Company name is required",
                        })}
                        className={inputError(INPUT_CLASS, companyInvalid)}
                        placeholder="e.g. Google Inc."
                        aria-invalid={companyInvalid || undefined}
                        aria-describedby={
                          companyInvalid ? `exp-company-${index}-error` : undefined
                        }
                      />
                      {companyInvalid && (
                        <p
                          id={`exp-company-${index}-error`}
                          role="alert"
                          className={ERROR_CLASS}
                        >
                          {errors.experience?.[index]?.company?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`exp-position-${index}`} className={LABEL_CLASS}>
                        Position
                      </label>
                      <input
                        id={`exp-position-${index}`}
                        {...register(`experience.${index}.position`, {
                          // Schema requires min(1); without this the field was
                          // validated nowhere and a blank one 400'd on save.
                          required: "Position is required",
                        })}
                        className={inputError(INPUT_CLASS, positionInvalid)}
                        placeholder="e.g. Software Engineer"
                        aria-invalid={positionInvalid || undefined}
                        aria-describedby={
                          positionInvalid ? `exp-position-${index}-error` : undefined
                        }
                      />
                      {positionInvalid && (
                        <p
                          id={`exp-position-${index}-error`}
                          role="alert"
                          className={ERROR_CLASS}
                        >
                          {errors.experience?.[index]?.position?.message || "Position is required"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`exp-location-${index}`} className={LABEL_CLASS}>
                        Location
                      </label>
                      <input
                        id={`exp-location-${index}`}
                        {...register(`experience.${index}.location`)}
                        className={INPUT_CLASS}
                        placeholder="e.g. Mountain View, CA"
                      />
                    </div>

                    {/* Current role sits with Location so the two date fields
                        end up side by side — a date range reads as one unit. */}
                    <div>
                      <label htmlFor={`exp-current-${index}`} className={LABEL_CLASS}>
                        Current Role
                      </label>
                      <select
                        id={`exp-current-${index}`}
                        {...register(`experience.${index}.isCurrent`)}
                        className={SELECT_CLASS}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes, I currently work here</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`exp-start-${index}`} className={LABEL_CLASS}>
                        Start Date
                      </label>
                      <input
                        id={`exp-start-${index}`}
                        type="month"
                        {...register(`experience.${index}.startDate`)}
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      <label htmlFor={`exp-end-${index}`} className={LABEL_CLASS}>
                        End Date
                      </label>
                      <input
                        id={`exp-end-${index}`}
                        type="month"
                        {...register(`experience.${index}.endDate`)}
                        className={INPUT_CLASS}
                        disabled={field.isCurrent}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor={`exp-desc-${index}`} className={LABEL_CLASS}>
                      Description (one bullet per line)
                    </label>
                    <textarea
                      id={`exp-desc-${index}`}
                      {...register(`experience.${index}.description`)}
                      maxLength={MAX_DESCRIPTION_CHARS}
                      className={`${TEXTAREA_CLASS} min-h-[120px]`}
                      rows={4}
                      placeholder={"Enter one bullet point per line. Example:\n• Increased sales by 20% through strategic partnerships\n• Led team of 5 engineers to deliver project on time\n• Reduced operational costs by 15%"}
                    />

                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>
                        {descriptionText.length}/{MAX_DESCRIPTION_CHARS} characters
                      </span>
                      <span>3–6 bullets read best on one page</span>
                    </div>

                    {/* Per-bullet ATS hints (advisory only) */}
                    {descriptionText && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {descriptionText
                          .split("\n")
                          .filter((line) => line.trim().length > 0)
                          .map((line, i) => {
                            const verb = hasActionVerb(line);
                            const metric = hasMetric(line);
                            return verb || metric ? (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                                  verb && metric
                                    ? "bg-emerald-100 text-emerald-700"
                                    : verb
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {verb && "✓ Action verb"}
                                {verb && metric && " • "}
                                {metric && "◆ Metric"}
                              </span>
                            ) : null;
                          })}
                      </div>
                    )}

                    <p className={HELP_CLASS}>
                      💡 ATS tip: Use strong action verbs (Led, Built, Increased,
                      Reduced), quantify results with numbers/percentages, and include
                      industry keywords.
                    </p>
                  </div>

                  <div className={REMOVE_ROW_CLASS}>
                    <button
                      type="button"
                      onClick={() => removeExp(index)}
                      className={REMOVE_BTN_CLASS}
                      aria-label={`Remove job ${index + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {expFields.length === 0 && (
            <p className={EMPTY_CLASS}>
              No experience added yet. Click &quot;+ Add Job&quot; to include your
              work experience.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
