import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react"; // Import a nice spinner icon

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // ✅ CENTERED LOADING SCREEN
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}