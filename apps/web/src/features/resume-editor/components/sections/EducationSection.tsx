import type { UseFormRegister, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { ResumeFormData } from "../../types";

interface EducationSectionProps {
  register: UseFormRegister<ResumeFormData>;
  eduFields: FieldArrayWithId<ResumeFormData, "education", "id">[];
  appendEdu: UseFieldArrayAppend<ResumeFormData, "education">;
  removeEdu: UseFieldArrayRemove;
}

export const EducationSection = ({
  register,
  eduFields,
  appendEdu,
  removeEdu,
}: EducationSectionProps) => (
  <div className="card shadow-lg p-6 bg-white rounded-xl">
    <div className="flex justify-between items-center mb-4">
      <h2 className="card-title text-xl font-bold">🎓 Education</h2>
      <button
        type="button"
        onClick={() =>
          appendEdu({
            institution: "",
            degree: "",
            field: "",
            location: "",
            startDate: "",
            endDate: "",
          })
        }
        className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
      >
        {" "}
        + Add Education{" "}
      </button>
    </div>
    <div className="space-y-6">
      {eduFields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium text-slate-700">
              Education #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEdu(index)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`edu-institution-${index}`} className="sr-only">Institution</label>
              <input
                id={`edu-institution-${index}`}
                {...register(`education.${index}.institution`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Institution"
              />
            </div>
            <div>
              <label htmlFor={`edu-degree-${index}`} className="sr-only">Degree</label>
              <input
                id={`edu-degree-${index}`}
                {...register(`education.${index}.degree`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Degree"
              />
            </div>
            <div>
              <label htmlFor={`edu-field-${index}`} className="sr-only">Field of Study</label>
              <input
                id={`edu-field-${index}`}
                {...register(`education.${index}.field`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Field of Study"
              />
            </div>
            <div>
              <label htmlFor={`edu-location-${index}`} className="sr-only">Location</label>
              <input
                id={`edu-location-${index}`}
                {...register(`education.${index}.location`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Location"
              />
            </div>
            <div>
              <label htmlFor={`edu-start-${index}`} className="sr-only">Start Date</label>
              <input
                id={`edu-start-${index}`}
                {...register(`education.${index}.startDate`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start Date"
              />
            </div>
            <div>
              <label htmlFor={`edu-end-${index}`} className="sr-only">End Date</label>
              <input
                id={`edu-end-${index}`}
                {...register(`education.${index}.endDate`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      ))}
      {eduFields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No education added yet.
        </p>
      )}
    </div>
  </div>
);
