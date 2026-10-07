import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cfcfrmsSynced, setCfcfrmsSynced] = useState(true);
  const [critCount, setCritCount] = useState(4);
  const [engine, setEngine] = useState('PG-3NF');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const json = await res.json();
          setEngine(json.data.engine === 'PGLITE_EMBEDDED' ? 'PG-3NF (EMBEDDED)' : 'PG-3NF (POSTGRES)');
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
    if (term.toLowerCase().startsWith('case-') || term.toLowerCase().startsWith('cr-')) {
      navigate(`/cases/${term}`);
    } else {
      navigate(`/transactions?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl pt-safe shadow-[0_2px_12px_rgba(0,0,0,0.45)] border-b border-outline-variant/20">
      <div className="h-28 px-margin-mobile max-w-7xl mx-auto flex flex-col justify-between py-space-xs">
        {/* Top Brand & Officer Profile Bar */}
        <div className="flex items-center justify-between gap-space-xs">
          {/* Logo & Subtitle */}
          <NavLink to="/dashboard" className="flex items-center gap-space-xs min-w-0 group">
            <div className="w-8 h-8 rounded bg-primary-container/20 border border-primary-container/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary-container text-[20px]">security</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-primary-container font-bold tracking-wider font-mono">
                  CYBERMESH
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">
                  RADAR
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate font-sans">
                UPI Scam &amp; Ring Radar
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 font-mono text-xs">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-surface-container-high text-primary-container font-bold border border-primary-container/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">radar</span>
              <span>OVERVIEW</span>
            </NavLink>
            <NavLink
              to="/cases"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-surface-container-high text-primary-container font-bold border border-primary-container/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>RAG BRIEF</span>
              <span className="text-[9px] px-1 rounded bg-primary-container text-on-primary-fixed font-bold">+AI</span>
            </NavLink>
            <NavLink
              to="/networks"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-surface-container-high text-primary-container font-bold border border-primary-container/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">hub</span>
              <span>GRAPH MATRIX</span>
            </NavLink>
            <NavLink
              to="/complaints/new"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-surface-container-high text-primary-container font-bold border border-primary-container/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>INTAKE</span>
            </NavLink>
            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-surface-container-high text-primary-container font-bold border border-primary-container/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">timeline</span>
              <span>WIRETAP</span>
            </NavLink>
            <NavLink
              to="/audit-logs"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-surface-container-high text-primary-container font-bold border border-primary-container/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`
              }
            >
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              <span>AUDIT</span>
            </NavLink>
          </div>

          {/* Officer Identity & Badge */}
          <div className="flex items-center gap-space-xs shrink-0">
            <div className="hidden xs:flex flex-col items-end text-right">
              <span className="font-label-sm text-label-sm text-primary font-mono font-bold">
                {user?.badgeNumber || 'IO-9482'} // {user?.role || 'CYBER CELL'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                NODE VERIFIED
              </span>
            </div>
            <button
              onClick={logout}
              title={`Logged in as ${user?.username || 'Officer'}. Click to Logout`}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </button>
          </div>
        </div>

        {/* Tactical Sub-Bar: Telemetry Pills + Quick Omni-Search Bar */}
        <div className="flex items-center justify-between gap-space-xs pt-1">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span>
              <span className="font-mono">CFCFRMS: SYNCED</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary font-label-sm text-label-sm border border-secondary-container/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping"></span>
              <span className="font-mono font-bold">CRIT: {critCount}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-primary-fixed font-label-sm text-label-sm font-mono shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              <span>{engine}</span>
            </div>
          </div>

          {/* Quick Trace Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded max-w-[220px] flex-1 justify-between text-on-surface-variant focus-within:ring-1 focus-within:ring-primary-container transition-all"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="UTR / VPA TRACE"
              className="bg-transparent border-none text-[11px] font-mono text-on-surface placeholder:text-outline focus:outline-none w-full"
            />
            <button type="submit" className="p-0.5 hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined text-[14px] text-primary-container">search</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
