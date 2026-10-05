// Test-only harness: a real react-hook-form instance wired to the wizard's
// steps, so a test can assert on the mounted DOM *and* on what `handleSubmit`
// actually validates. Lives under tests/ (outside tsconfig.app's `include`),
// so it never reaches the shipped bundle. Exports only the component — see
// `react-refresh/only-export-components` in eslint.config.js.
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import ResumeFormSteps from "../../src/features/create-resume/ResumeFormSteps";
import { AuthContext } from "../../src/context/AuthContext";
import type { ResumeFormData } from "../../src/features/resume-editor/types";

/** SettingsStep renders LinkedInImport, which reads the auth context. The real
 *  AuthProvider is Clerk-backed and network-bound — this is enough for it to
 *  render without throwing. */
const authStub = {
  user: null,
  isPro: false,
  token: null,
  isLoading: false,
  logout: () => undefined,
  getToken: async () => null,
  refreshUser: async () => undefined,
};

const WizardMountHarness = () => {
  const formMethods = useForm<ResumeFormData>({
    defaultValues: {
      title: "My Resume",
      templateId: "classic",
      personalInfo: {
        fullName: "Ada Lovelace",
        // Empty — but personal info lives on step 0 (Basics) now, so this is
        // the *visible* validation half; the hidden-step half is experience.
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
          // Deliberately started-but-incomplete: the entry counts as started
          // the moment any field holds text, so `requireIfStarted` demands a
          // company too. Experience is step 3 and the harness stands on step 0,
          // so this only surfaces an error if step 3 really is mounted.
          position: "Developer",
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
  // `useWatch` rather than `formMethods.watch()`: the latter is a
  // non-memoized function that react-hooks/incompatible-library refuses to
  // compile, and this is the reactive API react-hook-form recommends anyway.
  const formData = useWatch({ control: formMethods.control }) as ResumeFormData;

  return (
    <AuthContext.Provider value={authStub}>
      {/* Errors land in formState and the steps render them, so the test can
          read the outcome straight off the DOM — no callback plumbing. */}
      <form
        noValidate
        onSubmit={formMethods.handleSubmit(
          () => undefined,
          () => undefined,
        )}
      >
        <ResumeFormSteps
          currentStep={0}
          formMethods={formMethods}
          formData={formData}
          fieldArrays={{
            experience,
            education,
            skills,
            projects,
            certifications,
            profileLinks,
          }}
          onImportSuccess={() => undefined}
        />
      </form>
    </AuthContext.Provider>
  );
};

export default WizardMountHarness;
