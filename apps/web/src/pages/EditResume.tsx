import { useState, useEffect } from "react";
// Force HMR Update
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { resumeApi } from "../services/api";
import toast from "react-hot-toast";
import ResumePreview from "../components/ResumePreview";
import { analyzeResume } from "../services/ai";
import type { AIAnalysisResult } from "../services/ai";
import AIAnalysisModal from "../components/AIAnalysisModal";

// Types (same as CreateResume)
interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface Skill {
  category: string;
  skills: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  sourceCode?: string;
  liveUrl?: string;
}

interface Certification {
  name: string;
  issuer: string;
}

interface ResumeFormData {
  title: string;
  templateId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

const EditResume = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // AI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    try {
      const result = await analyzeResume(watch());
      setAiResult(result);
    } catch (error) {
      toast.error("Failed to analyze resume. Please try again.");
      setAiResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { register, control, handleSubmit, reset, watch } =
    useForm<ResumeFormData>();
  const formData = watch();

  // Field Arrays
  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({ control, name: "experience" });
  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({ control, name: "education" });
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: "skills" });
  const {
    fields: projFields,
    append: appendProj,
    remove: removeProj,
  } = useFieldArray({ control, name: "projects" });
  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({ control, name: "certifications" });

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await resumeApi.getById(id!);
        const data = response.data.data;

        // Reset form with fetched data
        reset({
          title: data.title,
          templateId: data.templateId,
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
      navigate("/resumes");
    } catch (error) {
      console.error("Error updating resume:", error);
      toast.error("Failed to update resume");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const url = await resumeApi.generatePdf(id!);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-4xl animate-spin mb-4">⏳</div>
        <p className="text-slate-600">Loading resume...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Edit Resume</h1>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="btn btn-secondary">
            📥 Download PDF
          </button>
          <button
            onClick={() => navigate("/resumes")}
            className="btn btn-secondary"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="card shadow-lg">
              <h2 className="card-title mb-4">📋 Resume Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Resume Title</label>
                  <input
                    {...register("title", { required: true })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Template</label>
                  <select {...register("templateId")} className="form-input">
                    <option value="premium">Premium</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="card shadow-lg">
              <h2 className="card-title mb-4">👤 Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  {...register("personalInfo.fullName")}
                  className="form-input"
                  placeholder="Full Name"
                />
                <input
                  {...register("personalInfo.email")}
                  className="form-input"
                  placeholder="Email"
                />
                <input
                  {...register("personalInfo.phone")}
                  className="form-input"
                  placeholder="Phone"
                />
                <input
                  {...register("personalInfo.location")}
                  className="form-input"
                  placeholder="Location"
                />
                <input
                  {...register("personalInfo.linkedin")}
                  className="form-input"
                  placeholder="LinkedIn URL"
                />
                <input
                  {...register("personalInfo.github")}
                  className="form-input"
                  placeholder="GitHub URL"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="card shadow-lg">
              <h2 className="card-title mb-4">📝 Professional Summary</h2>
              <textarea
                {...register("summary")}
                className="form-input min-h-[120px]"
                placeholder="Your professional summary..."
              />
            </div>

            {/* Experience */}
            <div className="card shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">💼 Experience</h2>
                <button
                  type="button"
                  onClick={() =>
                    appendExp({
                      company: "",
                      position: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      description: [],
                    })
                  }
                  className="btn btn-secondary text-sm"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {expFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        Experience #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExp(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        {...register(`experience.${index}.company`)}
                        className="form-input"
                        placeholder="Company"
                      />
                      <input
                        {...register(`experience.${index}.position`)}
                        className="form-input"
                        placeholder="Position"
                      />
                      <input
                        {...register(`experience.${index}.location`)}
                        className="form-input"
                        placeholder="Location"
                      />
                      <input
                        {...register(`experience.${index}.startDate`)}
                        className="form-input"
                        placeholder="Start Date"
                      />
                      <input
                        {...register(`experience.${index}.endDate`)}
                        className="form-input"
                        placeholder="End Date"
                      />
                    </div>
                    <textarea
                      {...register(`experience.${index}.description` as any)}
                      className="form-input"
                      placeholder="Description (one per line)"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="card shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">🎓 Education</h2>
                <button
                  type="button"
                  onClick={() =>
                    appendEdu({
                      institution: "",
                      degree: "",
                      field: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                    })
                  }
                  className="btn btn-secondary text-sm"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {eduFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        Education #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEdu(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        {...register(`education.${index}.institution`)}
                        className="form-input"
                        placeholder="Institution"
                      />
                      <input
                        {...register(`education.${index}.degree`)}
                        className="form-input"
                        placeholder="Degree"
                      />
                      <input
                        {...register(`education.${index}.field`)}
                        className="form-input"
                        placeholder="Field"
                      />
                      <input
                        {...register(`education.${index}.location`)}
                        className="form-input"
                        placeholder="Location"
                      />
                      <input
                        {...register(`education.${index}.startDate`)}
                        className="form-input"
                        placeholder="Start Date"
                      />
                      <input
                        {...register(`education.${index}.endDate`)}
                        className="form-input"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="card shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">🛠️ Skills</h2>
                <button
                  type="button"
                  onClick={() => appendSkill({ category: "", skills: [] })}
                  className="btn btn-secondary text-sm"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {skillFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Skill #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        {...register(`skills.${index}.category`)}
                        className="form-input"
                        placeholder="Category"
                      />
                      <input
                        {...register(`skills.${index}.skills` as any)}
                        className="form-input"
                        placeholder="Skills (comma separated)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="card shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">🚀 Projects</h2>
                <button
                  type="button"
                  onClick={() =>
                    appendProj({ name: "", description: "", technologies: [] })
                  }
                  className="btn btn-secondary text-sm"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {projFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Project #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeProj(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        {...register(`projects.${index}.name`)}
                        className="form-input"
                        placeholder="Project Name"
                      />
                      <input
                        {...register(`projects.${index}.technologies` as any)}
                        className="form-input"
                        placeholder="Technologies (comma separated)"
                      />
                      <input
                        {...register(`projects.${index}.sourceCode`)}
                        className="form-input"
                        placeholder="Source Code URL"
                      />
                      <input
                        {...register(`projects.${index}.liveUrl`)}
                        className="form-input"
                        placeholder="Live Demo URL"
                      />
                    </div>
                    <textarea
                      {...register(`projects.${index}.description`)}
                      className="form-input"
                      placeholder="Description"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="card shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">🏆 Certifications</h2>
                <button
                  type="button"
                  onClick={() => appendCert({ name: "", issuer: "" })}
                  className="btn btn-secondary text-sm"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {certFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Cert #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCert(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        {...register(`certifications.${index}.name`)}
                        className="form-input"
                        placeholder="Certification Name"
                      />
                      <input
                        {...register(`certifications.${index}.issuer`)}
                        className="form-input"
                        placeholder="Issuer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/resumes")}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? "⏳ Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview (Sticky) */}
        <div className="hidden lg:block sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto rounded-xl shadow-2xl bg-slate-800 p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              👀 Live Preview
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-normal">
                {formData.templateId === "premium" ? "Premium" : "Classic"}
              </span>
            </h3>
            <span className="text-xs text-slate-400 hidden xl:inline">
              Updates automatically
            </span>
            <button
              onClick={handleAnalyze}
              className="ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm flex items-center gap-1 transition-all"
            >
              ✨ AI Analyze
            </button>
          </div>
          <ResumePreview data={formData as unknown as any} />

          <AIAnalysisModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            isLoading={isAnalyzing}
            result={aiResult}
          />
        </div>
      </div>
    </div>
  );
};

export default EditResume;
