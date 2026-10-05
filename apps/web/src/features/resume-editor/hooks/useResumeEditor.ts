import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { resumeApi, aiApi, isReportedError } from "../../../services/api";
import toast from "react-hot-toast";
import type { ResumeFormData, ATSAnalysisResult } from "../types";
import { toApiPayload, toFormShapeFromApi } from "../lib/resumePayload";
import { normalizeResumeForAI } from "../lib/normalizeForAI";
import { triggerDownload, buildResumeFileName } from "../../../lib/download";
import { firstErrorStep } from "../../../lib/stepErrors";

/**
 * Steps rendered by the editor: Basics, Summary, Education, Experience, Skills,
 * Projects, Certifications. Keep in sync with `steps` in EditResume.tsx.
 */
const STEP_COUNT = 7;

/**
 * Top-level fields each step registers — keep in sync with `steps` in
 * EditResume.tsx and the section order in `ResumeFormSections`. It is what
 * maps a submit error back to the step that has to be revealed first.
 */
const STEP_FIELDS: readonly (readonly string[])[] = [
  ["title", "templateId", "personalInfo", "profileLinks"],
  ["summary"],
  ["education"],
  ["experience"],
  ["skills"],
  ["projects"],
  ["certifications"],
];

/** Used when the API returns no section order (matches resumeSchema default). */
const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
];

export const useResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Kept separate from `loading`: reusing the initial-load flag made the whole
  // editor blank out (EditResume renders a full-page spinner on `loading`).
  const [downloading, setDownloading] = useState(false);

  // Stepper State
  const [activeStep, setActiveStep] = useState(0);
  // Set by a failed submit: the step that owns the earliest error (or null when
  // none did). The effect below focuses it once React has committed the switch.
  const [focusRequest, setFocusRequest] = useState<{ step: number | null } | null>(
    null,
  );

  // AI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<ATSAnalysisResult | null>(null);

  // ATS State
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsJobDescription, setAtsJobDescription] = useState("");

  // Share State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState("");

  // Modals
  const [clModalOpen, setClModalOpen] = useState(false);
  const [aiCoachOpen, setAiCoachOpen] = useState(false);

  // Last-saved snapshot for dirty-tracking (ensures edits always reach the PDF)
  const savedSnapshotRef = useRef<string>("");

  // Form Setup
  // `shouldFocusError: false`: handleSubmit's own focus races the step reveal
  // below (it fires, including a deferred retry, before the switch commits) and
  // would land on a still-hidden control. The error handler owns focus instead.
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState,
  } = useForm<ResumeFormData>({ shouldFocusError: false });
  // Use watch() for live preview updates (formData must react to changes)
  const formData = watch();

  // Field Arrays
  const experienceFieldArray = useFieldArray({ control, name: "experience" });
  const educationFieldArray = useFieldArray({ control, name: "education" });
  const skillsFieldArray = useFieldArray({ control, name: "skills" });
  const projectsFieldArray = useFieldArray({ control, name: "projects" });
  const certificationsFieldArray = useFieldArray({
    control,
    name: "certifications",
  });
  const profileLinksFieldArray = useFieldArray({
    control,
    name: "profileLinks",
  });

  // Load Data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await resumeApi.getById(id!);
        const data = response.data.data;

        // One builder feeds both reset() and the saved snapshot: the dirty-check
        // diffs them as JSON, so they must be identical by construction.
        const formShape: ResumeFormData = {
          title: data.title,
          templateId: data.templateId || "classic",
          customization: data.customization || {
            primaryColor: "#2563EB",
            fontFamily: "serif",
          },
          sectionOrder:
            data.sectionOrder && data.sectionOrder.length > 0
              ? data.sectionOrder
              : DEFAULT_SECTION_ORDER,
          personalInfo: data.personalInfo,
          summary: data.summary || "",
          // Resumes predating the feature have no profileLinks in Mongo.
          profileLinks: data.profileLinks || [],
          ...toFormShapeFromApi(data),
        };

        reset(formShape);

        // Record the snapshot AFTER reset so the loaded state counts as "saved".
        savedSnapshotRef.current = JSON.stringify(formShape);

        setIsPublic(data.isPublic || false);
        setShareId(data.shareId || "");
      } catch (error) {
        console.error("Error fetching resume:", error);
        toast.error("Failed to load resume");
        navigate("/resumes");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchResume();
  }, [id, reset, navigate]);

  // Form Submission
  /**
   * Single save path shared by the Save button and the download pre-flight.
   * It reports success as a boolean rather than throwing, so `handleDownload`
   * can abort: `onSubmit` used to swallow the failure, which let the PDF be
   * generated from the last *server-side* revision while the edits sitting in
   * the form never reached it.
   */
  const saveResume = async (data: ResumeFormData): Promise<boolean> => {
    try {
      setSaving(true);
      // Form shape → server shape (string fields split back into arrays).
      const formattedData = { ...data, ...toApiPayload(data) };
      // Drop link rows the user added and then abandoned — an empty `platform`
      // would fail the API's enum and 400 the whole save.
      formattedData.profileLinks = (data.profileLinks || []).filter(
        (p) => p.platform !== "" && p.url.trim() !== "",
      );

      await resumeApi.update(id!, formattedData);
      // Snapshot the submitted state, not `watch()`: anything typed during the
      // await must remain dirty, or the pre-download dirty-check would treat
      // unsaved edits as saved and silently skip the save.
      savedSnapshotRef.current = JSON.stringify(data);
      return true;
    } catch (error) {
      console.error("Error updating resume:", error);
      toast.error("Failed to update resume");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: ResumeFormData) => {
    if (await saveResume(data)) {
      toast.success("Resume updated successfully! 🎉");
    }
    // navigate("/resumes"); // Don't navigate away, let user keep editing
  };

  // Handlers
  const handleAnalyze = async () => {
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    try {
      const response = await aiApi.analyze(normalizeResumeForAI(watch()));
      setAiResult(response.data.data);
    } catch {
      toast.error("Failed to analyze resume.");
      setAiResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const res = await resumeApi.toggleVisibility(id!);
      if (res.data.success) {
        setIsPublic(res.data.data.isPublic);
        setShareId(res.data.data.shareId);
        toast.success(
          res.data.data.isPublic
            ? "Resume is now Public"
            : "Resume is now Private",
        );
      }
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const handleATSCheck = async (jobDescription?: string) => {
    try {
      setAtsLoading(true);
      setAtsModalOpen(true);
      // aiApi.checkATSScore normalises internally — pass raw form state.
      const response = await aiApi.checkATSScore(watch(), jobDescription || atsJobDescription);
      setAtsResult(response.data.data);
      resumeApi
        .saveAtsScore(id!, response.data.data.score)
        .catch(() => {});
    } catch {
      // The axios interceptor already surfaces the server message — only reset
      // local state here so the user does not get two toasts.
      setAtsModalOpen(false);
    } finally {
      setAtsLoading(false);
    }
  };

  /**
   * Every section stays mounted (inactive ones are hidden), so a submit can
   * fail on a step the user cannot see. Reveal the step owning the earliest
   * error first — focusing a control inside `display:none` is a silent no-op —
   * then scroll it into view once React has committed the switch.
   */
  const handleSubmitError = (errors: FieldErrors<ResumeFormData>) => {
    const step = firstErrorStep(errors, STEP_FIELDS);
    if (step !== null && step !== activeStep) setActiveStep(step);
    setFocusRequest({ step });
    toast.error("Please fix the highlighted fields before saving.");
  };

  // Runs after commit: react-hook-form's error update and the step switch are
  // batched into one render, so every field already carries `aria-invalid` by
  // the time this fires. `step === null` means no section claimed the error —
  // fall back to the first marked field anywhere in the form.
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.step !== null && focusRequest.step !== activeStep) return;
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
  }, [focusRequest, activeStep]);

  const handleDownload = async () => {
    if (downloading) return; // guard double-clicks

    try {
      setDownloading(true);

      // Dirty-check: if the form has unsaved edits, save before generating the
      // PDF so the download always reflects the latest content.
      const isDirty =
        savedSnapshotRef.current !== "" &&
        JSON.stringify(watch()) !== savedSnapshotRef.current;
      if (isDirty && !(await saveResume(watch()))) {
        // Abort: without this the compile would silently ship the previous
        // revision, and the save's own failure toast already told the user why.
        return;
      }

      const url = await resumeApi.generatePdf(id!);

      const current = watch();
      triggerDownload(
        url,
        buildResumeFileName(current.personalInfo?.fullName, current.title),
      );

      // Revoke blob URL after a delay to allow the browser to read it
      setTimeout(() => resumeApi.revokePdfUrl(url), 60000);
    } catch (error) {
      if (isReportedError(error)) {
        // The axios interceptor already toasted this failure (and the parsed
        // PDF error is rethrown flagged as reported) — a second toast here
        // would just repeat it.
        console.error("PDF download failed:", error);
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to download PDF",
        );
      }
    } finally {
      setDownloading(false);
    }
  };

  // Navigation for Stepper
  const nextStep = () =>
    setActiveStep((prev) => Math.min(prev + 1, STEP_COUNT - 1));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (step: number) => setActiveStep(step);

  return {
    // Form
    formData,
    control,
    register,
    handleSubmit,
    handleSubmitError,
    setValue,
    watch,
    onSubmit,
    formState,

    // State
    loading,
    saving,
    downloading,
    activeStep,

    // Modals State
    isAIModalOpen,
    setIsAIModalOpen,
    isAnalyzing,
    aiResult,
    atsModalOpen,
    setAtsModalOpen,
    atsResult,
    atsLoading,
    shareModalOpen,
    setShareModalOpen,
    isPublic,
    shareId,
    clModalOpen,
    setClModalOpen,
    aiCoachOpen,
    setAiCoachOpen,

    // ATS Job Description
    atsJobDescription,
    setAtsJobDescription,

    // Actions
    handleAnalyze,
    handleToggleVisibility,
    handleATSCheck,
    handleDownload,
    nextStep,
    prevStep,
    goToStep,

    // Field Arrays
    experienceFieldArray,
    educationFieldArray,
    skillsFieldArray,
    projectsFieldArray,
    certificationsFieldArray,
    profileLinksFieldArray,
    getValues,
  };
};
