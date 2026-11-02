import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, AlertTriangle, Filter, CheckCircle2, Activity, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [channel, setChannel] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(anomalyOnly ? { anomalyOnly: 'true' } : {}),
        ...(channel ? { paymentChannel: channel } : {}),
        ...(search ? { search } : {})
      });
      const res = await api.getTransactions(queryParams.toString());
      if (res.success) {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnomalyScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.runAnomalyDetection();
      if (res.success) {
        setScanResult(res.data);
        await loadTransactions(1);
      }
    } catch (err) {
      console.error('Anomaly detection failed:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, [anomalyOnly, channel]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-cyan-400" />
            FINANCIAL TRANSACTION SURVEILLANCE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tracking money movements, payment channels, and statistical velocity anomalies ({pagination.total} records)
          </p>
        </div>

        <button
          type="button"
          disabled={scanning}
          onClick={handleRunAnomalyScan}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RUNNING STATISTICAL SCAN...</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 text-amber-200" />
              <span>RUN STATISTICAL ANOMALY SCAN</span>
            </>
          )}
        </button>
      </div>

      {/* Anomaly Scan Result Alert */}
      {scanResult && (
        <div className="cyber-glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3">
          <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono text-xs">
            <div className="text-amber-200 font-bold mb-1">
              Statistical Anomaly Scan Complete ({scanResult.engine})
            </div>
            <p className="text-slate-300">
              Evaluated <span className="font-bold text-white">{scanResult.totalAnalyzed}</span> financial transactions using amount Z-Score deviation, receiver velocity surges, and high-ticket thresholds.
              Flagged <span className="font-bold text-rose-400">{scanResult.flaggedCount}</span> anomalous transactions.
            </p>
          </div>
          <button
            onClick={() => setScanResult(null)}
            className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="cyber-glass-card p-4 rounded-xl border border-[#1f293d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transaction ID, reference, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Payment Channels</option>
            <option value="UPI">UPI</option>
            <option value="IMPS">IMPS</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="CARD">CARD</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnomalyOnly(!anomalyOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              anomalyOnly
                ? 'bg-rose-950 text-rose-400 border border-rose-500/50 shadow-cyber-rose'
                : 'bg-[#0a0f1d] text-slate-400 border border-[#1f293d] hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Show Anomalies Only</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="cyber-glass-card rounded-xl border border-[#1f293d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090d18] text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Sender Endpoint</th>
                <th className="py-3 px-4">Receiver Beneficiary</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Anomaly Flag</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving transaction stream...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No transactions found matching the filter.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.transaction_id} className={`hover:bg-[#131c31]/60 transition-colors ${
                    t.is_flagged_anomaly ? 'bg-rose-950/15' : ''
                  }`}>
                    <td className="py-3 px-4 font-bold text-cyan-400">{t.transaction_id}</td>
                    <td className="py-3 px-4 text-slate-400">{t.complaint_id || 'Cross-Ring'}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-[150px] truncate">
                      {t.sender_value || 'Citizen Account'}
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-semibold max-w-[180px] truncate">
                      {t.receiver_value}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-bold">
                      ₹{parseFloat(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e293b] text-slate-300 border border-slate-700">
                        {t.payment_channel}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {t.is_flagged_anomaly ? (
                        <div className="flex items-start gap-1.5 text-rose-400 text-[10px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="truncate">{t.anomaly_reason || 'Anomaly Detected'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Normal Flow</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">
                      {t.transaction_timestamp.split('T')[0]}
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
              onClick={() => loadTransactions(pagination.page - 1)}
              className="px-3 py-1 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadTransactions(pagination.page + 1)}
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
