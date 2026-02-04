import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { resumeApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ResumePreview from "../components/ResumePreview";
import LinkedInImport from "../components/LinkedInImport";

// --- Types ---
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

// --- Steps Configuration ---
const STEPS = [
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

const CreateResume = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Format date from YYYY-MM to "Mon Year" format
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    // If already in readable format, return as is
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

  // Pre-fill user data
  const { user } = useAuth(); // Using our custom hook which now wraps Clerk

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm<ResumeFormData>({
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

  // Navigation Logic
  const handleNext = async () => {
    const fields = STEPS[currentStep].fields;
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

  const handleImportSuccess = (data: any) => {
    console.log("📥 LinkedIn Import Data:", data);
    // reset form with imported data - map all fields correctly
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
    // Move to profile step to review
    setCurrentStep(1);
  };

  const onSubmit = async (data: ResumeFormData) => {
    try {
      setLoading(true);
      // Transform and filter data
      const formattedData = {
        ...data,
        // Filter out empty experiences and format dates
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
        // Filter out empty education and format dates
        education: data.education
          .filter((e) => e.institution && e.degree)
          .map((e) => ({
            ...e,
            startDate: formatDate(e.startDate),
            endDate: formatDate(e.endDate),
          })),
        // Filter out empty skills
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
        // Filter out empty projects
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
        // Filter out empty certifications
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

  // --- Success View ---
  if (success && resumeId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          You're All Set!
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Your professional resume has been generated. <br />
          Click below to download or view it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={downloadPdf}
            className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
          >
            📥 Download PDF Resume
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              setResumeId(null);
              setCurrentStep(0);
            }}
            className="btn btn-secondary text-lg px-8 py-4"
          >
            🔄 Create Another
          </button>
        </div>
      </div>
    );
  }

  // --- Main Form View ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Progress */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Create Your Resume
        </h1>

        {/* Progress Bar */}
        <div className="hidden md:flex justify-between items-center relative mb-8 px-4 max-w-4xl mx-auto">
          {/* Line background */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded"></div>
          {/* Line progress */}
          <div
            className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-10 rounded transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                            ${isActive ? "bg-blue-600 text-white border-blue-600 scale-110 shadow-md" : ""}
                            ${isCompleted ? "bg-blue-600 text-white border-blue-600" : ""}
                            ${!isActive && !isCompleted ? "bg-white text-slate-400 border-slate-300" : ""}
                        `}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-slate-500"}`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="md:hidden flex justify-between items-center text-sm font-medium text-slate-600 bg-slate-100 p-3 rounded-lg">
          <span>
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-blue-600">{STEPS[currentStep].title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="space-y-6">
          <form className="space-y-6">
            {/* Step 1: Basics */}
            {currentStep === 0 && (
              <div className="card animate-fade-in shadow-lg">
                <h2 className="card-title mb-6">📋 Resume Settings</h2>

                {/* LinkedIn Import Option */}
                <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <LinkedInImport onImportSuccess={handleImportSuccess} />
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">
                      Or start manually
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="form-group">
                    <label className="form-label">Resume Title</label>
                    <input
                      {...register("title", { required: true })}
                      className="form-input"
                      placeholder="e.g. Frontend Developer Resume"
                    />
                    {errors.title && (
                      <span className="text-red-500 text-sm">Required</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Template</label>
                    <select {...register("templateId")} className="form-input">
                      <option value="premium">Premium (Recommended)</option>
                      <option value="classic">Classic</option>
                      <option value="faangpath">FAANGPath Pro 🚀</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Profile */}
            {currentStep === 1 && (
              <div className="card animate-fade-in shadow-lg">
                <h2 className="card-title mb-6">👤 Personal Information</h2>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      {...register("personalInfo.fullName", { required: true })}
                      className="form-input"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      {...register("personalInfo.email", { required: true })}
                      type="email"
                      className="form-input"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <input
                        {...register("personalInfo.phone", { required: true })}
                        className="form-input"
                        placeholder="+91..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location *</label>
                      <input
                        {...register("personalInfo.location", {
                          required: true,
                        })}
                        className="form-input"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">LinkedIn</label>
                      <input
                        {...register("personalInfo.linkedin")}
                        className="form-input"
                        placeholder="username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GitHub</label>
                      <input
                        {...register("personalInfo.github")}
                        className="form-input"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {currentStep === 2 && (
              <div className="card animate-fade-in shadow-lg">
                <h2 className="card-title mb-6">📝 Professional Summary</h2>
                <div className="form-group">
                  <label className="form-label">Summary</label>
                  <textarea
                    {...register("summary")}
                    className="form-input min-h-[200px]"
                    placeholder="Detail your professional background, key achievements, and career goals here..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Education */}
            {currentStep === 3 && (
              <div className="card animate-fade-in shadow-lg">
                <div className="flex justify-between items-center mb-6">
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
                    + Add Education
                  </button>
                </div>
                <div className="space-y-6">
                  {eduFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between mb-4">
                        <span className="font-semibold text-slate-700">
                          Education #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEdu(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          {...register(`education.${index}.institution`)}
                          className="form-input"
                          placeholder="Institution / University"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            {...register(`education.${index}.degree`)}
                            className="form-input"
                            placeholder="Degree"
                          />
                          <input
                            {...register(`education.${index}.field`)}
                            className="form-input"
                            placeholder="Field of Study"
                          />
                        </div>
                        <input
                          {...register(`education.${index}.location`)}
                          className="form-input"
                          placeholder="Location"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500">
                              Start Date
                            </label>
                            <input
                              type="month"
                              {...register(`education.${index}.startDate`)}
                              className="form-input"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              End Date
                            </label>
                            <input
                              type="month"
                              {...register(`education.${index}.endDate`)}
                              className="form-input"
                            />
                          </div>
                        </div>
                        <input
                          {...register(`education.${index}.gpa`)}
                          className="form-input"
                          placeholder="GPA / CGPA (Optional)"
                        />
                      </div>
                    </div>
                  ))}
                  {eduFields.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      No education details added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Experience */}
            {currentStep === 4 && (
              <div className="card animate-fade-in shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="card-title">💼 Work Experience</h2>
                  <button
                    type="button"
                    onClick={() =>
                      appendExp({
                        company: "",
                        position: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        description: [""],
                      })
                    }
                    className="btn btn-secondary text-sm"
                  >
                    + Add Experience
                  </button>
                </div>
                <div className="space-y-6">
                  {expFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between mb-4">
                        <span className="font-semibold text-slate-700">
                          Experience #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExp(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          {...register(`experience.${index}.company`)}
                          className="form-input"
                          placeholder="Company Name"
                        />
                        <input
                          {...register(`experience.${index}.position`)}
                          className="form-input"
                          placeholder="Job Title"
                        />
                        <input
                          {...register(`experience.${index}.location`)}
                          className="form-input"
                          placeholder="Location"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500">
                              Start Date
                            </label>
                            <input
                              type="month"
                              {...register(`experience.${index}.startDate`)}
                              className="form-input"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">
                              End Date
                            </label>
                            <input
                              type="month"
                              {...register(`experience.${index}.endDate`)}
                              className="form-input"
                            />
                          </div>
                        </div>
                      </div>
                      <textarea
                        {...register(`experience.${index}.description` as any)}
                        className="form-input min-h-[100px] mt-3"
                        placeholder="Description (Bullet points recommended, one per line)"
                      />
                    </div>
                  ))}
                  {expFields.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      No experience details added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Skills */}
            {currentStep === 5 && (
              <div className="card animate-fade-in shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="card-title">🛠️ Technical Skills</h2>
                  <button
                    type="button"
                    onClick={() => appendSkill({ category: "", skills: [] })}
                    className="btn btn-secondary text-sm"
                  >
                    + Add Category
                  </button>
                </div>
                <div className="space-y-4">
                  {skillFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between mb-3">
                        <span className="font-semibold text-slate-700">
                          Skill Group #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          {...register(`skills.${index}.category`)}
                          className="form-input"
                          placeholder="Category (e.g. Languages)"
                        />
                        <input
                          {...register(`skills.${index}.skills` as any)}
                          className="form-input"
                          placeholder="Skills (comma separated)"
                        />
                      </div>
                    </div>
                  ))}
                  {skillFields.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      No skills added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Projects */}
            {currentStep === 6 && (
              <div className="card animate-fade-in shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="card-title">🚀 Notable Projects</h2>
                  <button
                    type="button"
                    onClick={() =>
                      appendProj({
                        name: "",
                        description: "",
                        technologies: [],
                      })
                    }
                    className="btn btn-secondary text-sm"
                  >
                    + Add Project
                  </button>
                </div>
                <div className="space-y-6">
                  {projFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between mb-3">
                        <span className="font-semibold text-slate-700">
                          Project #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProj(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="form-input min-h-[80px]"
                          placeholder="Brief description of the project..."
                        />
                      </div>
                    </div>
                  ))}
                  {projFields.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      No projects added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 8: Certifications */}
            {currentStep === 7 && (
              <div className="card animate-fade-in shadow-lg">
                <div className="flex justify-between items-center mb-6">
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
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-slate-700">
                          Cert #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCert(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
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
                  {certFields.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      No certifications added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <div>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-secondary px-6"
                  >
                    ← Back
                  </button>
                )}
              </div>
              <div>
                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary px-8"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                    className="btn btn-primary px-8 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Generating..." : "✨ Generate Resume"}
                  </button>
                )}
              </div>
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
            <span className="text-xs text-slate-400">
              Updates automatically
            </span>
          </div>
          <ResumePreview data={formData as unknown as any} />
        </div>
      </div>
    </div>
  );
};

export default CreateResume;
