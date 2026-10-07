import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderLock, Search, Filter, ShieldAlert, ArrowUpRight, Network } from 'lucide-react';
import { api } from '../services/api';

const RISK_COLORS = {
  'CRITICAL': '#f43f5e',
  'HIGH': '#f59e0b',
  'MEDIUM': '#3b82f6',
  'LOW': '#10b981'
};

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCases = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(riskLevel ? { riskLevel } : {})
      });
      const res = await api.getCases(queryParams.toString());
      if (res.success) {
        setCases(res.data.cases);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [status, riskLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCases();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
            <FolderLock className="w-6 h-6 text-cyan-400" />
            INVESTIGATION CASES BOARD
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Correlated fraud syndicates and multi-victim active investigations
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-glass-card p-4 rounded-xl border border-[#1f293d] flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case ID, investigation title, or primary complaint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical (&gt; 80)</option>
            <option value="HIGH">High (61-80)</option>
            <option value="MEDIUM">Medium (31-60)</option>
            <option value="LOW">Low (0-30)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="NEW">New</option>
            <option value="DISRUPTED">Disrupted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching case records...</span>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="cyber-glass-card p-12 text-center text-slate-500 font-mono text-xs rounded-xl">
          No investigation cases found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((c) => {
            const score = c.risk_score || 0;
            const level = c.risk_level || 'LOW';
            const riskColor = RISK_COLORS[level] || '#3b82f6';

            return (
              <div 
                key={c.case_id}
                className="cyber-glass-card p-5 rounded-xl border border-[#1f293d] hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-cyan-400 font-mono text-sm">{c.case_id}</span>
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                        style={{
                          backgroundColor: `${riskColor}20`,
                          color: riskColor,
                          border: `1px solid ${riskColor}50`
                        }}
                      >
                        {score} • {level}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mb-1.5">{c.case_title}</h3>
                  <p className="text-xs text-slate-400 font-mono line-clamp-2 mb-4">
                    {c.investigation_notes || 'Preliminary file opened based on reported cyber incident.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1f293d] flex items-center justify-between text-xs font-mono">
                  <div className="text-[11px] text-slate-500">
                    Lead: <span className="text-slate-300">{c.investigator_name || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}/network`)}
                      className="px-2.5 py-1 bg-[#111827] hover:bg-cyan-950/40 border border-[#1f293d] hover:border-cyan-500/40 text-cyan-400 rounded text-[11px] transition-colors flex items-center gap-1"
                    >
                      <Network className="w-3 h-3" />
                      <span>Graph</span>
                    </button>
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold rounded text-[11px] transition-all flex items-center gap-1"
                    >
                      <span>Investigate</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
