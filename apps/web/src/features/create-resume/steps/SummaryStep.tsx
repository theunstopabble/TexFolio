import type { UseFormRegister } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface SummaryStepProps {
  register: UseFormRegister<ResumeFormData>;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ register }) => (
  <div className="card animate-fade-in shadow-lg">
    <h2 className="card-title mb-6">📝 Professional Summary</h2>
    <div className="form-group">
      <label className="form-label">Summary</label>
      <textarea
        {...register("summary")}
        className="form-input min-h-[200px]"
        placeholder="Detail your professional background, key achievements, and career goals here..."
      />
    </div>
  </div>
);

export default SummaryStep;
