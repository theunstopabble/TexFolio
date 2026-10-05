import { CARD_CLASS, HEADING_ROW_CLASS, ERROR_CLASS } from "../../resume-editor/components/sections/formStyles";
import type { UseFormRegister, UseFieldArrayReturn, FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";
import { requireIfStarted } from "../entryValidation";

interface EducationStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "education", "id">;
  errors: FieldErrors<ResumeFormData>;
}

const degreeTypes = [
  "Bachelor of Technology (B.Tech)",
  "Bachelor of Engineering (B.E.)",
  "Bachelor of Science (B.S.)",
  "Bachelor of Arts (B.A.)",
  "Bachelor of Computer Applications (BCA)",
  "Master of Technology (M.Tech)",
  "Master of Science (M.S.)",
  "Master of Computer Applications (MCA)",
  "Master of Business Administration (MBA)",
  "Doctor of Philosophy (Ph.D.)",
  "Associate Degree",
  "Diploma",
  "High School / Secondary",
];

const EducationStep: React.FC<EducationStepProps> = ({
  register,
  fieldArray,
  errors,
}) => (
  <div className={`${CARD_CLASS} animate-fade-in`}>
    <div className="flex justify-between items-center mb-6">
      <h2 className={HEADING_ROW_CLASS}>🎓 Education</h2>
      <button
        type="button"
        onClick={() =>
          fieldArray.append({
            institution: "",
            degree: "",
            field: "",
            location: "",
            startDate: "",
            endDate: "",
          })
        }
        className="btn btn-secondary text-sm"
      >
        + Add Education
      </button>
    </div>
    <div className="space-y-6">
      {fieldArray.fields.map((field, index) => {
        const institution = errors.education?.[index]?.institution;
        const degree = errors.education?.[index]?.degree;
        const studyField = errors.education?.[index]?.field;
        return (
          <div
            key={field.id}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex justify-between mb-4">
              <span className="font-semibold text-slate-700">
                Education #{index + 1}
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
                  id={`crt-edu-inst-${index}`}
                  {...register(`education.${index}.institution`, {
                    validate: requireIfStarted(
                      "education",
                      index,
                      "Institution is required",
                    ),
                  })}
                  className="form-input"
                  placeholder="Institution / University"
                  aria-invalid={!!institution || undefined}
                  aria-describedby={
                    institution ? `crt-edu-inst-${index}-err` : undefined
                  }
                />
                {institution && (
                  <p
                    id={`crt-edu-inst-${index}-err`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {institution.message || "Institution is required"}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    id={`crt-edu-degree-${index}`}
                    list={`crt-edu-degree-list-${index}`}
                    {...register(`education.${index}.degree`, {
                      validate: requireIfStarted(
                        "education",
                        index,
                        "Degree is required",
                      ),
                    })}
                    className="form-input"
                    placeholder="Degree (e.g. B.Tech, B.S., M.S.)"
                    aria-invalid={!!degree || undefined}
                    aria-describedby={
                      degree ? `crt-edu-degree-${index}-err` : undefined
                    }
                  />
                  <datalist id={`crt-edu-degree-list-${index}`}>
                    {degreeTypes.map((dt, i) => (
                      <option key={i} value={dt} />
                    ))}
                  </datalist>
                  {degree && (
                    <p
                      id={`crt-edu-degree-${index}-err`}
                      role="alert"
                      className={ERROR_CLASS}
                    >
                      {degree.message || "Degree is required"}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    id={`crt-edu-field-${index}`}
                    {...register(`education.${index}.field`, {
                      validate: requireIfStarted(
                        "education",
                        index,
                        "Field of study is required",
                      ),
                    })}
                    className="form-input"
                    placeholder="Field of Study"
                    aria-invalid={!!studyField || undefined}
                    aria-describedby={
                      studyField ? `crt-edu-field-${index}-err` : undefined
                    }
                  />
                  {studyField && (
                    <p
                      id={`crt-edu-field-${index}-err`}
                      role="alert"
                      className={ERROR_CLASS}
                    >
                      {studyField.message || "Field of study is required"}
                    </p>
                  )}
                </div>
              </div>
              <input
                {...register(`education.${index}.location`)}
                className="form-input"
                placeholder="Location"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`crt-edu-start-${index}`}
                    className="text-xs text-slate-500"
                  >
                    Start Date
                  </label>
                  <input
                    id={`crt-edu-start-${index}`}
                    type="month"
                    {...register(`education.${index}.startDate`)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`crt-edu-end-${index}`}
                    className="text-xs text-slate-500"
                  >
                    End Date
                  </label>
                  <input
                    id={`crt-edu-end-${index}`}
                    type="month"
                    {...register(`education.${index}.endDate`)}
                    className="form-input"
                  />
                </div>
              </div>
              <input
                {...register(`education.${index}.gpa`)}
                className="form-input"
                placeholder="GPA / CGPA (Optional)"
              />
            </div>
          </div>
        );
      })}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No education added yet.
        </p>
      )}
    </div>
  </div>
);

export default EducationStep;
