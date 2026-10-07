import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {})
      });
      const res = await api.getComplaints(queryParams.toString());
      if (res.success) {
        setComplaints(res.data.complaints);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints(1);
  }, [category, status, priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadComplaints(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            INCIDENT COMPLAINTS REGISTRY
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Normalized 3NF cyber incident repository ({pagination.total} records recorded)
          </p>
        </div>
        <button
          onClick={() => navigate('/complaints/new')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs rounded-lg font-mono transition-all shadow-cyber-cyan flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Complaint (AI Extractor)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-glass-card p-4 rounded-xl border border-[#1f293d] flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, title, description, or victim name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Categories</option>
            <option value="UPI_FRAUD">UPI Fraud</option>
            <option value="PHISHING">Phishing</option>
            <option value="BANK_FRAUD">Bank Fraud</option>
            <option value="INVESTMENT_SCAM">Investment Scam</option>
            <option value="JOB_SCAM">Job Scam</option>
            <option value="SHOPPING_FRAUD">Shopping Fraud</option>
            <option value="ACCOUNT_TAKEOVER">Account Takeover</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="LINKED_TO_RING">Linked to Ring</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <button
            onClick={() => loadComplaints(pagination.page)}
            className="p-2 bg-[#0a0f1d] hover:bg-[#131c31] border border-[#1f293d] text-slate-300 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="cyber-glass-card rounded-xl border border-[#1f293d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090d18] text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Title & Synopsis</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Reported Amount</th>
                <th className="py-3 px-4">Linked Entities</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving database records...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No complaints matched the query criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-[#131c31]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400">{c.complaint_id}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-200 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{c.victim_name} • {c.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e293b] text-cyan-300 border border-cyan-900/40">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-semibold">
                      ₹{parseFloat(c.reported_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-purple-950/40 text-purple-300 border border-purple-800/40">
                        {c.identifier_count} Identifiers
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'LINKED_TO_RING' 
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{c.reported_date}</td>
                    <td className="py-3 px-4 text-right">
                      {c.case_id ? (
                        <button
                          onClick={() => navigate(`/cases/${c.case_id}`)}
                          className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Case {c.case_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#1f293d] flex items-center justify-between text-xs font-mono text-slate-400 bg-[#090d18]">
          <div>
            Showing Page <span className="text-white font-bold">{pagination.page}</span> of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadComplaints(pagination.page - 1)}
              className="px-3 py-1 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded disabled:opacity-30 disabled:hover:bg-[#111827]"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadComplaints(pagination.page + 1)}
              className="px-3 py-1 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded disabled:opacity-30 disabled:hover:bg-[#111827]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
