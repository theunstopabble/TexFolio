import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import type { ResumeFormData } from "../types";
import TemplateSelector from "../../../components/TemplateSelector";
// Unused imports from dnd-kit removed
import { AIWriterButton } from "./AIWriterButton"; // We will create this next

// Props definition
interface ResumeFormSectionsProps {
  activeStep: number;
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;

  // Field Arrays
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
  // 0: Basics (Title, Template, Personal Info)
  if (activeStep === 0) {
    return (
      <div className="space-y-6">
        {/* Settings */}
        <div className="card shadow-lg p-6 bg-white rounded-xl">
          <h2 className="card-title mb-4 text-xl font-bold flex items-center gap-2">
            📋 Resume Settings
          </h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="resumeTitle" className="form-label block text-sm font-medium text-slate-700 mb-1">
                Resume Title
              </label>
              <input
                id="resumeTitle"
                {...register("title", { required: true })}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Software Engineer Resume"
              />
            </div>

            <div>
              <label className="form-label mb-2 block text-sm font-medium text-slate-700">
                Design Template
              </label>
              <TemplateSelector
                currentTemplate={watch("templateId")}
                onSelect={(id) => {
                  const event = {
                    target: { name: "templateId", value: id },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  register("templateId").onChange(event);
                }}
              />
              <input type="hidden" {...register("templateId")} />
            </div>

            {/* Color/Font Customization if Premium */}
            {watch("templateId") === "premium" && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-3 mb-4">
                  {[
                    { name: "Blue", val: "#2563EB" },
                    { name: "Green", val: "#059669" },
                    { name: "Purple", val: "#7C3AED" },
                    { name: "Red", val: "#DC2626" },
                    { name: "Black", val: "#1F2937" },
                  ].map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      aria-label={`Select ${c.name} color`}
                      onClick={() =>
                        setValue("customization.primaryColor", c.val, {
                          shouldDirty: true,
                        })
                      }
                      className={`w-8 h-8 rounded-full border-2 ${
                        watch("customization.primaryColor") === c.val
                          ? "border-slate-900 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.val }}
                    />
                  ))}
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Font Style
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setValue("customization.fontFamily", "serif", {
                        shouldDirty: true,
                      })
                    }
                    className={`px-3 py-1 rounded borderText font-serif ${
                      watch("customization.fontFamily") === "serif"
                        ? "bg-slate-800 text-white"
                        : "bg-white"
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setValue("customization.fontFamily", "sans", {
                        shouldDirty: true,
                      })
                    }
                    className={`px-3 py-1 rounded border font-sans ${
                      watch("customization.fontFamily") === "sans"
                        ? "bg-slate-800 text-white"
                        : "bg-white"
                    }`}
                  >
                    Sans
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Info */}
        <div className="card shadow-lg p-6 bg-white rounded-xl">
          <h2 className="card-title mb-4 text-xl font-bold flex items-center gap-2">
            👤 Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                id="fullName"
                {...register("personalInfo.fullName")}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                id="email"
                {...register("personalInfo.email")}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. john@example.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                id="phone"
                {...register("personalInfo.phone")}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. +1 555-1234"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                id="location"
                {...register("personalInfo.location")}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
              <input
                id="linkedin"
                {...register("personalInfo.linkedin")}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
              <input
                id="github"
                {...register("personalInfo.github")}
                className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1: Summary
  if (activeStep === 1) {
    return (
      <div className="card shadow-lg p-6 bg-white rounded-xl">
        <h2 className="card-title mb-4 text-xl font-bold">
          📝 Professional Summary
        </h2>
        <AIWriterButton
          type="improve"
          originalText={watch("summary")}
          onResult={(text) => setValue("summary", text, { shouldDirty: true })}
        />
        <label htmlFor="summary" className="sr-only">Professional Summary</label>
        <textarea
          id="summary"
          {...register("summary")}
          className="form-input w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
          placeholder="Write a brief professional summary..."
        />
      </div>
    );
  }

  // 2: Experience
  if (activeStep === 2) {
    return (
      <div className="card shadow-lg p-6 bg-white rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-bold">💼 Experience</h2>
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
            className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
          >
            {" "}
            + Add Job{" "}
          </button>
        </div>
        <div className="space-y-6">
          {expFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">
                  Experience #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeExp(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor={`exp-company-${index}`} className="sr-only">Company</label>
                  <input
                    id={`exp-company-${index}`}
                    {...register(`experience.${index}.company`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Company"
                  />
                </div>
                <div>
                  <label htmlFor={`exp-position-${index}`} className="sr-only">Position</label>
                  <input
                    id={`exp-position-${index}`}
                    {...register(`experience.${index}.position`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Position"
                  />
                </div>
                <div>
                  <label htmlFor={`exp-location-${index}`} className="sr-only">Location</label>
                  <input
                    id={`exp-location-${index}`}
                    {...register(`experience.${index}.location`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Location"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`exp-start-${index}`} className="sr-only">Start Date</label>
                    <input
                      id={`exp-start-${index}`}
                      {...register(`experience.${index}.startDate`)}
                      className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start Date"
                    />
                  </div>
                  <div>
                    <label htmlFor={`exp-end-${index}`} className="sr-only">End Date</label>
                    <input
                      id={`exp-end-${index}`}
                      {...register(`experience.${index}.endDate`)}
                      className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End Date"
                    />
                  </div>
                </div>
              </div>
              <label htmlFor={`exp-desc-${index}`} className="sr-only">Description</label>
              <textarea
                id={`exp-desc-${index}`}
                {...register(
                  `experience.${index}.description` as `experience.${number}.description`,
                )}
                className="form-input w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="Description (bullets will be split by new line)"
              />
            </div>
          ))}
          {expFields.length === 0 && (
            <p className="text-center text-slate-500 py-4">
              No experience added yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  // 3: Education
  if (activeStep === 3) {
    return (
      <div className="card shadow-lg p-6 bg-white rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-bold">🎓 Education</h2>
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
            className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
          >
            {" "}
            + Add Education{" "}
          </button>
        </div>
        <div className="space-y-6">
          {eduFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">
                  Education #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEdu(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`edu-institution-${index}`} className="sr-only">Institution</label>
                  <input
                    id={`edu-institution-${index}`}
                    {...register(`education.${index}.institution`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Institution"
                  />
                </div>
                <div>
                  <label htmlFor={`edu-degree-${index}`} className="sr-only">Degree</label>
                  <input
                    id={`edu-degree-${index}`}
                    {...register(`education.${index}.degree`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Degree"
                  />
                </div>
                <div>
                  <label htmlFor={`edu-field-${index}`} className="sr-only">Field of Study</label>
                  <input
                    id={`edu-field-${index}`}
                    {...register(`education.${index}.field`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Field of Study"
                  />
                </div>
                <div>
                  <label htmlFor={`edu-location-${index}`} className="sr-only">Location</label>
                  <input
                    id={`edu-location-${index}`}
                    {...register(`education.${index}.location`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label htmlFor={`edu-start-${index}`} className="sr-only">Start Date</label>
                  <input
                    id={`edu-start-${index}`}
                    {...register(`education.${index}.startDate`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Start Date"
                  />
                </div>
                <div>
                  <label htmlFor={`edu-end-${index}`} className="sr-only">End Date</label>
                  <input
                    id={`edu-end-${index}`}
                    {...register(`education.${index}.endDate`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>
          ))}
          {eduFields.length === 0 && (
            <p className="text-center text-slate-500 py-4">
              No education added yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  // 4: Skills
  if (activeStep === 4) {
    return (
      <div className="card shadow-lg p-6 bg-white rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-bold">🛠️ Skills</h2>
          <button
            type="button"
            onClick={() => appendSkill({ category: "", skills: [] })}
            className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
          >
            {" "}
            + Add Category{" "}
          </button>
        </div>
        <div className="space-y-4">
          {skillFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">
                  Skill Category #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`skill-cat-${index}`} className="sr-only">Category</label>
                  <input
                    id={`skill-cat-${index}`}
                    {...register(`skills.${index}.category`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Category (e.g. Languages)"
                  />
                </div>
                <div>
                  <label htmlFor={`skill-list-${index}`} className="sr-only">Skills</label>
                  <input
                    id={`skill-list-${index}`}
                    {...register(
                      `skills.${index}.skills` as `skills.${number}.skills`
                    )}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Skills (comma separated)"
                  />
                </div>
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
    );
  }

  // 5: Projects
  if (activeStep === 5) {
    return (
      <div className="card shadow-lg p-6 bg-white rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-bold">🚀 Projects</h2>
          <button
            type="button"
            onClick={() =>
              appendProj({ name: "", description: "", technologies: [] })
            }
            className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
          >
            {" "}
            + Add Project{" "}
          </button>
        </div>
        <div className="space-y-6">
          {projFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">
                  Project #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeProj(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor={`proj-name-${index}`} className="sr-only">Project Name</label>
                  <input
                    id={`proj-name-${index}`}
                    {...register(`projects.${index}.name`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project Name"
                  />
                </div>
                <div>
                  <label htmlFor={`proj-tech-${index}`} className="sr-only">Technologies</label>
                  <input
                    id={`proj-tech-${index}`}
                    {...register(
                      `projects.${index}.technologies` as `projects.${number}.technologies`
                    )}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Technologies (comma separated)"
                  />
                </div>
                <div>
                  <label htmlFor={`proj-source-${index}`} className="sr-only">Source Code URL</label>
                  <input
                    id={`proj-source-${index}`}
                    {...register(`projects.${index}.sourceCode`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Source Code URL"
                  />
                </div>
                <div>
                  <label htmlFor={`proj-live-${index}`} className="sr-only">Live Demo URL</label>
                  <input
                    id={`proj-live-${index}`}
                    {...register(`projects.${index}.liveUrl`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Live Demo URL"
                  />
                </div>
              </div>
              <label htmlFor={`proj-desc-${index}`} className="sr-only">Project Description</label>
              <textarea
                id={`proj-desc-${index}`}
                {...register(`projects.${index}.description`)}
                className="form-input w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                placeholder="Project Description"
              />
            </div>
          ))}
          {projFields.length === 0 && (
            <p className="text-center text-slate-500 py-4">
              No projects added yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  // 6: Certifications
  if (activeStep === 6) {
    return (
      <div className="card shadow-lg p-6 bg-white rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-bold">🏆 Certifications</h2>
          <button
            type="button"
            onClick={() => appendCert({ name: "", issuer: "" })}
            className="btn btn-sm btn-secondary bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-sm"
          >
            {" "}
            + Add Cert{" "}
          </button>
        </div>
        <div className="space-y-4">
          {certFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">
                  Certification #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeCert(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`cert-name-${index}`} className="sr-only">Certification Name</label>
                  <input
                    id={`cert-name-${index}`}
                    {...register(`certifications.${index}.name`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Certification Name"
                  />
                </div>
                <div>
                  <label htmlFor={`cert-issuer-${index}`} className="sr-only">Issuer</label>
                  <input
                    id={`cert-issuer-${index}`}
                    {...register(`certifications.${index}.issuer`)}
                    className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Issuer Organization"
                  />
                </div>
              </div>
            </div>
          ))}
          {certFields.length === 0 && (
            <p className="text-center text-slate-500 py-4">
              No certifications added.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};
