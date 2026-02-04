import React from "react";
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

export const ResumeFormSections: React.FC<ResumeFormSectionsProps> = ({
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
}) => {
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
              <label className="form-label block text-sm font-medium text-slate-700 mb-1">
                Resume Title
              </label>
              <input
                {...register("title", { required: true })}
                className="form-input w-full p-2 border rounded-lg"
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
                  const event = { target: { name: "templateId", value: id } };
                  register("templateId").onChange(event as any);
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
                      onClick={() =>
                        setValue("customization.primaryColor", c.val, {
                          shouldDirty: true,
                        })
                      }
                      className={`w-8 h-8 rounded-full border-2 ${watch("customization.primaryColor") === c.val ? "border-slate-900 scale-110" : "border-transparent"}`}
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
                    className={`px-3 py-1 rounded borderText font-serif ${watch("customization.fontFamily") === "serif" ? "bg-slate-800 text-white" : "bg-white"}`}
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
                    className={`px-3 py-1 rounded border font-sans ${watch("customization.fontFamily") === "sans" ? "bg-slate-800 text-white" : "bg-white"}`}
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
            <input
              {...register("personalInfo.fullName")}
              className="form-input p-2 border rounded"
              placeholder="Full Name"
            />
            <input
              {...register("personalInfo.email")}
              className="form-input p-2 border rounded"
              placeholder="Email"
            />
            <input
              {...register("personalInfo.phone")}
              className="form-input p-2 border rounded"
              placeholder="Phone"
            />
            <input
              {...register("personalInfo.location")}
              className="form-input p-2 border rounded"
              placeholder="Location"
            />
            <input
              {...register("personalInfo.linkedin")}
              className="form-input p-2 border rounded"
              placeholder="LinkedIn URL"
            />
            <input
              {...register("personalInfo.github")}
              className="form-input p-2 border rounded"
              placeholder="GitHub URL"
            />
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
        <textarea
          {...register("summary")}
          className="form-input w-full p-3 border rounded min-h-[150px]"
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
                <input
                  {...register(`experience.${index}.company`)}
                  className="form-input p-2 border rounded"
                  placeholder="Company"
                />
                <input
                  {...register(`experience.${index}.position`)}
                  className="form-input p-2 border rounded"
                  placeholder="Position"
                />
                <input
                  {...register(`experience.${index}.location`)}
                  className="form-input p-2 border rounded"
                  placeholder="Location"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register(`experience.${index}.startDate`)}
                    className="form-input p-2 border rounded"
                    placeholder="Start Date"
                  />
                  <input
                    {...register(`experience.${index}.endDate`)}
                    className="form-input p-2 border rounded"
                    placeholder="End Date"
                  />
                </div>
              </div>
              {/* Note: We handle array-string conversion in hook onSubmit, here we bind to unknown for simplicity but better to manage as text */}
              <textarea
                {...register(`experience.${index}.description` as any)}
                className="form-input w-full p-2 border rounded h-24"
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
                <input
                  {...register(`education.${index}.institution`)}
                  className="form-input p-2 border rounded"
                  placeholder="Institution"
                />
                <input
                  {...register(`education.${index}.degree`)}
                  className="form-input p-2 border rounded"
                  placeholder="Degree"
                />
                <input
                  {...register(`education.${index}.field`)}
                  className="form-input p-2 border rounded"
                  placeholder="Field of Study"
                />
                <input
                  {...register(`education.${index}.location`)}
                  className="form-input p-2 border rounded"
                  placeholder="Location"
                />
                <input
                  {...register(`education.${index}.startDate`)}
                  className="form-input p-2 border rounded"
                  placeholder="Start Date"
                />
                <input
                  {...register(`education.${index}.endDate`)}
                  className="form-input p-2 border rounded"
                  placeholder="End Date"
                />
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
                <input
                  {...register(`skills.${index}.category`)}
                  className="form-input p-2 border rounded"
                  placeholder="Category (e.g. Languages)"
                />
                <input
                  {...register(`skills.${index}.skills` as any)}
                  className="form-input p-2 border rounded"
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
                <input
                  {...register(`projects.${index}.name`)}
                  className="form-input p-2 border rounded"
                  placeholder="Project Name"
                />
                <input
                  {...register(`projects.${index}.technologies` as any)}
                  className="form-input p-2 border rounded"
                  placeholder="Technologies (comma separated)"
                />
                <input
                  {...register(`projects.${index}.sourceCode`)}
                  className="form-input p-2 border rounded"
                  placeholder="Source Code URL"
                />
                <input
                  {...register(`projects.${index}.liveUrl`)}
                  className="form-input p-2 border rounded"
                  placeholder="Live Demo URL"
                />
              </div>
              <textarea
                {...register(`projects.${index}.description`)}
                className="form-input w-full p-2 border rounded h-20"
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
                <input
                  {...register(`certifications.${index}.name`)}
                  className="form-input p-2 border rounded"
                  placeholder="Certification Name"
                />
                <input
                  {...register(`certifications.${index}.issuer`)}
                  className="form-input p-2 border rounded"
                  placeholder="Issuer Organization"
                />
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
