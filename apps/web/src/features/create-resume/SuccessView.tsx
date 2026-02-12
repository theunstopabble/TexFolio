import React from "react";

interface SuccessViewProps {
  onDownload: () => void;
  onCreateAnother: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({
  onDownload,
  onCreateAnother,
}) => {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center animate-fade-in">
      <div className="text-7xl mb-6 animate-bounce">🎉</div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        You're All Set!
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Your professional resume has been generated. <br />
        Click below to download or view it.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onDownload}
          className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
        >
          📥 Download PDF Resume
        </button>
        <button
          onClick={onCreateAnother}
          className="btn btn-secondary text-lg px-8 py-4"
        >
          🔄 Create Another
        </button>
      </div>
    </div>
  );
};

export default SuccessView;
