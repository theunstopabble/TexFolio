import { CARD_CLASS, HEADING_ROW_CLASS, ERROR_CLASS } from "../../resume-editor/components/sections/formStyles";
import type { UseFormRegister, UseFieldArrayReturn, FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";
import { requireIfStarted } from "../entryValidation";

interface ProjectsStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "projects", "id">;
  errors: FieldErrors<ResumeFormData>;
}

const ProjectsStep: React.FC<ProjectsStepProps> = ({
  register,
  fieldArray,
  errors,
}) => (
  <div className={`${CARD_CLASS} animate-fade-in`}>
    <div className="flex justify-between items-center mb-6">
      <h2 className={HEADING_ROW_CLASS}>🚀 Projects</h2>
      <button
        type="button"
        onClick={() =>
          fieldArray.append({
            name: "",
            description: "",
            technologies: [],
          })
        }
        className="btn btn-secondary text-sm"
      >
        + Add Project
      </button>
    </div>
    <div className="space-y-6">
      {fieldArray.fields.map((field, index) => {
        const name = errors.projects?.[index]?.name;
        return (
          <div
            key={field.id}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex justify-between mb-3">
              <span className="font-semibold text-slate-700">
                Project #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => fieldArray.remove(index)}
                className="text-red-600 hover:text-red-700 text-sm font-medium p-1 -m-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Remove
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <input
                  id={`crt-project-name-${index}`}
                  {...register(`projects.${index}.name`, {
                    validate: requireIfStarted(
                      "projects",
                      index,
                      "Project name is required",
                    ),
                  })}
                  className="form-input"
                  placeholder="Project Name"
                  aria-invalid={!!name || undefined}
                  aria-describedby={
                    name ? `crt-project-name-${index}-err` : undefined
                  }
                />
                {name && (
                  <p
                    id={`crt-project-name-${index}-err`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {name.message || "Project name is required"}
                  </p>
                )}
              </div>
              <input
                {...register(
                  `projects.${index}.technologies` as `projects.${number}.technologies`,
                )}
                className="form-input"
                placeholder="Technologies (comma separated)"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  {...register(`projects.${index}.sourceCode`)}
                  className="form-input"
                  placeholder="Source Code URL"
                />
                <input
                  {...register(`projects.${index}.liveUrl`)}
                  className="form-input"
                  placeholder="Live Demo URL"
                />
              </div>
              <textarea
                {...register(`projects.${index}.description`)}
                className="form-textarea min-h-[80px]"
                placeholder="Brief description of the project..."
              />
            </div>
          </div>
        );
      })}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No projects added yet.
        </p>
      )}
    </div>
  </div>
);

export default ProjectsStep;
