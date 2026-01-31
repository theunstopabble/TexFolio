import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { setTokenProvider } from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut } = useClerkAuth();

  // Register the token provider with the API service
  useEffect(() => {
    setTokenProvider(async () => {
      return await getToken();
    });
  }, [getToken]);

  // Map Clerk user to our app's User interface
  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
      }
    : null;

  const logout = () => {
    signOut();
  };

  // Deprecated methods stubs
  const login = async () => {
    console.warn("Manual login is deprecated. Use Clerk UI.");
  };

  const register = async () => {
    console.warn("Manual register is deprecated. Use Clerk UI.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // Token is handled automatically via interceptor now
        isLoading: !isUserLoaded,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
