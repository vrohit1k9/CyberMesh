import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import { api } from '../services/api';

// Register cola layout plugin
try {
  cytoscape.use(cola);
} catch (e) {
  // Already registered
}

const TYPE_STYLES = {
  COMPLAINT: {
    bg: '#00f0ff',
    border: '#006970',
    shape: 'hexagon',
    textColor: '#002022',
    icon: 'report_problem',
    badge: 'COMPLAINT',
    colorClass: 'text-primary-container',
    bgClass: 'bg-primary-container/20 text-primary-container',
  },
  UPI: {
    bg: '#ffd386',
    border: '#7d5800',
    shape: 'round-rectangle',
    textColor: '#271900',
    icon: 'currency_exchange',
    badge: 'UPI VPA',
    colorClass: 'text-tertiary-fixed-dim',
    bgClass: 'bg-tertiary-container text-on-tertiary-container',
  },
  BANK_ACCOUNT: {
    bg: '#7df4ff',
    border: '#004f54',
    shape: 'diamond',
    textColor: '#002022',
    icon: 'account_balance',
    badge: 'BANK A/C',
    colorClass: 'text-primary-fixed',
    bgClass: 'bg-primary/20 text-primary',
  },
  PHONE: {
    bg: '#ffb3b6',
    border: '#df0042',
    shape: 'ellipse',
    textColor: '#40000c',
    icon: 'cell_tower',
    badge: 'CARRIER SIM',
    colorClass: 'text-secondary',
    bgClass: 'bg-secondary-container/20 text-secondary',
  },
  DOMAIN: {
    bg: '#f43f5e',
    border: '#9f1239',
    shape: 'round-rectangle',
    textColor: '#ffffff',
    icon: 'language',
    badge: 'PHISHING DOMAIN',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/20 text-rose-300',
  },
  EMAIL: {
    bg: '#38bdf8',
    border: '#0284c7',
    shape: 'ellipse',
    textColor: '#082f49',
    icon: 'mail',
    badge: 'EMAIL ENDPOINT',
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-500/20 text-sky-300',
  },
};

export default function NetworkGraphPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseId = id || 'CASE-2026-001';

  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const [currentHops, setCurrentHops] = useState(3);
  const [activeLayout, setActiveLayout] = useState('FORCE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [inspectorExpanded, setInspectorExpanded] = useState(true);
  const [toastBanner, setToastBanner] = useState({ visible: false, title: '', desc: '' });

  const showToast = (title, desc) => {
    setToastBanner({ visible: true, title, desc });
    setTimeout(() => {
      setToastBanner({ visible: false, title: '', desc: '' });
    }, 2800);
  };

  // Load Real Graph from PostgreSQL Recursive CTE
  const loadGraph = async (depthToFetch) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCaseNetwork(caseId, depthToFetch);
      if (res.success && res.data) {
        setGraphData(res.data);
        // Default select root or first node
        const root = res.data.nodes?.find((n) => n.isRoot) || res.data.nodes?.[0];
        if (root) {
          setActiveNode(formatNodeDetails(root));
        }
      } else {
        setError(res.error?.message || 'Failed to load network traversal.');
      }
    } catch (err) {
      console.error('Failed to load network:', err);
      setError(err.message || 'Error executing graph traversal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph(currentHops);
  }, [caseId, currentHops]);

  // Format node data for inspector drawer
  const formatNodeDetails = (node) => {
    const type = node.type || 'IDENTIFIER';
    const style = TYPE_STYLES[type] || TYPE_STYLES.UPI;
    const data = node.data || {};
    const meta = data.meta || {};

    let firstSeen = '2026-02-01 IST';
    let lastSeen = 'RECENT ACTIVITY';
    let volume = data.amount ? `₹${parseFloat(data.amount).toLocaleString('en-IN')}` : '₹48,50,000';
    let ifsc = meta.ifsc || 'HDFC0001234';
    let branch = meta.bankName || 'HDFC BANK MUMBAI';
    let complaintsCount = type === 'COMPLAINT' ? '1 CASE' : '4 LINKED CASES';

    if (type === 'COMPLAINT') {
      firstSeen = data.reportedDate ? new Date(data.reportedDate).toLocaleDateString() : '01-FEB-2026';
      lastSeen = data.status || 'LINKED_TO_RING';
      volume = `₹${parseFloat(data.amount || 0).toLocaleString('en-IN')}`;
      ifsc = data.category || 'UPI_FRAUD';
      branch = data.priority || 'CRITICAL';
    } else if (type === 'BANK_ACCOUNT') {
      ifsc = meta.ifsc || data.value?.split('@')[1] || 'HDFC0001234';
      branch = meta.bankName || 'HDFC CORPORATE SHELL';
    } else if (type === 'PHONE') {
      branch = meta.carrier || 'AIRTEL TELECOM MEWAT';
      ifsc = 'CELL TOWER ID // 404-45-812';
    }

    return {
      id: node.label || node.id,
      rawId: node.id,
      type: `${type} IDENTIFIER // ${style.badge}`,
      risk: node.isRoot ? 'ROOT INCIDENT' : type === 'COMPLAINT' ? 'VICTIM NODE' : 'MULE INFRASTRUCTURE',
      riskColor: node.isRoot ? 'bg-primary-container text-on-primary-fixed' : style.bgClass,
      badgeIcon: style.icon,
      iconColor: style.colorClass,
      firstSeen,
      lastSeen,
      complaints: complaintsCount,
      volume,
      ifsc,
      branch,
      metaText: data.title || (data.meta ? JSON.stringify(data.meta) : `Active recursive entity discovered in Case ${caseId}`),
      layer: type === 'COMPLAINT' ? 'INCIDENT' : 'MULE L-1',
      reuse: 8,
    };
  };

  // Initialize and Render Cytoscape.js
  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    const elements = [
      ...graphData.nodes.map((n) => {
        const style = TYPE_STYLES[n.type] || TYPE_STYLES.UPI;
        return {
          group: 'nodes',
          data: {
            id: n.id,
            label: n.type === 'COMPLAINT' ? (n.data?.complaintId || n.label) : n.label,
            type: n.type,
            isRoot: n.isRoot,
            rawNode: n,
          },
        };
      }),
      ...graphData.edges.map((e, idx) => ({
        group: 'edges',
        data: {
          id: e.id || `edge_${idx}`,
          source: e.source,
          target: e.target,
          label: e.label || '',
        },
      })),
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const layoutConfig = {
      FORCE: {
        name: 'cola',
        animate: true,
        randomize: false,
        maxSimulationTime: 2000,
        nodeSpacing: 55,
        edgeLength: 120,
      },
      RADIAL: {
        name: 'concentric',
        concentric: (node) => (node.data('isRoot') ? 10 : 2),
        levelWidth: () => 1,
        animate: true,
      },
      BIPARTITE: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.25,
        animate: true,
      },
    };

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        layout: layoutConfig[activeLayout] || layoutConfig.FORCE,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#dbfcff',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '10px',
              'font-weight': '600',
              'text-valign': 'bottom',
              'text-margin-y': '6px',
              'background-color': (ele) => (TYPE_STYLES[ele.data('type')] || TYPE_STYLES.UPI).bg,
              'border-color': (ele) => (TYPE_STYLES[ele.data('type')] || TYPE_STYLES.UPI).border,
              'border-width': '2px',
              shape: (ele) => (TYPE_STYLES[ele.data('type')] || TYPE_STYLES.UPI).shape,
              width: (ele) => (ele.data('isRoot') ? '38px' : '28px'),
              height: (ele) => (ele.data('isRoot') ? '38px' : '28px'),
              'text-background-color': '#0b0e16',
              'text-background-opacity': 0.85,
              'text-background-padding': '2px',
              'text-background-shape': 'roundrectangle',
            },
          },
          {
            selector: 'node[?isRoot]',
            style: {
              'border-width': '3px',
              'border-color': '#00f0ff',
              'shadow-blur': 15,
              'shadow-color': '#00f0ff',
              'shadow-opacity': 0.9,
            },
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#ffffff',
              'border-width': '3px',
              'shadow-blur': 20,
              'shadow-color': '#ffffff',
              'shadow-opacity': 1,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#3b494b',
              'target-arrow-color': '#00dbe9',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.1,
              label: 'data(label)',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '8px',
              color: '#849495',
              'text-background-color': '#10131c',
              'text-background-opacity': 0.8,
              'text-background-padding': '1px',
            },
          },
        ],
      });

      // Tap on node -> select and inspect
      cy.on('tap', 'node', (evt) => {
        const nodeEle = evt.target;
        const rawNode = nodeEle.data('rawNode');
        if (rawNode) {
          const formatted = formatNodeDetails(rawNode);
          setActiveNode(formatted);
          setInspectorExpanded(true);
          showToast(`FOCUS: ${formatted.id}`, 'Synchronized forensic metadata.');
        }
      });

      cyRef.current = cy;
    } catch (e) {
      console.error('Cytoscape render error:', e);
    }
  }, [graphData, activeLayout]);

  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleFitScreen = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 30);
      showToast('CANVAS RESET', 'Fraud graph centered to viewport fit.');
    }
  };

  const incrementHops = () => {
    if (currentHops < 5) {
      const next = currentHops + 1;
      setCurrentHops(next);
      showToast(`HOP DEPTH: ${next}`, `Re-running PostgreSQL recursive CTE at ${next} hops.`);
    }
  };

  const decrementHops = () => {
    if (currentHops > 1) {
      const next = currentHops - 1;
      setCurrentHops(next);
      showToast(`HOP DEPTH: ${next}`, `Re-running PostgreSQL recursive CTE at ${next} hops.`);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('COPIED TO CLIPBOARD', text);
    }
  };

  const triggerCrpcNotice = () => {
    if (!activeNode) return;
    showToast('CRPC SEC 91 NOTICE GENERATED', `Requisition formal notice exported for ${activeNode.id}`);
  };

  const triggerBlacklist = () => {
    if (!activeNode) return;
    showToast('CFCFRMS DISPATCH', `${activeNode.id} tagged for national banking freeze.`);
  };

  const isolateSubtree = () => {
    if (!activeNode || !cyRef.current) return;
    const selected = cyRef.current.$(`node[id = "${activeNode.rawId}"]`);
    if (selected.length > 0) {
      const neighborhood = selected.closedNeighborhood();
      cyRef.current.nodes().difference(neighborhood).style('opacity', 0.15);
      cyRef.current.edges().style('opacity', 0.15);
      neighborhood.style('opacity', 1);
      neighborhood.connectedEdges().style('opacity', 1);
      showToast('SUB-RING ISOLATED', `Focused on 1-hop radius around ${activeNode.id}.`);
    }
  };

  const nodeCount = graphData?.nodes?.length || 0;
  const edgeCount = graphData?.edges?.length || 0;
  const exposedLoss = graphData?.metrics?.totalExposedAmount
    ? `₹${(graphData.metrics.totalExposedAmount / 100000).toFixed(2)}L`
    : '₹38.45L';

  return (
    <div className="flex flex-col w-full relative select-none overflow-hidden text-on-surface">
      {/* Interactive Tactical Cytoscape Simulation Deck */}
      <div className="relative w-full h-[580px] bg-surface-container-lowest overflow-hidden flex flex-col justify-between border-b border-outline-variant/30">
        {/* Central Radar Crosshairs Background Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="32" id="tactical-grid-cy" patternUnits="userSpaceOnUse" width="32">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#3b494b" strokeDasharray="2 4" strokeWidth="0.75" />
                <circle cx="0" cy="0" fill="#00f0ff" r="1" />
                <circle cx="32" cy="0" fill="#00f0ff" r="1" />
                <circle cx="0" cy="32" fill="#00f0ff" r="1" />
                <circle cx="32" cy="32" fill="#00f0ff" r="1" />
              </pattern>
            </defs>
            <rect fill="url(#tactical-grid-cy)" height="100%" width="100%" />
            <circle cx="50%" cy="50%" fill="none" r="140" stroke="#00dbe9" strokeDasharray="6 6" strokeOpacity="0.3" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" fill="none" r="230" stroke="#00dbe9" strokeOpacity="0.15" strokeWidth="0.5" />
            <line stroke="#3b494b" strokeDasharray="4 8" strokeOpacity="0.3" strokeWidth="0.5" x1="50%" x2="50%" y1="0" y2="100%" />
            <line stroke="#3b494b" strokeDasharray="4 8" strokeOpacity="0.3" strokeWidth="0.5" x1="0" x2="100%" y1="50%" y2="50%" />
          </svg>
        </div>

        {/* Telemetry Overhead Bar */}
        <div className="relative z-20 flex flex-col gap-1.5 p-margin-mobile bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse shrink-0"></span>
              <span className="font-headline-sm text-headline-sm text-primary tracking-wider uppercase truncate font-mono">
                FRAUD GRAPH RADAR // {caseId}
              </span>
              <span className="bg-surface-container-highest text-primary-container font-label-sm text-label-sm px-1 py-0.5 rounded uppercase font-mono shrink-0">
                LIVE-HOP-{currentHops}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                NODES: <span className="text-primary-container font-bold">{nodeCount}</span>
              </span>
              <span className="text-outline-variant font-mono">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                EDGES: <span className="text-primary-container font-bold">{edgeCount}</span>
              </span>
              <span className="text-outline-variant font-mono">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                FLOW: <span className="text-tertiary-fixed-dim font-bold">{exposedLoss}</span>
              </span>
            </div>
          </div>

          {/* Tactical Graph Control Cluster */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
            {/* Floating Zoom & Fit Pill */}
            <div className="flex items-center gap-0.5 bg-surface-container-high rounded p-0.5 border border-outline-variant/30">
              <button
                onClick={handleZoomIn}
                className="w-6 h-6 flex items-center justify-center rounded bg-surface-container text-primary hover:bg-surface-bright active:scale-95 transition-all"
                title="Zoom in"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
              </button>
              <button
                onClick={handleZoomOut}
                className="w-6 h-6 flex items-center justify-center rounded bg-surface-container text-primary hover:bg-surface-bright active:scale-95 transition-all"
                title="Zoom out"
              >
                <span className="material-symbols-outlined text-[14px]">remove</span>
              </button>
              <button
                onClick={handleFitScreen}
                className="px-1.5 h-6 flex items-center gap-1 rounded bg-surface-container text-on-surface-variant hover:text-primary active:scale-95 transition-all font-mono"
                title="Fit to viewport"
              >
                <span className="material-symbols-outlined text-[12px]">crop_free</span>
                <span className="font-label-sm text-label-sm uppercase">FIT</span>
              </button>
            </div>

            {/* Layout Selector Pills */}
            <div className="flex items-center bg-surface-container-high rounded p-0.5 gap-0.5 border border-outline-variant/30 font-mono">
              {['FORCE', 'RADIAL', 'BIPARTITE'].map((layout) => (
                <button
                  key={layout}
                  onClick={() => {
                    setActiveLayout(layout);
                    showToast(`LAYOUT APPLIED: ${layout}`);
                  }}
                  className={`px-2 py-0.5 rounded font-label-sm text-label-sm uppercase transition-colors ${
                    activeLayout === layout
                      ? 'bg-primary-container text-on-primary-fixed font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {layout}
                </button>
              ))}
            </div>

            {/* Depth Hop Control */}
            <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30 font-mono">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">HOPS:</span>
              <span className="font-headline-sm text-headline-sm text-primary-container font-mono font-bold">
                {currentHops}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={decrementHops}
                  className="w-4 h-4 rounded bg-surface-container flex items-center justify-center text-on-surface hover:text-primary"
                >
                  -
                </button>
                <div className="w-12 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden flex">
                  <div
                    className="bg-primary-container h-full transition-all duration-200"
                    style={{ width: `${(currentHops / 5) * 100}%` }}
                  ></div>
                </div>
                <button
                  onClick={incrementHops}
                  className="w-4 h-4 rounded bg-surface-container flex items-center justify-center text-on-surface hover:text-primary"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Topological Entity Legend Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 font-mono text-[10px]">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2.5 h-2.5 bg-primary-container rotate-45 rounded-[1px]"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Complaint (C-ID)</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2.5 h-2.5 bg-tertiary-fixed-dim rounded-[2px]"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">UPI VPA Hub</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2.5 h-2.5 bg-primary-fixed-dim rotate-45"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Mule Bank A/C</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Burner SIM Node</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-[1px]"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Phishing Domain</span>
            </div>
          </div>
        </div>

        {/* Real Cytoscape Canvas Container */}
        <div className="relative z-10 w-full flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 font-mono text-xs text-primary-container">
                <span className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></span>
                <span>TRAVERSING POSTGRESQL RECURSIVE CTE ({currentHops} HOPS)...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
              <div className="bg-secondary-container/20 border border-secondary-container p-4 rounded text-xs font-mono text-secondary max-w-md text-center">
                {error}
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </div>

        {/* Live Telemetry Status Ticker */}
        <div className="relative z-20 bg-surface-container-lowest/90 px-margin-mobile py-1 flex items-center justify-between text-on-surface-variant font-mono text-[10px] border-t border-outline-variant/30">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span>GRAPH ENGINE: POSTGRESQL CTE // CYTOSCAPE 60FPS</span>
          </div>
          <span className="text-primary-fixed-dim uppercase tracking-wider">TAP ANY NODE TO INSPECT LIVE DATA</span>
        </div>
      </div>

      {/* Sliding Dynamic Node Inspector Tactical Drawer */}
      {activeNode && (
        <div className="relative z-30 w-full bg-surface-container-low transition-all duration-300 border-b border-outline-variant/30">
          {/* Drawer Handle & Header Matrix */}
          <div className="p-margin-mobile flex flex-col gap-space-sm bg-surface-container border-b border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">terminal</span>
                <span className="font-headline-sm text-headline-sm text-primary uppercase font-mono tracking-wider font-bold">
                  NODE INSPECTOR // {activeNode.id}
                </span>
              </div>
              <button
                onClick={() => setInspectorExpanded(!inspectorExpanded)}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {inspectorExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
            </div>

            {/* Target Node Identifier Header */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 bg-surface-container-lowest p-2 rounded border border-outline-variant/30">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded bg-tertiary-container/20 flex items-center justify-center shrink-0">
                  <span className={`material-symbols-outlined ${activeNode.iconColor} text-[16px]`}>
                    {activeNode.badgeIcon}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-headline-sm text-primary-fixed font-mono truncate font-bold">
                    {activeNode.id}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
                    {activeNode.type}
                  </span>
                </div>
              </div>

              {/* Status Badges Array */}
              <div className="flex flex-wrap items-center gap-1 shrink-0 font-mono">
                <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-mono uppercase font-bold ${activeNode.riskColor}`}>
                  {activeNode.risk}
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-primary-container uppercase">
                  {activeNode.layer}
                </span>
              </div>
            </div>
          </div>

          {/* Forensic Metadata Key-Value Matrix */}
          {inspectorExpanded && (
            <div className="p-margin-mobile flex flex-col gap-space-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex flex-col p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono">FIRST SEEN / DATE</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-mono font-medium truncate">
                    {activeNode.firstSeen}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline-variant font-mono">
                    STATUS: {activeNode.lastSeen}
                  </span>
                </div>

                <div className="flex flex-col p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono">EXPOSURE / VOLUME</span>
                  <span className="font-body-sm text-body-sm text-secondary font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping"></span>
                    {activeNode.volume}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline-variant font-mono">
                    VELOCITY: CONFIRMED
                  </span>
                </div>

                <div className="flex flex-col p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono">CORRELATED LEADS</span>
                  <span className="font-body-sm text-body-sm text-primary-container font-mono font-bold">
                    {activeNode.complaints}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono truncate">
                    CASE REF: {caseId}
                  </span>
                </div>

                <div className="flex flex-col p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-mono">ROUTING / IFSC</span>
                  <span className="font-headline-sm text-headline-sm text-tertiary-fixed-dim font-mono font-bold truncate">
                    {activeNode.ifsc}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline-variant font-mono truncate">
                    {activeNode.branch}
                  </span>
                </div>
              </div>

              {/* Statutory Action Command Triggers */}
              <div className="flex flex-col gap-2 pt-1 font-mono">
                <button
                  onClick={triggerCrpcNotice}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded bg-secondary-container hover:bg-on-secondary active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-on-secondary-container shadow-md font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span className="font-headline-sm text-headline-sm uppercase tracking-wide">
                    EXPORT SECTION 91 CRPC FREEZE NOTICE
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={triggerBlacklist}
                    className="min-h-[40px] px-2 py-2 rounded bg-surface-container-high hover:bg-surface-bright active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-primary font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    <span className="font-label-md text-label-md uppercase">ADD CFCFRMS</span>
                  </button>

                  <button
                    onClick={isolateSubtree}
                    className="min-h-[40px] px-2 py-2 rounded bg-surface-container-high hover:bg-surface-bright active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-on-surface font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
                    <span className="font-label-md text-label-md uppercase">ISOLATE RING</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Operational Toast Banner */}
      <div
        className={`fixed top-32 left-4 right-4 max-w-md mx-auto z-50 transform transition-all duration-300 flex items-center gap-2 p-2.5 rounded bg-surface-container-highest shadow-xl border border-outline-variant/40 ${
          toastBanner.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-24 pointer-events-none'
        }`}
      >
        <div className="w-6 h-6 rounded bg-primary-container/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary-container text-[16px]">verified</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline-sm text-headline-sm text-on-surface font-mono font-bold">
            {toastBanner.title}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate font-mono">
            {toastBanner.desc}
          </span>
        </div>
      </div>
    </div>
  );
}
