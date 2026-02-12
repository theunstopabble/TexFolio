import ResumePreview from "../components/ResumePreview";
import {
  useCreateResume,
  STEPS,
} from "../features/create-resume/useCreateResume";
import ResumeFormSteps from "../features/create-resume/ResumeFormSteps";
import SuccessView from "../features/create-resume/SuccessView";

const CreateResume = () => {
  const {
    currentStep,
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
    handleImportSuccess,
    onSubmit,
    downloadPdf,
    resetState,
  } = actions;

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
            <ResumeFormSteps
              currentStep={currentStep}
              formMethods={formMethods}
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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ResumePreview data={formData as unknown as any} />
        </div>
      </div>
    </div>
  );
};

export default CreateResume;
