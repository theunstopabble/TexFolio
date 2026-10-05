import { CARD_CLASS, HEADING_CLASS } from "../../resume-editor/components/sections/formStyles";
import { MAX_TITLE_CHARS } from "../../resume-editor/lib/resumePayload";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";
import type { ImportedResumeData } from "../useCreateResume";
import LinkedInImport from "../../../components/LinkedInImport";

interface SettingsStepProps {
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  onImportSuccess: (data: ImportedResumeData) => void;
}

const SettingsStep: React.FC<SettingsStepProps> = ({
  register,
  errors,
  onImportSuccess,
}) => (
  <div className={`${CARD_CLASS} animate-fade-in`}>
    <h2 className={HEADING_CLASS}>📋 Resume Settings</h2>

    {/* LinkedIn Import Option */}
    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
      <LinkedInImport onImportSuccess={onImportSuccess} />
    </div>

    <div className="relative mb-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-slate-500">
          Or start manually
        </span>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <div className="form-group">
        <label htmlFor="crt-title" className="form-label">
          Resume Title
        </label>
        <input
          id="crt-title"
          {...register("title", {
            required: true,
            // Schema caps the title; without this a long one 400'd on submit.
            maxLength: {
              value: MAX_TITLE_CHARS,
              message: `Resume title is limited to ${MAX_TITLE_CHARS} characters`,
            },
          })}
          className="form-input"
          placeholder="e.g. Frontend Developer Resume"
          maxLength={MAX_TITLE_CHARS}
          aria-required="true"
          aria-invalid={!!errors.title || undefined}
          aria-describedby={errors.title ? "crt-title-err" : undefined}
        />
        {errors.title && (
          <span id="crt-title-err" role="alert" className="mt-1 block text-xs text-red-600">
            {errors.title.message || "Required"}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="crt-templateId" className="form-label">
          Select Template
        </label>
        {/* form-select, not form-input: the editor's select styling includes
            the dropdown affordance, and this was the only <select> left using
            the plain input class. */}
        <select
          id="crt-templateId"
          {...register("templateId")}
          className="form-select"
        >
          <option value="classic">Classic (Free)</option>
          {/* Pro templates are marked: the wizard used to list them first with
              no indication they were gated. */}
          <option value="premium">Premium (Pro)</option>
          <option value="faangpath">FAANGPath Pro</option>
          <option value="developer">Developer Pro</option>
        </select>
      </div>
    </div>
  </div>
);

export default SettingsStep;
