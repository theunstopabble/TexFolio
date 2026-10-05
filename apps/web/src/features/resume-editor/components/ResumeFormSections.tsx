import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  UseFormGetValues,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import type { ResumeFormData } from "../types";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { SummarySection } from "./sections/SummarySection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection } from "./sections/SkillsSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { CertificationsSection } from "./sections/CertificationsSection";

interface ResumeFormSectionsProps {
  activeStep: number;
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  expFields: FieldArrayWithId<ResumeFormData, "experience", "id">[];
  appendExp: UseFieldArrayAppend<ResumeFormData, "experience">;
  removeExp: UseFieldArrayRemove;
  eduFields: FieldArrayWithId<ResumeFormData, "education", "id">[];
  appendEdu: UseFieldArrayAppend<ResumeFormData, "education">;
  removeEdu: UseFieldArrayRemove;
  skillFields: FieldArrayWithId<ResumeFormData, "skills", "id">[];
  appendSkill: UseFieldArrayAppend<ResumeFormData, "skills">;
  removeSkill: UseFieldArrayRemove;
  projFields: FieldArrayWithId<ResumeFormData, "projects", "id">[];
  appendProj: UseFieldArrayAppend<ResumeFormData, "projects">;
  removeProj: UseFieldArrayRemove;
  certFields: FieldArrayWithId<ResumeFormData, "certifications", "id">[];
  appendCert: UseFieldArrayAppend<ResumeFormData, "certifications">;
  removeCert: UseFieldArrayRemove;
  plFields: FieldArrayWithId<ResumeFormData, "profileLinks", "id">[];
  appendPl: UseFieldArrayAppend<ResumeFormData, "profileLinks">;
  removePl: UseFieldArrayRemove;
  getValues: UseFormGetValues<ResumeFormData>;
}

export const ResumeFormSections = ({
  activeStep,
  register,
  watch,
  setValue,
  errors,
  expFields,
  appendExp,
  removeExp,
  eduFields,
  appendEdu,
  removeEdu,
  skillFields,
  appendSkill,
  removeSkill,
  projFields,
  appendProj,
  removeProj,
  certFields,
  appendCert,
  removeCert,
  plFields,
  appendPl,
  removePl,
  getValues,
}: ResumeFormSectionsProps) => {
  // Every section is mounted; inactive ones are only hidden. react-hook-form
  // never validates a field whose ref has detached, so rendering a single
  // section let Save ship whole sections of the payload unchecked — the API
  // rejected it 400 with no field marked red. See `lib/stepErrors.ts`.
  // `hidden` (display:none) keeps the refs attached while dropping the section
  // from layout and the a11y tree.
  return (
    <>
      <div data-step={0} className={activeStep === 0 ? undefined : "hidden"}>
        <BasicInfoSection
          register={register}
          watch={watch}
          setValue={setValue}
          getValues={getValues}
          errors={errors}
          plFields={plFields}
          appendPl={appendPl}
          removePl={removePl}
        />
      </div>
      <div data-step={1} className={activeStep === 1 ? undefined : "hidden"}>
        <SummarySection register={register} watch={watch} setValue={setValue} />
      </div>
      {/* Matches the create wizard's step order (Education before Experience) —
          the editor previously reversed the two, so the same resume presented a
          different sequence depending on how it was created. */}
      <div data-step={2} className={activeStep === 2 ? undefined : "hidden"}>
        <EducationSection register={register} errors={errors} eduFields={eduFields} appendEdu={appendEdu} removeEdu={removeEdu} />
      </div>
      <div data-step={3} className={activeStep === 3 ? undefined : "hidden"}>
        <ExperienceSection register={register} watch={watch} errors={errors} expFields={expFields} appendExp={appendExp} removeExp={removeExp} />
      </div>
      <div data-step={4} className={activeStep === 4 ? undefined : "hidden"}>
        <SkillsSection
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          skillFields={skillFields}
          appendSkill={appendSkill}
          removeSkill={removeSkill}
        />
      </div>
      <div data-step={5} className={activeStep === 5 ? undefined : "hidden"}>
        <ProjectsSection register={register} errors={errors} projFields={projFields} appendProj={appendProj} removeProj={removeProj} />
      </div>
      <div data-step={6} className={activeStep === 6 ? undefined : "hidden"}>
        <CertificationsSection register={register} errors={errors} certFields={certFields} appendCert={appendCert} removeCert={removeCert} />
      </div>
    </>
  );
};
