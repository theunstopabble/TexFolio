import { useState, useRef, useEffect } from "react";
import ResumePreview, { type ResumeData } from "./ResumePreview";

interface ResumePreviewStudioProps {
  data: ResumeData;
  onOpenAiCoach?: () => void;
  onOpenAiAnalyze?: () => void;
  className?: string;
}

type ZoomMode = "fit-width" | "fit-page" | "custom";

export const ResumePreviewStudio: React.FC<ResumePreviewStudioProps> = ({
  data,
  onOpenAiCoach,
  onOpenAiAnalyze,
  className = "",
}) => {
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit-width");
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Template name resolution
  const templateName =
    data.templateId === "premium"
      ? "Premium"
      : data.templateId === "faangpath"
        ? "FAANGPath Pro"
        : data.templateId === "developer"
          ? "Developer Pro"
          : "Classic";

  const templateColor =
    data.templateId === "premium"
      ? "bg-blue-600 text-white"
      : data.templateId === "faangpath"
        ? "bg-emerald-600 text-white"
        : data.templateId === "developer"
          ? "bg-indigo-600 text-white"
          : "bg-slate-700 text-white";

  const handleZoomIn = () => {
    setZoomMode("custom");
    setZoomPercent((prev) => Math.min(prev + 10, 160));
  };

  const handleZoomOut = () => {
    setZoomMode("custom");
    setZoomPercent((prev) => Math.max(prev - 10, 50));
  };

  const selectFitWidth = () => {
    setZoomMode("fit-width");
    setZoomPercent(100);
  };

  const selectFitPage = () => {
    setZoomMode("fit-page");
    setZoomPercent(100);
  };

  // Keyboard shortcut: Esc closes fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Determine sizing class based on zoomMode
  const getSheetClass = () => {
    if (zoomMode === "fit-page") {
      return "w-full max-w-[min(100%,calc((100vh-9.5rem)*0.7072))] mx-auto shadow-2xl transition-all duration-200";
    }
    // Default: "fit-width" (fills column width with pleasant margins)
    return "w-full max-w-2xl lg:max-w-3xl mx-auto shadow-2xl transition-all duration-200";
  };

  const renderStudioToolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-3 border-b border-slate-700/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 rounded-t-xl">
      {/* Title & Template Badge */}
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5 shrink-0">
          <span className="text-base sm:text-lg">👀</span> Live Preview
        </h3>
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-sm truncate ${templateColor}`}
        >
          {templateName}
        </span>
      </div>

      {/* Center: Zoom & View Mode Controls */}
      <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-xs shadow-inner">
        <button
          type="button"
          onClick={selectFitWidth}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            zoomMode === "fit-width"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-white hover:bg-slate-700/60"
          }`}
          title="Fit to Column Width (Best for editing)"
        >
          Fit Width
        </button>
        <button
          type="button"
          onClick={selectFitPage}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            zoomMode === "fit-page"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-white hover:bg-slate-700/60"
          }`}
          title="Fit Whole Page in Viewport"
        >
          Fit Page
        </button>

        <span className="text-slate-600 px-0.5" aria-hidden="true">
          |
        </span>

        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoomPercent <= 50}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>

        <span className="w-10 text-center font-mono text-[11px] font-medium text-slate-200 select-none">
          {zoomMode === "fit-width"
            ? "Auto"
            : zoomMode === "fit-page"
              ? "Fit"
              : `${zoomPercent}%`}
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomPercent >= 160}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-700 ml-0.5"
          title="Full Screen Preview"
          aria-label="Full Screen Preview"
        >
          ⛶
        </button>
      </div>

      {/* Right: AI Quick Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenAiCoach && (
          <button
            type="button"
            onClick={onOpenAiCoach}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-sm flex items-center gap-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>🤖</span> <span className="hidden sm:inline">AI</span> Coach
          </button>
        )}
        {onOpenAiAnalyze && (
          <button
            type="button"
            onClick={onOpenAiAnalyze}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-sm flex items-center gap-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>✨</span> <span className="hidden sm:inline">AI</span> Analyze
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`relative flex flex-col rounded-2xl shadow-2xl bg-slate-900 border border-slate-700/80 overflow-hidden ${className}`}
      >
        {renderStudioToolbar()}

        {/* Scrollable Canvas Viewport */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-4 md:p-6 bg-slate-950 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]"
        >
          <div
            className="flex justify-center items-start min-h-full transition-transform duration-150"
            style={
              zoomMode === "custom" && zoomPercent !== 100
                ? {
                    transform: `scale(${zoomPercent / 100})`,
                    transformOrigin: "top center",
                    width: `${100 * (100 / zoomPercent)}%`,
                  }
                : undefined
            }
          >
            <ResumePreview data={data} className={getSheetClass()} />
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fade-in">
          {/* Top Bar in Fullscreen */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <h2 className="text-white font-bold text-lg sm:text-xl">
                {data.title || "Resume Preview"}
              </h2>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${templateColor}`}>
                {templateName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 shadow"
              >
                ✕ Close Preview
              </button>
            </div>
          </div>

          {/* Fullscreen Sheet Viewer */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex justify-center items-start">
            <ResumePreview
              data={data}
              className="w-full max-w-3xl mx-auto shadow-2xl rounded-sm"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ResumePreviewStudio;
