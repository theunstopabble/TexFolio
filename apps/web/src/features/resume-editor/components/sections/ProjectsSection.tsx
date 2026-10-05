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
  TEXTAREA_CLASS,
  LABEL_CLASS,
  ERROR_CLASS,
  inputError,
} from "./formStyles";
import TagChips from "../TagChips";

interface ProjectsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  projFields: FieldArrayWithId<ResumeFormData, "projects", "id">[];
  appendProj: UseFieldArrayAppend<ResumeFormData, "projects">;
  removeProj: UseFieldArrayRemove;
}

export const ProjectsSection = ({
  register,
  errors,
  projFields,
  appendProj,
  removeProj,
}: ProjectsSectionProps) => (
  <div className={SECTION_WRAPPER_CLASS}>
    <div className={CARD_CLASS}>
      <h2 className={HEADING_CLASS}>🚀 Projects</h2>

      <div className={BODY_CLASS}>
        {/* Add New Project */}
        <div className={ADD_ROW_CLASS}>
          <button
            type="button"
            onClick={() =>
              appendProj({ name: "", description: "", technologies: [] })
            }
            className={ADD_BTN_CLASS}
          >
            + Add Project
          </button>
        </div>

        {/* Project Entries */}
        <div className={ENTRY_LIST_CLASS}>
          {projFields.map((field, index) => {
            const nameInvalid = !!errors.projects?.[index]?.name;
            return (
              <div
                key={field.id}
                className={ENTRY_CARD_CLASS}
                role="group"
                aria-label={`Project entry ${index + 1}`}
              >
                <div className={ENTRY_GRID_CLASS}>
                  <div>
                    <label htmlFor={`proj-name-${index}`} className={LABEL_CLASS}>
                      Project Name
                    </label>
                    <input
                      id={`proj-name-${index}`}
                      {...register(`projects.${index}.name`, {
                        required: "Project name is required",
                      })}
                      className={inputError(INPUT_CLASS, nameInvalid)}
                      placeholder="e.g. TexFolio"
                      aria-invalid={nameInvalid || undefined}
                      aria-describedby={
                        nameInvalid ? `proj-name-${index}-error` : undefined
                      }
                    />
                    {nameInvalid && (
                      <p
                        id={`proj-name-${index}-error`}
                        role="alert"
                        className={ERROR_CLASS}
                      >
                        {errors.projects?.[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`proj-tech-${index}`} className={LABEL_CLASS}>
                      Technologies (comma separated)
                    </label>
                    <TagChips
                      id={`proj-tech-${index}`}
                      value={Array.isArray(field.technologies)
                        ? field.technologies.join(", ")
                        : field.technologies || ""}
                      onChange={(value) =>
                        register(`projects.${index}.technologies` as `projects.${number}.technologies`).onChange({
                          target: { name: `projects.${index}.technologies`, value },
                        })
                      }
                      suggestions={[
                        "React",
                        "TypeScript",
                        "Node.js",
                        "Python",
                        "Go",
                        "AWS",
                        "Docker",
                        "Kubernetes",
                        "PostgreSQL",
                        "MongoDB",
                        "GraphQL",
                        "REST API",
                        "CI/CD",
                        "Git",
                        "Next.js",
                        "Vue",
                      ]}
                      placeholder="Add technologies (Enter or comma)"
                      ariaDescribedBy={`proj-tech-${index}-help`}
                    />
                  </div>

                  <div>
                    <label htmlFor={`proj-source-${index}`} className={LABEL_CLASS}>
                      Source Code URL
                    </label>
                    <input
                      id={`proj-source-${index}`}
                      {...register(`projects.${index}.sourceCode`)}
                      className={INPUT_CLASS}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <label htmlFor={`proj-live-${index}`} className={LABEL_CLASS}>
                      Live Demo URL
                    </label>
                    <input
                      id={`proj-live-${index}`}
                      {...register(`projects.${index}.liveUrl`)}
                      className={INPUT_CLASS}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor={`proj-desc-${index}`} className={LABEL_CLASS}>
                    Description
                  </label>
                  <textarea
                    id={`proj-desc-${index}`}
                    {...register(`projects.${index}.description`)}
                    className={`${TEXTAREA_CLASS} min-h-[80px]`}
                    rows={3}
                    placeholder="What it does, who uses it, and the measurable outcome."
                  />
                </div>

                {/* Remove */}
                <div className={REMOVE_ROW_CLASS}>
                  <button
                    type="button"
                    onClick={() => removeProj(index)}
                    className={REMOVE_BTN_CLASS}
                    aria-label={`Remove project ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {projFields.length === 0 && (
          <p className={EMPTY_CLASS}>
            No projects added yet. Click &quot;+ Add Project&quot; to showcase your
            work.
          </p>
        )}

        {/* ATS tip */}
        <p className={TIP_CLASS}>
          💡 ATS tip: mirror the exact wording of the job post for your stack (for
          example &quot;Node.js&quot;, &quot;PostgreSQL&quot;) — keyword matching is
          literal.
        </p>
      </div>
    </div>
  </div>
);
