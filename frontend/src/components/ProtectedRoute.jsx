import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  // If session validity check is running, show a full-screen loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center">
        {/* Modern premium spinner */}
        <div className="w-12 h-12 border-4 border-secondary-container border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 font-body-md text-on-surface-variant animate-pulse">
          Securing Lexora session connection...
        </p>
      </div>
    );
  }

  // If no token exists, redirect to login page preserving attempted location state
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render nested child routes
  return <Outlet />;
}

