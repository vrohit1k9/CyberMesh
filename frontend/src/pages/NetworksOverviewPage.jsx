import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, AlertCircle, Share2, DollarSign, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function NetworksOverviewPage() {
  const [rings, setRings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRings() {
      try {
        const res = await api.getGlobalNetworks();
        if (res.success) {
          setRings(res.data.rings);
        }
      } catch (err) {
        console.error('Failed to load global fraud rings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
          <Network className="w-6 h-6 text-cyan-400" />
          DISCOVERED FRAUD SYNDICATE CLUSTERS
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Automated multi-incident graph correlation across shared beneficiary bank accounts, phone numbers, and domains
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Executing global connected-component graph analysis...</span>
          </div>
        </div>
      ) : rings.length === 0 ? (
        <div className="cyber-glass-card p-12 text-center text-slate-500 font-mono text-xs rounded-xl">
          No multi-complaint fraud rings detected in current database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rings.map((ring, idx) => {
            const isAlpha = ring.complaintCount >= 4;
            return (
              <div 
                key={ring.networkId}
                className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-cyan-400 font-mono text-sm">
                      {ring.networkId}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isAlpha 
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                    }`}>
                      {isAlpha ? 'CRITICAL SYNDICATE' : 'HIGH PRIORITY RING'}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400 mb-1">Anchor Hub Identifier:</div>
                  <div className="text-xs font-bold font-mono text-slate-100 bg-[#0a0f1d] p-2 rounded border border-[#1f293d] truncate mb-4">
                    {ring.anchorIdentifier}
                  </div>

                  {/* Ring Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-[#0a0f1d] p-3 rounded-lg border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500 uppercase">Complaints</div>
                      <div className="text-cyan-400 font-bold text-lg mt-0.5">{ring.complaintCount}</div>
                    </div>

                    <div className="bg-[#0a0f1d] p-3 rounded-lg border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500 uppercase">Identifiers</div>
                      <div className="text-purple-400 font-bold text-lg mt-0.5">{ring.identifierCount}</div>
                    </div>
                  </div>

                  <div className="mt-3 bg-[#0a0f1d] p-3 rounded-lg border border-[#1f293d] text-xs font-mono">
                    <div className="text-[10px] text-slate-500 uppercase">Total Ring Financial Loss</div>
                    <div className="text-emerald-400 font-bold text-base mt-0.5">
                      ₹{ring.totalExposedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1f293d] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Seed: {ring.seedComplaintId}
                  </span>
                  <button
                    onClick={() => navigate(`/cases/CASE-${ring.seedComplaintId.replace('CMP-', '')}/network`)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold font-mono text-xs rounded-lg transition-all shadow-cyber-cyan flex items-center gap-1.5"
                  >
                    <span>View Graph Topology</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
