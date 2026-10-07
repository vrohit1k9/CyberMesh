import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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
      if (res.success && res.data?.cases) {
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
    <div className="flex flex-col gap-4 w-full px-margin-mobile text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wide text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[24px]">description</span>
            ACTIVE INVESTIGATION DOSSIERS
          </h1>
          <p className="text-xs text-on-surface-variant font-mono mt-1">
            Correlated syndicate cases with automated RAG domain intelligence &amp; Section 91 CrPC freeze pipelines
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px]">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-outline text-[18px] absolute left-2.5 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search case ID, investigation title, or primary complaint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container/60"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 font-mono text-xs">
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary-container/60"
          >
            <option value="">All Risk Tiers</option>
            <option value="CRITICAL">Critical (&gt; 80)</option>
            <option value="HIGH">High (61-80)</option>
            <option value="MEDIUM">Medium (31-60)</option>
            <option value="LOW">Low (0-30)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary-container/60"
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
        <div className="flex items-center justify-center h-48 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <span className="font-mono text-xs text-primary-container animate-pulse">
            LOADING CASE DOSSIERS...
          </span>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-surface-container-low p-8 text-center text-outline font-mono text-xs rounded-xl border border-outline-variant/30">
          No active case dossiers matching filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cases.map((c) => {
            const score = c.risk_score || 0;
            const isCrit = score >= 80;

            return (
              <div
                key={c.case_id}
                className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 hover:border-primary-container/50 transition-all flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-primary-fixed font-mono text-sm">{c.case_id}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          isCrit
                            ? 'bg-secondary-container/20 text-secondary border border-secondary-container/40'
                            : 'bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/40'
                        }`}
                      >
                        {score} • {c.risk_level || 'TIER'}
                      </span>
                      <span className="bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant/20">
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-on-surface mb-1 font-sans">{c.case_title}</h3>
                  <p className="text-xs text-on-surface-variant font-mono line-clamp-2 mb-3">
                    {c.investigation_notes || 'Preliminary file opened based on reported cyber incident.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-mono">
                  <div className="text-[11px] text-outline">
                    Anchor: <span className="text-primary-container font-bold">{c.primary_identifier || 'VPA/PHONE'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}/network`)}
                      className="px-2 py-1 bg-surface-container hover:bg-surface-bright text-primary-container rounded text-[11px] font-mono transition-colors flex items-center gap-1 border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-[13px]">hub</span>
                      <span>GRAPH</span>
                    </button>
                    <button
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="px-2.5 py-1 bg-primary-container text-on-primary-fixed font-bold font-mono text-[11px] rounded hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <span>RAG BRIEF</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
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
