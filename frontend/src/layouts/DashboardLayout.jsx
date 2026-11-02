import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070d17] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 antialiased font-sans">
      {/* Top Header */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full pt-32 pb-24 max-w-7xl mx-auto flex flex-col px-4">
        <Outlet />
      </main>

      {/* Fixed Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 pb-safe bg-[#0b1322]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.5)] border-t border-cyan-500/20 lg:hidden">
        <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono text-xs ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </NavLink>

          {/* Complaints */}
          <NavLink
            to="/complaints"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono text-xs ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Complaints</span>
          </NavLink>

          {/* New Complaint */}
          <NavLink
            to="/complaints/new"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono text-xs ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>New</span>
          </NavLink>

          {/* Graph */}
          <NavLink
            to="/networks"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono text-xs ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <span>Graph</span>
          </NavLink>

          {/* Cases */}
          <NavLink
            to="/cases"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono text-xs ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">folder</span>
            <span>Cases</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
