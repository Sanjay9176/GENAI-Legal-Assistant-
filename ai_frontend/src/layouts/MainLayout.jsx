import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronLeft, LayoutDashboard, PlusCircle, LogOut, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; 

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); 

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-slate-900 text-white hidden md:flex flex-col transition-all duration-300 relative z-50 shadow-xl`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-10 bg-blue-600 rounded-full p-1 border-2 border-slate-50 text-white hover:bg-blue-700 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
        </button>

        {/* Logo */}
        <div className="p-6 h-16 border-b border-slate-800 flex items-center overflow-hidden whitespace-nowrap shrink-0">
          <span className="text-xl mr-4">⚖️</span>
          {isSidebarOpen && <span className="font-bold tracking-tight">Gen-Vidhik</span>}
        </div>

        {/* --- TOP SECTION (Navigation) --- */}
        <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            isOpen={isSidebarOpen} 
            active={isActive("/dashboard")}
            onClick={() => navigate("/dashboard")} 
          />
          {/* Add 'My Cases' here later */}
        </nav>

        {/* --- BOTTOM SECTION (Actions) --- */}
        <div className="p-3 bg-slate-800/50 border-t border-slate-800 space-y-2 shrink-0">
          
          <NavItem 
            icon={<PlusCircle size={20} />} 
            label="New Case" 
            isOpen={isSidebarOpen} 
            active={isActive("/new-case")}
            onClick={() => navigate("/new-case")}
            className="text-blue-400 hover:text-blue-300"
          />

          <NavItem 
            icon={<LogOut size={20} />} 
            label="Logout" 
            isOpen={isSidebarOpen} 
            onClick={logout} 
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          />
        </div>

      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* 1. Header (Added this) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Case Workspace
          </h2>
        </header>
        
        {/* 2. Main Content (Fixed Scrolling) */}
        {/* Changed overflow-hidden to overflow-y-auto */}
        <main className="flex-1 overflow-hidden p-4 relative scroll-smooth">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

// NavItem Component
const NavItem = ({ icon, label, isOpen, active = false, onClick, className = "" }) => (
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
    {isOpen && <span className="ml-4 font-medium transition-opacity duration-300 whitespace-nowrap">{label}</span>}
  </div>
);

export default MainLayout;