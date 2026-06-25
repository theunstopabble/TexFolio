import type { UseFormRegister, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface ProjectsStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "projects", "id">;
}

const ProjectsStep: React.FC<ProjectsStepProps> = ({ register, fieldArray }) => (
  <div className="card animate-fade-in shadow-lg">
    <div className="flex justify-between items-center mb-6">
      <h2 className="card-title">🚀 Notable Projects</h2>
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
      {fieldArray.fields.map((field, index) => (
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
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          <div className="space-y-4">
            <input
              {...register(`projects.${index}.name`)}
              className="form-input"
              placeholder="Project Name"
            />
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
              className="form-input min-h-[80px]"
              placeholder="Brief description of the project..."
            />
          </div>
        </div>
      ))}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No projects added yet.
        </p>
      )}
    </div>
  </div>
);

export default ProjectsStep;
