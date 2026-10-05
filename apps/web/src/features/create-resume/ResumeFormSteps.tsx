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
  /** Live `watch()` snapshot — ReviewStep renders values, not registered
   *  inputs, so it needs the reactive copy rather than `getValues()`. */
  formData: ResumeFormData;
  fieldArrays: {
    experience: UseFieldArrayReturn<ResumeFormData, "experience", "id">;
    education: UseFieldArrayReturn<ResumeFormData, "education", "id">;
    skills: UseFieldArrayReturn<ResumeFormData, "skills", "id">;
    projects: UseFieldArrayReturn<ResumeFormData, "projects", "id">;
    certifications: UseFieldArrayReturn<ResumeFormData, "certifications", "id">;
    profileLinks: UseFieldArrayReturn<ResumeFormData, "profileLinks", "id">;
  };
  onImportSuccess: (data: ImportedResumeData) => void;
}

const ResumeFormSteps: React.FC<ResumeFormStepsProps> = ({
  currentStep,
  formMethods,
  formData,
  fieldArrays,
  onImportSuccess,
}) => {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = formMethods;

  return (
    // No `space-y-6` here: it would add a 1.5rem block-end margin to every
    // non-last child, and with all eight steps mounted the *visible* one is
    // usually not last. Only one step is ever visible, so no inter-step gap
    // exists to produce. The form's own `space-y-6` still separates the step
    // from the action buttons below. Step 0 is the exception: Basics stacks
    // the Settings and Personal Information cards, so it gets its own gap.
    <div>
      {/* Every step stays mounted; inactive ones are only hidden. react-hook-form
          never validates a field whose ref has detached, so conditionally
          rendering one step let Generate ship unchecked sections straight to the
          API — the wizard then reported a generic failure. See `lib/stepErrors.ts`. */}
      <div
        data-step={0}
        className={`space-y-6 ${currentStep === 0 ? "" : "hidden"}`}
      >
        <SettingsStep
          register={register}
          errors={errors}
          onImportSuccess={onImportSuccess}
        />
        <PersonalInfoStep
          register={register}
          setValue={setValue}
          getValues={getValues}
          errors={errors}
          profileLinks={fieldArrays.profileLinks}
        />
      </div>
      <div data-step={1} className={currentStep === 1 ? undefined : "hidden"}>
        <SummaryStep register={register} watch={watch} errors={errors} />
      </div>
      <div data-step={2} className={currentStep === 2 ? undefined : "hidden"}>
        <EducationStep
          register={register}
          fieldArray={fieldArrays.education}
          errors={errors}
        />
      </div>
      <div data-step={3} className={currentStep === 3 ? undefined : "hidden"}>
        <ExperienceStep
          register={register}
          fieldArray={fieldArrays.experience}
          errors={errors}
        />
      </div>
      <div data-step={4} className={currentStep === 4 ? undefined : "hidden"}>
        <SkillsStep
          register={register}
          setValue={setValue}
          watch={watch}
          fieldArray={fieldArrays.skills}
          errors={errors}
        />
      </div>
      <div data-step={5} className={currentStep === 5 ? undefined : "hidden"}>
        <ProjectsStep
          register={register}
          fieldArray={fieldArrays.projects}
          errors={errors}
        />
      </div>
      <div data-step={6} className={currentStep === 6 ? undefined : "hidden"}>
        <CertificationsStep
          register={register}
          fieldArray={fieldArrays.certifications}
          errors={errors}
        />
      </div>
      <div data-step={7} className={currentStep === 7 ? undefined : "hidden"}>
        <ReviewStep formData={formData} />
      </div>
    </div>
  );
};

export default ResumeFormSteps;
