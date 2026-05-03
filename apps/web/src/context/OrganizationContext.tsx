import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useOrganizationStore, type UserOrg } from "../stores/organizationStore";
import { useAuth } from "./AuthContext";
import { setOrgIdProvider } from "../services/api";

interface OrganizationContextType {
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const setOrganizations = useOrganizationStore((s) => s.setOrganizations);
  const setLoading = useOrganizationStore((s) => s.setLoading);
  const clearOrgs = useOrganizationStore((s) => s.clearOrgs);

  // Register org ID provider for API interceptor
  useEffect(() => {
    setOrgIdProvider(() => useOrganizationStore.getState().activeOrgId);
  }, []);

  const refreshOrganizations = async () => {
    if (!user) {
      clearOrgs();
      return;
    }
    setLoading(true);
    try {
      const { organizationApi } = await import("../services/api");
      const res = await organizationApi.list();
      if (res.data.success) {
        const orgs: UserOrg[] = res.data.data.map((item: { organization: UserOrg["organization"]; role: UserOrg["role"] }) => ({
          organization: item.organization,
          role: item.role,
        }));
        setOrganizations(orgs);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshOrganizations();
    } else {
      clearOrgs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <OrganizationContext.Provider value={{ refreshOrganizations }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
