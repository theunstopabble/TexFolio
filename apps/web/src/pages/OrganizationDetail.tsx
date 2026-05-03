import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Users, Settings, FileText, ArrowLeft, Shield } from "lucide-react";
import { useOrganizationStore, canAdmin } from "../stores/organizationStore";
import { organizationApi } from "../services/api";

interface OrgDetail {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
    lockedTemplateId?: string;
  };
  settings?: {
    disableAI?: boolean;
    enforceCompanyFont?: boolean;
  };
  createdAt: string;
}

interface OrgResume {
  _id: string;
  title: string;
  updatedAt: string;
  visibility: string;
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeRole = useOrganizationStore((s) =>
    s.organizations.find((o) => o.organization._id === id)?.role ?? null
  );

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [resumes, setResumes] = useState<OrgResume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orgRes, resumesRes] = await Promise.all([
          organizationApi.getById(id),
          organizationApi.getOrgResumes(id),
        ]);
        if (orgRes.data.success) setOrg(orgRes.data.data);
        if (resumesRes.data.success) setResumes(resumesRes.data.data);
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600">Organization not found.</p>
        <button
          onClick={() => navigate("/organizations")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Organizations
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/organizations")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
              <p className="text-slate-500">@{org.slug}</p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${
                  activeRole === "owner"
                    ? "bg-amber-100 text-amber-700"
                    : activeRole === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : activeRole === "editor"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <Shield className="w-3 h-3" />
                {activeRole}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/organizations/${id}/members`)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <Users className="w-4 h-4" />
              Members
            </button>
            {canAdmin(activeRole) && (
              <button
                onClick={() => navigate(`/organizations/${id}/settings`)}
                className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-slate-400" />
          Organization Resumes
        </h2>
        {resumes.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No organization resumes yet. Create one from the dashboard.
          </p>
        ) : (
          <div className="grid gap-3">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                onClick={() => navigate(`/edit/${resume._id}`)}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <h3 className="font-medium text-slate-900">{resume.title}</h3>
                  <p className="text-sm text-slate-500">
                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    resume.visibility === "public"
                      ? "bg-green-100 text-green-700"
                      : resume.visibility === "organization"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {resume.visibility}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
