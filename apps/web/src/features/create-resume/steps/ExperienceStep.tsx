import { CARD_CLASS, HEADING_ROW_CLASS, ERROR_CLASS } from "../../resume-editor/components/sections/formStyles";
import type { UseFormRegister, UseFieldArrayReturn, FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";
import { requireIfStarted } from "../entryValidation";

interface ExperienceStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "experience", "id">;
  errors: FieldErrors<ResumeFormData>;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({
  register,
  fieldArray,
  errors,
}) => (
  <div className={`${CARD_CLASS} animate-fade-in`}>
    <div className="flex justify-between items-center mb-6">
      <h2 className={HEADING_ROW_CLASS}>💼 Experience</h2>
      <button
        type="button"
        onClick={() =>
          fieldArray.append({
            company: "",
            position: "",
            location: "",
            startDate: "",
            endDate: "",
            description: [""],
            isCurrent: false,
          })
        }
        className="btn btn-secondary text-sm"
      >
        + Add Experience
      </button>
    </div>
    <div className="space-y-6">
      {fieldArray.fields.map((field, index) => {
        const company = errors.experience?.[index]?.company;
        const position = errors.experience?.[index]?.position;
        return (
          <div
            key={field.id}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex justify-between mb-4">
              <span className="font-semibold text-slate-700">
                Experience #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => fieldArray.remove(index)}
                className="text-red-600 hover:text-red-700 text-sm font-medium p-1 -m-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Remove
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <input
                  id={`crt-exp-company-${index}`}
                  {...register(`experience.${index}.company`, {
                    validate: requireIfStarted(
                      "experience",
                      index,
                      "Company name is required",
                    ),
                  })}
                  className="form-input"
                  placeholder="Company Name"
                  aria-invalid={!!company || undefined}
                  aria-describedby={
                    company ? `crt-exp-company-${index}-err` : undefined
                  }
                />
                {company && (
                  <p
                    id={`crt-exp-company-${index}-err`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {company.message || "Company name is required"}
                  </p>
                )}
              </div>
              <div>
                <input
                  id={`crt-exp-position-${index}`}
                  {...register(`experience.${index}.position`, {
                    validate: requireIfStarted(
                      "experience",
                      index,
                      "Position is required",
                    ),
                  })}
                  className="form-input"
                  placeholder="Job Title"
                  aria-invalid={!!position || undefined}
                  aria-describedby={
                    position ? `crt-exp-position-${index}-err` : undefined
                  }
                />
                {position && (
                  <p
                    id={`crt-exp-position-${index}-err`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {position.message || "Position is required"}
                  </p>
                )}
              </div>
              <input
                {...register(`experience.${index}.location`)}
                className="form-input"
                placeholder="Location"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`crt-exp-start-${index}`}
                    className="text-xs text-slate-500"
                  >
                    Start Date
                  </label>
                  <input
                    id={`crt-exp-start-${index}`}
                    type="month"
                    {...register(`experience.${index}.startDate`)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`crt-exp-end-${index}`}
                    className="text-xs text-slate-500"
                  >
                    End Date
                  </label>
                  <input
                    id={`crt-exp-end-${index}`}
                    type="month"
                    {...register(`experience.${index}.endDate`)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            <textarea
              {...register(
                `experience.${index}.description` as `experience.${number}.description`,
              )}
              className="form-textarea min-h-[100px] mt-3"
              placeholder="Description (Bullet points recommended, one per line)"
            />
          </div>
        );
      })}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No experience added yet.
        </p>
      )}
    </div>
  </div>
);

export default ExperienceStep;
