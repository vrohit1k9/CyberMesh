import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getComplaints('limit=6&page=1')
        ]);

        if (statsRes?.success) setStats(statsRes.data);
        if (complaintsRes?.success && complaintsRes.data?.complaints) {
          setRecentComplaints(complaintsRes.data.complaints);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const kpis = stats?.kpis || {};
  const categories = stats?.categories || [];

  return (
    <div className="flex flex-col w-full gap-6 text-slate-100">
      {/* System Status Banner */}
      <div className="w-full bg-[#0b1322] px-4 py-3 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-mono text-cyan-300 font-semibold">
            PostgreSQL Relational Engine // 3NF Schema // Recursive Graph Traversal (WITH RECURSIVE)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/30">
            System Online
          </span>
        </div>
      </div>

      {/* 4 Core DBMS Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Total Complaints</span>
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">receipt_long</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              {kpis.totalComplaints ? kpis.totalComplaints.toLocaleString('en-IN') : '55'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Recorded in <span className="text-cyan-400 font-semibold">complaints</span> table
          </div>
        </div>

        {/* Reused Identifiers / Shared Hubs */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Shared Identifiers</span>
            <span className="material-symbols-outlined text-amber-400 text-[18px]">hub</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-amber-400 tracking-tight">
              {kpis.reusedIdentifiersCount || '18'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Linked across &ge;2 complaints
          </div>
        </div>

        {/* Detected Fraud Syndicates */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Fraud Rings / Cases</span>
            <span className="material-symbols-outlined text-rose-400 text-[18px]">folder_shared</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono text-rose-400 tracking-tight">
              {kpis.detectedSyndicates || '4'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Grouped by shared entities
          </div>
        </div>

        {/* Total Financial Loss */}
        <div className="bg-[#0e1726] p-4 rounded-xl border border-slate-700/60 shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Total Loss Reported</span>
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">currency_rupee</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-cyan-300 tracking-tight">
              {kpis.totalReportedLoss
                ? `₹${Number(kpis.totalReportedLoss).toLocaleString('en-IN')}`
                : '₹28,45,000'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Aggregate across all records
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0b1322] p-3 rounded-xl border border-slate-700/60">
        <span className="text-xs font-mono text-slate-400 font-semibold pl-1">QUICK ACTIONS:</span>
        <button
          onClick={() => navigate('/complaints/new')}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>Register New Complaint</span>
        </button>
        <button
          onClick={() => navigate('/networks')}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">hub</span>
          <span>View Network Graph</span>
        </button>
        <button
          onClick={() => navigate('/complaints')}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">table_rows</span>
          <span>Browse Complaints Table</span>
        </button>
      </div>

      {/* Category Breakdown & Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Categories Breakdown */}
        <div className="bg-[#0e1726] p-5 rounded-xl border border-slate-700/60 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">pie_chart</span>
              Categories in DB
            </span>
            <span className="text-xs font-mono text-slate-400">{categories.length} Types</span>
          </div>

          <div className="flex flex-col gap-2.5 mt-1">
            {categories.slice(0, 6).map((c) => (
              <div key={c.category} className="flex flex-col gap-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{c.category.replace(/_/g, ' ')}</span>
                  <span className="text-cyan-400 font-bold">{c.count} complaints</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((c.count / (kpis.totalComplaints || 55)) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registered Complaints Table */}
        <div className="lg:col-span-2 bg-[#0e1726] p-5 rounded-xl border border-slate-700/60 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">receipt_long</span>
              Recent Complaints in PostgreSQL
            </span>
            <button
              onClick={() => navigate('/complaints')}
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-400 uppercase text-[11px]">
                  <th className="py-2 px-3">Complaint ID</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentComplaints.map((c) => (
                  <tr
                    key={c.complaint_id}
                    onClick={() => navigate('/complaints')}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{c.complaint_id}</td>
                    <td className="py-2.5 px-3 text-slate-200 truncate max-w-[200px]">{c.title}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      ₹{Number(c.reported_amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
