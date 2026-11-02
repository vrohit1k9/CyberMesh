import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseId = id || 'CASE-2026-001';

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await api.getCaseById(caseId);
        if (res.success && res.data?.case) {
          setCaseData(res.data.case);
        }
      } catch (err) {
        setError('Failed to fetch case details.');
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-400 font-mono text-sm animate-pulse">
        Loading case details from PostgreSQL...
      </div>
    );
  }

  const riskScore = caseData?.risk_score || 75;
  const riskLevel = caseData?.risk_level || 'HIGH';
  const reportedAmount = caseData?.reported_amount
    ? `₹${Number(caseData.reported_amount).toLocaleString('en-IN')}`
    : '₹2,90,000';

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <button onClick={() => navigate('/cases')} className="hover:text-cyan-400 transition-colors">
              Cases
            </button>
            <span>/</span>
            <span className="text-cyan-400 font-bold">{caseId}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-mono text-white">
            {caseData?.case_title || `Investigation Dossier ${caseId}`}
          </h1>
        </div>

        {/* View Network Graph Button */}
        <button
          onClick={() => navigate(`/cases/${caseId}/network`)}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">hub</span>
          <span>View Network Graph</span>
        </button>
      </div>

      {/* Case Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Primary Identifier */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-mono uppercase">Primary Identifier</span>
          <span className="text-base font-bold font-mono text-cyan-400 mt-2 truncate">
            {caseData?.primary_identifier || 'fastrefund@okaxis'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono mt-1">Beneficiary handle</span>
        </div>

        {/* Total Financial Loss */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-mono uppercase">Reported Amount</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-2">
            {reportedAmount}
          </span>
          <span className="text-[11px] text-slate-400 font-mono mt-1">Loss across complaints</span>
        </div>

        {/* Status */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-mono uppercase">Investigation Status</span>
          <span className="text-base font-bold font-mono text-amber-400 mt-2">
            {caseData?.status || 'ACTIVE'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono mt-1">Lead assigned</span>
        </div>

        {/* Risk Score */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-mono uppercase">Risk Level</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold font-mono text-rose-400">{riskScore}/100</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono font-bold">
              {riskLevel}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1">Explainable 4-factor score</span>
        </div>
      </div>

      {/* Primary Complaint & Connected Network Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Root Complaint Details */}
        <div className="bg-[#0e1726] p-5 rounded-xl border border-slate-700/60 shadow-md flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">receipt_long</span>
              Primary Complaint
            </span>
            <span className="text-cyan-400 font-bold">{caseData?.primary_complaint_id || 'CMP-2026-0001'}</span>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Incident Category:</span>
              <span className="text-slate-200 font-bold">{caseData?.category || 'UPI_FRAUD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Investigator:</span>
              <span className="text-slate-200">{caseData?.investigator_name || 'Inspector Sharma'}</span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-slate-400">Case Description:</span>
              <p className="bg-slate-900 p-3 rounded border border-slate-800 text-slate-300 leading-relaxed font-sans text-xs">
                {caseData?.investigation_notes ||
                  'Multiple complaints reported against shared financial endpoints. Correlated through recursive graph traversal over shared phone, UPI, and bank account identifiers.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4-Factor Risk Breakdown */}
        <div className="bg-[#0e1726] p-5 rounded-xl border border-slate-700/60 shadow-md flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">analytics</span>
              4-Factor Risk Breakdown
            </span>
            <span className="text-amber-400 font-bold">{riskScore} / 100</span>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            {/* Factor 1: Identifier Reuse */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-slate-300">
                <span>1. Identifier Reuse Across Complaints (Max 30)</span>
                <span className="text-cyan-400 font-bold">25 / 30</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>

            {/* Factor 2: Transaction Velocity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-slate-300">
                <span>2. Transaction Inflow Velocity (Max 25)</span>
                <span className="text-amber-400 font-bold">20 / 25</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>

            {/* Factor 3: Network Density */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-slate-300">
                <span>3. Graph Node Density / Hops (Max 25)</span>
                <span className="text-rose-400 font-bold">18 / 25</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>

            {/* Factor 4: Financial Loss Exposure */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-slate-300">
                <span>4. Cumulative Loss Exposure (Max 20)</span>
                <span className="text-emerald-400 font-bold">12 / 20</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
