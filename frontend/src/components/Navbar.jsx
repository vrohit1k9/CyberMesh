import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [engine, setEngine] = useState('PostgreSQL 3NF');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const json = await res.json();
          setEngine(json.data.engine === 'PGLITE_EMBEDDED' ? 'PostgreSQL 3NF (Embedded)' : 'PostgreSQL 3NF');
        }
      } catch (e) {
        // silent fallback
      }
    }
    checkHealth();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    const term = searchTerm.trim();
    if (term.toLowerCase().startsWith('case-')) {
      navigate(`/cases/${term}`);
    } else {
      navigate(`/complaints?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0b1322]/95 backdrop-blur-xl pt-safe shadow-[0_2px_12px_rgba(0,0,0,0.45)] border-b border-cyan-500/20">
      <div className="h-28 px-4 max-w-7xl mx-auto flex flex-col justify-between py-2">
        {/* Top Brand & Officer Profile Bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-9 h-9 rounded bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-cyan-400 text-[22px]">database</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg text-cyan-400 font-bold tracking-wider font-mono">
                  CYBERMESH
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                  DBMS
                </span>
              </div>
              <span className="text-xs text-slate-400 truncate font-sans">
                Fraud Complaint &amp; Network Database
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              <span>DASHBOARD</span>
            </NavLink>

            <NavLink
              to="/complaints"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>COMPLAINTS</span>
            </NavLink>

            <NavLink
              to="/complaints/new"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>NEW COMPLAINT</span>
            </NavLink>

            <NavLink
              to="/networks"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">hub</span>
              <span>NETWORK GRAPH</span>
            </NavLink>

            <NavLink
              to="/cases"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">folder</span>
              <span>CASES</span>
            </NavLink>
          </div>

          {/* User Identity & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden xs:flex flex-col items-end text-right">
              <span className="text-xs text-cyan-400 font-mono font-bold">
                {user?.fullName || user?.username || 'Investigator'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                {user?.role || 'INVESTIGATOR'}
              </span>
            </div>
            <button
              onClick={logout}
              title={`Logged in as ${user?.username || 'Officer'}. Click to Logout`}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 hover:bg-cyan-500/20 hover:border-cyan-400 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">logout</span>
            </button>
          </div>
        </div>

        {/* Sub-Bar: DBMS Indicators + Quick Search Bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Status Indicators */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700/60 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>{engine}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/60 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Recursive CTE: Active</span>
            </div>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded max-w-[280px] flex-1 justify-between text-slate-400 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/50 transition-all"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Complaint or Identifier..."
              className="bg-transparent border-none text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none w-full"
            />
            <button type="submit" className="p-0.5 hover:text-cyan-400 transition-colors">
              <span className="material-symbols-outlined text-[15px] text-cyan-400">search</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
