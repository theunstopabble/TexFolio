import type { UseFormRegister, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface CertificationsStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "certifications", "id">;
}

const CertificationsStep: React.FC<CertificationsStepProps> = ({ register, fieldArray }) => (
  <div className="card animate-fade-in shadow-lg">
    <div className="flex justify-between items-center mb-6">
      <h2 className="card-title">🏆 Certifications</h2>
      <button
        type="button"
        onClick={() =>
          fieldArray.append({ name: "", issuer: "" })
        }
        className="btn btn-secondary text-sm"
      >
        + Add
      </button>
    </div>
    <div className="space-y-4">
      {fieldArray.fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-slate-700">
              Cert #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => fieldArray.remove(index)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input
              {...register(`certifications.${index}.name`)}
              className="form-input"
              placeholder="Certification Name"
            />
            <input
              {...register(`certifications.${index}.issuer`)}
              className="form-input"
              placeholder="Issuer"
            />
          </div>
        </div>
      ))}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No certifications added yet.
        </p>
      )}
    </div>
  </div>
);

export default CertificationsStep;
