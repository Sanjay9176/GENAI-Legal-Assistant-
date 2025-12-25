import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // ✅ CENTERED LOADING SCREEN
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}