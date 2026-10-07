import React, { useState, useEffect } from 'react';
import { Search, Shield, Activity, Terminal } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar() {
  const [healthStatus, setHealthStatus] = useState('ONLINE');
  const [engine, setEngine] = useState('POSTGRESQL');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const json = await res.json();
          setEngine(json.data.engine === 'PGLITE_EMBEDDED' ? 'PG-EMBEDDED' : 'POSTGRES-SERVER');
          setHealthStatus('ONLINE');
        } else {
          setHealthStatus('DEGRADED');
        }
      } catch (e) {
        setHealthStatus('OFFLINE');
      }
    }
    checkHealth();
  }, []);

  return (
    <header className="h-16 bg-[#0d1322]/80 backdrop-blur-md border-b border-[#1f293d] px-8 flex items-center justify-between shrink-0 z-10">
      {/* Global Terminal Search */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search identifier, complaint ID, phone, UPI, or domain..."
            className="w-full bg-[#111827] border border-[#1f293d] rounded-lg pl-10 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
          />
        </div>
      </div>

      {/* Real-time System Status Telemetry */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded-lg border border-[#1f293d] text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-slate-400">DBMS:</span>
          <span className="text-cyan-400 font-bold">{engine}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded-lg border border-[#1f293d] text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">AI GATEWAY:</span>
          <span className="text-emerald-400 font-bold">{healthStatus}</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg">
          <Shield className="w-3.5 h-3.5" />
          <span>PROTOTYPE GRADE 3NF</span>
        </div>
      </div>
    </header>
  );
}
