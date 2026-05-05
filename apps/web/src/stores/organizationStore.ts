import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface Organization {
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
  updatedAt: string;
}

export interface OrganizationMember {
  _id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  invitedBy: string;
  status: "active" | "pending";
  createdAt: string;
  updatedAt: string;
}

export interface UserOrg {
  organization: Organization;
  role: OrgRole;
}

interface OrganizationState {
  organizations: UserOrg[];
  activeOrgId: string | null;
  isLoading: boolean;

  setOrganizations: (orgs: UserOrg[]) => void;
  setActiveOrg: (orgId: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearOrgs: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  devtools(
    (set, get) => ({
      organizations: [],
      activeOrgId: null,
      isLoading: false,

      setOrganizations: (orgs) => {
        const currentActive = get().activeOrgId;
        // If current active org is not in new list, clear it
        const stillValid = orgs.some((o) => o.organization._id === currentActive);
        set({
          organizations: orgs,
          activeOrgId: stillValid ? currentActive : orgs[0]?.organization._id ?? null,
        });
      },

      setActiveOrg: (orgId) => set({ activeOrgId: orgId }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearOrgs: () => set({ organizations: [], activeOrgId: null }),
    }),
    { name: "OrganizationStore" },
  ),
);

// Computed selector hooks
export const useOrganizations = () => useOrganizationStore((state) => state.organizations);
export const useActiveOrgId = () => useOrganizationStore((state) => state.activeOrgId);
export const useOrgLoading = () => useOrganizationStore((state) => state.isLoading);

export const useActiveOrg = () => useOrganizationStore((state) => {
  if (!state.activeOrgId) return null;
  return state.organizations.find((o) => o.organization._id === state.activeOrgId)?.organization ?? null;
});

export const useActiveRole = () => useOrganizationStore((state) => {
  if (!state.activeOrgId) return null;
  return state.organizations.find((o) => o.organization._id === state.activeOrgId)?.role ?? null;
});

// Role helpers
export const canEdit = (role: OrgRole | null) =>
  role === "owner" || role === "admin" || role === "editor";
export const canAdmin = (role: OrgRole | null) =>
  role === "owner" || role === "admin";
export const isOwner = (role: OrgRole | null) => role === "owner";
