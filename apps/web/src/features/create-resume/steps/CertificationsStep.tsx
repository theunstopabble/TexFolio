import { CARD_CLASS, HEADING_ROW_CLASS, ERROR_CLASS } from "../../resume-editor/components/sections/formStyles";
import type { UseFormRegister, UseFieldArrayReturn, FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";
import { requireIfStarted } from "../entryValidation";

interface CertificationsStepProps {
  register: UseFormRegister<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "certifications", "id">;
  errors: FieldErrors<ResumeFormData>;
}

const CertificationsStep: React.FC<CertificationsStepProps> = ({
  register,
  fieldArray,
  errors,
}) => (
  <div className={`${CARD_CLASS} animate-fade-in`}>
    <div className="flex justify-between items-center mb-6">
      <h2 className={HEADING_ROW_CLASS}>🏆 Certifications</h2>
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
      {fieldArray.fields.map((field, index) => {
        const name = errors.certifications?.[index]?.name;
        return (
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
                className="text-red-600 hover:text-red-700 text-sm font-medium p-1 -m-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <input
                  id={`crt-cert-name-${index}`}
                  {...register(`certifications.${index}.name`, {
                    validate: requireIfStarted(
                      "certifications",
                      index,
                      "Certification name is required",
                    ),
                  })}
                  className="form-input"
                  placeholder="Certification Name"
                  aria-invalid={!!name || undefined}
                  aria-describedby={
                    name ? `crt-cert-name-${index}-err` : undefined
                  }
                />
                {name && (
                  <p
                    id={`crt-cert-name-${index}-err`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {name.message || "Certification name is required"}
                  </p>
                )}
              </div>
              <input
                {...register(`certifications.${index}.issuer`)}
                className="form-input"
                placeholder="Issuer"
              />
            </div>
          </div>
        );
      })}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No certifications added yet.
        </p>
      )}
    </div>
  </div>
);

export default CertificationsStep;
