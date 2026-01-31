import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { aiApi } from "../services/api";
import toast from "react-hot-toast";

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: any;
}

const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  resumeData,
}) => {
  const [step, setStep] = useState<"input" | "result">("input");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");

  const handleGenerate = async () => {
    if (!jobDescription) {
      toast.error("Please enter a job description");
      return;
    }

    setLoading(true);
    try {
      const data = {
        resume: resumeData,
        jobDescription,
        jobTitle,
        company,
      };

      // Remove internal fields
      if (data.resume._id) delete data.resume._id;

      const res = await aiApi.generateCoverLetter(data);
      if (res.data.success) {
        setGeneratedLetter(res.data.data.coverLetter);
        setStep("result");
        toast.success("Cover Letter Generated! ✍️");
      }
    } catch (error) {
      console.error("Cover Letter Error:", error);
      toast.error("Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success("Copied to clipboard!");
  };

  const handleReset = () => {
    setStep("input");
    setGeneratedLetter("");
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900 flex justify-between items-center mb-4"
                >
                  <span>✍️ AI Cover Letter Writer</span>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </Dialog.Title>

                {step === "input" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Paste the job description below, and our AI will write a
                      tailored cover letter matching your resume skills.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Job Title (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input w-full"
                          placeholder="e.g. Frontend Developer"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input w-full"
                          placeholder="e.g. Google"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Job Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="form-input w-full min-h-[150px]"
                        placeholder="Paste the full job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="btn bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Writing...
                          </span>
                        ) : (
                          "✨ Generate Cover Letter"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto">
                      <textarea
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-800 text-sm leading-relaxed min-h-[300px]"
                        value={generatedLetter}
                        onChange={(e) => setGeneratedLetter(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={handleReset}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                      >
                        Start Over
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={handleCopy}
                          className="btn btn-secondary text-sm"
                        >
                          📋 Copy Text
                        </button>
                        <button
                          onClick={onClose}
                          className="btn btn-primary text-sm"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CoverLetterModal;
