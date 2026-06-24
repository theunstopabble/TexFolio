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
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">No Active Organization</h3>
                <p className="text-xs sm:text-sm text-slate-600">Create an organization to collaborate with your team.</p>
              </div>
            </div>
            <Link
              to="/organizations"
              className="btn btn-primary w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Create Org
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="mb-8 bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Personal Mode</h3>
              <p className="text-xs sm:text-sm text-slate-600">Select an organization from the header dropdown to collaborate.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/organizations")}
            className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium w-full sm:w-auto justify-center"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{activeOrg.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs font-medium text-blue-700">
              <Shield className="w-3 h-3" />
              {activeRole}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/organizations/${activeOrg._id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium border border-blue-200 w-full sm:w-auto justify-center"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center min-h-[60vh] flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4" role="status">
            <span className="sr-only">Loading</span>
          </div>
          <p className="text-slate-600 text-sm sm:text-base">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Welcome Section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Here's what's happening with your resumes.
          </p>
        </div>
        <Link to="/create" className="btn btn-primary w-full sm:w-auto">
          ➕ Create New
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 sm:p-4 opacity-10 text-4xl sm:text-6xl -translate-y-1 sm:translate-y-0">
            📄
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
            {stats?.totalResumes || 0}
          </div>
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            Total Resumes
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 sm:p-4 opacity-10 text-4xl sm:text-6xl -translate-y-1 sm:translate-y-0">
            🎯
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
            {stats?.avgAtsScore || 0}%
          </div>
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            Avg. ATS Score
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 sm:p-4 opacity-10 text-4xl sm:text-6xl -translate-y-1 sm:translate-y-0">
            📥
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
            {resumes.length}
          </div>
          <div className="text-slate-500 text-xs sm:text-sm font-medium">
            PDFs Generated
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 sm:p-4 opacity-10 text-4xl sm:text-6xl -translate-y-1 sm:translate-y-0">
            ⚡
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
            {stats?.topSkills?.length || 0}
          </div>
          <div className="text-slate-500 text-xs sm:text-sm font-medium">Top Skills</div>
        </div>
      </div>

      {/* Organization Context */}
      <OrganizationSection />

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-8">
        {/* Activity Chart */}
        <div className="md:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6">
            Activity Overview
          </h3>
          <div className="min-h-[200px] sm:min-h-[300px]">
            <AnalyticsChart data={stats?.chartData || []} />
          </div>
        </div>

        {/* Top Skills & Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
              Top Skills
            </h3>
            {stats?.topSkills && stats.topSkills.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {stats.topSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-slate-700 font-medium text-sm sm:text-base truncate pr-2">
                      {skill.name}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs shrink-0">
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
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-3xl sm:text-4xl">👑</span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-medium">
                  Active
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1">TexFolio Pro</h3>
              <p className="text-green-50 text-xs sm:text-sm">
                You have access to all premium features.
              </p>
            </div>
          ) : (
            <Link
              to="/pricing"
              className="block bg-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
                  🚀
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1">Upgrade to Pro</h3>
              <p className="text-slate-300 text-xs sm:text-sm">
                Unlock AI Cover Letters & unlimited templates.
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Resumes */}
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Recent Resumes</h2>
      {recentResumes.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center">
          <p className="text-slate-600 mb-4 text-sm sm:text-base">
            No resumes yet. Start your journey!
          </p>
          <Link
            to="/create"
            className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            🚀 Create Resume
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {recentResumes.map((resume) => (
            <div
              key={resume._id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                  📄
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 shrink-0">
                  Latex
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 truncate text-sm sm:text-base">
                {resume.title}
              </h3>
              <p className="text-xs text-slate-500 mb-3 sm:mb-4">
                Edited {new Date(resume.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/edit/${resume._id}`}
                  className="flex-1 btn btn-secondary text-xs sm:text-sm py-2 justify-center"
                >
                  Edit
                </Link>
                <Link
                  to={`/edit/${resume._id}`}
                  className="flex-1 btn btn-primary text-xs sm:text-sm py-2 justify-center"
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
                  className="w-8 sm:w-10 btn btn-secondary text-xs sm:text-sm py-2 flex items-center justify-center shrink-0"
                  title="Email to Me"
                  aria-label="Email this resume to me"
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
