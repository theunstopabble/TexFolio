import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useResumeCoach, useResumeCoach } from "../hooks/useResumeCoach";

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: Record<string, any>;
}

export default function AICoachModal({
  isOpen,
  onClose,
  resumeData,
}: AICoachModalProps) {
  const { mutate: analyzeResume, data, isPending, reset } = useResumeCoach();

  const handleAnalyze = () => {
    analyzeResume({ resumeData });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "🏆";
    if (score >= 60) return "👍";
    return "💪";
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                  <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                    🤖 AI Resume Coach
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Powered by NVIDIA
                    </span>
                  </Dialog.Title>
                  <p className="text-purple-100 text-sm mt-1">
                    Get comprehensive AI analysis of your resume
                  </p>
                </div>

                <div className="p-6">
                  {!data && !isPending && (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Ready to Analyze Your Resume
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Our AI agent will analyze your resume across 4
                        dimensions: Content, ATS Compatibility, Format, and
                        Impact.
                      </p>
                      <button
                        onClick={handleAnalyze}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                      >
                        🚀 Start Analysis
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin text-5xl mb-4">
                        ⚙️
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Analyzing Your Resume...
                      </h3>
                      <p className="text-gray-600">
                        Running through Content → ATS → Format → Impact checks
                      </p>
                      <div className="flex justify-center gap-2 mt-4">
                        {["Content", "ATS", "Format", "Impact"].map(
                          (step, i) => (
                            <div key={step} className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"
                                style={{ animationDelay: `${i * 200}ms` }}
                              />
                              <span className="text-xs text-gray-500">
                                {step}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {data && (
                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div className="text-center">
                        <div
                          className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${getScoreColor(data.finalScore)}`}
                        >
                          <span className="text-4xl">
                            {getScoreEmoji(data.finalScore)}
                          </span>
                          <div>
                            <div className="text-5xl font-black">
                              {data.finalScore}
                            </div>
                            <div className="text-sm font-medium opacity-80">
                              / 100
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        {data.breakdown.content && (
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">📝 Content</span>
                              <span
                                className={`font-bold ${getScoreColor(data.breakdown.content.score)} px-2 py-0.5 rounded`}
                              >
                                {data.breakdown.content.score}
                              </span>
                            </div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {data.breakdown.content.feedback
                                ?.slice(0, 2)
                                .map((f, i) => (
                                  <li key={i} className="truncate">
                                    • {f}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {data.breakdown.ats && (
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">🔍 ATS</span>
                              <span
                                className={`font-bold ${getScoreColor(data.breakdown.ats.score)} px-2 py-0.5 rounded`}
                              >
                                {data.breakdown.ats.score}
                              </span>
                            </div>
                            {data.breakdown.ats.missing?.length > 0 && (
                              <div className="text-sm text-gray-600">
                                Missing:{" "}
                                {data.breakdown.ats.missing
                                  .slice(0, 3)
                                  .join(", ")}
                              </div>
                            )}
                          </div>
                        )}

                        {data.breakdown.format && (
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">📋 Format</span>
                              <span
                                className={`font-bold ${getScoreColor(data.breakdown.format.score)} px-2 py-0.5 rounded`}
                              >
                                {data.breakdown.format.score}
                              </span>
                            </div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {data.breakdown.format.issues
                                ?.slice(0, 2)
                                .map((i, idx) => (
                                  <li key={idx} className="truncate">
                                    • {i}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {data.breakdown.impact && (
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">💡 Impact</span>
                              <span
                                className={`font-bold ${getScoreColor(data.breakdown.impact.score)} px-2 py-0.5 rounded`}
                              >
                                {data.breakdown.impact.score}
                              </span>
                            </div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {data.breakdown.impact.suggestions
                                ?.slice(0, 2)
                                .map((s, i) => (
                                  <li key={i} className="truncate">
                                    • {s}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Recommendations */}
                      {data.recommendations.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            🎯 Top Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {data.recommendations.slice(0, 5).map((rec, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-700 flex items-start gap-2"
                              >
                                <span className="text-purple-500">→</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          onClick={handleAnalyze}
                          className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          🔄 Re-analyze
                        </button>
                        <button
                          onClick={handleClose}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
