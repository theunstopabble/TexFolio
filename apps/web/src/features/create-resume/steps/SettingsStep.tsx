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
  <div className="card animate-fade-in shadow-lg">
    <h2 className="card-title mb-6">📋 Resume Settings</h2>

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
        <label className="form-label">Resume Title</label>
        <input
          {...register("title", { required: true })}
          className="form-input"
          placeholder="e.g. Frontend Developer Resume"
        />
        {errors.title && (
          <span className="text-red-500 text-sm">Required</span>
        )}
      </div>
      <div className="form-group">
        <label className="form-label">Select Template</label>
        <select {...register("templateId")} className="form-input">
          <option value="premium">Premium (Recommended)</option>
          <option value="classic">Classic</option>
          <option value="faangpath">FAANGPath Pro 🚀</option>
        </select>
      </div>
    </div>
  </div>
);

export default SettingsStep;
