import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  ChevronLeft,
  LayoutDashboard,
  PlusCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* ================= MOBILE SIDEBAR OVERLAY ================= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          bg-slate-900 text-white flex flex-col shadow-xl z-50
          transition-all duration-300
          fixed md:relative
          h-full
          ${
            isMobileSidebarOpen
              ? "left-0 w-64"
              : "left-[-260px] w-64 md:left-0"
          }
          ${isSidebarOpen ? "md:w-64" : "md:w-16"}
        `}
      >
        {/* TOGGLE (DESKTOP) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute -right-3 top-10 bg-blue-600 rounded-full p-1 border-2 border-slate-50 hover:bg-blue-700"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
        </button>

        {/* LOGO */}
        <div className="p-6 h-16 border-b border-slate-800 flex items-center shrink-0">
          <span className="text-xl mr-4">⚖️</span>
          {(isSidebarOpen || isMobileSidebarOpen) && (
            <span className="font-bold tracking-tight">Gen-Vidhik</span>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isOpen={isSidebarOpen || isMobileSidebarOpen}
            active={isActive("/dashboard")}
            onClick={() => {
              navigate("/dashboard");
              setIsMobileSidebarOpen(false);
            }}
          />
        </nav>

        {/* ACTIONS */}
        <div className="p-3 bg-slate-800/50 border-t border-slate-800 space-y-2 shrink-0">
          <NavItem
            icon={<PlusCircle size={20} />}
            label="New Case"
            isOpen={isSidebarOpen || isMobileSidebarOpen}
            active={isActive("/new-case")}
            onClick={() => {
              navigate("/new-case");
              setIsMobileSidebarOpen(false);
            }}
            className="text-blue-400 hover:text-blue-300"
          />

          <NavItem
            icon={<LogOut size={20} />}
            label="Logout"
            isOpen={isSidebarOpen || isMobileSidebarOpen}
            onClick={logout}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          />
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden md:ml-0">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 md:px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded hover:bg-slate-100"
            >
              <Menu size={18} />
            </button>

            <h2 className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Case Workspace
            </h2>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* ================= NAV ITEM ================= */
const NavItem = ({
  icon,
  label,
  isOpen,
  active = false,
  onClick,
  className = "",
}) => (
  <div
    onClick={onClick}
    className={`
      flex items-center p-3 rounded-lg cursor-pointer transition-colors
      ${active ? "bg-blue-600 text-white" : "hover:bg-slate-800"}
      ${!active && !className ? "text-slate-400 hover:text-white" : ""}
      ${className}
    `}
  >
    <div className="min-w-[24px] flex justify-center">{icon}</div>
    {isOpen && (
      <span className="ml-4 font-medium whitespace-nowrap">{label}</span>
    )}
  </div>
);

export default MainLayout;
