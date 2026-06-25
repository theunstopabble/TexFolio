import type { UseFormRegister, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface ExperienceStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "experience", "id">;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({ register, fieldArray }) => (
  <div className="card animate-fade-in shadow-lg">
    <div className="flex justify-between items-center mb-6">
      <h2 className="card-title">💼 Work Experience</h2>
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
          })
        }
        className="btn btn-secondary text-sm"
      >
        + Add Experience
      </button>
    </div>
    <div className="space-y-6">
      {fieldArray.fields.map((field, index) => (
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
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          <div className="space-y-3">
            <input
              {...register(`experience.${index}.company`)}
              className="form-input"
              placeholder="Company Name"
            />
            <input
              {...register(`experience.${index}.position`)}
              className="form-input"
              placeholder="Job Title"
            />
            <input
              {...register(`experience.${index}.location`)}
              className="form-input"
              placeholder="Location"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">
                  Start Date
                </label>
                <input
                  type="month"
                  {...register(`experience.${index}.startDate`)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">End Date</label>
                <input
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
            className="form-input min-h-[100px] mt-3"
            placeholder="Description (Bullet points recommended, one per line)"
          />
        </div>
      ))}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No experience details added yet.
        </p>
      )}
    </div>
  </div>
);

export default ExperienceStep;
