import type { UseFormRegister } from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";

interface PersonalInfoStepProps {
  register: UseFormRegister<ResumeFormData>;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ register }) => (
  <div className="card animate-fade-in shadow-lg">
    <h2 className="card-title mb-6">👤 Personal Information</h2>
    <div className="space-y-4">
      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input
          {...register("personalInfo.fullName", { required: true })}
          className="form-input"
          placeholder="John Doe"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Email *</label>
        <input
          {...register("personalInfo.email", { required: true })}
          type="email"
          className="form-input"
          placeholder="john@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input
            {...register("personalInfo.phone", { required: true })}
            className="form-input"
            placeholder="+91..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location *</label>
          <input
            {...register("personalInfo.location", {
              required: true,
            })}
            className="form-input"
            placeholder="City, Country"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">LinkedIn</label>
          <input
            {...register("personalInfo.linkedin")}
            className="form-input"
            placeholder="username"
          />
        </div>
        <div className="form-group">
          <label className="form-label">GitHub</label>
          <input
            {...register("personalInfo.github")}
            className="form-input"
            placeholder="username"
          />
        </div>
      </div>
    </div>
  </div>
);

export default PersonalInfoStep;
