import { useState, useEffect } from "react";
import { resumeApi, aiApi } from "../services/api";
import toast from "react-hot-toast";

interface Resume {
  _id: string;
  title: string;
}

const CoverLetter = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await resumeApi.getAll();
        const resumeList = response.data.data || [];
        setResumes(resumeList);
        if (resumeList.length > 0) {
          setSelectedResumeId(resumeList[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
        toast.error("Failed to load resumes");
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setGenerating(true);
    setGeneratedLetter("");

    try {
      // 1. Fetch full resume details
      const resumeResponse = await resumeApi.getById(selectedResumeId);
      const resumeData = resumeResponse.data.data;

      // 2. Call AI API
      const aiResponse = await aiApi.generateCoverLetter({
        resume: resumeData,
        jobDescription,
      });

      setGeneratedLetter(aiResponse.data.data.coverLetter);
      toast.success("Cover Letter Generated!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate cover letter. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          AI Cover Letter Generator ✍️
        </h1>
        <p className="text-slate-600">
          Paste a job description and let AI write a tailored cover letter for
          you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Your Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.title}
                </option>
              ))}
            </select>
            {resumes.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No resumes found. Create one first!
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job requirements here..."
              className="w-full h-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || resumes.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] ${
              generating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg"
            }`}
          >
            {generating ? "Writing Magic... ✨" : "Generate Cover Letter 🚀"}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-slate-700">
              Generated Letter
            </label>
            {generatedLetter && (
              <button
                onClick={copyToClipboard}
                className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors font-medium"
              >
                📋 Copy Text
              </button>
            )}
          </div>

          {generatedLetter ? (
            <textarea
              value={generatedLetter}
              onChange={(e) => setGeneratedLetter(e.target.value)}
              className="flex-1 w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-serif text-slate-700 leading-relaxed bg-slate-50"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="text-6xl mb-4">📝</div>
              <p>Your cover letter will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
