import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { resumeApi } from "../../services/api";
import toast from "react-hot-toast";
import type { ResumeFormData } from "../resume-editor/types";

// --- Configuration ---
export const STEPS = [
  { id: "basics", title: "Basics", fields: ["title", "templateId"] },
  {
    id: "profile",
    title: "Profile",
    fields: [
      "personalInfo.fullName",
      "personalInfo.email",
      "personalInfo.phone",
      "personalInfo.location",
    ],
  },
  { id: "summary", title: "Summary", fields: ["summary"] },
  { id: "education", title: "Education", fields: ["education"] },
  { id: "experience", title: "Experience", fields: ["experience"] },
  { id: "skills", title: "Skills", fields: ["skills"] },
  { id: "projects", title: "Projects", fields: ["projects"] },
  { id: "certifications", title: "Certifications", fields: ["certifications"] },
];

export const useCreateResume = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const formMethods = useForm<ResumeFormData>({
    defaultValues: {
      title: "My Resume",
      templateId: "premium",
      personalInfo: {
        fullName: user?.name || "",
        email: user?.email || "",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
      },
      summary: "",
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

  const { control, handleSubmit, trigger, watch, reset } = formMethods;
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

  // Helpers
  const formatDate = (dateStr: string): string => {
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
  const handleNext = async () => {
    const fields = STEPS[currentStep].fields;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStepValid = await trigger(fields as any);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImportSuccess = (data: any) => {
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
        data.experience?.length > 0 ? data.experience : formData.experience,
      education:
        data.education?.length > 0 ? data.education : formData.education,
      skills: data.skills?.length > 0 ? data.skills : formData.skills,
      projects: data.projects?.length > 0 ? data.projects : formData.projects,
      certifications:
        data.certifications?.length > 0
          ? data.certifications
          : formData.certifications,
    });
    setCurrentStep(1); // Move to profile step
  };

  const onSubmit = async (data: ResumeFormData) => {
    try {
      setLoading(true);
      const formattedData = {
        ...data,
        experience: data.experience
          .filter((e) => e.company && e.position)
          .map((e) => ({
            ...e,
            startDate: formatDate(e.startDate),
            endDate: formatDate(e.endDate),
            description:
              typeof e.description === "string"
                ? (e.description as unknown as string)
                    .split("\n")
                    .filter((d) => d.trim())
                : e.description,
          })),
        education: data.education
          .filter((e) => e.institution && e.degree)
          .map((e) => ({
            ...e,
            startDate: formatDate(e.startDate),
            endDate: formatDate(e.endDate),
          })),
        skills: data.skills
          .filter((s) => s.category)
          .map((s) => ({
            category: s.category,
            skills:
              typeof s.skills === "string"
                ? (s.skills as unknown as string)
                    .split(",")
                    .map((sk) => sk.trim())
                : s.skills,
          })),
        projects: data.projects
          .filter((p) => p.name)
          .map((p) => ({
            ...p,
            technologies:
              typeof p.technologies === "string"
                ? (p.technologies as unknown as string)
                    .split(",")
                    .map((t) => t.trim())
                : p.technologies,
          })),
        certifications: data.certifications.filter((c) => c.name),
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
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error opening PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSuccess(false);
    setResumeId(null);
    setCurrentStep(0);
    reset(); // Reset form too
  };

  return {
    currentStep,
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
    },
    actions: {
      handleNext,
      handleBack,
      handleImportSuccess,
      onSubmit: handleSubmit(onSubmit),
      downloadPdf,
      resetState,
    },
  };
};
