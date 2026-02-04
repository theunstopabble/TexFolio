import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { resumeApi, aiApi } from "../../../services/api";
import { analyzeResume } from "../../../services/ai";
import toast from "react-hot-toast";
import type { ResumeFormData, ATSAnalysisResult } from "../types";

export const useResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stepper State
  const [activeStep, setActiveStep] = useState(0);

  // AI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<ATSAnalysisResult | null>(null);

  // ATS State
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [atsResult, setAtsResult] = useState<any>(null);
  const [atsLoading, setAtsLoading] = useState(false);

  // Share State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState("");

  // Modals
  const [clModalOpen, setClModalOpen] = useState(false);
  const [aiCoachOpen, setAiCoachOpen] = useState(false);

  // Form Setup
  const { register, control, handleSubmit, reset, watch, setValue } =
    useForm<ResumeFormData>();
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

  // Load Data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await resumeApi.getById(id!);
        const data = response.data.data;

        reset({
          title: data.title,
          templateId: data.templateId || "classic",
          customization: data.customization || {
            primaryColor: "#2563EB",
            fontFamily: "serif",
          },
          sectionOrder: data.sectionOrder || [
            "summary",
            "experience",
            "education",
            "skills",
            "projects",
            "certifications",
          ],
          personalInfo: data.personalInfo,
          summary: data.summary || "",
          experience: data.experience || [],
          education: data.education || [],
          skills:
            data.skills?.map((s: any) => ({
              ...s,
              skills: s.skills?.join(", ") || "",
            })) || [],
          projects:
            data.projects?.map((p: any) => ({
              ...p,
              technologies: p.technologies?.join(", ") || "",
            })) || [],
          certifications: data.certifications || [],
        });

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
  const onSubmit = async (data: ResumeFormData) => {
    try {
      setSaving(true);
      const formattedData = {
        ...data,
        experience: data.experience.map((e) => ({
          ...e,
          description:
            typeof e.description === "string"
              ? (e.description as unknown as string)
                  .split("\n")
                  .filter((d) => d.trim())
              : e.description,
        })),
        skills: data.skills.map((s) => ({
          category: s.category,
          skills:
            typeof s.skills === "string"
              ? (s.skills as unknown as string)
                  .split(",")
                  .map((sk) => sk.trim())
              : s.skills,
        })),
        projects: data.projects.map((p) => ({
          ...p,
          technologies:
            typeof p.technologies === "string"
              ? (p.technologies as unknown as string)
                  .split(",")
                  .map((t) => t.trim())
              : p.technologies,
        })),
      };

      await resumeApi.update(id!, formattedData);
      toast.success("Resume updated successfully! 🎉");
      // navigate("/resumes"); // Don't navigate away, let user keep editing
    } catch (error) {
      console.error("Error updating resume:", error);
      toast.error("Failed to update resume");
    } finally {
      setSaving(false);
    }
  };

  // Handlers
  const handleAnalyze = async () => {
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    try {
      const result = await analyzeResume(watch());
      setAiResult(result);
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  const handleATSCheck = async () => {
    try {
      setAtsLoading(true);
      setAtsModalOpen(true);
      const data = watch();
      const { _id, ...cleanData } = data as any;
      const res = await aiApi.checkATSScore({ resumeData: cleanData });
      setAtsResult(res.data.data);
    } catch (error) {
      toast.error("Failed to analyze resume");
      setAtsModalOpen(false);
    } finally {
      setAtsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const url = await resumeApi.generatePdf(id!);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  // Navigation for Stepper
  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 6)); // 0-6 steps
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (step: number) => setActiveStep(step);

  return {
    // Form
    formData,
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    onSubmit,

    // State
    loading,
    saving,
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
  };
};
