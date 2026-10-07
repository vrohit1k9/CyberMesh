import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  FileText, 
  Share2, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign,
  Activity,
  Network
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { api } from '../services/api';

const RISK_COLORS = {
  'CRITICAL': '#f43f5e',
  'HIGH': '#f59e0b',
  'MEDIUM': '#3b82f6',
  'LOW': '#10b981'
};

const CATEGORY_COLORS = ['#00f2fe', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-cyan-400">Loading Intelligence Telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
        Failed to fetch telemetry data: {error}
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const categoryData = data?.categoryBreakdown || [];
  const riskData = data?.riskDistribution || [];
  const timelineData = data?.timeline || [];
  const recentCases = data?.recentCases || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            CYBER CRIME INVESTIGATION RADAR
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time identifier correlation, PostgreSQL graph analytics, and syndicate detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/complaints/new')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs rounded-lg font-mono transition-all shadow-cyber-cyan flex items-center gap-2"
          >
            + Ingest Complaint (AI)
          </button>
        </div>
      </div>

      {/* Primary KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Complaints */}
        <div className="cyber-glass-card p-5 rounded-xl border border-[#1f293d]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Complaints</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.totalComplaints || 0}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Recorded in 3NF database
          </div>
        </div>

        {/* Active Cases */}
        <div className="cyber-glass-card p-5 rounded-xl border border-[#1f293d]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Cases</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.activeCases || 0}</div>
          <div className="text-[11px] text-blue-400 font-mono mt-1">
            Under active investigation
          </div>
        </div>

        {/* Reused Identifiers */}
        <div className="cyber-glass-card p-5 rounded-xl border border-[#1f293d]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Reused Identifiers</span>
            <Share2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{kpis.reusedIdentifiers || 0}</div>
          <div className="text-[11px] text-purple-400 font-mono mt-1">
            Cross-incident links
          </div>
        </div>

        {/* Critical Cases */}
        <div className="cyber-glass-card p-5 rounded-xl border border-[#1f293d]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Critical Risk</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{kpis.criticalRiskCases || 0}</div>
          <div className="text-[11px] text-rose-400 font-mono mt-1">
            Risk Score &gt; 80 / 100
          </div>
        </div>

        {/* Total Financial Loss */}
        <div className="cyber-glass-card p-5 rounded-xl border border-[#1f293d]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Exposed Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 truncate">
            ₹{(kpis.totalReportedLoss || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Reported monetary loss
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 cyber-glass-card p-6 rounded-xl border border-[#1f293d]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Complaints by Category Distribution
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Aggregated from PostgreSQL complaint records</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f293d', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#00f2fe' }}
                />
                <Bar dataKey="count" fill="#00f2fe" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution Donut */}
        <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-1">
              Risk Level Severity
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mb-4">Explainable 4-factor risk breakdown</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="level"
                >
                  {riskData.map((entry) => (
                    <Cell key={`risk-${entry.level}`} fill={RISK_COLORS[entry.level] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f293d', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1f293d]">
            {riskData.map(r => (
              <div key={r.level} className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[r.level] || '#3b82f6' }}></span>
                <span className="text-slate-400">{r.level}:</span>
                <span className="text-white font-bold">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="cyber-glass-card rounded-xl border border-[#1f293d] overflow-hidden">
        <div className="p-5 border-b border-[#1f293d] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              High Priority Investigation Files
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Top ranked active cases requiring investigator intervention</p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Cases</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090d18] text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Investigation Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Exposed Loss</th>
                <th className="py-3 px-4">Risk Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {recentCases.map((c) => {
                const score = c.risk_score || 0;
                const level = c.risk_level || 'LOW';
                return (
                  <tr key={c.case_id} className="hover:bg-[#131c31]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400">{c.case_id}</td>
                    <td className="py-3 px-4 text-slate-200 max-w-xs truncate">{c.case_title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e293b] text-slate-300 border border-slate-700">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      ₹{parseFloat(c.reported_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ 
                            backgroundColor: `${RISK_COLORS[level]}20`, 
                            color: RISK_COLORS[level],
                            border: `1px solid ${RISK_COLORS[level]}40`
                          }}
                        >
                          {score} • {level}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/cases/${c.case_id}`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => navigate(`/cases/${c.case_id}/network`)}
                        className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px] transition-colors"
                      >
                        View Network
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
