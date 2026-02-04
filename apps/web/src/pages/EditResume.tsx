import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeEditor } from "../features/resume-editor/hooks/useResumeEditor";
import { ResumeFormSections } from "../features/resume-editor/components/ResumeFormSections";
import { ShareModal } from "../features/resume-editor/components/ShareModal";
import CoverLetterModal from "../components/CoverLetterModal";
import AICoachModal from "../components/AICoachModal";
// Unused imports removed

const EditResume = () => {
  const {
    // Form
    formData,
    register,
    handleSubmit,
    setValue,
    watch,
    onSubmit,
    // State
    loading,
    saving,
    activeStep,
    // Modals
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
  } = useResumeEditor();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const steps = [
    { title: "Basics", icon: "👤" },
    { title: "Summary", icon: "📝" },
    { title: "Experience", icon: "💼" },
    { title: "Education", icon: "🎓" },
    { title: "Skills", icon: "🛠️" },
    { title: "Projects", icon: "🚀" },
    { title: "Certifications", icon: "🏆" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <p className="text-slate-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Edit Resume</h1>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={handleATSCheck}
            className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <span>📊</span> Check ATS Score
          </button>
          <button
            type="button"
            onClick={() => setClModalOpen(true)}
            className="btn bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          >
            <span>✍️</span> Cover Letter
          </button>
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <span>🔗</span> Share
          </button>
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

      {/* Stepper Navigation (Desktop) */}
      <div className="hidden lg:flex justify-between items-center mb-8 px-4 py-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => goToStep(index)}
            className={`flex flex-col items-center gap-2 min-w-[80px] transition-all px-2 py-2 rounded-lg ${
              activeStep === index
                ? "text-purple-600 bg-purple-50 font-semibold scale-105"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                activeStep === index
                  ? "border-purple-600 bg-white"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {step.icon}
            </div>
            <span className="text-xs whitespace-nowrap">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Mobile Tab Toggle */}
      <div className="lg:hidden flex mb-6 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "editor" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          ✏️ Editor
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          👀 Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form (Stepper Content) */}
        <div
          className={`space-y-6 ${activeTab === "preview" ? "hidden lg:block" : "block"}`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Render Active Section */}
            <div className="min-h-[400px]">
              <ResumeFormSections
                activeStep={activeStep}
                register={register}
                watch={watch}
                setValue={setValue}
                // Field Arrays props
                expFields={experienceFieldArray.fields}
                appendExp={experienceFieldArray.append}
                removeExp={experienceFieldArray.remove}
                eduFields={educationFieldArray.fields}
                appendEdu={educationFieldArray.append}
                removeEdu={educationFieldArray.remove}
                skillFields={skillsFieldArray.fields}
                appendSkill={skillsFieldArray.append}
                removeSkill={skillsFieldArray.remove}
                projFields={projectsFieldArray.fields}
                appendProj={projectsFieldArray.append}
                removeProj={projectsFieldArray.remove}
                certFields={certificationsFieldArray.fields}
                appendCert={certificationsFieldArray.append}
                removeCert={certificationsFieldArray.remove}
              />
            </div>

            {/* Stepper Controls */}
            <div className="flex justify-between pt-6 border-t mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={activeStep === 0}
                className={`btn btn-secondary px-6 ${activeStep === 0 ? "invisible" : ""}`}
              >
                ← Previous
              </button>

              <div className="flex gap-3">
                <button
                  type="button" // Change to button type to prevent submit, unless last step intended to save
                  onClick={() => {
                    // Auto-save on next? Or just navigate?
                    // For now just navigate, user explicitly saves.
                    if (activeStep < steps.length - 1) nextStep();
                  }}
                  className={`btn btn-primary px-6 ${activeStep === steps.length - 1 ? "hidden" : ""}`}
                >
                  Next →
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  {saving ? "⏳ Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview (Sticky) */}
        <div
          className={`${activeTab === "editor" ? "hidden lg:block" : "block"} lg:sticky lg:top-24 h-[calc(100vh-8rem)] overflow-y-auto rounded-xl shadow-2xl bg-slate-800 p-4 border border-slate-700`}
        >
          <div className="flex justify-between items-center mb-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              👀 Live Preview
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-normal">
                {formData.templateId === "premium"
                  ? "Premium"
                  : formData.templateId === "faangpath"
                    ? "FAANGPath"
                    : "Classic"}
              </span>
            </h3>
            <span className="text-xs text-slate-400 hidden xl:inline">
              Updates automatically
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setAiCoachOpen(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm flex items-center gap-1 transition-all"
              >
                🤖 AI Coach
              </button>
              <button
                onClick={handleAnalyze}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm flex items-center gap-1 transition-all"
              >
                ✨ AI Analyze
              </button>
            </div>
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

      {/* Modals outside main layout */}
      <AIAnalysisModal
        isOpen={atsModalOpen}
        onClose={() => setAtsModalOpen(false)}
        result={atsResult}
        isLoading={atsLoading}
      />
      <CoverLetterModal
        isOpen={clModalOpen}
        onClose={() => setClModalOpen(false)}
        resumeData={formData}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        isPublic={isPublic}
        shareId={shareId}
        onToggle={handleToggleVisibility}
      />
      <AICoachModal
        isOpen={aiCoachOpen}
        onClose={() => setAiCoachOpen(false)}
        resumeData={formData}
      />
    </div>
  );
};

export default EditResume;
