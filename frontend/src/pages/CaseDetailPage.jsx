import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseId = id || 'CASE-2026-0079';

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Evidence Checklist State
  const [evidenceList, setEvidenceList] = useState([
    {
      id: 1,
      title: '12-Digit UTR Sequence Verified via NPCI',
      sub: 'UTR: 419200481920 // HASH MATCHED',
      checked: true,
    },
    {
      id: 2,
      title: 'WhatsApp Scam Logs & Malicious QR Scrim',
      sub: 'EXIF METADATA PRESERVED',
      checked: true,
    },
    {
      id: 3,
      title: 'IPDR Carrier Session Logs Fetched',
      sub: 'AWAITING AIRTEL / JIO RESPONSE',
      checked: false,
    },
    {
      id: 4,
      title: 'Sec 65B Electronic Evidence Affidavit',
      sub: 'COMPLAINANT SIGNATURE PENDING',
      checked: false,
    },
  ]);

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await api.getCaseById(caseId);
        if (res.success && res.data?.case) {
          setCaseData(res.data.case);
        }
      } catch (e) {
        // Fallback to default scenario
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  const copyTargetVpa = () => {
    const vpa = caseData?.primary_identifier || 'fastrefund@okaxis';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vpa);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1800);
    }
  };

  const toggleEvidence = (id) => {
    setEvidenceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const validatedCount = evidenceList.filter((e) => e.checked).length;

  const targetIdentifier = caseData?.primary_identifier || 'fastrefund@okaxis';
  const riskScore = caseData?.risk_score || 92;
  const reportedAmount = caseData?.reported_amount
    ? `₹${(Number(caseData.reported_amount) / 100000).toFixed(2)} LAKHS`
    : '₹18.40 LAKHS';

  return (
    <div className="flex flex-col w-full text-on-surface select-none">
      {/* Case Context Tactical Strip */}
      <div className="px-margin-mobile py-space-sm bg-surface-container-lowest border-b border-outline-variant/30">
        <div className="flex items-center justify-between gap-space-xs mb-space-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping shrink-0"></span>
            <span className="font-headline-sm text-headline-sm text-secondary truncate tracking-tight font-mono">
              CASE #{caseId}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm uppercase font-mono">
              NEW DELHI CYBER CELL
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/30 shadow-md">
          <div className="flex items-center justify-between gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
              Primary Syndicate Target (VPA)
            </span>
            <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary-fixed-dim font-label-sm text-label-sm font-mono font-bold">
              SUSPECT L1 MULE
            </span>
          </div>
          <div className="flex items-center justify-between gap-space-xs">
            <span className="font-headline-md text-headline-md text-primary-fixed tracking-tight truncate font-mono font-bold">
              {targetIdentifier}
            </span>
            <button
              onClick={copyTargetVpa}
              className={`flex items-center gap-1 px-2 py-1 rounded bg-surface-container-highest text-primary-container font-label-sm text-label-sm active:scale-95 transition-transform font-mono ${
                copySuccess ? 'text-tertiary-fixed-dim font-bold' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {copySuccess ? 'done' : 'content_copy'}
              </span>
              <span>{copySuccess ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-mono">
            Modus: QR &apos;Scan to Receive&apos; Reverse Debit Syndicate
          </p>
        </div>
      </div>

      {/* Main Scrollable Content Container */}
      <div className="flex flex-col gap-space-md px-margin-mobile py-space-md">
        {/* Risk Score HUD & Threat Telemetry Gauge */}
        <div className="bg-surface-container-low rounded-xl p-space-md shadow-md border border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-xs mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">warning</span>
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-mono tracking-wider">
                Risk Matrix Assessment
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold tracking-wider animate-pulse font-mono">
              CRITICAL RISK
            </span>
          </div>

          {/* Tactical Metric Cluster */}
          <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-lowest mb-space-sm border border-outline-variant/20">
            <div className="flex flex-col items-center justify-center min-w-[96px] py-1 bg-surface-container-high rounded-lg text-center border border-outline-variant/30">
              <span className="font-headline-xl text-headline-xl text-secondary leading-none font-bold font-mono">
                {riskScore}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">
                /100 SCORE
              </span>
              <span className="font-label-sm text-label-sm text-secondary-container font-bold mt-0.5 font-mono">
                LETHAL TIER
              </span>
            </div>

            <div className="flex flex-col min-w-0 flex-1 justify-center">
              <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md mb-0.5 font-mono">
                <span>SIPHONED LOSS</span>
                <span className="text-secondary font-bold">{reportedAmount}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-1.5 font-mono">
                6 Verified Victims in NCR Zone (NCRB 1930 Portal)
              </p>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-primary-fixed-dim">
                  HOP DEPTH: 4
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-tertiary-fixed-dim">
                  CYCLED: YES
                </span>
              </div>
            </div>
          </div>

          {/* 3 Anomaly Breakdown Bars */}
          <div className="flex flex-col gap-space-xs font-mono">
            {/* Metric 1: Identifier Reuse */}
            <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                <span className="text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    phone_iphone
                  </span>
                  IDENTIFIER REUSE
                </span>
                <span className="text-secondary font-bold">95%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1">
                <div className="h-full bg-secondary-container rounded-full" style={{ width: '95%' }}></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">
                Linked: 8 Prior 1930 complaints on same IMEI &amp; Phone
              </span>
            </div>

            {/* Metric 2: Graph Density */}
            <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                <span className="text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">
                    hub
                  </span>
                  GRAPH DENSITY CLUSTERING
                </span>
                <span className="text-tertiary-fixed-dim font-bold">91%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1">
                <div className="h-full bg-tertiary-fixed-dim rounded-full" style={{ width: '91%' }}></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">
                Part of 5-node cyclic mule laundering sub-network
              </span>
            </div>

            {/* Metric 3: Velocity Anomaly */}
            <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
              <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                <span className="text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary-container">
                    speed
                  </span>
                  VELOCITY BURST ANOMALY
                </span>
                <span className="text-primary-container font-bold">88%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1">
                <div className="h-full bg-primary-container rounded-full" style={{ width: '88%' }}></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">
                14 high-value txns executed within 90 seconds (01:14 AM)
              </span>
            </div>
          </div>
        </div>

        {/* RAG Intelligence Dossier Card (+AI) */}
        <div className="bg-surface-container-low rounded-xl p-space-md shadow-md border border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-xs mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                psychology
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-mono tracking-wider">
                RAG Domain Intelligence
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-on-primary-fixed font-headline-sm text-headline-sm font-bold font-mono">
              <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
              <span>98% MATCH</span>
            </div>
          </div>

          <div className="p-space-sm rounded-lg bg-surface-container-lowest mb-space-sm border border-outline-variant/20">
            <div className="flex items-center gap-1 text-primary-fixed mb-1 font-label-md text-label-md uppercase font-mono">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Matched Threat Pattern Archetype</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-semibold leading-snug font-mono">
              NPCI Protocol: QR Code &quot;Scan to Receive&quot; Reverse Debit Scam
            </p>
          </div>

          {/* AI Analytical Breakdown Text */}
          <div className="bg-surface-container p-space-sm rounded-lg border border-outline-variant/20">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
                Extracted Forensic Insights
              </span>
              <span className="font-label-sm text-label-sm text-primary font-mono">LLM-FININT // v4.2</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
              Target generates phishing QR encoded with merchant Collect Request payloads (
              <code className="text-primary-fixed font-mono text-[10px]">
                pa=fastrefund@okaxis&amp;am=49999
              </code>
              ). Victims are socially engineered via spoofed WhatsApp business accounts claiming instant refunds. Pin entry executes immediate debit. Siphoned funds are instantaneously cascaded to 3 intermediary mule accounts within 180 seconds to bypass static rules.
            </p>

            {/* Quick Tag Strip */}
            <div className="flex flex-wrap gap-1.5 mt-space-sm pt-space-xs bg-surface-container-low p-2 rounded border border-outline-variant/20 font-mono">
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                Vector: OLX / WhatsApp
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-on-surface">
                Target Bank: Axis Bank (Mule)
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary">
                Exit Gate: Crypto P2P Desk
              </span>
            </div>
          </div>
        </div>

        {/* Statutory SOP Directives (CrPC Workflow) */}
        <div className="bg-surface-container-low rounded-xl p-space-md shadow-md border border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-xs mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">
                gavel
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-mono tracking-wider">
                Statutory SOP Directives
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              CRPC PROTOCOL
            </span>
          </div>

          <div className="flex flex-col gap-space-xs font-mono">
            {/* Step 1 */}
            <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between gap-space-xs border border-outline-variant/20">
              <div className="flex items-start gap-2 min-w-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container font-headline-sm text-headline-sm shrink-0">
                  1
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                    Section 91 CrPC Automated Notice
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Bank Nodal Officer requisition package
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-secondary-container/20 text-secondary font-label-sm text-label-sm shrink-0 uppercase font-bold">
                READY
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between gap-space-xs border border-outline-variant/20">
              <div className="flex items-start gap-2 min-w-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-tertiary-container text-on-tertiary-container font-headline-sm text-headline-sm shrink-0">
                  2
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                    CFCFRMS Immediate Account Lien
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time debit freeze directive
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-tertiary-container/20 text-tertiary-fixed-dim font-label-sm text-label-sm shrink-0 uppercase font-bold">
                PENDING SIGN
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between gap-space-xs border border-outline-variant/20">
              <div className="flex items-start gap-2 min-w-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-bright text-on-surface font-headline-sm text-headline-sm shrink-0">
                  3
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                    SIM IPDR / CDR Telemetry Order
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    IMEI cross-binding extraction request
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm shrink-0 uppercase">
                DISPATCHED
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Evidence Checklist (Interactive) */}
        <div className="bg-surface-container-low rounded-xl p-space-md shadow-md border border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-xs mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-mono tracking-wider">
                Evidence Chain Registry
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-primary-container px-2 py-0.5 rounded bg-surface-container-high font-mono">
              {validatedCount} / {evidenceList.length} VALIDATED
            </span>
          </div>

          <div className="flex flex-col gap-1.5 font-mono">
            {evidenceList.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2 p-2 rounded bg-surface-container cursor-pointer select-none border border-outline-variant/20 hover:border-primary-container/30 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleEvidence(item.id)}
                  className="mt-0.5 rounded accent-primary-container w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-body-md text-body-md text-on-surface font-medium leading-tight">
                    {item.title}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim font-mono">
                    {item.sub}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rapid Node & Graph Link Preview Ribbon */}
        <div className="bg-surface-container-low rounded-xl p-space-md shadow-md border border-outline-variant/30">
          <div className="flex items-center justify-between gap-space-xs mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">
                account_tree
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-mono tracking-wider">
                Multi-Hop Laundering Chain
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold font-mono">
              Hop 1 → 4 Active
            </span>
          </div>

          {/* Tactical Mini-Graph Chain Diagram */}
          <div className="flex items-center justify-between gap-1 py-space-sm px-2 bg-surface-container-lowest rounded-lg overflow-x-auto no-scrollbar border border-outline-variant/20 font-mono">
            {/* Node 1: Victim */}
            <div className="flex flex-col items-center min-w-[64px] text-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-on-surface mb-1">
                <span className="material-symbols-outlined text-[16px]">person</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-16">
                VICTIM
              </span>
              <span className="font-label-sm text-label-sm text-primary font-mono">₹49,999</span>
            </div>

            <span className="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0">
              arrow_forward
            </span>

            {/* Node 2: Target (Amber) */}
            <div className="flex flex-col items-center min-w-[72px] text-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-1 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-bold truncate w-20">
                fastrefund
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-mono">TARGET</span>
            </div>

            <span className="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0">
              arrow_forward
            </span>

            {/* Node 3: Mule Bank 1 */}
            <div className="flex flex-col items-center min-w-[64px] text-center shrink-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary-fixed-dim mb-1">
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-16">
                AXIS MULE
              </span>
              <span className="font-label-sm text-label-sm text-tertiary-fixed-dim font-mono">
                L2 TIER
              </span>
            </div>

            <span className="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0">
              arrow_forward
            </span>

            {/* Node 4: Mule Bank 2 (Dispersal) */}
            <div className="flex flex-col items-center min-w-[64px] text-center shrink-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-fixed-dim mb-1">
                <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-16">
                P2P CRYPTO
              </span>
              <span className="font-label-sm text-label-sm text-primary font-mono">EXIT POOL</span>
            </div>
          </div>
        </div>

        {/* Officer Directive Action Hub */}
        <div className="flex flex-col gap-space-xs mt-space-xs pb-space-lg font-mono">
          <button
            onClick={() => setDispatchModalOpen(true)}
            className="w-full py-3 px-space-md rounded-lg bg-secondary-container text-on-secondary-container font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:opacity-90 transition-opacity font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>DISPATCH SECTION 91 NOTICE &amp; FREEZE</span>
          </button>

          <button
            onClick={() => navigate(`/cases/${caseId}/network`)}
            className="w-full py-2.5 px-space-md rounded-lg bg-surface-container-high text-primary-container font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-2 active:bg-surface-bright transition-colors border border-outline-variant/30 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>OPEN NETWORK GRAPH MATRIX</span>
          </button>
        </div>
      </div>

      {/* Dynamic Notification / Dispatch Toast Modal */}
      {dispatchModalOpen && (
        <div
          onClick={() => setDispatchModalOpen(false)}
          className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center p-margin-mobile"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface-container-low rounded-xl p-space-md shadow-2xl flex flex-col gap-space-sm border border-outline-variant/40 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span className="font-headline-sm text-headline-sm uppercase font-bold font-mono">
                  Notice Dispatched
                </span>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-sans">
              Statutory Section 91 CrPC notice generated and transmitted to <strong>Axis Bank Nodal</strong> and <strong>CFCFRMS</strong>.
            </p>
            <div className="p-2 rounded bg-surface-container-lowest text-primary font-mono font-label-sm text-label-sm border border-outline-variant/20 leading-relaxed">
              ACK: DL-CYBER-SEC91-2024-910294<br />
              TIMESTAMP: 2024-11-20 03:14:22 IST<br />
              STATUS: ACCOUNT IN HARD-HOLD LIEN
            </div>
            <button
              onClick={() => setDispatchModalOpen(false)}
              className="w-full py-2 rounded bg-primary-container text-on-primary-fixed font-headline-sm text-headline-sm uppercase font-mono font-bold hover:opacity-90 transition-opacity"
            >
              CONFIRM &amp; RETURN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
