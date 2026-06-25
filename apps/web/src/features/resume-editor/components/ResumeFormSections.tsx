import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
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
}

export const ResumeFormSections = ({
  activeStep,
  register,
  watch,
  setValue,
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
}: ResumeFormSectionsProps) => {
  switch (activeStep) {
    case 0:
      return <BasicInfoSection register={register} watch={watch} setValue={setValue} />;
    case 1:
      return <SummarySection register={register} watch={watch} setValue={setValue} />;
    case 2:
      return <ExperienceSection register={register} expFields={expFields} appendExp={appendExp} removeExp={removeExp} />;
    case 3:
      return <EducationSection register={register} eduFields={eduFields} appendEdu={appendEdu} removeEdu={removeEdu} />;
    case 4:
      return <SkillsSection register={register} skillFields={skillFields} appendSkill={appendSkill} removeSkill={removeSkill} />;
    case 5:
      return <ProjectsSection register={register} projFields={projFields} appendProj={appendProj} removeProj={removeProj} />;
    case 6:
      return <CertificationsSection register={register} certFields={certFields} appendCert={appendCert} removeCert={removeCert} />;
    default:
      return null;
  }
};
