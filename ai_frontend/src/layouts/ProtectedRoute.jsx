import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          Verifying access…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
