import type { UseFormRegister, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { ResumeFormData } from "../../types";

interface ProjectsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  projFields: FieldArrayWithId<ResumeFormData, "projects", "id">[];
  appendProj: UseFieldArrayAppend<ResumeFormData, "projects">;
  removeProj: UseFieldArrayRemove;
}

export const ProjectsSection = ({
  register,
  projFields,
  appendProj,
  removeProj,
}: ProjectsSectionProps) => (
  <div className="card shadow-lg p-6 bg-white rounded-xl">
    <div className="flex justify-between items-center mb-4">
      <h2 className="card-title text-xl font-bold">🚀 Projects</h2>
      <button
        type="button"
        onClick={() =>
          appendProj({ name: "", description: "", technologies: [] })
        }
        className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
      >
        {" "}
        + Add Project{" "}
      </button>
    </div>
    <div className="space-y-6">
      {projFields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium text-slate-700">
              Project #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeProj(index)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor={`proj-name-${index}`} className="sr-only">Project Name</label>
              <input
                id={`proj-name-${index}`}
                {...register(`projects.${index}.name`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Project Name"
              />
            </div>
            <div>
              <label htmlFor={`proj-tech-${index}`} className="sr-only">Technologies</label>
              <input
                id={`proj-tech-${index}`}
                {...register(
                  `projects.${index}.technologies` as `projects.${number}.technologies`
                )}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Technologies (comma separated)"
              />
            </div>
            <div>
              <label htmlFor={`proj-source-${index}`} className="sr-only">Source Code URL</label>
              <input
                id={`proj-source-${index}`}
                {...register(`projects.${index}.sourceCode`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Source Code URL"
              />
            </div>
            <div>
              <label htmlFor={`proj-live-${index}`} className="sr-only">Live Demo URL</label>
              <input
                id={`proj-live-${index}`}
                {...register(`projects.${index}.liveUrl`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Live Demo URL"
              />
            </div>
          </div>
          <label htmlFor={`proj-desc-${index}`} className="sr-only">Project Description</label>
          <textarea
            id={`proj-desc-${index}`}
            {...register(`projects.${index}.description`)}
            className="form-input w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
            placeholder="Project Description"
          />
        </div>
      ))}
      {projFields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No projects added yet.
        </p>
      )}
    </div>
  </div>
);
