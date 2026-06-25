import type { UseFormRegister, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import type { ResumeFormData } from "../../types";

interface CertificationsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  certFields: FieldArrayWithId<ResumeFormData, "certifications", "id">[];
  appendCert: UseFieldArrayAppend<ResumeFormData, "certifications">;
  removeCert: UseFieldArrayRemove;
}

export const CertificationsSection = ({
  register,
  certFields,
  appendCert,
  removeCert,
}: CertificationsSectionProps) => (
  <div className="card shadow-lg p-6 bg-white rounded-xl">
    <div className="flex justify-between items-center mb-4">
      <h2 className="card-title text-xl font-bold">🏆 Certifications</h2>
      <button
        type="button"
        onClick={() => appendCert({ name: "", issuer: "" })}
        className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
      >
        {" "}
        + Add Cert{" "}
      </button>
    </div>
    <div className="space-y-4">
      {certFields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium text-slate-700">
              Certification #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCert(index)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`cert-name-${index}`} className="sr-only">Certification Name</label>
              <input
                id={`cert-name-${index}`}
                {...register(`certifications.${index}.name`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Certification Name"
              />
            </div>
            <div>
              <label htmlFor={`cert-issuer-${index}`} className="sr-only">Issuer</label>
              <input
                id={`cert-issuer-${index}`}
                {...register(`certifications.${index}.issuer`)}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Issuer Organization"
              />
            </div>
          </div>
        </div>
      ))}
      {certFields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No certifications added.
        </p>
      )}
    </div>
  </div>
);
