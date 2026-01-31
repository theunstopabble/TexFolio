import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { AIAnalysisResult } from "../services/ai";

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AIAnalysisResult | null;
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                    <div className="space-y-6">
                      {/* Score Circle */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                            result.atsScore >= 80
                              ? "border-green-500 text-green-600"
                              : result.atsScore >= 60
                                ? "border-yellow-500 text-yellow-600"
                                : "border-red-500 text-red-600"
                          }`}
                        >
                          {result.atsScore}
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
                          {result.summaryFeedback}
                        </p>
                      </div>

                      {/* Improvements List */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-3">
                          Suggested Improvements
                        </h4>
                        <ul className="space-y-3">
                          {result.improvements.map((item, idx) => (
                            <li key={idx} className="flex gap-3 text-sm">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {item.section}
                                </span>
                                <span className="text-slate-600">
                                  {item.tip}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-500">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none"
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
