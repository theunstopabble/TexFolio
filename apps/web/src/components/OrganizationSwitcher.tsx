import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import {
  useOrganizations,
  useActiveOrg,
  useActiveRole,
  useOrganizationStore,
} from "../stores/organizationStore";

export default function OrganizationSwitcher() {
  const orgs = useOrganizations();
  const activeOrg = useActiveOrg();
  const activeRole = useActiveRole();
  const setActiveOrg = useOrganizationStore((s) => s.setActiveOrg);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (orgs.length === 0) return null;

  const handleSelect = (orgId: string) => {
    setActiveOrg(orgId);
    setOpen(false);
    toast.success("Organization switched");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
      >
        <Building2 className="w-4 h-4" />
        <span className="max-w-[120px] truncate">
          {activeOrg?.name ?? "Personal"}
        </span>
        <span className="text-xs text-slate-500">({activeRole ?? "—"})</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Organizations
          </div>

          {orgs.map(({ organization }) => (
            <button
              key={organization._id}
              onClick={() => handleSelect(organization._id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{organization.name}</span>
              </div>
              {activeOrg?._id === organization._id && (
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={() => {
              setOpen(false);
              setActiveOrg(null);
              toast.success("Switched to personal");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Personal (no org)
            {!activeOrg && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
          </button>

          <div className="border-t border-slate-100 my-1" />

          <button
            onClick={() => {
              setOpen(false);
              navigate("/organizations");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Manage Organizations
          </button>
        </div>
      )}
    </div>
  );
}
