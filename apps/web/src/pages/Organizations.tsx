import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Plus, ChevronRight, Shield, Users } from "lucide-react";
import {
  useOrganizations,
  useOrganizationStore,
  useOrgLoading,
} from "../stores/organizationStore";
import { organizationApi } from "../services/api";
import { useOrganization } from "../context/OrganizationContext";

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const orgs = useOrganizations();
  const isLoading = useOrgLoading();
  const setActiveOrg = useOrganizationStore((s) => s.setActiveOrg);
  const { refreshOrganizations } = useOrganization();

  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgSlug.trim()) return;

    try {
      const res = await organizationApi.create({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      });
      if (res.data.success) {
        toast.success("Organization created!");
        setIsCreating(false);
        setNewOrgName("");
        setNewOrgSlug("");
        await refreshOrganizations();
        navigate(`/organizations/${res.data.data._id}`);
      }
    } catch {
      // error handled by interceptor
    }
  };

  const handleSelect = (orgId: string) => {
    setActiveOrg(orgId);
    toast.success("Organization switched");
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          Organizations
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            New Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  setNewOrgSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\s]/g, "")
                      .replace(/\s+/g, "-")
                  );
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Acme Corp"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={newOrgSlug}
                onChange={(e) =>
                  setNewOrgSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="acme-corp"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {orgs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No organizations yet
          </h3>
          <p className="text-slate-600 mb-4">
            Create an organization to collaborate on resumes with your team.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Organization
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orgs.map(({ organization, role }) => (
            <div
              key={organization._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {organization.name}
                  </h3>
                  <p className="text-sm text-slate-500">@{organization.slug}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        role === "owner"
                          ? "bg-amber-100 text-amber-700"
                          : role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : role === "editor"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {role}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {role === "owner" || role === "admin"
                        ? "Manage members"
                        : "Member"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelect(organization._id)}
                  className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Switch
                </button>
                <button
                  onClick={() => navigate(`/organizations/${organization._id}`)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
