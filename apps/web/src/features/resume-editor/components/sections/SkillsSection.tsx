import type { UseFormRegister, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { ResumeFormData } from "../../types";

interface SkillsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  skillFields: FieldArrayWithId<ResumeFormData, "skills", "id">[];
  appendSkill: UseFieldArrayAppend<ResumeFormData, "skills">;
  removeSkill: UseFieldArrayRemove;
}

export const SkillsSection = ({
  register,
  skillFields,
  appendSkill,
  removeSkill,
}: SkillsSectionProps) => (
  <div className="card shadow-lg p-6 bg-white rounded-xl">
    <div className="flex justify-between items-center mb-4">
      <h2 className="card-title text-xl font-bold">🛠️ Skills</h2>
      <button
        type="button"
        onClick={() => appendSkill({ category: "", skills: [] })}
        className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
      >
        {" "}
        + Add Category{" "}
      </button>
    </div>
    <div className="space-y-4">
      {skillFields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium text-slate-700">
              Skill Category #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`skill-cat-${index}`} className="sr-only">Category</label>
              <input
                id={`skill-cat-${index}`}
                {...register(`skills.${index}.category`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Category (e.g. Languages)"
              />
            </div>
            <div>
              <label htmlFor={`skill-list-${index}`} className="sr-only">Skills</label>
              <input
                id={`skill-list-${index}`}
                {...register(
                  `skills.${index}.skills` as `skills.${number}.skills`
                )}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Skills (comma separated)"
              />
            </div>
          </div>
        </div>
      ))}
      {skillFields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No skills added yet.
        </p>
      )}
    </div>
  </div>
);
