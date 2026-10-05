import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeEditor } from "../features/resume-editor/hooks/useResumeEditor";
import { ResumeFormSections } from "../features/resume-editor/components/ResumeFormSections";
import { ShareModal } from "../features/resume-editor/components/ShareModal";
import { DownloadModal } from "../features/resume-editor/components/DownloadModal";
import { ResumePreviewStudio } from "../components/ResumePreviewStudio";
import AIAnalysisModal from "../components/AIAnalysisModal";
import CoverLetterModal from "../components/CoverLetterModal";
import AICoachModal from "../components/AICoachModal";
// Unused imports removed

const EditResume = () => {
  const {
    // Form
    formData,
    register,
    handleSubmit,
    handleSubmitError,
    setValue,
    watch,
    onSubmit,
    // State
    loading,
    saving,
    downloading,
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
    atsJobDescription,
    setAtsJobDescription,
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
    formState,
    // Field Arrays
    experienceFieldArray,
    educationFieldArray,
    skillsFieldArray,
    projectsFieldArray,
    certificationsFieldArray,
    profileLinksFieldArray,
    getValues,
  } = useResumeEditor();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  /**
   * Runs the compile and closes the chooser when it settles.
   *
   * `handleDownload` never rejects (it swallows into a toast), so the modal is
   * guaranteed to dismiss on both success and failure — leaving it open would
   * ask for one extra click after the browser's own download bar already
   * signalled completion.
   */
  const downloadFromModal = async () => {
    await handleDownload();
    setDownloadModalOpen(false);
  };

  const steps = [
    { title: "Basics", icon: "👤" },
    { title: "Summary", icon: "📝" },
    { title: "Education", icon: "🎓" },
    { title: "Experience", icon: "💼" },
    { title: "Skills", icon: "🛠️" },
    { title: "Projects", icon: "🚀" },
    { title: "Certifications", icon: "🏆" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4" role="status">
            <span className="sr-only">Loading</span>
          </div>
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
        {/* 2-up below md: six full-width stacked buttons ate ~300px of the
            mobile viewport before the form even started. The ATS input and the
            Back escape hatch span both columns since their labels are longest. */}
        <div className="grid grid-cols-2 gap-2 text-sm md:flex md:flex-row md:items-center md:justify-center md:flex-wrap md:text-base">
          <div className="relative col-span-2 md:w-auto md:max-w-xs">
            <input
              type="text"
              value={atsJobDescription}
              onChange={(e) => setAtsJobDescription(e.target.value)}
              placeholder="Paste job description (optional)…"
              className="form-input w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              aria-label="Job description for ATS keyword matching"
            />
          </div>
          <button
            type="button"
            onClick={() => handleATSCheck(atsJobDescription)}
            className="btn bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500 flex items-center gap-2 md:whitespace-nowrap"
          >
            <span>📊</span> Check ATS Score
          </button>
          <button
            type="button"
            onClick={() => setClModalOpen(true)}
            className="btn bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500 flex items-center gap-2"
          >
            <span>✍️</span> Cover Letter
          </button>
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>🔗</span> Share
          </button>
          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <span>📥</span> Download
          </button>
          <button
            type="button"
            onClick={() => navigate("/resumes")}
            className="btn btn-secondary col-span-2 md:col-span-1"
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
            type="button"
            onClick={() => goToStep(index)}
            aria-current={activeStep === index ? "step" : undefined}
            className={`flex flex-col items-center gap-2 min-w-[80px] transition-all px-2 py-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
              activeStep === index
                ? "text-purple-600 bg-purple-50 font-semibold scale-105"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
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

      {/* Mobile Tab Toggle + Step Indicator */}
      <div className="lg:hidden space-y-3 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            aria-pressed={activeTab === "editor"}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${activeTab === "editor" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            ✏️ Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            aria-pressed={activeTab === "preview"}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${activeTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            👀 Preview
          </button>
        </div>
        {/* The desktop stepper is `hidden lg:flex`, so below lg the only way to
            move was single-stepping through all 7 with Previous/Next. These chips
            give mobile the same jump capability. */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
          <span>
            Step {activeStep + 1} of {steps.length}
          </span>
          <span className="text-purple-600">{steps[activeStep].title}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {steps.map((step, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToStep(index)}
              aria-current={activeStep === index ? "step" : undefined}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
                activeStep === index
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span aria-hidden="true">{step.icon}</span>
              {index + 1}. {step.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form (Stepper Content) */}
        <div
          className={`space-y-6 ${activeTab === "preview" ? "hidden lg:block" : "block"}`}
        >
          <form
            onSubmit={handleSubmit(onSubmit, handleSubmitError)}
            className="space-y-6"
            // Native constraint validation runs over *every* candidate control,
            // hidden ones included, and cannot show its tooltip on a
            // display:none element — a bad `type="email"`/`type="number"` value
            // in an inactive section would block Save with no feedback at all.
            // react-hook-form owns validation for the whole form.
            noValidate
          >
            {/* Every section renders; only the active one is visible (see
                ResumeFormSections — inactive sections must stay mounted so
                react-hook-form validates them).
                Floor the section so the Prev/Next/Save row doesn't jump when
                swapping between a tall section (Experience) and a near-empty one
                (Certifications). 320px covers the typical empty-state card
                without leaving a half-screen of dead space below it. */}
            <div className="min-h-[320px]">
              <ResumeFormSections
                activeStep={activeStep}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={formState.errors}
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
                plFields={profileLinksFieldArray.fields}
                appendPl={profileLinksFieldArray.append}
                removePl={profileLinksFieldArray.remove}
                getValues={getValues}
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
                  type="button"
                  onClick={() => {
                    if (activeStep < steps.length - 1) nextStep();
                  }}
                  className={`btn btn-primary px-6 ${activeStep === steps.length - 1 ? "invisible" : ""}`}
                >
                  Next →
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-success px-8"
                >
                  {saving ? "⏳ Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview (Sticky Studio Canvas) */}
        <div
          className={`${activeTab === "editor" ? "hidden lg:block" : "block"} lg:sticky lg:top-20 h-[calc(100vh-6rem)]`}
        >
          <ResumePreviewStudio
            data={formData}
            onOpenAiCoach={() => setAiCoachOpen(true)}
            onOpenAiAnalyze={handleAnalyze}
            className="h-full"
          />

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
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        data={formData}
        downloading={downloading}
        onDownloadPdf={downloadFromModal}
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
