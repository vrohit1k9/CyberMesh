import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw, 
  Search, 
  ArrowLeft, 
  Info, 
  X,
  CreditCard,
  Phone,
  Globe,
  FileText,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';

// Register cola layout
cytoscape.use(cola);

const NODE_COLORS = {
  'COMPLAINT': '#8b5cf6',   // Purple
  'PHONE': '#10b981',       // Emerald
  'UPI': '#00f2fe',         // Cyan
  'BANK_ACCOUNT': '#f59e0b',// Amber
  'DOMAIN': '#f43f5e',      // Rose
};

export default function NetworkGraphPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const [depth, setDepth] = useState(3);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter toggles
  const [filters, setFilters] = useState({
    COMPLAINT: true,
    PHONE: true,
    UPI: true,
    BANK_ACCOUNT: true,
    DOMAIN: true,
  });

  const loadNetwork = async (currentDepth) => {
    setLoading(true);
    setSelectedNode(null);
    try {
      const res = await api.getCaseNetwork(id, currentDepth);
      if (res.success) {
        setGraphData(res.data);
      }
    } catch (err) {
      console.error('Failed to load network:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork(depth);
  }, [id, depth]);

  // Cytoscape initialization and updates
  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    // Filter nodes and edges based on toggles
    const activeNodes = graphData.nodes.filter(n => filters[n.type]);
    const activeNodeIds = new Set(activeNodes.map(n => n.id));
    const activeEdges = graphData.edges.filter(
      e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
    );

    const elements = [
      ...activeNodes.map(n => ({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.type === 'COMPLAINT' ? n.data.complaintId : n.label,
          type: n.type,
          isRoot: n.isRoot,
          meta: n.data
        }
      })),
      ...activeEdges.map(e => ({
        group: 'edges',
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || '',
          isAnomaly: e.isAnomaly || false,
          type: e.type
        }
      }))
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '10px',
            'font-family': 'monospace',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'background-color': (ele) => NODE_COLORS[ele.data('type')] || '#64748b',
            'width': (ele) => ele.data('isRoot') ? 38 : (ele.data('type') === 'COMPLAINT' ? 30 : 24),
            'height': (ele) => ele.data('isRoot') ? 38 : (ele.data('type') === 'COMPLAINT' ? 30 : 24),
            'border-width': (ele) => ele.data('isRoot') ? 3 : 1,
            'border-color': (ele) => ele.data('isRoot') ? '#00f2fe' : '#ffffff',
            'border-opacity': 0.8,
            'text-outline-width': 2,
            'text-outline-color': '#070b14',
            'overlay-opacity': 0
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#00f2fe',
            'shadow-blur': 25,
            'shadow-color': '#00f2fe',
            'shadow-opacity': 0.9
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => ele.data('isAnomaly') ? 3 : 1.5,
            'line-color': (ele) => ele.data('isAnomaly') ? '#f43f5e' : '#334155',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': (ele) => ele.data('isAnomaly') ? '#f43f5e' : '#475569',
            'arrow-scale': 0.8,
            'label': 'data(label)',
            'font-size': '8px',
            'font-family': 'monospace',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'line-style': (ele) => ele.data('type') === 'TRANSACTION_FLOW' ? 'dashed' : 'solid'
          }
        }
      ],
      layout: {
        name: 'cola',
        animate: true,
        randomize: false,
        maxSimulationTime: 1500,
        nodeSpacing: 45,
        edgeLength: 120,
        fit: true,
        padding: 40
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.id(),
        type: node.data('type'),
        label: node.data('label'),
        isRoot: node.data('isRoot'),
        meta: node.data('meta')
      });
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData, filters]);

  // Search node
  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!cyRef.current || !searchQuery) return;
    const cy = cyRef.current;
    const found = cy.nodes().filter(n => 
      n.data('label').toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.id().toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (found.length > 0) {
      cy.center(found);
      cy.zoom(1.8);
      found.select();
      setSelectedNode({
        id: found[0].id(),
        type: found[0].data('type'),
        label: found[0].data('label'),
        isRoot: found[0].data('isRoot'),
        meta: found[0].data('meta')
      });
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Controls Bar */}
      <div className="cyber-glass-card p-4 rounded-xl border border-[#1f293d] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cases/${id}`)}
            className="p-2 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <h1 className="text-base font-bold font-mono text-white">
                FRAUD SYNDICATE TOPOLOGY — {id}
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Recursive PostgreSQL CTE Graph Traversal (Max Depth: {depth} Hops)
            </p>
          </div>
        </div>

        {/* Traversal Depth & Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#090d18] px-3 py-1.5 rounded-lg border border-[#1f293d]">
            <span className="text-[11px] font-mono text-slate-400">Depth Hops:</span>
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all ${
                  depth === d
                    ? 'bg-cyan-500 text-black shadow-cyber-cyan'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Search inside Graph */}
          <form onSubmit={handleSearchNode} className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </form>

          {/* Graph Controls */}
          <div className="flex items-center gap-1 bg-[#090d18] p-1 rounded-lg border border-[#1f293d]">
            <button
              onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => cyRef.current?.fit()}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
              title="Fit View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => loadNetwork(depth)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
              title="Reload Layout"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Inspection Sidebar */}
      <div className="flex-1 min-h-0 relative flex gap-4">
        {/* Cytoscape Canvas */}
        <div className="flex-1 cyber-glass-card rounded-xl border border-[#1f293d] relative overflow-hidden bg-[#070b14]/90">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 cyber-glass p-3 rounded-lg border border-[#1f293d] text-[10px] font-mono space-y-1.5 select-none pointer-events-none">
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">Entity Legend</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#8b5cf6]"></span><span className="text-slate-300">Complaint Node</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#f59e0b]"></span><span className="text-slate-300">Bank Account Node</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#00f2fe]"></span><span className="text-slate-300">UPI Handle Node</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#10b981]"></span><span className="text-slate-300">Phone Number Node</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#f43f5e]"></span><span className="text-slate-300">Phishing Domain Node</span></div>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="w-80 cyber-glass-card p-5 rounded-xl border border-cyan-500/40 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase">Entity Telemetry</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold font-mono inline-block mb-1.5"
                  style={{
                    backgroundColor: `${NODE_COLORS[selectedNode.type]}20`,
                    color: NODE_COLORS[selectedNode.type],
                    border: `1px solid ${NODE_COLORS[selectedNode.type]}50`
                  }}
                >
                  {selectedNode.type}
                </span>
                <div className="text-sm font-bold font-mono text-slate-100 break-all">
                  {selectedNode.label}
                </div>
              </div>

              {selectedNode.type === 'COMPLAINT' ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-[#0a0f1d] p-3 rounded border border-[#1f293d]">
                    <div className="text-[10px] text-slate-500">Complaint Title</div>
                    <div className="text-slate-200 font-semibold mt-0.5">{selectedNode.meta.title}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500">Category</div>
                      <div className="text-cyan-400 font-bold mt-0.5">{selectedNode.meta.category}</div>
                    </div>
                    <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500">Loss Amount</div>
                      <div className="text-emerald-400 font-bold mt-0.5">₹{selectedNode.meta.amount?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                    <div className="text-[10px] text-slate-500">Reported Date</div>
                    <div className="text-slate-300 font-bold mt-0.5">{selectedNode.meta.reportedDate}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-[#0a0f1d] p-3 rounded border border-[#1f293d]">
                    <div className="text-[10px] text-slate-500">Canonical Identifier</div>
                    <div className="text-slate-200 font-semibold break-all mt-0.5">{selectedNode.meta.value}</div>
                  </div>

                  {selectedNode.meta.meta?.bankName && (
                    <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500">Bank & Branch</div>
                      <div className="text-amber-400 font-bold mt-0.5">{selectedNode.meta.meta.bankName}</div>
                      <div className="text-[10px] text-slate-400">IFSC: {selectedNode.meta.meta.ifsc}</div>
                    </div>
                  )}

                  {selectedNode.meta.meta?.carrier && (
                    <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500">Telecom Provider</div>
                      <div className="text-emerald-400 font-bold mt-0.5">{selectedNode.meta.meta.carrier}</div>
                    </div>
                  )}

                  {selectedNode.meta.meta?.registrar && (
                    <div className="bg-[#0a0f1d] p-2.5 rounded border border-[#1f293d]">
                      <div className="text-[10px] text-slate-500">Domain Registrar</div>
                      <div className="text-rose-400 font-bold mt-0.5">{selectedNode.meta.meta.registrar}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#1f293d]">
              <div className="text-[10px] text-slate-500 font-mono text-center">
                Investigator Action: Verify cross-victim linkage
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
