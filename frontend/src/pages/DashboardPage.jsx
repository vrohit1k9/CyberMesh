import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dbStats, setDbStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [hopDepth, setHopDepth] = useState(4);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [activeFilters, setActiveFilters] = useState(['#MuleAccount']);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Helper
  const showToast = (text) => {
    setToastMessage(text);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2600);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await api.getDashboardStats();
        if (stats?.success) setDbStats(stats.data);
      } catch (e) {
        // Fallback to synthetic default
      }
      try {
        const txRes = await api.getTransactions('limit=6');
        if (txRes?.success && txRes.data?.transactions) {
          setTransactions(txRes.data.transactions);
        }
      } catch (e) {
        // Fallback to default wiretap data
      }
    }
    loadData();
  }, []);

  const openInspector = (node) => {
    setSelectedNode(node);
    setInspectorOpen(true);
    showToast(`FOCUS: ${node.id}`);
  };

  const closeInspector = () => {
    setInspectorOpen(false);
  };

  const toggleFilter = (filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleExecSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('ENTER UTR, PHONE, OR VPA TO EXECUTE');
      return;
    }
    const q = searchQuery.trim();
    if (q.toLowerCase().startsWith('case-') || q.toLowerCase().startsWith('cr-')) {
      navigate(`/cases/${q}`);
    } else {
      navigate(`/transactions?search=${encodeURIComponent(q)}`);
    }
  };

  const handleExportNotice = () => {
    showToast('EXPORTING §91 NOTICE DISPATCH XML...');
    setTimeout(() => {
      closeInspector();
    }, 900);
  };

  const handleTagBank = () => {
    showToast('BANK NODAL OFFICER FLAGGED IN CFCFRMS');
    setTimeout(() => {
      closeInspector();
    }, 900);
  };

  const handleMasterFreeze = () => {
    showToast('EMERGENCY CFCFRMS LOCK BROADCAST INITIATED (§91 CrPC)');
  };

  // KPI Calculations
  const kpis = dbStats?.kpis || {};
  const totalComplaints = kpis.totalComplaints ? kpis.totalComplaints.toLocaleString('en-IN') : '1,482';
  const activeSyndicates = kpis.detectedSyndicates || 18;
  const criticalRiskNodes = kpis.criticalRiskCases || 24;
  const lossReported = kpis.totalReportedLoss
    ? `₹${(kpis.totalReportedLoss / 10000000).toFixed(2)}Cr`
    : '₹4.82Cr';

  return (
    <div className="flex flex-col w-full px-margin-mobile gap-space-md relative">
      {/* Dynamic Micro HUD / Telemetry String */}
      <div className="w-full bg-surface-container-lowest p-space-xs rounded flex items-center justify-between shadow-sm border border-outline-variant/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shrink-0"></span>
          <span className="font-label-sm text-label-sm text-primary-fixed-dim font-mono tracking-tight truncate">
            DBMS: PG-3NF // RAG: ONLINE // CFCFRMS: 12ms // CYCLIC CTE: ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined text-[12px] text-tertiary-fixed-dim">sensors</span>
          <span className="font-label-sm text-label-sm font-mono text-tertiary-fixed-dim">LIVE POLLING</span>
        </div>
      </div>

      {/* Omni-Search HUD Terminal */}
      <div className="w-full bg-surface-container-low p-space-sm rounded shadow-md flex flex-col gap-space-xs border border-outline-variant/30">
        <form onSubmit={handleExecSearch} className="relative flex items-center w-full">
          <span className="material-symbols-outlined text-outline text-[18px] absolute left-2 pointer-events-none">
            terminal
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-7 pr-24 py-2 rounded focus:outline-none focus:bg-surface-container-high placeholder:text-outline/70 transition-all font-mono"
            placeholder="UTR hash, Phone (+91), VPA (@okaxis), or Case ID..."
            type="text"
          />
          <div className="absolute right-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => showToast('SCANNER ONLINE: CAMERA / BARCODE READY')}
              className="p-1 rounded bg-surface-container hover:bg-surface-bright text-primary-container transition-colors"
              title="Scan QR / UTR Barcode"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            </button>
            <button
              type="submit"
              className="px-2 py-1 bg-primary-container text-on-primary-fixed font-label-sm text-label-sm font-mono font-bold rounded hover:opacity-90 transition-opacity"
            >
              EXEC
            </button>
          </div>
        </form>

        {/* Quick Filter Tag Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { tag: '#MuleAccount', dot: true },
            { tag: '#MultiHopLayer', dot: false },
            { tag: '#1930PortalSync', dot: false },
            { tag: '#RapidDrainage', dot: false },
          ].map(({ tag, dot }) => {
            const isActive = activeFilters.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFilter(tag)}
                className={`filter-chip px-2 py-0.5 rounded font-label-sm text-label-sm font-mono whitespace-nowrap active:scale-95 transition-transform flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-fixed font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {dot && <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span>}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 High-Contrast Tactical KPI Matrix (2x2 on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-xs w-full">
        {/* Total Complaints Card */}
        <div className="bg-surface-container-low p-space-sm rounded shadow-sm flex flex-col justify-between gap-1 border border-outline-variant/20 hover:border-primary-container/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase">
              COMPLAINTS (24H)
            </span>
            <span className="material-symbols-outlined text-primary-container text-[14px]">shield_person</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-headline-md text-headline-md text-on-surface font-mono font-bold tracking-tight">
              {totalComplaints}
            </span>
            <span className="font-label-sm text-label-sm text-primary-fixed font-mono bg-surface-container px-1 rounded">
              +14.2%
            </span>
          </div>
          {/* Tactical Micro Sparkline SVG */}
          <div className="w-full h-5 mt-1">
            <svg className="w-full h-full text-primary-container" fill="none" viewBox="0 0 100 24">
              <path
                d="M0 18 L15 16 L30 19 L45 11 L60 14 L75 8 L90 10 L100 3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
              <path
                d="M0 18 L15 16 L30 19 L45 11 L60 14 L75 8 L90 10 L100 3 L100 24 L0 24 Z"
                fill="currentColor"
                fillOpacity="0.12"
              ></path>
            </svg>
          </div>
        </div>

        {/* Active Fraud Syndicates Card */}
        <div className="bg-surface-container-low p-space-sm rounded shadow-sm flex flex-col justify-between gap-1 border border-outline-variant/20 hover:border-tertiary-fixed-dim/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-mono text-tertiary-fixed-dim uppercase">
              SYNDICATES
            </span>
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[14px]">hub</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-headline-md text-headline-md text-tertiary-fixed-dim font-mono font-bold tracking-tight">
              {activeSyndicates} <span className="text-label-sm text-on-surface-variant font-normal">RINGS</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-ping"></span>
          </div>
          <div className="bg-surface-container-highest px-1.5 py-0.5 rounded mt-1 truncate">
            <span className="font-label-sm text-label-sm text-on-tertiary-container font-mono">
              +3 cyclic loops live
            </span>
          </div>
        </div>

        {/* Critical Risk Cases Card */}
        <div className="bg-surface-container-low p-space-sm rounded shadow-sm flex flex-col justify-between gap-1 border border-outline-variant/20 hover:border-secondary-container/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-mono text-secondary uppercase">
              HIGH RISK NODES
            </span>
            <span className="material-symbols-outlined text-secondary text-[14px]">warning</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-headline-md text-headline-md text-secondary font-mono font-bold tracking-tight">
              {criticalRiskNodes}
            </span>
            <span className="font-label-sm text-label-sm text-on-secondary-container bg-secondary-container px-1 rounded font-mono font-bold animate-pulse">
              URGENT
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-outline-variant mt-1 truncate">
            Escalated to Cyber Cell
          </span>
        </div>

        {/* Losses Siphoned Card */}
        <div className="bg-surface-container-low p-space-sm rounded shadow-sm flex flex-col justify-between gap-1 border border-outline-variant/20 hover:border-primary-container/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase">
              LOSS SIPHONED
            </span>
            <span className="material-symbols-outlined text-primary-container text-[14px]">currency_rupee</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-headline-md text-headline-md text-on-surface font-mono font-bold tracking-tight">
              {lossReported}
            </span>
          </div>
          <div className="bg-surface-container-highest px-1.5 py-0.5 rounded mt-1 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary-fixed-dim font-mono">₹62.4L FROZEN</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">6H</span>
          </div>
        </div>
      </div>

      {/* Interactive Network Graph Sandbox Preview */}
      <div className="w-full bg-surface-container-lowest rounded p-space-sm shadow-md flex flex-col gap-space-xs relative overflow-hidden border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary-container text-[16px]">bubble_chart</span>
            <span className="font-label-lg text-label-lg font-mono text-on-surface font-bold tracking-wider">
              TOPOLOGY CANVAS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/networks')}
              className="text-[11px] font-mono text-primary-container hover:underline flex items-center gap-1"
            >
              <span>FULL MATRIX</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </button>
            <div className="flex items-center gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">COLA ENGINE</span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Floating Graph Tool Overlay */}
        <div
          className="relative w-full h-56 md:h-72 bg-surface-container-high rounded overflow-hidden flex items-center justify-center transition-transform origin-center"
          style={{ transform: `scale(${canvasZoom})` }}
        >
          {/* Grid Crosshairs Background Overlay */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#00f0ff 0.75px, transparent 0.75px)',
              backgroundSize: '16px 16px',
            }}
          ></div>

          {/* Graph Links SVG Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line stroke="#00f0ff" strokeDasharray="3 3" strokeWidth="1.5" x1="15%" x2="40%" y1="50%" y2="35%"></line>
            <line stroke="#ffd386" strokeWidth="2" x1="40%" x2="70%" y1="35%" y2="55%"></line>
            <line stroke="#ffb4ab" strokeDasharray="2 2" strokeWidth="1.5" x1="40%" x2="45%" y1="35%" y2="75%"></line>
            <line stroke="#00f0ff" strokeWidth="1.5" x1="70%" x2="85%" y1="55%" y2="30%"></line>
          </svg>

          {/* Interactive Nodes */}
          {/* Node 1: Complaint Hexagon */}
          <button
            onClick={() =>
              openInspector({
                id: 'FIR-2024-9021',
                type: 'Complaint Node (Victim 1)',
                classification: 'Origin Fraud Complaint',
                flag: 'VERIFIED REPORT',
                meta: 'Complainant reported QR code reversal trap. Initial loss: ₹98,500 via UPI collect request. Cyber Cell Pune origin.',
              })
            }
            className="node-target absolute top-16 left-8 md:left-20 p-1 bg-surface-container-lowest rounded flex items-center justify-center hover:bg-surface-bright transition-transform active:scale-90 shadow-md border border-primary-container/40"
          >
            <div className="w-7 h-7 bg-primary-container text-on-primary-fixed flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-[15px]">report_problem</span>
            </div>
          </button>

          {/* Node 2: Core Mule VPA (Amber) */}
          <button
            onClick={() =>
              openInspector({
                id: 'fastrefund@okaxis',
                type: 'Primary Mule VPA Hub',
                classification: 'Layer 1 Mule Aggregator',
                flag: 'RECOVERY CRITICAL',
                meta: 'Connecting across 4 cyclic hops. Immediate debit freeze mandate recommended under Section 91 CrPC and CFCFRMS.',
              })
            }
            className="node-target absolute top-10 left-36 md:left-72 px-2.5 py-1.5 bg-tertiary-container text-on-tertiary-container rounded flex items-center gap-1.5 font-label-sm text-label-sm font-mono shadow-md hover:brightness-110 active:scale-95 border border-tertiary-fixed-dim"
          >
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span className="font-bold">fastrefund@okaxis</span>
          </button>

          {/* Node 3: Bank Account Diamond (Blue/Cyan) */}
          <button
            onClick={() =>
              openInspector({
                id: '987654321012@HDFC0001234',
                type: 'Layer-2 Mule Current A/C',
                classification: 'Mule Layer 2 Corporate Shell',
                flag: 'IMMEDIATE LIEN',
                meta: 'Holder: Synthetic Corp | IFSC: HDFC0001234. Siphoned ₹1,20,000 from fastrefund@okaxis. Automated Section 91 notice ready.',
              })
            }
            className="node-target absolute top-28 right-16 md:right-40 p-2 bg-surface-container-highest text-primary-fixed rounded transform rotate-45 hover:bg-surface-bright active:scale-95 border border-primary-container/50 shadow-md"
          >
            <span className="material-symbols-outlined text-[16px] -rotate-45 block">account_balance</span>
          </button>

          {/* Node 4: Caller/SIM Node (Crimson Outlier) */}
          <button
            onClick={() =>
              openInspector({
                id: '+91 9876543210',
                type: 'VoIP Carrier SIM / Phishing Endpoint',
                classification: 'Social Engineering Endpoint',
                flag: 'TELECOM ORDER',
                meta: 'IMEI: 86492019284. Mewat Cluster telecom subscriber. 14 spam/extortion hits recorded on 1930 portal.',
              })
            }
            className="node-target absolute bottom-8 left-32 md:left-64 p-1.5 bg-secondary-container text-on-secondary-container rounded-full hover:scale-110 transition-transform shadow-md"
          >
            <span className="material-symbols-outlined text-[14px]">cell_tower</span>
          </button>

          {/* Graph Canvas Floating Controls HUD */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-surface-container-lowest/80 backdrop-blur-md p-0.5 rounded border border-outline-variant/30">
            <button
              type="button"
              onClick={() => {
                setCanvasZoom((z) => Math.min(z + 0.15, 1.6));
                showToast('CANVAS ZOOMED IN');
              }}
              className="p-1 rounded hover:bg-surface-container text-on-surface"
              title="Zoom in"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCanvasZoom((z) => Math.max(z - 0.15, 0.7));
                showToast('CANVAS ZOOMED OUT');
              }}
              className="p-1 rounded hover:bg-surface-container text-on-surface"
              title="Zoom out"
            >
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCanvasZoom(1);
                showToast('TOPOLOGY RE-CENTERED TO CANVAS');
              }}
              className="p-1 rounded hover:bg-surface-container text-primary-container"
              title="Fit to viewport"
            >
              <span className="material-symbols-outlined text-[14px]">fit_screen</span>
            </button>
          </div>

          {/* Hop Depth Slider Bar */}
          <div className="absolute bottom-2 right-2 bg-surface-container-lowest/80 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1.5 border border-outline-variant/30">
            <span className="font-label-sm text-label-sm text-outline font-mono">HOPS:</span>
            <span className="font-label-sm text-label-sm text-primary-container font-mono font-bold">
              {hopDepth}
            </span>
            <input
              type="range"
              min="1"
              max="5"
              value={hopDepth}
              onChange={(e) => {
                setHopDepth(Number(e.target.value));
                showToast(`GRAPH HOPS SET TO ${e.target.value}`);
              }}
              className="w-14 h-1 accent-cyan-400 bg-surface-container cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Multi-Hop Syndicate Radar Widget */}
      <div className="w-full bg-surface-container-low rounded p-space-sm shadow-md flex flex-col gap-space-xs border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary-container text-[16px]">radar</span>
            <span className="font-label-lg text-label-lg font-mono text-on-surface font-bold tracking-wider">
              ACTIVE SYNDICATE RADAR
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono font-bold">
            2 DETECTED
          </span>
        </div>

        {/* Ring Card 1 */}
        <div className="w-full bg-surface-container p-space-xs rounded flex flex-col gap-1.5 border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              <span className="font-label-md text-label-md font-mono text-on-surface font-bold">
                RING #UP-8821 (SYNDICATE ALPHA)
              </span>
              <span className="font-label-sm text-label-sm px-1 rounded bg-surface-container-high text-primary-fixed">
                Refund Botnet
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-mono text-secondary font-bold">₹48.5L ROUTED</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-mono font-label-sm text-label-sm">
            <span>4-HOP CASCADE // 12 MULE VPAS</span>
            <span className="text-tertiary-fixed-dim font-bold">HIGH VELOCITY SURGE</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                showToast('HOPS SYNCHRONIZED FOR SYNDICATE ALPHA');
                navigate('/cases/CASE-2026-0079');
              }}
              className="flex-1 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-primary-fixed-dim font-label-sm text-label-sm font-mono flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">timeline</span>
              <span>TRACE TOPOLOGY</span>
            </button>
            <button
              onClick={() => showToast('§91 CrPC NOTICE STAGED FOR RING #UP-8821')}
              className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-mono font-bold hover:brightness-110 transition-transform active:scale-95"
            >
              FREEZE RING
            </button>
          </div>
        </div>

        {/* Ring Card 2 */}
        <div className="w-full bg-surface-container p-space-xs rounded flex flex-col gap-1.5 border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="font-label-md text-label-md font-mono text-on-surface font-bold">
                RING #MH-1049
              </span>
              <span className="font-label-sm text-label-sm px-1 rounded bg-surface-container-high text-tertiary-fixed">
                Fake APK Banking
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-mono text-tertiary-fixed-dim font-bold">
              ₹19.2L ROUTED
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-mono font-label-sm text-label-sm">
            <span>3-HOP MESH // 7 MULE VPAS</span>
            <span className="text-outline">LAYER DORMANT</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                showToast('HOPS SYNCHRONIZED FOR RING #MH-1049');
                navigate('/cases/CASE-2026-0087');
              }}
              className="flex-1 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-primary-fixed-dim font-label-sm text-label-sm font-mono flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">timeline</span>
              <span>TRACE TOPOLOGY</span>
            </button>
            <button
              onClick={() => showToast('§91 CrPC DISPATCH GENERATED FOR RING #MH-1049')}
              className="px-2.5 py-1 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-mono hover:bg-surface-bright transition-transform active:scale-95"
            >
              DISPATCH §91
            </button>
          </div>
        </div>
      </div>

      {/* Live UPI Anomaly Wiretap Feed */}
      <div className="w-full bg-surface-container-low rounded p-space-sm shadow-md flex flex-col gap-space-xs border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary-container text-[16px]">stream</span>
            <span className="font-label-lg text-label-lg font-mono text-on-surface font-bold tracking-wider">
              UPI WIRETAP STREAM
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-ping"></span>
            <span className="font-label-sm text-label-sm text-outline font-mono">1930 DISPATCH</span>
          </div>
        </div>

        {/* Wiretap Item 1 */}
        <div
          onClick={() => {
            navigator.clipboard?.writeText('UTR-908129482910');
            showToast('COPIED WIRE REFERENCE: UTR-908129482910');
          }}
          className="wiretap-row bg-surface-container p-space-xs rounded flex flex-col gap-1 transition-colors hover:bg-surface-container-high cursor-pointer border border-outline-variant/20"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-mono text-primary font-bold">
              UTR-908129482910
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-mono font-bold">
              Z-SCORE OUTLIER 3.4x
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm font-mono">
            <span className="text-on-surface truncate max-w-[220px]">fastrefund@okaxis → Mule SBI-881</span>
            <span className="text-secondary font-bold">₹98,500</span>
          </div>
          <div className="flex items-center justify-between text-outline text-[10px] font-mono">
            <span>NPCI Latency: 18ms</span>
            <span>00:01:14 ago</span>
          </div>
        </div>

        {/* Wiretap Item 2 */}
        <div
          onClick={() => {
            navigator.clipboard?.writeText('UTR-440182930192');
            showToast('COPIED WIRE REFERENCE: UTR-440182930192');
          }}
          className="wiretap-row bg-surface-container p-space-xs rounded flex flex-col gap-1 transition-colors hover:bg-surface-container-high cursor-pointer border border-outline-variant/20"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-mono text-primary font-bold">
              UTR-440182930192
            </span>
            <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-mono font-bold">
              VELOCITY SURGE
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm font-mono">
            <span className="text-on-surface truncate max-w-[220px]">helpdesk.kyc@icici → P2P Split</span>
            <span className="text-tertiary-fixed-dim font-bold">₹49,999</span>
          </div>
          <div className="flex items-center justify-between text-outline text-[10px] font-mono">
            <span>6 splits under ₹50k limit</span>
            <span>00:03:40 ago</span>
          </div>
        </div>

        {/* Wiretap Item 3 */}
        <div
          onClick={() => {
            navigator.clipboard?.writeText('UTR-119284910283');
            showToast('COPIED WIRE REFERENCE: UTR-119284910283');
          }}
          className="wiretap-row bg-surface-container p-space-xs rounded flex flex-col gap-1 transition-colors hover:bg-surface-container-high cursor-pointer border border-outline-variant/20"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-mono text-primary font-bold">
              UTR-119284910283
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-mono font-bold">
              GEO ANOMALY
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm font-mono">
            <span className="text-on-surface truncate max-w-[220px]">ATM Direct Withdrawal (Mewat)</span>
            <span className="text-secondary font-bold">₹1,20,000</span>
          </div>
          <div className="flex items-center justify-between text-outline text-[10px] font-mono">
            <span>Cardless UPI Terminal Geo Mismatch</span>
            <span>00:07:22 ago</span>
          </div>
        </div>
      </div>

      {/* Statutory CrPC & Freeze Dispatch Quick Action Bar */}
      <div className="w-full pt-1 pb-4 flex flex-col gap-2">
        <button
          onClick={handleMasterFreeze}
          className="w-full py-2.5 px-4 bg-secondary-container hover:bg-on-secondary-fixed-variant active:scale-[0.98] text-on-secondary-container font-headline-sm text-headline-sm font-mono font-bold rounded shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">lock_clock</span>
          <span>INITIATE CFCFRMS FREEZE NOTICE</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono tracking-wider">
            §91 CrPC
          </span>
        </button>
        <div className="flex items-center justify-between px-1 text-outline font-label-sm text-label-sm font-mono">
          <span>DIGITALLY SIGNED CERT: NCIIPC-4491</span>
          <span className="text-primary-container">AUTH: IO-9482</span>
        </div>
      </div>

      {/* Interactive Slide-In Forensic Inspector Drawer / Modal */}
      {inspectorOpen && selectedNode && (
        <div
          onClick={closeInspector}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center p-2"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-low rounded-t-xl p-space-md flex flex-col gap-space-sm shadow-2xl border border-outline-variant/40 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container text-[18px]">
                  verified_user
                </span>
                <span className="font-headline-sm text-headline-sm font-mono text-on-surface font-bold tracking-tight">
                  NODE DOSSIER
                </span>
              </div>
              <button
                onClick={closeInspector}
                className="p-1 rounded bg-surface-container hover:bg-surface-bright text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-space-xs bg-surface-container-lowest rounded flex flex-col gap-1.5 font-mono">
              <div className="flex items-center justify-between text-label-sm text-label-sm">
                <span className="text-outline">IDENTIFIER:</span>
                <span className="text-primary-fixed font-bold truncate max-w-[210px]">
                  {selectedNode.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-label-sm text-label-sm">
                <span className="text-outline">CLASSIFICATION:</span>
                <span className="text-tertiary-fixed-dim">{selectedNode.classification}</span>
              </div>
              <div className="flex items-center justify-between text-label-sm text-label-sm">
                <span className="text-outline">CFCFRMS FLAG:</span>
                <span className="px-1 bg-secondary-container text-on-secondary-container rounded font-bold">
                  {selectedNode.flag}
                </span>
              </div>
              <div className="p-2 bg-surface-container rounded mt-1 text-on-surface-variant font-label-sm text-label-sm leading-relaxed">
                {selectedNode.meta}
              </div>
            </div>

            {/* Tactical Action Cluster inside Drawer */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExportNotice}
                className="flex-1 py-2 bg-primary-container text-on-primary-fixed font-label-md text-label-md font-mono font-bold rounded flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>EXPORT §91 NOTICE</span>
              </button>
              <button
                onClick={handleTagBank}
                className="px-3 py-2 bg-surface-container-highest text-on-surface font-label-md text-label-md font-mono rounded hover:bg-surface-bright active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">security_update_warning</span>
                <span>TAG BANK</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Pill */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary-container text-on-primary-fixed px-3 py-1.5 rounded shadow-xl font-label-md text-label-md font-mono font-bold flex items-center gap-2 transition-opacity duration-200 ${
          toastVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">check_circle</span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
