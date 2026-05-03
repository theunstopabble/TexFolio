import { Link, useNavigate } from "react-router-dom";
import { Building2, Users, ArrowRight, Plus, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useResumes, useSendEmail } from "../hooks/useResumes";
import { useAnalytics } from "../hooks/useQueries";
import AnalyticsChart from "../components/AnalyticsChart";
import {
  useActiveOrg,
  useOrganizations,
  useActiveRole,
} from "../stores/organizationStore";

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

const OrganizationSection = () => {
  const activeOrg = useActiveOrg();
  const activeRole = useActiveRole();
  const orgs = useOrganizations();
  const navigate = useNavigate();

  if (!activeOrg) {
    if (orgs.length === 0) {
      return (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">No Active Organization</h3>
                <p className="text-sm text-slate-600">Create an organization to collaborate with your team.</p>
              </div>
            </div>
            <Link
              to="/organizations"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Org
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="mb-8 bg-amber-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Personal Mode</h3>
              <p className="text-sm text-slate-600">Select an organization from the header dropdown to collaborate.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/organizations")}
            className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{activeOrg.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs font-medium text-blue-700">
              <Shield className="w-3 h-3" />
              {activeRole}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/organizations/${activeOrg._id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium border border-blue-200"
        >
          Manage
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, isPro } = useAuth();

  // TanStack Query hooks - parallel data fetching
  const { data: resumes = [], isLoading: resumesLoading } = useResumes();
  const { mutate: sendEmail, isPending: isSendingEmail } = useSendEmail();
  const { data: stats, isLoading: statsLoading } = useAnalytics() as {
    data: AnalyticsData | undefined;
    isLoading: boolean;
  };

  const loading = resumesLoading || statsLoading;
  const recentResumes = (resumes as Resume[]).slice(0, 3);

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

      {/* Organization Context */}
      <OrganizationSection />

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

          {isPro ? (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-4xl">👑</span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-medium">
                  Active
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1">TexFolio Pro</h3>
              <p className="text-green-50 text-sm">
                You have access to all premium features.
              </p>
            </div>
          ) : (
            <Link
              to="/pricing"
              className="block bg-slate-900 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  🚀
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1">Upgrade to Pro</h3>
              <p className="text-slate-300 text-sm">
                Unlock AI Cover Letters & unlimited templates.
              </p>
            </Link>
          )}
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
                <button
                  onClick={() => {
                    if (user?.email) {
                      sendEmail({ id: resume._id, email: user.email });
                    }
                  }}
                  disabled={isSendingEmail}
                  className="w-10 btn btn-secondary text-sm py-2 flex items-center justify-center shrink-0"
                  title="Email to Me"
                >
                  📧
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
