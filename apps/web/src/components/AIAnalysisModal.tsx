import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { ATSAnalysisResult } from "../services/ai";

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ATSAnalysisResult | null;
  isLoading: boolean;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
}) => {
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
                  className="text-xl font-bold leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>✨ AI Resume Analysis</span>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </Dialog.Title>

                <div className="mt-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-slate-600">
                        Analyzing your resume... This may take a few seconds.
                      </p>
                    </div>
                  ) : result ? (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                      {/* Score Circle */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                            result.score >= 80
                              ? "border-green-500 text-green-600"
                              : result.score >= 60
                                ? "border-yellow-500 text-yellow-600"
                                : "border-red-500 text-red-600"
                          }`}
                        >
                          {result.score}
                        </div>
                        <span className="text-sm text-slate-500 mt-2 font-medium">
                          ATS Compatibility Score
                        </span>
                      </div>

                      {/* Summary Feedback */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-1">
                          Overview
                        </h4>
                        <p className="text-sm text-slate-600">
                          {result.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Missing Keywords */}
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                          <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                            ⚠️ Missing Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.keywords_missing?.length ? (
                              result.keywords_missing.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-white border border-red-200 text-red-700 rounded text-xs font-medium"
                                >
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">
                                None detected! Good job.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Formatting Issues */}
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                          <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            🛠️ Formatting Check
                          </h4>
                          <ul className="list-disc list-inside text-sm text-yellow-900 space-y-1">
                            {result.formatting_issues?.length ? (
                              result.formatting_issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))
                            ) : (
                              <span className="text-slate-500">
                                No major issues found.
                              </span>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Improvements List */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-3">
                          🚀 Suggested Improvements
                        </h4>
                        <ul className="space-y-3">
                          {result.suggestions?.map((tip, idx) => (
                            <li
                              key={idx}
                              className="flex gap-3 text-sm p-3 bg-blue-50 rounded-lg"
                            >
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-slate-700">{tip}</span>
                            </li>
                          )) || (
                            <li className="text-sm text-slate-500">
                              No suggestions available.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-500 text-center">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AIAnalysisModal;
