import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import { api } from '../services/api';
import CaseSubGraph from '../components/CaseSubGraph';

try {
  cytoscape.use(cola);
} catch (e) {
  // Already registered
}

const DEMO_PRESETS = [
  {
    name: 'OLX QR Reverse Debit Scam (Syndicate Alpha)',
    title: 'Marketplace Buyer Fake QR Code Payment Reverse Debit',
    category: 'UPI_FRAUD',
    amount: '35000',
    description: 'Victim listed furniture on OLX. Buyer claimed to be army personnel and messaged from +919876543210. Buyer sent PhonePe QR code claiming victim must scan and enter UPI PIN to receive ₹35,000. Victim scanned QR code, money debited to fastrefund@okaxis and bank account 987654321012@HDFC0001234.'
  },
  {
    name: 'Telegram VIP Task Mule Scam (Syndicate Alpha)',
    title: 'Telegram High-Yield Task Commission Scam',
    category: 'INVESTMENT_SCAM',
    amount: '50000',
    description: 'Victim contacted on Telegram by +919876543210 offering part-time review tasks. After initial Rs 500 payout, victim instructed to deposit ₹50,000 via UPI fastrefund@okaxis. Directed to login on secure-kyc-update.xyz and send funds to bank account 987654321012@HDFC0001234.'
  },
  {
    name: 'Electricity Helpline Collect Trap (Syndicate Beta)',
    title: 'Urgent Power Disconnection Helpline Collect Trap',
    category: 'UPI_FRAUD',
    amount: '42000',
    description: 'Received SMS stating electricity will be disconnected tonight. Called recruiter/helpline +919811223344. Caller sent UPI collect request from workfromhome@paytm for ₹42,000 disguised as verification note and instructed victim to approve. Linked to bank account 112233445566.'
  },
  {
    name: 'Crypto & Forex VIP Signal Scam (Syndicate Gamma)',
    title: 'Forex Trading Platform Siphoning Scheme',
    category: 'INVESTMENT_SCAM',
    amount: '95000',
    description: 'Invested money on platform apex-forex-trade.net. Advised by agent from +919700112233. Deposited ₹95,000 through UPI handle apexvip@ybl backed by beneficiary bank account 554433221100.'
  }
];

export default function ComplaintNewPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('UPI_FRAUD');
  const [priority, setPriority] = useState('HIGH');
  const [location, setLocation] = useState('New Delhi Cyber Cell');
  const [victimName, setVictimName] = useState('Citizen Complainant');

  const [extractedEntities, setExtractedEntities] = useState([]);
  const [correlationData, setCorrelationData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTabs, setActiveTabs] = useState({}); // Per-case active tab: 'GRAPH' | 'RAG_SOLUTION' | 'EVIDENCE'

  const globalGraphContainerRef = useRef(null);
  const globalCyRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const setCaseTab = (caseId, tab) => {
    setActiveTabs((prev) => ({ ...prev, [caseId]: tab }));
  };

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setAmount(preset.amount);
    setExtractedEntities([]);
    setCorrelationData(null);
    setAnalysisDone(false);
    setError('');
  };

  const copyTextToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`);
    }
  };

  // Trigger Comprehensive AI + RAG + Database Correlation Pipeline
  const handleAnalyzeWithAi = async () => {
    if (!description || description.trim().length < 5) {
      setError('Please provide incident details with at least phone numbers, UPI handles, or bank accounts.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 1. Deterministic Entity Extraction
      const extractRes = await api.extractEntities(description);
      let entities = [];
      if (extractRes.success && extractRes.data.entities) {
        entities = extractRes.data.entities;
        setExtractedEntities(entities);
      }

      // 2. Category Classification
      const classRes = await api.classifyText(title, description);
      if (classRes.success && classRes.data.category) {
        setCategory(classRes.data.category);
      }

      // 3. Database Correlation & RAG Solution Generation
      const correlateRes = await api.correlate({
        title,
        description,
        reported_amount: parseFloat(amount) || 0,
        identifiers: entities
      });

      if (correlateRes.success && correlateRes.data) {
        setCorrelationData(correlateRes.data);
        showToast(correlateRes.data.syndicateSummary);
      }

      setAnalysisDone(true);
    } catch (err) {
      setError(`AI analysis warning: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render Global Panoramic Cytoscape Graph Preview
  useEffect(() => {
    if (!correlationData?.graphData || !globalGraphContainerRef.current) return;

    const gData = correlationData.graphData;
    const elements = [
      ...gData.nodes.map((n) => ({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          isNew: n.isNew
        }
      })),
      ...gData.edges.map((e) => ({
        group: 'edges',
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label
        }
      }))
    ];

    if (globalCyRef.current) {
      globalCyRef.current.destroy();
    }

    try {
      const cy = cytoscape({
        container: globalGraphContainerRef.current,
        elements,
        layout: {
          name: 'cola',
          animate: true,
          nodeSpacing: 45,
          edgeLength: 100
        },
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#dbfcff',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '9px',
              'font-weight': '600',
              'text-valign': 'bottom',
              'text-margin-y': '5px',
              'background-color': '#00dbe9',
              'border-width': '2px',
              'border-color': '#004f54',
              width: '28px',
              height: '28px',
              'text-background-color': '#0b0e16',
              'text-background-opacity': 0.85,
              'text-background-padding': '2px'
            }
          },
          {
            selector: 'node[?isNew]',
            style: {
              'background-color': '#df0042',
              'border-color': '#ffb3b6',
              'border-width': '3px',
              width: '34px',
              height: '34px',
              'shadow-blur': 14,
              'shadow-color': '#df0042'
            }
          },
          {
            selector: 'node[type = "UPI"]',
            style: {
              'background-color': '#ffd386',
              'border-color': '#7d5800',
              shape: 'round-rectangle'
            }
          },
          {
            selector: 'node[type = "COMPLAINT"]',
            style: {
              'background-color': '#00f0ff',
              'border-color': '#006970',
              shape: 'hexagon'
            }
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#3b494b',
              'target-arrow-color': '#00f0ff',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '7px',
              color: '#849495',
              'text-background-color': '#10131c',
              'text-background-opacity': 0.8
            }
          }
        ]
      });

      globalCyRef.current = cy;
    } catch (e) {
      console.error('Global preview Cytoscape error:', e);
    }
  }, [correlationData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        reported_amount: parseFloat(amount) || 0,
        category,
        priority,
        location,
        victim_name: victimName,
        isAiExtracted: analysisDone,
        identifiers: extractedEntities.map((ent) => ({
          type: ent.type,
          value: ent.value,
          roleInFraud: ent.role || 'BENEFICIARY',
          confidenceScore: ent.confidence || 1.0,
          extractedBy: 'AI_EXTRACTOR',
          details: ent.meta || {}
        }))
      };

      const res = await api.createComplaint(payload);
      if (res.success && res.data.caseId) {
        navigate(`/cases/${res.data.caseId}`);
      } else {
        navigate('/complaints');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const correlatedCases = correlationData?.correlatedCases || [];
  const rag = correlationData?.ragAnalysis;

  return (
    <div className="flex flex-col gap-6 w-full px-margin-mobile text-on-surface select-none pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wide text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[24px]">hub</span>
          INCIDENT INGESTION &amp; MULTI-CASE CORRELATION
        </h1>
        <p className="text-xs text-on-surface-variant font-mono mt-1">
          Automated indicator correlation • Per-case graph visualization • RAG statutory solution synthesis
        </p>
      </div>

      {/* Preset Quick Loader */}
      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex flex-wrap items-center justify-between gap-2 shadow-sm font-mono text-xs">
        <div className="flex items-center gap-2 text-primary-container font-bold">
          <span className="material-symbols-outlined text-[16px]">bookmark</span>
          <span>QUICK CORRELATION TEST PRESETS:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-bright text-primary-fixed border border-outline-variant/30 rounded text-xs transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-secondary-container/20 border border-secondary-container rounded-xl text-secondary text-xs font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Intake Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-3 shadow-md font-mono text-xs">
            <div>
              <label className="block text-[11px] text-outline uppercase mb-1">Incident / Complaint Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Marketplace Buyer Fake QR Code Payment Reverse Debit"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-on-surface focus:outline-none focus:border-primary-container/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-outline uppercase mb-1">Reported Amount (₹ INR)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="35000"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-on-surface focus:outline-none focus:border-primary-container/60"
                />
              </div>

              <div>
                <label className="block text-[11px] text-outline uppercase mb-1">Incident Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-on-surface focus:outline-none focus:border-primary-container/60"
                >
                  <option value="UPI_FRAUD">UPI Fraud</option>
                  <option value="INVESTMENT_SCAM">Investment Scam</option>
                  <option value="PHISHING">Phishing Portal</option>
                  <option value="BANK_FRAUD">Bank Fraud</option>
                  <option value="JOB_SCAM">Job Scam</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-outline uppercase mb-1">Incident Narrative &amp; Endpoints</label>
              <textarea
                rows={6}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste victim complaint text, phone numbers (+91), UPI handles (@okaxis), bank accounts, or phishing domains..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-on-surface font-sans text-xs focus:outline-none focus:border-primary-container/60 leading-relaxed"
              />
            </div>

            {/* AI Action Trigger Button */}
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyzeWithAi}
              className="w-full py-2.5 rounded bg-primary-container text-on-primary-fixed font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin"></span>
                  <span>CORRELATING WITH DATABASE &amp; RUNNING RAG...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>CORRELATE WITH DATABASE &amp; SYNTHESIZE SOLUTIONS</span>
                </>
              )}
            </button>
          </div>

          {/* Submit / Open Formal Case Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded bg-secondary-container text-on-secondary-container font-mono text-xs uppercase font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
          >
            {isSubmitting ? (
              <span>COMMITTING TRANSACTION...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>OPEN FORMAL CASE DOSSIER IN DATABASE</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Dynamic Live Correlation, Per-Case Graphs & RAG Solutions */}
        <div className="flex flex-col gap-4">
          {!analysisDone ? (
            <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[360px]">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[28px]">account_tree</span>
              </div>
              <span className="font-mono text-sm text-on-surface font-bold">READY TO CORRELATE</span>
              <p className="font-mono text-xs text-outline max-w-sm">
                Click <strong>&quot;CORRELATE WITH DATABASE &amp; SYNTHESIZE SOLUTIONS&quot;</strong>. CyberMesh will scan for overlapping UPI handles, bank accounts, and phone numbers in existing database cases, generating an interactive sub-graph and RAG statutory directives for each related case.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Extracted Identifiers Badge Bar */}
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 font-mono text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-outline uppercase font-bold">1. EXTRACTED IDENTIFIERS</span>
                  <span className="text-primary-container font-bold">{extractedEntities.length} FOUND</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {extractedEntities.map((ent, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-mono text-[11px] border border-outline-variant/30 flex items-center gap-1"
                    >
                      <span className="text-outline text-[9px]">{ent.type}:</span>
                      <span className="font-bold">{ent.value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* RAG Matched Modus Operandi Card */}
              {rag?.matchedModusOperandi && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 font-mono shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-primary-container">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        2. RAG DOMAIN INTELLIGENCE
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-fixed text-[10px] font-bold">
                      {rag.matchedModusOperandi.relevancePercentage || '98%'} MATCH
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-xs text-primary-fixed font-bold block">
                      {rag.matchedModusOperandi.name}
                    </span>
                    <p className="text-[11px] text-on-surface-variant font-sans mt-1 leading-relaxed">
                      {rag.matchedModusOperandi.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 3: Per-Case Correlation & Dedicated Sub-Graphs */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-secondary font-mono">
                    <span className="material-symbols-outlined text-[18px]">hub</span>
                    <span className="font-bold text-xs uppercase tracking-wider">
                      3. CORRELATED DATABASE CASES ({correlatedCases.length} FOUND)
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      correlatedCases.length > 0
                        ? 'bg-secondary-container/20 text-secondary border border-secondary-container/40 animate-pulse'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    {correlatedCases.length > 0 ? 'SYNDICATE MATCH DETECTED' : 'NO OVERLAP'}
                  </span>
                </div>

                {correlatedCases.length === 0 ? (
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-outline text-xs font-mono">
                    No matching identifiers found in existing database cases. This is an isolated incident.
                  </div>
                ) : (
                  correlatedCases.map((cc) => {
                    const activeTab = activeTabs[cc.caseId] || 'GRAPH';
                    const sol = cc.possibleSolution || {};

                    return (
                      <div
                        key={cc.caseId}
                        className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-3 font-mono shadow-md"
                      >
                        {/* Case Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-bold text-xs border border-primary/30">
                              {cc.caseId}
                            </span>
                            <span className="font-sans font-bold text-on-surface text-xs truncate max-w-xs">
                              {cc.caseTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold text-[10px]">
                              RISK: {cc.riskScore}/100 • {cc.riskLevel}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-outline text-[10px]">
                              {cc.status}
                            </span>
                          </div>
                        </div>

                        {/* Hop Path Breadcrumb */}
                        <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/20 text-[11px] flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold text-[9px]">
                            NEW INTAKE
                          </span>
                          <span className="material-symbols-outlined text-[12px] text-outline">arrow_forward</span>
                          <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-bold text-[9px]">
                            {cc.correlationDegree}
                          </span>
                          <span className="material-symbols-outlined text-[12px] text-outline">arrow_forward</span>
                          <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-fixed font-bold text-[9px]">
                            {cc.caseId} ({cc.complaints.length} COMPLAINTS)
                          </span>
                        </div>

                        {/* Interactive Tab Switcher for this Case */}
                        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/30 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCaseTab(cc.caseId, 'GRAPH')}
                            className={`flex-1 py-1 px-2 rounded font-bold uppercase transition-colors flex items-center justify-center gap-1 ${
                              activeTab === 'GRAPH'
                                ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">account_tree</span>
                            <span>GRAPH VISUALIZATION</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCaseTab(cc.caseId, 'RAG_SOLUTION')}
                            className={`flex-1 py-1 px-2 rounded font-bold uppercase transition-colors flex items-center justify-center gap-1 ${
                              activeTab === 'RAG_SOLUTION'
                                ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">gavel</span>
                            <span>RAG STATUTORY SOLUTION</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCaseTab(cc.caseId, 'EVIDENCE')}
                            className={`flex-1 py-1 px-2 rounded font-bold uppercase transition-colors flex items-center justify-center gap-1 ${
                              activeTab === 'EVIDENCE'
                                ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">checklist</span>
                            <span>EVIDENCE CHECKLIST</span>
                          </button>
                        </div>

                        {/* TAB 1: DEDICATED GRAPH VISUALIZATION FOR THIS CASE */}
                        {activeTab === 'GRAPH' && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-outline uppercase font-bold">
                              Sub-Graph Topology: New Intake Connecting to {cc.caseId}
                            </span>
                            {cc.caseGraph ? (
                              <CaseSubGraph graphData={cc.caseGraph} caseId={cc.caseId} />
                            ) : (
                              <div className="p-4 bg-surface-container-lowest text-outline text-xs text-center rounded">
                                No sub-graph data available.
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 2: RAG STATUTORY SOLUTION & DIRECTIVES */}
                        {activeTab === 'RAG_SOLUTION' && (
                          <div className="flex flex-col gap-2.5">
                            {/* Strategy Summary */}
                            <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-xs">
                              <span className="text-secondary font-bold block mb-1 uppercase text-[10px]">
                                TACTICAL STRATEGY SUMMARY:
                              </span>
                              <p className="font-sans text-on-surface leading-relaxed text-xs">
                                {sol.strategySummary}
                              </p>
                              {sol.recoveryEstimate && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-bold text-[10px]">
                                    RECOVERY PROBABILITY: {sol.recoveryEstimate.probabilityPercent}%
                                  </span>
                                  <span className="text-[10px] text-outline font-sans">
                                    {sol.recoveryEstimate.goldenHourWindow}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Statutory Directives List */}
                            <div className="p-2.5 rounded bg-surface-container-high border border-outline-variant/20 text-xs">
                              <span className="text-primary-container font-bold block mb-1 uppercase text-[10px]">
                                MANDATORY STATUTORY DIRECTIVES:
                              </span>
                              <ul className="list-disc pl-4 text-on-surface-variant space-y-1 font-sans text-xs">
                                {sol.statutoryDirectives?.map((d, idx) => (
                                  <li key={idx}>{d}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Section 91 Formal Notice Draft */}
                            {sol.statutoryNoticeDraft && (
                              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-tertiary-fixed-dim font-bold uppercase text-[10px]">
                                    FORMAL SECTION 91 CRPC NOTICE DRAFT:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyTextToClipboard(sol.statutoryNoticeDraft, 'Section 91 CrPC Notice')}
                                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-bright text-primary text-[10px] font-bold border border-outline-variant/30 flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">content_copy</span>
                                    <span>COPY DRAFT</span>
                                  </button>
                                </div>
                                <pre className="p-2 rounded bg-surface-container-lowest text-[10px] text-on-surface-variant whitespace-pre-wrap font-mono leading-relaxed max-h-36 overflow-y-auto border border-outline-variant/10">
                                  {sol.statutoryNoticeDraft}
                                </pre>
                              </div>
                            )}

                            {/* RBI Customer Liability Protection */}
                            {sol.rbiLiabilityProtection && (
                              <div className="p-2 rounded bg-surface-container-lowest border border-primary-container/20 text-[11px]">
                                <span className="text-primary font-bold block uppercase text-[10px]">
                                  RBI LIMITED LIABILITY STATUTORY PROTECTION:
                                </span>
                                <span className="text-outline text-[10px] block font-sans">
                                  {sol.rbiLiabilityProtection.clause}
                                </span>
                                <span className="text-on-surface font-sans font-semibold block mt-0.5 text-xs">
                                  {sol.rbiLiabilityProtection.entitlement}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 3: EVIDENCE CHECKLIST */}
                        {activeTab === 'EVIDENCE' && (
                          <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/20 flex flex-col gap-2 text-xs">
                            <span className="text-primary font-bold uppercase text-[10px]">
                              COURT-ADMISSIBLE EVIDENCE PACKAGING CHECKLIST:
                            </span>
                            <div className="flex flex-col gap-1.5 font-sans">
                              {sol.evidenceChecklist?.map((item, idx) => (
                                <label key={idx} className="flex items-start gap-2 cursor-pointer text-on-surface">
                                  <input type="checkbox" defaultChecked className="mt-0.5 accent-primary" />
                                  <span className="text-xs">{item}</span>
                                </label>
                              ))}
                            </div>
                            {sol.regulatoryCitations && (
                              <div className="mt-2 pt-2 border-t border-outline-variant/20">
                                <span className="text-[10px] text-outline uppercase font-mono block">
                                  REGULATORY CITATIONS:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1 font-mono">
                                  {sol.regulatoryCitations.map((cit, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded bg-surface-container text-outline text-[9px]"
                                    >
                                      {cit}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* One-Click Action Footer */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/cases/${cc.caseId}/network`)}
                            className="flex-1 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-bright text-primary-container text-xs flex items-center justify-center gap-1 border border-primary-container/30 transition-colors font-bold"
                          >
                            <span className="material-symbols-outlined text-[14px]">hub</span>
                            <span>INSPECT FULL {cc.caseId} NETWORK</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* SECTION 4: Dynamic Global Panoramic Correlation Topology */}
              {correlationData?.graphData && (
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 font-mono shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-primary">
                      4. GLOBAL PANORAMIC NETWORK RADAR
                    </span>
                    <span className="text-[10px] text-outline font-mono">ALL CASES COMBINED</span>
                  </div>
                  <div
                    ref={globalGraphContainerRef}
                    className="w-full h-56 bg-surface-container-lowest rounded-lg border border-outline-variant/20 overflow-hidden"
                  />
                  <span className="text-[10px] text-outline mt-1 block">
                    Red node: New Intake • Cyan: Linked Complaints across all cases • Amber: Shared IOC Bridge Nodes
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary-container text-on-primary-fixed px-3 py-1.5 rounded shadow-xl font-mono text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
