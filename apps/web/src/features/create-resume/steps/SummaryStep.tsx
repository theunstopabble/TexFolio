import { CARD_CLASS, HEADING_CLASS, ERROR_CLASS } from "../../resume-editor/components/sections/formStyles";
import { MAX_SUMMARY_CHARS, RECOMMENDED_SUMMARY_CHARS } from "../../resume-editor/lib/resumePayload";
import type { UseFormRegister, UseFormWatch, FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface SummaryStepProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ register, watch, errors }) => {
  const summary = watch("summary") || "";
  const overRecommended = summary.length > RECOMMENDED_SUMMARY_CHARS;
  const error = errors.summary;

  return (
    <div className={`${CARD_CLASS} animate-fade-in`}>
      <h2 className={HEADING_CLASS}>📝 Professional Summary</h2>
      <div className="form-group">
        <label htmlFor="crt-summary" className="form-label">
          Summary
        </label>
        <textarea
          id="crt-summary"
          {...register("summary", {
            maxLength: {
              value: MAX_SUMMARY_CHARS,
              message: `Summary is limited to ${MAX_SUMMARY_CHARS} characters`,
            },
          })}
          // The server rejects anything over the schema's 1500 with a 400, and
          // this step had neither the attribute nor the rule — a long paste
          // sailed through the wizard and died on submit with a generic error.
          maxLength={MAX_SUMMARY_CHARS}
          className="form-textarea min-h-[200px]"
          placeholder="Detail your professional background, key achievements, and career goals here..."
          aria-invalid={!!error || undefined}
          aria-describedby={
            error ? "crt-summary-err" : "crt-summary-counter"
          }
        />
        {error && (
          <p id="crt-summary-err" role="alert" className={ERROR_CLASS}>
            {error.message || `Summary is limited to ${MAX_SUMMARY_CHARS} characters`}
          </p>
        )}
        <div
          id="crt-summary-counter"
          className="mt-1 flex justify-between text-xs text-slate-500"
        >
          <span className={overRecommended ? "text-amber-600 font-medium" : ""}>
            {summary.length}/{MAX_SUMMARY_CHARS} characters
          </span>
          <span>Recommended max {RECOMMENDED_SUMMARY_CHARS}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryStep;
