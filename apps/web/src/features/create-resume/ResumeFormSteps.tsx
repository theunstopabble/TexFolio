import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import type { ResumeFormData } from "../resume-editor/types";
import LinkedInImport from "../../components/LinkedInImport";

interface ResumeFormStepsProps {
  currentStep: number;
  formMethods: UseFormReturn<ResumeFormData>;
  fieldArrays: {
    experience: UseFieldArrayReturn<ResumeFormData, "experience", "id">;
    education: UseFieldArrayReturn<ResumeFormData, "education", "id">;
    skills: UseFieldArrayReturn<ResumeFormData, "skills", "id">;
    projects: UseFieldArrayReturn<ResumeFormData, "projects", "id">;
    certifications: UseFieldArrayReturn<ResumeFormData, "certifications", "id">;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onImportSuccess: (data: any) => void;
}

const ResumeFormSteps: React.FC<ResumeFormStepsProps> = ({
  currentStep,
  formMethods,
  fieldArrays,
  onImportSuccess,
}) => {
  const {
    register,
    formState: { errors },
  } = formMethods;

  return (
    <div className="space-y-6">
      {/* Step 1: Basics */}
      {currentStep === 0 && (
        <div className="card animate-fade-in shadow-lg">
          <h2 className="card-title mb-6">📋 Resume Settings</h2>

          {/* LinkedIn Import Option */}
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <LinkedInImport onImportSuccess={onImportSuccess} />
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
                fieldArrays.education.append({
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
            {fieldArrays.education.fields.map((field, index) => (
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
                    onClick={() => fieldArrays.education.remove(index)}
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
                      <label className="text-xs text-slate-500">End Date</label>
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
            {fieldArrays.education.fields.length === 0 && (
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
                fieldArrays.experience.append({
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
            {fieldArrays.experience.fields.map((field, index) => (
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
                    onClick={() => fieldArrays.experience.remove(index)}
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
                      <label className="text-xs text-slate-500">End Date</label>
                      <input
                        type="month"
                        {...register(`experience.${index}.endDate`)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
                <textarea
                  {...register(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    `experience.${index}.description` as any,
                  )}
                  className="form-input min-h-[100px] mt-3"
                  placeholder="Description (Bullet points recommended, one per line)"
                />
              </div>
            ))}
            {fieldArrays.experience.fields.length === 0 && (
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
              onClick={() =>
                fieldArrays.skills.append({ category: "", skills: [] })
              }
              className="btn btn-secondary text-sm"
            >
              + Add Category
            </button>
          </div>
          <div className="space-y-4">
            {fieldArrays.skills.fields.map((field, index) => (
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
                    onClick={() => fieldArrays.skills.remove(index)}
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
                    {...register(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      `skills.${index}.skills` as any,
                    )}
                    className="form-input"
                    placeholder="Skills (comma separated)"
                  />
                </div>
              </div>
            ))}
            {fieldArrays.skills.fields.length === 0 && (
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
                fieldArrays.projects.append({
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
            {fieldArrays.projects.fields.map((field, index) => (
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
                    onClick={() => fieldArrays.projects.remove(index)}
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
                    {...register(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      `projects.${index}.technologies` as any,
                    )}
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
            {fieldArrays.projects.fields.length === 0 && (
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
              onClick={() =>
                fieldArrays.certifications.append({ name: "", issuer: "" })
              }
              className="btn btn-secondary text-sm"
            >
              + Add
            </button>
          </div>
          <div className="space-y-4">
            {fieldArrays.certifications.fields.map((field, index) => (
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
                    onClick={() => fieldArrays.certifications.remove(index)}
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
            {fieldArrays.certifications.fields.length === 0 && (
              <p className="text-center text-slate-500 py-4">
                No certifications added yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeFormSteps;
