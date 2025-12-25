// src/AppRoutes.jsx (or wherever your routes are defined)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import ProtectedRoute from "@/layouts/ProtectedRoute";
import PublicRoute from "@/layouts/PublicRoute"; // <--- IMPORT THIS
import Onboarding from "@/pages/Onboarding";
import Landing from "@/pages/Landing";
import Workspace from "@/pages/Workspace";
import RegisterPage from './pages/RegisterPage';
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ForgotPassword from "@/pages/ForgotPassword";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Routes (Wrapped in PublicRoute) */}
        {/* If logged in, these will auto-redirect to Dashboard */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />

        {/* 2. PROTECTED ROUTES (User MUST be logged in) */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<Onboarding />} />
          <Route path="/case/:id" element={<Workspace />} />
          <Route path="/new-case" element={<Landing />} />
        </Route>

        {/* 3. Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />

        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;