import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { resumeApi, analyticsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import AnalyticsChart from "../components/AnalyticsChart";

interface Resume {
  _id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  totalResumes: number;
  chartData: { name: string; resumes: number }[];
  topSkills: { name: string; count: number }[];
  avgAtsScore: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumesRes, statsRes] = await Promise.all([
          resumeApi.getAll(),
          analyticsApi.getStats(),
        ]);

        setResumes(resumesRes.data.data || []);
        setStats(statsRes.data.data);
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentResumes = resumes.slice(0, 3);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center h-screen flex items-center justify-center">
        <div>
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <p className="text-slate-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Welcome Section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-slate-600">
            Here's what's happening with your resumes.
          </p>
        </div>
        <Link to="/create" className="btn btn-primary hidden md:block">
          ➕ Create New
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl">
            📄
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {stats?.totalResumes || 0}
          </div>
          <div className="text-slate-500 text-sm font-medium">
            Total Resumes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl">
            🎯
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {stats?.avgAtsScore || 0}%
          </div>
          <div className="text-slate-500 text-sm font-medium">
            Avg. ATS Score
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl">
            📥
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {resumes.length}
          </div>
          <div className="text-slate-500 text-sm font-medium">
            PDFs Generated
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl">
            ⚡
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {stats?.topSkills?.length || 0}
          </div>
          <div className="text-slate-500 text-sm font-medium">Top Skills</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Activity Chart */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Activity Overview
          </h3>
          <AnalyticsChart data={stats?.chartData || []} />
        </div>

        {/* Top Skills & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Top Skills
            </h3>
            {stats?.topSkills && stats.topSkills.length > 0 ? (
              <div className="space-y-3">
                {stats.topSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-slate-700 font-medium">
                      {skill.name}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                      {skill.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                Add skills to your resumes to see them here.
              </p>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Upgrade to Pro 🚀</h3>
            <p className="text-slate-300 text-sm mb-4">
              Get AI Cover Letters and unlimited templates.
            </p>
            <button className="w-full bg-white text-slate-900 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors">
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Recent Resumes */}
      <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Resumes</h2>
      {recentResumes.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <p className="text-slate-600 mb-4">
            No resumes yet. Start your journey!
          </p>
          <Link
            to="/create"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            🚀 Create Resume
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {recentResumes.map((resume) => (
            <div
              key={resume._id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  📄
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                  Latex
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 truncate">
                {resume.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Edited {new Date(resume.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/edit/${resume._id}`}
                  className="flex-1 btn btn-secondary text-sm py-2 justify-center"
                >
                  Edit
                </Link>
                <Link
                  to={`/edit/${resume._id}`}
                  className="flex-1 btn btn-primary text-sm py-2 justify-center"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
