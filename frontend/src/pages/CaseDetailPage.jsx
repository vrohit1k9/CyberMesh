import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FolderLock, 
  Network, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  Phone, 
  Globe, 
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';

const RISK_COLORS = {
  'CRITICAL': '#f43f5e',
  'HIGH': '#f59e0b',
  'MEDIUM': '#3b82f6',
  'LOW': '#10b981'
};

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusVal, setStatusVal] = useState('ACTIVE');
  const [notesVal, setNotesVal] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [recalculatingRisk, setRecalculatingRisk] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getCaseById(id);
      if (res.success) {
        setCaseData(res.data.case);
        setStatusVal(res.data.case.status);
        setNotesVal(res.data.case.investigation_notes || '');
        if (res.data.case.ai_summary) {
          setSummaryData({
            summary: res.data.case.ai_summary,
            generatedAt: res.data.case.ai_summary_generated_at
          });
        }
      }

      // Also load network graph for linked entities and complaints
      const netRes = await api.getCaseNetwork(id, 3);
      if (netRes.success) {
        setNetworkData(netRes.data);
      }
    } catch (err) {
      console.error('Failed to load case:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true);
    setMessage('');
    try {
      const res = await api.updateCaseStatus(id, {
        status: statusVal,
        investigation_notes: notesVal
      });
      if (res.success) {
        setMessage('Case status and investigation log successfully updated.');
      }
    } catch (err) {
      setMessage(`Update failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRecalculateRisk = async () => {
    setRecalculatingRisk(true);
    try {
      const res = await api.recalculateRisk(id);
      if (res.success) {
        setCaseData(prev => ({
          ...prev,
          risk_score: res.data.risk.final_score,
          risk_level: res.data.risk.risk_level,
          score_factors: res.data.risk.score_factors,
          identifier_reuse_score: res.data.risk.identifier_reuse_score,
          transaction_anomaly_score: res.data.risk.transaction_anomaly_score,
          network_density_score: res.data.risk.network_density_score,
          complaint_frequency_score: res.data.risk.complaint_frequency_score
        }));
        setMessage('Risk score recalculated from live graph topology.');
      }
    } catch (err) {
      setMessage(`Recalculation error: ${err.message}`);
    } finally {
      setRecalculatingRisk(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await api.generateAiSummary(id);
      if (res.success) {
        setSummaryData(res.data);
        setMessage('AI Investigation Summary generated and logged to case file.');
      }
    } catch (err) {
      setMessage(`Summary error: ${err.message}`);
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading investigation file {id}...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return <div className="text-rose-400 font-mono text-xs">Investigation case not found.</div>;
  }

  const score = caseData.risk_score || 0;
  const level = caseData.risk_level || 'LOW';
  const riskColor = RISK_COLORS[level] || '#3b82f6';
  const factors = typeof caseData.score_factors === 'string' ? JSON.parse(caseData.score_factors) : (caseData.score_factors || []);

  const connectedComplaints = networkData?.nodes.filter(n => n.type === 'COMPLAINT') || [];
  const connectedIdentifiers = networkData?.nodes.filter(n => n.type !== 'COMPLAINT') || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-mono tracking-wide text-white">
                {caseData.case_id}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded text-xs font-bold font-mono"
                style={{
                  backgroundColor: `${riskColor}20`,
                  color: riskColor,
                  border: `1px solid ${riskColor}50`
                }}
              >
                {score} / 100 • {level}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{caseData.case_title}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cases/${id}/network`)}
            className="px-4 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-semibold text-xs font-mono rounded-lg transition-all flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            <span>Interactive Graph</span>
          </button>

          <button
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs font-mono rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generatingSummary ? 'Synthesizing...' : 'Generate AI Summary'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Primary Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint & Case Synopsis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Primary Incident Profile
              </span>
              <span className="text-xs font-mono text-cyan-400">
                {caseData.primary_complaint_id}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {caseData.primary_complaint_title}
              </h3>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-[#0a0f1d] p-3.5 rounded-lg border border-[#1f293d]">
                {caseData.primary_complaint_desc}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                <div className="text-[10px] text-slate-500 uppercase">Category</div>
                <div className="text-cyan-400 font-bold mt-0.5">{caseData.category}</div>
              </div>
              <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                <div className="text-[10px] text-slate-500 uppercase">Reported Loss</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  ₹{parseFloat(caseData.reported_amount).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                <div className="text-[10px] text-slate-500 uppercase">Reported Date</div>
                <div className="text-slate-300 font-bold mt-0.5">{caseData.reported_date}</div>
              </div>
            </div>
          </div>

          {/* AI Investigation Summary Box */}
          {summaryData && (
            <div className="cyber-glass-card p-6 rounded-xl border border-purple-500/30 space-y-4 bg-purple-950/10">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                    AI Investigation Brief & Recommendations
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Grounded on Discovered Graph Evidence
                </span>
              </div>

              <div className="text-xs font-mono text-slate-200 leading-relaxed bg-[#0a0f1d] p-4 rounded-lg border border-[#1f293d]">
                {summaryData.summary}
              </div>

              {summaryData.patterns && summaryData.patterns.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase">
                    Detected Syndicate Patterns:
                  </div>
                  <ul className="space-y-1 text-xs font-mono text-slate-300">
                    {summaryData.patterns.map((pat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400">•</span>
                        <span>{pat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summaryData.recommendations && summaryData.recommendations.length > 0 && (
                <div className="pt-2 border-t border-[#1f293d]">
                  <div className="text-[11px] font-mono font-bold text-cyan-400 mb-2 uppercase">
                    Statutory Next Steps (crpc notices / freezing):
                  </div>
                  <ul className="space-y-1.5 text-xs font-mono text-slate-300">
                    {summaryData.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Connected Identifiers Cards */}
          <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Connected Identifiers in Syndicate ({connectedIdentifiers.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Discovered via Recursive Traversal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectedIdentifiers.map((ident) => (
                <div
                  key={ident.id}
                  className="p-3 bg-[#0a0f1d] border border-[#1f293d] rounded-lg text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {ident.type}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ID: #{ident.data.identifierId}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200 truncate">{ident.label}</div>
                  {ident.data.meta?.bankName && (
                    <div className="text-[10px] text-slate-400">Bank: {ident.data.meta.bankName}</div>
                  )}
                  {ident.data.meta?.carrier && (
                    <div className="text-[10px] text-slate-400">Carrier: {ident.data.meta.carrier}</div>
                  )}
                  {ident.data.meta?.registrar && (
                    <div className="text-[10px] text-slate-400">Registrar: {ident.data.meta.registrar}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Risk Breakdown & Investigator Actions */}
        <div className="space-y-6">
          {/* Explainable 4-Factor Risk Score Gauge */}
          <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Risk Engine Breakdown
              </span>
              <button
                onClick={handleRecalculateRisk}
                disabled={recalculatingRisk}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                title="Recalculate Risk Score"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculatingRisk ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            <div className="text-center py-2">
              <div 
                className="text-5xl font-extrabold font-mono"
                style={{ color: riskColor }}
              >
                {score}
              </div>
              <div className="text-xs font-mono uppercase tracking-widest mt-1 text-slate-400">
                Severity: <span style={{ color: riskColor, fontWeight: 'bold' }}>{level}</span>
              </div>
            </div>

            {/* Factor Bars */}
            <div className="space-y-3 pt-2 border-t border-[#1f293d] text-xs font-mono">
              <div>
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="text-slate-400">Identifier Reuse</span>
                  <span className="text-cyan-400 font-bold">{caseData.identifier_reuse_score || 0} / 30</span>
                </div>
                <div className="w-full bg-[#0a0f1d] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-1.5 rounded-full"
                    style={{ width: `${((caseData.identifier_reuse_score || 0) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="text-slate-400">Transaction Anomaly</span>
                  <span className="text-amber-400 font-bold">{caseData.transaction_anomaly_score || 0} / 25</span>
                </div>
                <div className="w-full bg-[#0a0f1d] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-1.5 rounded-full"
                    style={{ width: `${((caseData.transaction_anomaly_score || 0) / 25) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="text-slate-400">Network Density</span>
                  <span className="text-purple-400 font-bold">{caseData.network_density_score || 0} / 25</span>
                </div>
                <div className="w-full bg-[#0a0f1d] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-purple-400 h-1.5 rounded-full"
                    style={{ width: `${((caseData.network_density_score || 0) / 25) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="text-slate-400">Financial Exposure</span>
                  <span className="text-rose-400 font-bold">{caseData.complaint_frequency_score || 0} / 20</span>
                </div>
                <div className="w-full bg-[#0a0f1d] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-rose-400 h-1.5 rounded-full"
                    style={{ width: `${((caseData.complaint_frequency_score || 0) / 20) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Complaints in Network */}
          <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Connected Complaints ({connectedComplaints.length})
            </span>

            <div className="space-y-2">
              {connectedComplaints.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-[#0a0f1d] border border-[#1f293d] rounded-lg text-xs font-mono flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-cyan-400">{c.data.complaintId}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.data.title}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-emerald-400 text-[11px] font-bold">
                      ₹{c.data.amount?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Status & Investigator Notes */}
          <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] space-y-4">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Investigator Actions
            </span>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Investigation Status
              </label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="NEW">New</option>
                <option value="ACTIVE">Active Investigation</option>
                <option value="IN_REVIEW">Under Legal Review</option>
                <option value="ESCALATED">Escalated to Cyber Cell</option>
                <option value="DISRUPTED">Mule Account Disrupted</option>
                <option value="CLOSED">Closed File</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Case Diary / Investigator Notes
              </label>
              <textarea
                rows="3"
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                placeholder="Log investigative progress, bank communication, FIR filing reference..."
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={updatingStatus}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold font-mono text-xs rounded-lg transition-all shadow-cyber-cyan disabled:opacity-50"
            >
              {updatingStatus ? 'Updating...' : 'Update Investigation Log'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
