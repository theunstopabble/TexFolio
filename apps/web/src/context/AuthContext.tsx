import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { setTokenProvider } from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
}

interface AuthContextType {
  user: User | null;
  isPro: boolean;
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
  const [mongoUser, setMongoUser] = useState<User | null>(null);

  // Register the token provider with the API service
  useEffect(() => {
    setTokenProvider(async () => {
      return await getToken();
    });
  }, [getToken]);

  // Fetch Mongo User (with isPro) when Clerk user is ready
  useEffect(() => {
    const syncUser = async () => {
      if (clerkUser) {
        try {
          // Ensure token is ready first
          await getToken();
          // Dynamically import to avoid circular dep if needed, or just use authApi
          const { authApi } = await import("../services/api");
          const res = await authApi.getMe();
          if (res.data.success) {
            setMongoUser({
              id: res.data.data.id,
              name: res.data.data.name,
              email: res.data.data.email,
              isPro: res.data.data.isPro || false,
            });
          }
        } catch (err) {
          console.error("Failed to sync backend user:", err);
          // Fallback to basic clerk data
          setMongoUser({
            id: clerkUser.id,
            name: clerkUser.fullName || "User",
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            isPro: false,
          });
        }
      } else {
        setMongoUser(null);
      }
    };

    if (isUserLoaded) {
      syncUser();
    }
  }, [clerkUser, isUserLoaded, getToken]);

  const logout = () => {
    signOut();
    setMongoUser(null);
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
        user: mongoUser,
        isPro: Boolean(mongoUser?.isPro),
        token: null,
        isLoading: Boolean(!isUserLoaded || (clerkUser && !mongoUser)), // Wait for mongo sync
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
