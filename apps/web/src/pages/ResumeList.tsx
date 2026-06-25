import { Link } from "react-router-dom";
import {
  useResumes,
  useDeleteResume,
  useGeneratePdf,
} from "../hooks/useResumes";

interface Resume {
  _id: string;
  title: string;
  personalInfo: {
    fullName: string;
    email: string;
  };
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

const ResumeList = () => {
  // TanStack Query hooks replace useState + useEffect
  const { data: resumes = [], isLoading, isError } = useResumes();
  const deleteResume = useDeleteResume();
  const generatePdf = useGeneratePdf();

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    deleteResume.mutate(id);
  };

  const handleDownload = (id: string) => {
    generatePdf.mutate(id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4" role="status">
          <span className="sr-only">Loading</span>
        </div>
        <p className="text-slate-600 text-sm sm:text-base">Loading resumes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-red-600 text-sm sm:text-base">
          Failed to load resumes. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Resumes</h1>
        <Link to="/create" className="btn btn-primary w-full sm:w-auto">
          ➕ Create New Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border px-4">
          <div className="text-5xl sm:text-6xl mb-4">📄</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-2">
            No Resumes Yet
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">
            Create your first professional resume!
          </p>
          <Link to="/create" className="btn btn-primary w-full sm:w-auto">
            🚀 Create Resume
          </Link>
          <a
            href="https://interviewminds.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center gap-1.5"
          >
            🎤 Practice with InterviewMinds
          </a>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {resumes.map((resume: Resume) => (
            <div
              key={resume._id}
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1 truncate">
                    {resume.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {resume.personalInfo?.fullName || "No name"}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500">
                    <span className="truncate">📧 {resume.personalInfo?.email || "No email"}</span>
                    <span>📅 Created: {formatDate(resume.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto md:flex-nowrap justify-end">
                  <Link
                    to={`/edit/${resume._id}`}
                    className="btn btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap flex-1 sm:flex-none justify-center"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDownload(resume._id)}
                    disabled={generatePdf.isPending}
                    className="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap disabled:opacity-50 flex-1 sm:flex-none justify-center"
                  >
                    {generatePdf.isPending ? "⏳" : "📥"} PDF
                  </button>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    disabled={deleteResume.isPending}
                    className="btn btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 text-red-600 hover:bg-red-50 whitespace-nowrap disabled:opacity-50 flex-1 sm:flex-none justify-center"
                  >
                    {deleteResume.isPending ? "⏳" : "🗑️"} Delete
                  </button>
                  <a
                    href={`https://interviewminds.vercel.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap flex-1 sm:flex-none justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg font-semibold transition-all no-underline inline-flex items-center gap-1"
                  >
                    🎤 Practice
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeList;
