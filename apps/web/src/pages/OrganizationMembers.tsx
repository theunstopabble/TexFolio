import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, ArrowLeft, Shield, UserPlus, Trash2, Crown } from "lucide-react";
import { useOrganizationStore, canAdmin, isOwner } from "../stores/organizationStore";
import { organizationApi } from "../services/api";

interface Member {
  _id: string;
  userId: string;
  role: string;
  status: string;
  invitedBy: string;
  createdAt: string;
}

export default function OrganizationMembersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeRole = useOrganizationStore((s) =>
    s.organizations.find((o) => o.organization._id === id)?.role ?? null
  );

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  const fetchMembers = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await organizationApi.listMembers(id);
      if (res.data.success) setMembers(res.data.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteUserId.trim()) return;
    try {
      const res = await organizationApi.inviteMember(id, {
        userId: inviteUserId.trim(),
        role: inviteRole,
      });
      if (res.data.success) {
        toast.success("Member invited!");
        setInviting(false);
        setInviteUserId("");
        setInviteRole("editor");
        await fetchMembers();
      }
    } catch {
      // handled
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!id) return;
    try {
      const res = await organizationApi.updateMemberRole(id, userId, newRole);
      if (res.data.success) {
        toast.success("Role updated");
        await fetchMembers();
      }
    } catch {
      // handled
    }
  };

  const handleRemove = async (userId: string) => {
    if (!id) return;
    if (!window.confirm("Remove this member?")) return;
    try {
      await organizationApi.removeMember(id, userId);
      toast.success("Member removed");
      await fetchMembers();
    } catch {
      // handled
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-16 bg-slate-200 rounded" />
          <div className="h-16 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(`/organizations/${id}`)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organization
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Users className="w-7 h-7 text-blue-600" />
          Members
        </h1>
        {canAdmin(activeRole) && (
          <button
            onClick={() => setInviting(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {inviting && canAdmin(activeRole) && (
        <form
          onSubmit={handleInvite}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">Invite Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="user_..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Invite
            </button>
            <button
              type="button"
              onClick={() => setInviting(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{member.userId}</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.role === "owner"
                        ? "bg-amber-100 text-amber-700"
                        : member.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : member.role === "editor"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {member.role === "owner" && <Crown className="w-3 h-3" />}
                    {member.role !== "owner" && <Shield className="w-3 h-3" />}
                    {member.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner(activeRole) && member.role !== "owner" && (
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
                {canAdmin(activeRole) &&
                  member.role !== "owner" &&
                  member.userId !== useOrganizationStore.getState().organizations.find((o) => o.organization._id === id)?.organization.ownerId && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
