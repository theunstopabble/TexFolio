import type {
  UseFormRegister,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldErrors,
} from "react-hook-form";
import type { ResumeFormData } from "../../types";
import {
  SECTION_WRAPPER_CLASS,
  CARD_CLASS,
  HEADING_CLASS,
  BODY_CLASS,
  ADD_ROW_CLASS,
  ADD_BTN_CLASS,
  ENTRY_LIST_CLASS,
  ENTRY_CARD_CLASS,
  ENTRY_GRID_CLASS,
  REMOVE_ROW_CLASS,
  REMOVE_BTN_CLASS,
  EMPTY_CLASS,
  TIP_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  ERROR_CLASS,
  inputError,
} from "./formStyles";

interface CertificationsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  certFields: FieldArrayWithId<ResumeFormData, "certifications", "id">[];
  appendCert: UseFieldArrayAppend<ResumeFormData, "certifications">;
  removeCert: UseFieldArrayRemove;
}

export const CertificationsSection = ({
  register,
  errors,
  certFields,
  appendCert,
  removeCert,
}: CertificationsSectionProps) => (
  <div className={SECTION_WRAPPER_CLASS}>
    <div className={CARD_CLASS}>
      <h2 className={HEADING_CLASS}>🏆 Certifications</h2>

      <div className={BODY_CLASS}>
        {/* Add New Certification */}
        <div className={ADD_ROW_CLASS}>
          <button
            type="button"
            onClick={() => appendCert({ name: "", issuer: "", date: "" })}
            className={ADD_BTN_CLASS}
          >
            + Add Certification
          </button>
        </div>

        {/* Certification Entries */}
        <div className={ENTRY_LIST_CLASS}>
          {certFields.map((field, index) => {
            const nameInvalid = !!errors.certifications?.[index]?.name;
            return (
              <div
                key={field.id}
                className={ENTRY_CARD_CLASS}
                role="group"
                aria-label={`Certification entry ${index + 1}`}
              >
                <div className={ENTRY_GRID_CLASS}>
                  {/* Span both columns so the remaining 2 fields make one full
                      row instead of leaving a lone cell in a 3-item grid. */}
                  <div className="lg:col-span-2">
                    <label htmlFor={`cert-name-${index}`} className={LABEL_CLASS}>
                      Certification Name
                    </label>
                    <input
                      id={`cert-name-${index}`}
                      {...register(`certifications.${index}.name`, {
                        required: "Certification name is required",
                      })}
                      className={inputError(INPUT_CLASS, nameInvalid)}
                      placeholder="e.g. AWS Certified Solutions Architect - Associate"
                      aria-invalid={nameInvalid || undefined}
                      aria-describedby={
                        nameInvalid ? `cert-name-${index}-error` : undefined
                      }
                    />
                    {nameInvalid && (
                      <p
                        id={`cert-name-${index}-error`}
                        role="alert"
                        className={ERROR_CLASS}
                      >
                        {errors.certifications?.[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`cert-issuer-${index}`} className={LABEL_CLASS}>
                      Issuer
                    </label>
                    <input
                      id={`cert-issuer-${index}`}
                      {...register(`certifications.${index}.issuer`)}
                      className={INPUT_CLASS}
                      placeholder="e.g. Amazon Web Services"
                    />
                  </div>

                  <div>
                    <label htmlFor={`cert-date-${index}`} className={LABEL_CLASS}>
                      Date Issued (optional)
                    </label>
                    <input
                      id={`cert-date-${index}`}
                      type="month"
                      {...register(`certifications.${index}.date`)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Remove */}
                <div className={REMOVE_ROW_CLASS}>
                  <button
                    type="button"
                    onClick={() => removeCert(index)}
                    className={REMOVE_BTN_CLASS}
                    aria-label={`Remove certification ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {certFields.length === 0 && (
          <p className={EMPTY_CLASS}>
            No certifications added yet. Click &quot;+ Add Certification&quot; to
            list them.
          </p>
        )}

        {/* ATS tip */}
        <p className={TIP_CLASS}>
          💡 ATS tip: use the issuing body&apos;s exact certification title — keyword
          matching is literal, so avoid abbreviations the employer may not use.
        </p>
      </div>
    </div>
  </div>
);
