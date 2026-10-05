import { useState, useEffect } from "react";
import {
  useForm,
  useFieldArray,
  type FieldPath,
  type FieldErrors,
} from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { resumeApi, isReportedError } from "../../services/api";
import toast from "react-hot-toast";
import type { ResumeFormData } from "../resume-editor/types";
import type { Experience, Education, Skill, Project, Certification } from "../resume-editor/types";
import { triggerDownload, buildResumeFileName } from "../../lib/download";
import { firstErrorStep } from "../../lib/stepErrors";
import { entryComplete } from "./entryValidation";

// Shape of data returned from LinkedIn import
export interface ImportedResumeData {
  [key: string]: unknown;
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
  certifications?: Certification[];
}

// --- Configuration ---
/**
 * Steps 1-7 are the resume's data sections — the same seven the editor shows.
 * Personal info lives inside Basics (it is part of "who you are", not a
 * section of the document), and Review is the pre-submit check, not a data
 * step. Field scope drives `trigger`, `firstErrorStep` and `maxVisited`
 * gating, so merged Basics validates title/template AND the personal fields
 * in one Next.
 */
export const STEPS = [
  {
    id: "basics",
    title: "Basics",
    fields: [
      "title",
      "templateId",
      "personalInfo.fullName",
      "personalInfo.email",
      "personalInfo.phone",
      "personalInfo.location",
      "profileLinks",
    ],
  },
  { id: "summary", title: "Summary", fields: ["summary"] },
  { id: "education", title: "Education", fields: ["education"] },
  { id: "experience", title: "Experience", fields: ["experience"] },
  { id: "skills", title: "Skills", fields: ["skills"] },
  { id: "projects", title: "Projects", fields: ["projects"] },
  { id: "certifications", title: "Certifications", fields: ["certifications"] },
  // `ResumeFormSteps` has always rendered ReviewStep at the last index, but
  // STEPS used to stop short of it — so `currentStep` could never reach it and
  // the branch was dead code; the wizard fell straight from Certifications to
  // Generate. `fields: []` means there is nothing new to validate on the way in.
  { id: "review", title: "Review", fields: [] },
] as const;

/** Field scope of each step, in order — derived from `STEPS` so the two can
 *  never drift, and what maps a submit error back to the step to reveal. */
const STEP_FIELDS: readonly (readonly string[])[] = STEPS.map((step) => step.fields);

export const useCreateResume = () => {
  const [currentStep, setCurrentStep] = useState(0);
  // Set by a failed submit: the step owning the earliest error (or null when
  // none did). The effect below focuses it once React has committed the switch.
  const [focusRequest, setFocusRequest] = useState<{ step: number | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get("template");
  const validTemplates = ["premium", "classic", "faangpath", "developer"];
  // "classic" is the only template that is not Pro-gated. Defaulting to
  // "premium" pre-selected a locked design for free accounts — the form opened
  // showing something the user was not allowed to generate.
  const initialTemplate = validTemplates.includes(templateFromUrl || "")
    ? templateFromUrl!
    : "classic";

  const formMethods = useForm<ResumeFormData>({
    defaultValues: {
      title: "My Resume",
      templateId: initialTemplate,
      personalInfo: {
        fullName: user?.name || "",
        email: user?.email || "",
        phone: "",
        location: "",
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
    // `shouldFocusError: false`: handleSubmit's own focus fires (twice, the
    // second on a timer) before the step reveal below commits and would land on
    // a still-hidden control. The error handler owns focus instead. `trigger`'s
    // per-call `shouldFocus` in `validateCurrentStep` is unaffected.
    shouldFocusError: false,
  });

  const { control, handleSubmit, trigger, reset, watch } = formMethods;
  // Use watch() for live preview updates (formData must react to changes)
  const formData = watch();

  // Field Arrays
  const experienceFieldArray = useFieldArray({
    control,
    name: "experience",
  });
  const educationFieldArray = useFieldArray({
    control,
    name: "education",
  });
  const skillsFieldArray = useFieldArray({ control, name: "skills" });
  const projectsFieldArray = useFieldArray({
    control,
    name: "projects",
  });
  const certificationsFieldArray = useFieldArray({
    control,
    name: "certifications",
  });
  const profileLinksFieldArray = useFieldArray({
    control,
    name: "profileLinks",
  });

  // Helpers
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    if (!/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
    const [year, month] = dateStr.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Actions
  const [maxVisited, setMaxVisited] = useState(0);

  /** Validate the step we are standing on. Returns false when it has errors. */
  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = STEPS[currentStep].fields;
    // The Review step declares no fields — nothing to validate on entry.
    return (
      fields.length === 0 ||
      (await trigger(fields as unknown as readonly FieldPath<ResumeFormData>[], {
        // Without this, `trigger` failed silently: the Next button just did
        // nothing, which reads as a broken button rather than a validation
        // problem. Focus the offending input so the reason is obvious.
        shouldFocus: true,
      }))
    );
  };

  const handleNext = async () => {
    if (await validateCurrentStep()) {
      const next = Math.min(currentStep + 1, STEPS.length - 1);
      setCurrentStep(next);
      setMaxVisited((m) => Math.max(m, next));
      window.scrollTo(0, 0);
    }
    // No toast here: `shouldFocus` scrolls to the offending input and the
    // field's own error text explains the problem — a second notification
    // would just be noise over the same issue.
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  /**
   * Jump to an already-visited step. Steps beyond `maxVisited` stay gated so
   * the wizard only ever moves forward through a validated Next; advancing
   * `maxVisited` happens exclusively there.
   *
   * A forward jump re-validates the step being left, so an edit made here is
   * reported now rather than at Generate. Backward jumps are free: they cannot
   * leave an unvalidated edit behind.
   *
   * Submit no longer depends on any of this: every step stays mounted, so
   * `handleSubmit` validates the whole form no matter where the user is.
   */
  const goToStep = async (target: number) => {
    if (target > maxVisited) return;
    if (target > currentStep && !(await validateCurrentStep())) return;
    setCurrentStep(target);
    window.scrollTo(0, 0);
  };

  /**
   * Every step stays mounted (inactive ones are hidden), so Generate can fail
   * on a field the user cannot see — most often an earlier step they walked
   * back out of. Reveal the step owning the earliest error first: focusing a
   * control inside `display:none` is a silent no-op, and with nothing focused
   * the only signal would be a toast.
   */
  const handleSubmitError = (errors: FieldErrors<ResumeFormData>) => {
    const step = firstErrorStep(errors, STEP_FIELDS);
    if (step !== null && step !== currentStep) setCurrentStep(step);
    setFocusRequest({ step });
    toast.error("Please fix the highlighted fields before generating.");
  };

  // Runs after commit: react-hook-form's error update and the step switch are
  // batched into one render, so every field already carries `aria-invalid` by
  // the time this fires. `step === null` means no step claimed the error —
  // fall back to the first marked field anywhere in the form.
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.step !== null && focusRequest.step !== currentStep) return;
    setFocusRequest(null);
    const el =
      (focusRequest.step === null
        ? null
        : document
            .querySelector(`form [data-step="${focusRequest.step}"]`)
            ?.querySelector<HTMLElement>('[aria-invalid="true"]')) ??
      document.querySelector<HTMLElement>('form [aria-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // preventScroll keeps the scroll we just asked for instead of jumping to
    // the focus target's default position.
    el.focus({ preventScroll: true });
  }, [focusRequest, currentStep]);

  const handleImportSuccess = (data: ImportedResumeData) => {
    reset({
      ...formData,
      title: `${data.personalInfo?.fullName || "My"}'s Resume`,
      personalInfo: {
        ...formData.personalInfo,
        fullName: data.personalInfo?.fullName || formData.personalInfo.fullName,
        email: data.personalInfo?.email || formData.personalInfo.email,
        phone: data.personalInfo?.phone || "",
        location: data.personalInfo?.location || "",
        linkedin: data.personalInfo?.linkedin || "",
        github: data.personalInfo?.github || "",
      },
      summary: data.summary || "",
      experience:
        (data.experience?.length ?? 0) > 0 ? data.experience : formData.experience,
      education:
        (data.education?.length ?? 0) > 0 ? data.education : formData.education,
      skills: (data.skills?.length ?? 0) > 0 ? data.skills : formData.skills,
      projects: (data.projects?.length ?? 0) > 0 ? data.projects : formData.projects,
      certifications:
        (data.certifications?.length ?? 0) > 0
          ? data.certifications
          : formData.certifications,
    });
    // Personal info is part of Basics now, so the import filled everything on
    // step 0 — skip straight to Summary.
    setCurrentStep(1);
    setMaxVisited((m) => Math.max(m, 1));
  };

  const onSubmit = async (data: ResumeFormData) => {
    try {
      setLoading(true);
      const formattedData = {
        ...data,
        experience: data.experience
          // `entryComplete` is the same predicate Review uses, so what the user
          // reads there is what actually reaches the API.
          .filter((e) => entryComplete("experience", e))
          .map((e) => ({
            ...e,
            startDate: formatDate(e.startDate),
            endDate: formatDate(e.endDate),
            description:
              typeof e.description === "string"
                ? String(e.description)
                    .split("\n")
                    .filter((d) => d.trim())
                : e.description,
          })),
        education: data.education
          .filter((e) => entryComplete("education", e))
          .map((e) => ({
            ...e,
            startDate: formatDate(e.startDate),
            endDate: formatDate(e.endDate),
          })),
        skills: data.skills
          .filter((s) => entryComplete("skills", s))
          .map((s) => ({
            category: s.category,
            skills:
              typeof s.skills === "string"
                ? String(s.skills)
                    .split(",")
                    .map((sk) => sk.trim())
                : s.skills,
          })),
        projects: data.projects
          .filter((p) => entryComplete("projects", p))
          .map((p) => ({
            ...p,
            technologies:
              typeof p.technologies === "string"
                ? String(p.technologies)
                    .split(",")
                    .map((t) => t.trim())
                : p.technologies,
          })),
        certifications: data.certifications.filter((c) =>
          entryComplete("certifications", c),
        ),
        // Rows the user abandoned (platform chosen, no link — or vice versa)
        // are dropped the same way the other arrays drop half-filled entries.
        profileLinks: (data.profileLinks || []).filter((p) =>
          entryComplete("profileLinks", p),
        ),
      };

      const response = await resumeApi.create(formattedData);
      setResumeId(response.data.data._id);
      toast.success("Resume created successfully! 🎉");
      setSuccess(true);
    } catch (error) {
      console.error("Error creating resume:", error);
      toast.error("Failed to create resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!resumeId) return;
    try {
      setLoading(true);
      const url = await resumeApi.generatePdf(resumeId);
      // Not window.open(): it runs after an await, so it is no longer inside
      // the user-gesture window and popup blockers routinely swallowed it —
      // the button appeared to do nothing. Same helper the editor uses.
      const current = watch();
      triggerDownload(
        url,
        buildResumeFileName(current.personalInfo?.fullName, current.title),
      );
      // Revoke blob URL after a delay to allow the browser to read it
      setTimeout(() => resumeApi.revokePdfUrl(url), 60000);
    } catch (error) {
      // Same double-toast rule as the editor's download: the axios interceptor
      // owns reporting for anything that came off the wire.
      if (isReportedError(error)) {
        console.error("Error opening PDF:", error);
      } else {
        toast.error("Failed to download PDF");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSuccess(false);
    setResumeId(null);
    setCurrentStep(0);
    setMaxVisited(0);
    reset(); // Reset form too
  };

  return {
    currentStep,
    maxVisited,
    loading,
    success,
    resumeId,
    formMethods,
    formData,
    fieldArrays: {
      experience: experienceFieldArray,
      education: educationFieldArray,
      skills: skillsFieldArray,
      projects: projectsFieldArray,
      certifications: certificationsFieldArray,
      profileLinks: profileLinksFieldArray,
    },
    actions: {
      handleNext,
      handleBack,
      goToStep,
      handleImportSuccess,
      onSubmit: handleSubmit(onSubmit, handleSubmitError),
      downloadPdf,
      resetState,
    },
  };
};
