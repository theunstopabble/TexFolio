import { useState } from "react";
import { ResumePreviewStudio } from "../components/ResumePreviewStudio";
import {
  useCreateResume,
  STEPS,
} from "../features/create-resume/useCreateResume";
import ResumeFormSteps from "../features/create-resume/ResumeFormSteps";
import SuccessView from "../features/create-resume/SuccessView";

const CreateResume = () => {
  const {
    currentStep,
    maxVisited,
    loading,
    success,
    formMethods,
    formData,
    fieldArrays,
    actions,
  } = useCreateResume();

  const {
    handleNext,
    handleBack,
    goToStep,
    handleImportSuccess,
    onSubmit,
    downloadPdf,
    resetState,
  } = actions;

  // Below lg the preview column is `hidden`, so without a toggle the mobile
  // user never saw the live render at all — only the editor.
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // --- Success View ---
  if (success) {
    return (
      <SuccessView onDownload={downloadPdf} onCreateAnother={resetState} />
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
            // These used to be inert <div>s — the progress bar only displayed
            // position. Clicking a reached step now jumps back to it.
            const isLocked = index > maxVisited;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(index)}
                disabled={isLocked}
                aria-current={isActive ? "step" : undefined}
                className={`group flex flex-col items-center gap-2 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${
                  isLocked ? "" : "cursor-pointer hover:bg-slate-50"
                }`}
              >
                <div
                  className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                            ${isActive ? "bg-blue-600 text-white border-blue-600 scale-110 shadow-md" : ""}
                            ${isCompleted ? "bg-blue-600 text-white border-blue-600" : ""}
                            ${!isActive && !isCompleted ? "bg-white text-slate-500 border-slate-300" : ""}
                        `}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-slate-500"}`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Step Indicator & Jump Chips */}
        <div className="md:hidden space-y-2">
          <div className="flex justify-between items-center text-sm font-medium text-slate-600 bg-slate-100 p-3 rounded-lg">
            <span>
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-blue-600 font-bold">{STEPS[currentStep].title}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isLocked = index > maxVisited;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  disabled={isLocked}
                  aria-current={isActive ? "step" : undefined}
                  className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{index + 1}.</span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Below lg the preview column is hidden — without this toggle a mobile
            user had no way to reach the live render at all. */}
        <div className="lg:hidden mt-3 flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            aria-pressed={activeTab === "editor"}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeTab === "editor"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ✏️ Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            aria-pressed={activeTab === "preview"}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeTab === "preview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            👀 Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form */}
        <div
          className={`space-y-6 ${activeTab === "preview" ? "hidden lg:block" : "block"}`}
        >
          {/* `noValidate`: native constraint validation covers hidden controls
              too and cannot show its tooltip on a display:none element, so a
              bad `type="email"` value in an inactive step would block Generate
              with no feedback. react-hook-form validates the whole form. */}
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <ResumeFormSteps
              currentStep={currentStep}
              formMethods={formMethods}
              formData={formData}
              fieldArrays={fieldArrays}
              onImportSuccess={handleImportSuccess}
            />

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
                    onClick={onSubmit}
                    disabled={loading}
                    className="btn btn-success px-8"
                  >
                    {loading ? "Generating..." : "✨ Generate Resume"}
                  </button>
                )}
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
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CreateResume;
