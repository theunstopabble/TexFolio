import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? (
    <Outlet />
  ) : (
    // Redirect to login but save the attempted URL for redirect-back
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
