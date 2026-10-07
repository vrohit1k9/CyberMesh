import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-fixed antialiased">
      {/* Tactical Top Header */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full pt-28 pb-24 max-w-7xl mx-auto flex flex-col">
        <Outlet />
      </main>

      {/* Fixed Tactical Bottom Mobile Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.5)] border-t border-outline-variant/20 lg:hidden"
        data-active-classes="text-primary-container font-semibold"
      >
        <div className="flex justify-around items-center h-16 px-gutter-mobile max-w-md mx-auto">
          {/* Overview Tab */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">radar</span>
            <span className="font-label-sm text-label-sm">Overview</span>
          </NavLink>

          {/* RAG Brief Tab (+AI) */}
          <NavLink
            to="/cases"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors relative font-mono ${
                isActive || location.pathname.startsWith('/cases')
                  ? 'text-primary-container font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span className="absolute -top-1 -right-3 text-[8px] px-1 py-0 rounded bg-primary-container text-on-primary-fixed font-headline-sm font-bold">
                +AI
              </span>
            </div>
            <span className="font-label-sm text-label-sm">RAG Brief</span>
          </NavLink>

          {/* Graph Matrix Tab */}
          <NavLink
            to="/networks"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <span className="font-label-sm text-label-sm">Graph</span>
          </NavLink>

          {/* Wiretap Tab */}
          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">stream</span>
            <span className="font-label-sm text-label-sm">Wiretap</span>
          </NavLink>

          {/* Audit Dossier Tab */}
          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors font-mono ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">terminal</span>
            <span className="font-label-sm text-label-sm">Audit</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
