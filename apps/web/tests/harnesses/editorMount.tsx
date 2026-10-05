// Test-only harness for the editor half of the same structural fix: a real
// react-hook-form instance wired to `ResumeFormSections`, standing on the LAST
// step so every earlier section is hidden. Exports only the component — see
// `react-refresh/only-export-components` in eslint.config.js.
import { useForm, useFieldArray } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { ResumeFormSections } from "../../src/features/resume-editor/components/ResumeFormSections";
import { AuthContext } from "../../src/context/AuthContext";
import type { ResumeFormData } from "../../src/features/resume-editor/types";

/** BasicInfoSection renders TemplateSelector (needs auth) and every section
 *  can render AIWriterButton — the real AuthProvider is Clerk-backed. */
const authStub = {
  user: null,
  isPro: false,
  token: null,
  isLoading: false,
  logout: () => undefined,
  getToken: async () => null,
  refreshUser: async () => undefined,
};

const EditorMountHarness = () => {
  const formMethods = useForm<ResumeFormData>({
    defaultValues: {
      title: "My Resume",
      templateId: "classic",
      customization: { primaryColor: "#2563EB", fontFamily: "serif" },
      sectionOrder: [
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
      ],
      personalInfo: {
        fullName: "Ada Lovelace",
        // Deliberately empty. Basics is step 0 and the harness stands on the
        // final step, so this only reaches the API if step 0 is still mounted.
        email: "",
        phone: "+91 00000 00000",
        location: "Bengaluru",
        linkedin: "",
        github: "",
      },
      summary: "",
      profileLinks: [],
      experience: [
        {
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          description: [""],
        },
      ],
      education: [
        {
          institution: "",
          degree: "",
          field: "",
          location: "",
          startDate: "",
          endDate: "",
        },
      ],
      skills: [{ category: "", skills: [] }],
      projects: [{ name: "", description: "", technologies: [] }],
      certifications: [{ name: "", issuer: "" }],
    },
  });

  const experience = useFieldArray({ control: formMethods.control, name: "experience" });
  const education = useFieldArray({ control: formMethods.control, name: "education" });
  const skills = useFieldArray({ control: formMethods.control, name: "skills" });
  const projects = useFieldArray({ control: formMethods.control, name: "projects" });
  const certifications = useFieldArray({
    control: formMethods.control,
    name: "certifications",
  });
  const profileLinks = useFieldArray({
    control: formMethods.control,
    name: "profileLinks",
  });
  return (    <MemoryRouter>
      <AuthContext.Provider value={authStub}>
        <form
          noValidate
          onSubmit={formMethods.handleSubmit(
            () => undefined,
            () => undefined,
          )}
        >
          <div className="min-h-[320px]">
            <ResumeFormSections
              activeStep={6}
              register={formMethods.register}
              watch={formMethods.watch}
              setValue={formMethods.setValue}
              errors={formMethods.formState.errors}
              expFields={experience.fields}
              appendExp={experience.append}
              removeExp={experience.remove}
              eduFields={education.fields}
              appendEdu={education.append}
              removeEdu={education.remove}
              skillFields={skills.fields}
              appendSkill={skills.append}
              removeSkill={skills.remove}
              projFields={projects.fields}
              appendProj={projects.append}
              removeProj={projects.remove}
              certFields={certifications.fields}
              appendCert={certifications.append}
              removeCert={certifications.remove}
              plFields={profileLinks.fields}
              appendPl={profileLinks.append}
              removePl={profileLinks.remove}
              getValues={formMethods.getValues}
            />
          </div>
        </form>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

export default EditorMountHarness;
