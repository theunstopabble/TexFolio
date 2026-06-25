import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../resume-editor/types";
import type { ImportedResumeData } from "./useCreateResume";
import SettingsStep from "./steps/SettingsStep";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import SummaryStep from "./steps/SummaryStep";
import EducationStep from "./steps/EducationStep";
import ExperienceStep from "./steps/ExperienceStep";
import SkillsStep from "./steps/SkillsStep";
import ProjectsStep from "./steps/ProjectsStep";
import CertificationsStep from "./steps/CertificationsStep";
import ReviewStep from "./steps/ReviewStep";

interface ResumeFormStepsProps {
  currentStep: number;
  formMethods: UseFormReturn<ResumeFormData>;
  fieldArrays: {
    experience: UseFieldArrayReturn<ResumeFormData, "experience", "id">;
    education: UseFieldArrayReturn<ResumeFormData, "education", "id">;
    skills: UseFieldArrayReturn<ResumeFormData, "skills", "id">;
    projects: UseFieldArrayReturn<ResumeFormData, "projects", "id">;
    certifications: UseFieldArrayReturn<ResumeFormData, "certifications", "id">;
  };
  onImportSuccess: (data: ImportedResumeData) => void;
}

const ResumeFormSteps: React.FC<ResumeFormStepsProps> = ({
  currentStep,
  formMethods,
  fieldArrays,
  onImportSuccess,
}) => {
  const {
    register,
    formState: { errors },
  } = formMethods;

  return (
    <div className="space-y-6">
      {currentStep === 0 && (
        <SettingsStep
          register={register}
          errors={errors}
          onImportSuccess={onImportSuccess}
        />
      )}
      {currentStep === 1 && <PersonalInfoStep register={register} />}
      {currentStep === 2 && <SummaryStep register={register} />}
      {currentStep === 3 && (
        <EducationStep register={register} fieldArray={fieldArrays.education} />
      )}
      {currentStep === 4 && (
        <ExperienceStep register={register} fieldArray={fieldArrays.experience} />
      )}
      {currentStep === 5 && (
        <SkillsStep register={register} fieldArray={fieldArrays.skills} />
      )}
      {currentStep === 6 && (
        <ProjectsStep register={register} fieldArray={fieldArrays.projects} />
      )}
      {currentStep === 7 && (
        <CertificationsStep register={register} fieldArray={fieldArrays.certifications} />
      )}
      {currentStep === 8 && (
        <ReviewStep formData={formMethods.getValues()} />
      )}
    </div>
  );
};

export default ResumeFormSteps;
