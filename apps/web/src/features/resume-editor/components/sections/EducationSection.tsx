import type {
  UseFormRegister,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldErrors,
} from "react-hook-form";
import type { ResumeFormData } from "../../types";
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
  TIP_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  ERROR_CLASS,
  inputError,
} from "./formStyles";

interface EducationSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  eduFields: FieldArrayWithId<ResumeFormData, "education", "id">[];
  appendEdu: UseFieldArrayAppend<ResumeFormData, "education">;
  removeEdu: UseFieldArrayRemove;
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

const fieldOfStudyKeywords = [
  "computer science", "engineering", "mathematics", "business", "management",
  "psychology", "design", "architecture", "arts", "humanities", "science", "technology",
];

export const EducationSection = ({
  register,
  errors,
  eduFields,
  appendEdu,
  removeEdu,
}: EducationSectionProps) => {
  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <div className={CARD_CLASS}>
        <h2 className={HEADING_CLASS}>🎓 Education</h2>

        <div className={BODY_CLASS}>
          <div className={ADD_ROW_CLASS}>
            <button
              type="button"
              onClick={() =>
                appendEdu({ institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "" })
              }
              className={ADD_BTN_CLASS}
            >
              + Add Education
            </button>
          </div>

          <div className={ENTRY_LIST_CLASS}>
            {eduFields.map((field, index) => {
              const institutionInvalid = !!errors.education?.[index]?.institution;
              const degreeInvalid = !!errors.education?.[index]?.degree;
              const studyFieldInvalid = !!errors.education?.[index]?.field;
              return (
                <div
                  key={field.id}
                  className={ENTRY_CARD_CLASS}
                  role="group"
                  aria-label={`Education entry ${index + 1}`}
                >
                  <div className={ENTRY_GRID_CLASS}>
                    {/* Spans both columns: with 7 fields a plain first cell left
                        a one-item orphan row at the bottom. Spanning it yields
                        3 full pairs below and puts the date range together. */}
                    <div className="lg:col-span-2">
                      <label htmlFor={`edu-institution-${index}`} className={LABEL_CLASS}>
                        Institution
                      </label>
                      <input
                        id={`edu-institution-${index}`}
                        {...register(`education.${index}.institution`, {
                          required: "Institution name is required",
                        })}
                        className={inputError(INPUT_CLASS, institutionInvalid)}
                        placeholder="e.g. University of California, Berkeley"
                        aria-invalid={institutionInvalid || undefined}
                        aria-describedby={
                          institutionInvalid ? `edu-institution-${index}-error` : undefined
                        }
                      />
                      {institutionInvalid && (
                        <p
                          id={`edu-institution-${index}-error`}
                          role="alert"
                          className={ERROR_CLASS}
                        >
                          {errors.education?.[index]?.institution?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`edu-degree-${index}`} className={LABEL_CLASS}>
                        Degree
                      </label>
                      <input
                        id={`edu-degree-${index}`}
                        list={`edu-degree-list-${index}`}
                        {...register(`education.${index}.degree`, {
                          required: "Degree is required",
                        })}
                        className={inputError(INPUT_CLASS, degreeInvalid)}
                        placeholder="e.g. B.Tech, B.S., M.S."
                        aria-invalid={degreeInvalid || undefined}
                        aria-describedby={
                          degreeInvalid ? `edu-degree-${index}-error` : undefined
                        }
                      />
                      <datalist id={`edu-degree-list-${index}`}>
                        {degreeTypes.map((dt, i) => (
                          <option key={i} value={dt} />
                        ))}
                      </datalist>
                      {degreeInvalid && (
                        <p
                          id={`edu-degree-${index}-error`}
                          role="alert"
                          className={ERROR_CLASS}
                        >
                          {errors.education?.[index]?.degree?.message || "Degree is required"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`edu-field-${index}`} className={LABEL_CLASS}>
                        Field of Study
                      </label>
                      <input
                        id={`edu-field-${index}`}
                        {...register(`education.${index}.field`, {
                          required: "Field of study is required",
                        })}
                        className={inputError(INPUT_CLASS, studyFieldInvalid)}
                        placeholder="e.g. Computer Science"
                        aria-invalid={studyFieldInvalid || undefined}
                        aria-describedby={
                          studyFieldInvalid ? `edu-field-${index}-error` : undefined
                        }
                      />
                      {studyFieldInvalid && (
                        <p
                          id={`edu-field-${index}-error`}
                          role="alert"
                          className={ERROR_CLASS}
                        >
                          {errors.education?.[index]?.field?.message || "Field of study is required"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`edu-location-${index}`} className={LABEL_CLASS}>
                        Location
                      </label>
                      <input
                        id={`edu-location-${index}`}
                        {...register(`education.${index}.location`)}
                        className={INPUT_CLASS}
                        placeholder="e.g. Berkeley, CA"
                      />
                    </div>

                    <div>
                      <label htmlFor={`edu-gpa-${index}`} className={LABEL_CLASS}>
                        GPA / CGPA (Optional)
                      </label>
                      <input
                        id={`edu-gpa-${index}`}
                        {...register(`education.${index}.gpa`)}
                        className={INPUT_CLASS}
                        placeholder="3.5 / 4.0 (Optional)"
                        type="number"
                      />
                    </div>

                    <div>
                      <label htmlFor={`edu-start-${index}`} className={LABEL_CLASS}>
                        Start Date
                      </label>
                      <input
                        id={`edu-start-${index}`}
                        type="month"
                        {...register(`education.${index}.startDate`)}
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      <label htmlFor={`edu-end-${index}`} className={LABEL_CLASS}>
                        End Date
                      </label>
                      <input
                        id={`edu-end-${index}`}
                        type="month"
                        {...register(`education.${index}.endDate`)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {/* Remove + ATS feedback */}
                  <div className={REMOVE_ROW_CLASS}>
                    <button
                      type="button"
                      onClick={() => removeEdu(index)}
                      className={REMOVE_BTN_CLASS}
                      aria-label={`Remove education ${index + 1}`}
                    >
                      Remove
                    </button>
                    {field.field && field.field.length > 0 && (
                      <span>
                        {field.field
                          .split(" ")
                          .filter((w) => fieldOfStudyKeywords.includes(w.toLowerCase())).length > 0
                          ? "✓ ATS-recognized field"
                          : "• Consider adding common field keywords"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {eduFields.length === 0 && (
            <p className={EMPTY_CLASS}>
              No education added yet. Click &quot;+ Add Education&quot; to include
              your academic background.
            </p>
          )}

          <p className={TIP_CLASS}>
            💡 ATS tip: use the degree title the job post expects (e.g. &quot;B.Tech&quot;
            vs &quot;Bachelor of Technology&quot;) — keyword matching is literal.
          </p>
        </div>
      </div>
    </div>
  );
};
