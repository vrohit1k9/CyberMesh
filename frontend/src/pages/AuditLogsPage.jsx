import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, Terminal } from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 1 });
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(action ? { action } : {})
      });
      const res = await api.getAuditLogs(queryParams.toString());
      if (res.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs(1);
  }, [action]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
          IMMUTABLE INVESTIGATOR AUDIT LOG
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Cryptographically recorded action ledger for compliance, forensic accountability, and chain of custody
        </p>
      </div>

      {/* Filter Bar */}
      <div className="cyber-glass-card p-4 rounded-xl border border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Filter Action:</span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Forensic Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE_COMPLAINT">CREATE_COMPLAINT</option>
            <option value="UPDATE_COMPLAINT">UPDATE_COMPLAINT</option>
            <option value="UPDATE_CASE_STATUS">UPDATE_CASE_STATUS</option>
            <option value="ANALYZE_NETWORK">ANALYZE_NETWORK</option>
            <option value="RECALCULATE_RISK">RECALCULATE_RISK</option>
            <option value="GENERATE_AI_SUMMARY">GENERATE_AI_SUMMARY</option>
          </select>
        </div>

        <div className="text-xs font-mono text-cyan-400">
          Total Recorded Actions: <span className="font-bold">{pagination.total}</span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="cyber-glass-card rounded-xl border border-[#1f293d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090d18] text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Investigator</th>
                <th className="py-3 px-4">Forensic Action</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Metadata Context</th>
                <th className="py-3 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Reading audit ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const metaStr = typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : log.metadata;
                  return (
                    <tr key={log.log_id} className="hover:bg-[#131c31]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-500">#{log.log_id}</td>
                      <td className="py-3 px-4 text-slate-400">{log.created_at}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-cyan-400">{log.full_name || log.username || 'System Root'}</div>
                        <div className="text-[10px] text-slate-500">{log.badge_number || 'SYSTEM'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.resource} <span className="text-slate-500">({log.resource_id || '-'})</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-400" title={metaStr}>
                        {metaStr}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{log.ip_address}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#1f293d] flex items-center justify-between text-xs font-mono text-slate-400 bg-[#090d18]">
          <div>
            Page <span className="text-white font-bold">{pagination.page}</span> of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadAuditLogs(pagination.page - 1)}
              className="px-3 py-1 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadAuditLogs(pagination.page + 1)}
              className="px-3 py-1 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
