import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';

try {
  cytoscape.use(cola);
} catch (e) {
  // Already registered
}

const TYPE_STYLES = {
  NEW_COMPLAINT: {
    bg: '#df0042',
    border: '#ffb3b6',
    shape: 'ellipse',
    color: '#ffffff',
    label: 'NEW INTAKE'
  },
  COMPLAINT: {
    bg: '#00f0ff',
    border: '#006970',
    shape: 'hexagon',
    color: '#dbfcff',
    label: 'CASE CMP'
  },
  UPI: {
    bg: '#ffd386',
    border: '#7d5800',
    shape: 'round-rectangle',
    color: '#ffd386',
    label: 'UPI VPA'
  },
  BANK_ACCOUNT: {
    bg: '#7df4ff',
    border: '#004f54',
    shape: 'diamond',
    color: '#dbfcff',
    label: 'BANK A/C'
  },
  PHONE: {
    bg: '#ffb3b6',
    border: '#df0042',
    shape: 'ellipse',
    color: '#ffb3b6',
    label: 'PHONE'
  },
  DOMAIN: {
    bg: '#f43f5e',
    border: '#9f1239',
    shape: 'round-rectangle',
    color: '#f43f5e',
    label: 'DOMAIN'
  }
};

export default function CaseSubGraph({ graphData, caseId }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    const elements = [
      ...graphData.nodes.map((n) => ({
        group: 'nodes',
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          isNew: n.isNew,
          isShared: n.isShared,
          raw: n.data || {}
        }
      })),
      ...graphData.edges.map((e, idx) => ({
        group: 'edges',
        data: {
          id: e.id || `edge_${idx}`,
          source: e.source,
          target: e.target,
          label: e.label || ''
        }
      }))
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    try {
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        userZoomingEnabled: false,
        zoomingEnabled: true,
        panningEnabled: true,
        boxSelectionEnabled: false,
        layout: {
          name: 'cola',
          animate: false,
          nodeSpacing: 45,
          edgeLength: 100,
          randomize: false
        },
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#dbfcff',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '8px',
              'font-weight': '600',
              'text-valign': 'bottom',
              'text-margin-y': '4px',
              'background-color': (ele) => (TYPE_STYLES[ele.data('type')] || TYPE_STYLES.UPI).bg,
              'border-color': (ele) => (TYPE_STYLES[ele.data('type')] || TYPE_STYLES.UPI).border,
              'border-width': '2px',
              shape: (ele) => (TYPE_STYLES[ele.data('type')] || TYPE_STYLES.UPI).shape,
              width: '26px',
              height: '26px',
              'text-background-color': '#0b0e16',
              'text-background-opacity': 0.85,
              'text-background-padding': '2px',
              'text-background-shape': 'roundrectangle'
            }
          },
          {
            selector: 'node[?isNew]',
            style: {
              'background-color': '#df0042',
              'border-color': '#ffb3b6',
              'border-width': '3px',
              width: '32px',
              height: '32px',
              'shadow-blur': 14,
              'shadow-color': '#df0042',
              'shadow-opacity': 0.95
            }
          },
          {
            selector: 'node[?isShared]',
            style: {
              'border-width': '3px',
              'border-color': '#ffd386',
              'shadow-blur': 12,
              'shadow-color': '#ffd386',
              'shadow-opacity': 0.85
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#ffffff',
              'border-width': '3px',
              'shadow-blur': 16,
              'shadow-color': '#ffffff'
            }
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#3b494b',
              'target-arrow-color': '#00dbe9',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 0.9,
              label: 'data(label)',
              'font-family': 'JetBrains Mono, monospace',
              'font-size': '7px',
              color: '#849495',
              'text-background-color': '#10131c',
              'text-background-opacity': 0.85,
              'text-background-padding': '1px'
            }
          }
        ]
      });

      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        setSelectedNode({
          id: node.data('id'),
          label: node.data('label'),
          type: node.data('type'),
          isNew: node.data('isNew'),
          isShared: node.data('isShared'),
          data: node.data('raw')
        });
      });

      cyRef.current = cy;
    } catch (err) {
      console.error('CaseSubGraph error:', err);
    }
  }, [graphData]);

  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleFit = () => {
    if (cyRef.current) cyRef.current.fit(null, 25);
  };

  return (
    <div className="relative w-full rounded-lg bg-surface-container-lowest border border-outline-variant/30 overflow-hidden flex flex-col">
      {/* Mini Controls Bar */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-sm p-1 rounded border border-outline-variant/30 text-[10px] font-mono">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-5 h-5 flex items-center justify-center rounded bg-surface-container text-primary hover:bg-surface-bright"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-5 h-5 flex items-center justify-center rounded bg-surface-container text-primary hover:bg-surface-bright"
          title="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleFit}
          className="px-1.5 h-5 flex items-center justify-center rounded bg-surface-container text-primary hover:bg-surface-bright font-bold"
          title="Fit view"
        >
          FIT
        </button>
      </div>

      {/* Subgraph Canvas */}
      <div
        ref={containerRef}
        className="w-full h-56 cursor-grab active:cursor-grabbing bg-[radial-gradient(#1e2638_1px,transparent_1px)] [background-size:16px_16px]"
      />

      {/* Node Mini Inspector Popover if selected */}
      {selectedNode && (
        <div className="p-2 bg-surface-container-high border-t border-outline-variant/30 font-mono text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="text-primary font-bold">{selectedNode.label}</span>
            <span className="text-outline text-[9px] uppercase">({selectedNode.type})</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="text-outline hover:text-on-surface text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Legend strip */}
      <div className="px-2 py-1 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between text-[9px] font-mono text-outline">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span>Red: New Intake</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-tertiary-fixed-dim"></span>
            <span>Amber: Shared Bridge</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span>Cyan: Existing Syndicate</span>
          </span>
        </div>
        <span>CASE: {caseId}</span>
      </div>
    </div>
  );
}
