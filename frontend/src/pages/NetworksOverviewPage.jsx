import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NetworkGraphPage from './NetworkGraphPage';
import { api } from '../services/api';

export default function NetworksOverviewPage() {
  const [rings, setRings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRings() {
      try {
        const res = await api.getGlobalNetworks();
        if (res.success && res.data?.rings) {
          setRings(res.data.rings);
        }
      } catch (err) {
        // silent fallback
      } finally {
        setLoading(false);
      }
    }
    loadRings();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full text-on-surface">
      {/* Embedded Tactical Graph Deck (Page 2) */}
      <NetworkGraphPage />

      {/* Discovered Syndicate Cluster Dossiers */}
      <div className="px-margin-mobile flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">hub</span>
            <span className="font-headline-sm text-headline-sm text-primary uppercase font-mono tracking-wider font-bold">
              DISCOVERED SYNDICATE CLUSTERS (RECURSIVE CTE)
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            {rings.length} DETECTED
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 bg-surface-container-low rounded p-4 border border-outline-variant/30">
            <span className="font-mono text-xs text-primary-container animate-pulse">
              ANALYZING CYCLIC CTE GRAPH EDGES...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rings.map((ring) => {
              const isAlpha = ring.complaintCount >= 4;
              return (
                <div
                  key={ring.networkId}
                  className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 hover:border-primary-container/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-container font-mono text-sm">
                      {ring.networkId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isAlpha
                          ? 'bg-secondary-container/20 text-secondary border border-secondary-container/40'
                          : 'bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-container/40'
                      }`}
                    >
                      {isAlpha ? 'CRITICAL RING' : 'MULE LAYER'}
                    </span>
                  </div>

                  <div className="font-mono text-xs">
                    <div className="text-[10px] text-outline uppercase">ANCHOR HUB IDENTIFIER:</div>
                    <div className="text-primary-fixed bg-surface-container-lowest p-1.5 rounded truncate font-bold mt-1 border border-outline-variant/20">
                      {ring.anchorIdentifier}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/20">
                      <div className="text-[10px] text-outline uppercase">Complaints</div>
                      <div className="text-primary-container font-bold text-sm mt-0.5">
                        {ring.complaintCount}
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/20">
                      <div className="text-[10px] text-outline uppercase">Identifiers</div>
                      <div className="text-secondary font-bold text-sm mt-0.5">
                        {ring.identifierCount}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <span className="text-[11px] font-mono font-bold text-tertiary-fixed-dim">
                      ₹{ring.totalExposedAmount.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/cases/CASE-${ring.seedComplaintId?.replace('CMP-', '')}/network`)
                      }
                      className="px-2.5 py-1 bg-primary-container text-on-primary-fixed font-bold font-mono text-[11px] rounded hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <span>FOCUS TOPOLOGY</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
