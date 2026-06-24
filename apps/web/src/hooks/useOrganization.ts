import { useContext } from "react";
import { OrganizationContext, type OrganizationContextType } from "../context/OrganizationContext";

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
