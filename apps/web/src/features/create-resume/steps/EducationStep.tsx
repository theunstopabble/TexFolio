import type { UseFormRegister, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface EducationStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "education", "id">;
}

const EducationStep: React.FC<EducationStepProps> = ({ register, fieldArray }) => (
  <div className="card animate-fade-in shadow-lg">
    <div className="flex justify-between items-center mb-6">
      <h2 className="card-title">🎓 Education</h2>
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
      {fieldArray.fields.map((field, index) => (
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
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          <div className="space-y-3">
            <input
              {...register(`education.${index}.institution`)}
              className="form-input"
              placeholder="Institution / University"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                {...register(`education.${index}.degree`)}
                className="form-input"
                placeholder="Degree"
              />
              <input
                {...register(`education.${index}.field`)}
                className="form-input"
                placeholder="Field of Study"
              />
            </div>
            <input
              {...register(`education.${index}.location`)}
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
                  {...register(`education.${index}.startDate`)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">End Date</label>
                <input
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
      ))}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No education details added yet.
        </p>
      )}
    </div>
  </div>
);

export default EducationStep;
