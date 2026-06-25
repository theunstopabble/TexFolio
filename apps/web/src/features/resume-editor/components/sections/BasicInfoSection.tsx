import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { ResumeFormData } from "../../types";
import TemplateSelector from "../../../components/TemplateSelector";

interface BasicInfoSectionProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
}

export const BasicInfoSection = ({
  register,
  watch,
  setValue,
}: BasicInfoSectionProps) => (
  <div className="space-y-6">
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
