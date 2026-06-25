import type { UseFormRegister, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { ResumeFormData } from "../../types";

interface ExperienceSectionProps {
  register: UseFormRegister<ResumeFormData>;
  expFields: FieldArrayWithId<ResumeFormData, "experience", "id">[];
  appendExp: UseFieldArrayAppend<ResumeFormData, "experience">;
  removeExp: UseFieldArrayRemove;
}

export const ExperienceSection = ({
  register,
  expFields,
  appendExp,
  removeExp,
}: ExperienceSectionProps) => (
  <div className="card shadow-lg p-6 bg-white rounded-xl">
    <div className="flex justify-between items-center mb-4">
      <h2 className="card-title text-xl font-bold">💼 Experience</h2>
      <button
        type="button"
        onClick={() =>
          appendExp({
            company: "",
            position: "",
            location: "",
            startDate: "",
            endDate: "",
            description: [],
          })
        }
        className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
      >
        {" "}
        + Add Job{" "}
      </button>
    </div>
    <div className="space-y-6">
      {expFields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium text-slate-700">
              Experience #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeExp(index)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor={`exp-company-${index}`} className="sr-only">Company</label>
              <input
                id={`exp-company-${index}`}
                {...register(`experience.${index}.company`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company"
              />
            </div>
            <div>
              <label htmlFor={`exp-position-${index}`} className="sr-only">Position</label>
              <input
                id={`exp-position-${index}`}
                {...register(`experience.${index}.position`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Position"
              />
            </div>
            <div>
              <label htmlFor={`exp-location-${index}`} className="sr-only">Location</label>
              <input
                id={`exp-location-${index}`}
                {...register(`experience.${index}.location`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Location"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`exp-start-${index}`} className="sr-only">Start Date</label>
                <input
                  id={`exp-start-${index}`}
                  {...register(`experience.${index}.startDate`)}
                  className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
              </div>
              <div>
                <label htmlFor={`exp-end-${index}`} className="sr-only">End Date</label>
                <input
                  id={`exp-end-${index}`}
                  {...register(`experience.${index}.endDate`)}
                  className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>
            </div>
          </div>
          <label htmlFor={`exp-desc-${index}`} className="sr-only">Description</label>
          <textarea
            id={`exp-desc-${index}`}
            {...register(
              `experience.${index}.description` as `experience.${number}.description`,
            )}
            className="form-input w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            placeholder="Description (bullets will be split by new line)"
          />
        </div>
      ))}
      {expFields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No experience added yet.
        </p>
      )}
    </div>
  </div>
);
