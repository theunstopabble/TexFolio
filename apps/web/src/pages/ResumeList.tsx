import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { resumeApi } from "../services/api";
import toast from "react-hot-toast";

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
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumeApi.getAll();
      setResumes(response.data.data || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      toast.error("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await resumeApi.delete(id);
      toast.success("Resume deleted!");
      fetchResumes();
    } catch (error) {
      toast.error("Failed to delete resume");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await resumeApi.generatePdf(id);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-4xl animate-spin mb-4">⏳</div>
        <p className="text-slate-600">Loading resumes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Resumes</h1>
        <Link to="/create" className="btn btn-primary">
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
          {resumes.map((resume) => (
            <div
              key={resume._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">
                    {resume.title}
                  </h3>
                  <p className="text-slate-600">
                    {resume.personalInfo?.fullName || "No name"}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-slate-500">
                    <span>📧 {resume.personalInfo?.email || "No email"}</span>
                    <span>📅 Created: {formatDate(resume.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/edit/${resume._id}`}
                    className="btn btn-secondary text-sm px-4 py-2"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDownload(resume._id)}
                    className="btn btn-primary text-sm px-4 py-2"
                  >
                    📥 PDF
                  </button>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="btn btn-secondary text-sm px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    🗑️ Delete
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
