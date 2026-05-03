import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Settings, ArrowLeft, Trash2, Save } from "lucide-react";
import { useOrganizationStore } from "../stores/organizationStore";
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
}

export default function OrganizationSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeRole = useOrganizationStore((s) =>
    s.organizations.find((o) => o.organization._id === id)?.role ?? null
  );

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [lockedTemplateId, setLockedTemplateId] = useState("");
  const [enforceCompanyFont, setEnforceCompanyFont] = useState(false);
  const [disableAI, setDisableAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    organizationApi
      .getById(id)
      .then((res) => {
        if (res.data.success) {
          const data = res.data.data as OrgDetail;
          setOrg(data);
          setName(data.name);
          setPrimaryColor(data.branding?.primaryColor || "#2563EB");
          setLockedTemplateId(data.branding?.lockedTemplateId || "");
          setEnforceCompanyFont(data.settings?.enforceCompanyFont || false);
          setDisableAI(data.settings?.disableAI || false);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await organizationApi.update(id, {
        name,
        branding: {
          primaryColor,
          lockedTemplateId: lockedTemplateId || undefined,
        },
        settings: {
          enforceCompanyFont,
          disableAI,
        },
      });
      if (res.data.success) {
        toast.success("Organization updated");
      }
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !org) return;
    if (!window.confirm(`Delete "${org.name}" permanently? This cannot be undone.`)) return;
    try {
      await organizationApi.delete(id);
      toast.success("Organization deleted");
      navigate("/organizations");
    } catch {
      // handled
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600">Organization not found.</p>
      </div>
    );
  }

  const isOwner = activeRole === "owner";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(`/organizations/${id}`)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-6">
        <Settings className="w-7 h-7 text-blue-600" />
        Organization Settings
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!isOwner}
                className="w-12 h-10 rounded border border-slate-300 cursor-pointer disabled:opacity-50"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!isOwner}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Locked Template ID
            </label>
            <input
              type="text"
              value={lockedTemplateId}
              onChange={(e) => setLockedTemplateId(e.target.value)}
              disabled={!isOwner}
              placeholder="e.g. faangpath"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enforceCompanyFont}
              onChange={(e) => setEnforceCompanyFont(e.target.checked)}
              disabled={!isOwner}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Enforce company font (sans-serif)</span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={disableAI}
              onChange={(e) => setDisableAI(e.target.checked)}
              disabled={!isOwner}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Disable AI features for this org</span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving || !isOwner}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Organization
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
