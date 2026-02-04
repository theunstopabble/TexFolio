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
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-4xl animate-spin mb-4">⏳</div>
        <p className="text-slate-600">Loading resumes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-red-600">
          Failed to load resumes. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">My Resumes</h1>
        <Link to="/create" className="btn btn-primary w-full sm:w-auto">
          ➕ Create New Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-semibold text-slate-700 mb-2">
            No Resumes Yet
          </h2>
          <p className="text-slate-500 mb-6">
            Create your first professional resume!
          </p>
          <Link to="/create" className="btn btn-primary">
            🚀 Create Resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume: Resume) => (
            <div
              key={resume._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">
                    {resume.title}
                  </h3>
                  <p className="text-slate-600">
                    {resume.personalInfo?.fullName || "No name"}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                    <span>📧 {resume.personalInfo?.email || "No email"}</span>
                    <span>📅 Created: {formatDate(resume.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <Link
                    to={`/edit/${resume._id}`}
                    className="btn btn-secondary text-sm px-4 py-2 whitespace-nowrap"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDownload(resume._id)}
                    disabled={generatePdf.isPending}
                    className="btn btn-primary text-sm px-4 py-2 whitespace-nowrap disabled:opacity-50"
                  >
                    {generatePdf.isPending ? "⏳" : "📥"} PDF
                  </button>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    disabled={deleteResume.isPending}
                    className="btn btn-secondary text-sm px-4 py-2 text-red-600 hover:bg-red-50 whitespace-nowrap disabled:opacity-50"
                  >
                    {deleteResume.isPending ? "⏳" : "🗑️"} Delete
                  </button>
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
