import type { UseFormRegister, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface SkillsStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "skills", "id">;
}

const SkillsStep: React.FC<SkillsStepProps> = ({ register, fieldArray }) => (
  <div className="card animate-fade-in shadow-lg">
    <div className="flex justify-between items-center mb-6">
      <h2 className="card-title">🛠️ Technical Skills</h2>
      <button
        type="button"
        onClick={() =>
          fieldArray.append({ category: "", skills: [] })
        }
        className="btn btn-secondary text-sm"
      >
        + Add Category
      </button>
    </div>
    <div className="space-y-4">
      {fieldArray.fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-3">
            <span className="font-semibold text-slate-700">
              Skill Group #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => fieldArray.remove(index)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <input
              {...register(`skills.${index}.category`)}
              className="form-input"
              placeholder="Category (e.g. Languages)"
            />
            <input
              {...register(
                `skills.${index}.skills` as `skills.${number}.skills`,
              )}
              className="form-input"
              placeholder="Skills (comma separated)"
            />
          </div>
        </div>
      ))}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No skills added yet.
        </p>
      )}
    </div>
  </div>
);

export default SkillsStep;
