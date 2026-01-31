import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import ResumePreview from "../components/ResumePreview";
import { Link } from "react-router-dom";

const PublicResume = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublicResume = async () => {
      try {
        const response = await api.get(`/public/${shareId}`); // Uses the public route
        if (response.data.success) {
          setResume(response.data.data);
        } else {
          setError("Resume not found");
        }
      } catch (err) {
        console.error("Error fetching public resume:", err);
        setError("Resume not found or is private.");
      } finally {
        setLoading(false);
      }
    };

    if (shareId) fetchPublicResume();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <p className="text-slate-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Resume Not Available
          </h1>
          <p className="text-slate-600 mb-6">
            {error || "This resume link is invalid or has been made private."}
          </p>
          <Link to="/" className="btn btn-primary">
            Go to TexFolio Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Public Header */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="font-bold text-slate-900 hidden sm:inline">
              TexFolio
            </span>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Create your own Resume →
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden min-h-[1000px]">
            <ResumePreview data={resume} />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>
          Powered by{" "}
          <Link to="/" className="text-white hover:underline font-medium">
            TexFolio
          </Link>{" "}
          - The AI Resume Builder
        </p>
      </div>
    </div>
  );
};

export default PublicResume;
