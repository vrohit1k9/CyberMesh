import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const DEMO_PRESETS = [
  {
    name: 'OLX QR Reverse Scam (Syndicate Alpha)',
    title: 'Marketplace Buyer Fake QR Code Payment Reverse Debit',
    category: 'UPI_FRAUD',
    amount: '35000',
    description: 'Victim listed furniture on OLX. Buyer claimed to be army personnel and messaged from +919876543210. Buyer sent PhonePe QR code claiming victim must scan and enter UPI PIN to receive ₹35,000. Money was debited to fastrefund@okaxis and bank account 987654321012@HDFC0001234.'
  },
  {
    name: 'Telegram VIP Task Scam (Syndicate Alpha)',
    title: 'Telegram High-Yield Task Commission Scam',
    category: 'INVESTMENT_SCAM',
    amount: '50000',
    description: 'Victim contacted on Telegram by +919876543210 offering part-time review tasks. After initial Rs 500 payout, victim was instructed to deposit ₹50,000 via UPI fastrefund@okaxis and bank account 987654321012@HDFC0001234 on website secure-kyc-update.xyz.'
  },
  {
    name: 'Electricity Helpline Trap (Syndicate Beta)',
    title: 'Urgent Power Disconnection Helpline Collect Trap',
    category: 'UPI_FRAUD',
    amount: '42000',
    description: 'Received SMS stating electricity will be disconnected tonight. Called helpline +919811223344. Caller sent UPI collect request from workfromhome@paytm for ₹42,000 linked to bank account 112233445566.'
  }
];

export default function ComplaintNewPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('UPI_FRAUD');
  const [priority, setPriority] = useState('HIGH');
  const [location, setLocation] = useState('New Delhi');
  const [victimName, setVictimName] = useState('Citizen Complainant');

  const [extractedEntities, setExtractedEntities] = useState([]);
  const [linkedCases, setLinkedCases] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setAmount(preset.amount);
    setExtractedEntities([]);
    setLinkedCases([]);
    setAnalysisDone(false);
    setError('');
    setFeedback(`Applied preset: ${preset.name}`);
  };

  // Extract entities & correlate against PostgreSQL database
  const handleExtractAndCheck = async () => {
    if (!description || description.trim().length < 5) {
      setError('Please provide incident details (with phone number, UPI handle, or bank account).');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setFeedback('');

    try {
      // 1. Extract entities locally in Node.js
      const extractRes = await api.extractEntities(description);
      let entities = [];
      if (extractRes.success && extractRes.data.entities) {
        entities = extractRes.data.entities;
        setExtractedEntities(entities);
      }

      // 2. Classify Category
      const classRes = await api.classifyText(title, description);
      if (classRes.success && classRes.data.category) {
        setCategory(classRes.data.category);
      }

      // 3. Query PostgreSQL for shared identifiers
      const correlateRes = await api.correlate({
        title,
        description,
        reported_amount: parseFloat(amount) || 0,
        identifiers: entities
      });

      if (correlateRes.success && correlateRes.data) {
        const cases = correlateRes.data.correlatedCases || [];
        setLinkedCases(cases);
        if (cases.length > 0) {
          setFeedback(`⚡ Database Match: Correlated with ${cases.length} existing case(s) sharing these identifiers!`);
        } else {
          setFeedback('✓ No prior records found. This will create a fresh identifier record.');
        }
      }

      setAnalysisDone(true);
    } catch (err) {
      setError(`Extraction warning: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and incident description are required.');
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
          extractedBy: 'NODEJS_EXTRACTOR',
          details: ent.meta || {}
        }))
      };

      const res = await api.createComplaint(payload);
      if (res.success) {
        if (res.data.caseId) {
          navigate(`/cases/${res.data.caseId}`);
        } else {
          navigate('/complaints');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit complaint to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wide text-cyan-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[26px]">add_circle</span>
          Register New Fraud Complaint
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Inserts records into 3NF normalized PostgreSQL tables (complaints, identifiers, complaint_identifiers)
        </p>
      </div>

      {/* Demo Preset Buttons */}
      <div className="bg-[#0e1726] p-3.5 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 shadow-sm font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>QUICK DEMO PRESETS:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-xs transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="bg-[#0e1726] p-5 rounded-xl border border-slate-700/60 shadow-md flex flex-col gap-4 font-mono text-xs">
          {/* Row 1: Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-bold">Complaint Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Marketplace Buyer Fake QR Code Payment Reverse Debit"
              required
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Row 2: Category, Amount, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">Fraud Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
              >
                <option value="UPI_FRAUD">UPI FRAUD</option>
                <option value="PHISHING">PHISHING</option>
                <option value="BANK_FRAUD">BANK FRAUD</option>
                <option value="INVESTMENT_SCAM">INVESTMENT SCAM</option>
                <option value="JOB_SCAM">JOB SCAM</option>
                <option value="SHOPPING_FRAUD">SHOPPING FRAUD</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">Reported Amount Lost (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 35000"
                min="0"
                required
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          {/* Row 3: Complainant Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">Complainant / Victim Name</label>
              <input
                type="text"
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-bold">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New Delhi"
                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-bold">Incident Description &amp; Details *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scam including phone numbers (+91...), UPI IDs (@okaxis...), bank accounts, or websites used by the scammer..."
              required
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Step 1 Button: Extract Identifiers */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleExtractAndCheck}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 rounded font-bold flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span>{isAnalyzing ? 'Extracting & Checking Database...' : 'Extract Identifiers & Check Database'}</span>
            </button>

            {feedback && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded">
                {feedback}
              </span>
            )}
          </div>
        </div>

        {/* Extracted Identifiers Panel */}
        {extractedEntities.length > 0 && (
          <div className="bg-[#0e1726] p-4 rounded-xl border border-cyan-500/30 shadow-md flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                Extracted Canonical Identifiers ({extractedEntities.length})
              </span>
              <span className="text-slate-400 text-[11px]">Will be inserted into `identifiers` table</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {extractedEntities.map((ent, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800">
                    {ent.type}
                  </span>
                  <span className="font-bold text-white">{ent.value}</span>
                  <span className="text-[10px] text-slate-400">({ent.role || 'BENEFICIARY'})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Database Link / Correlation Preview */}
        {linkedCases.length > 0 && (
          <div className="bg-[#0e1726] p-4 rounded-xl border border-amber-500/40 shadow-md flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-700/60 pb-2">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>PostgreSQL Match: Connected to Existing Fraud Syndicate!</span>
            </div>

            <div className="flex flex-col gap-2">
              {linkedCases.map((c) => (
                <div key={c.caseId} className="p-3 bg-slate-900 rounded border border-slate-700 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{c.caseId}: {c.caseTitle}</span>
                    <span className="text-amber-400 font-bold">{c.sharedIdentifiersCount} Shared Identifiers</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Linked Complaints in Ring: {c.linkedComplaints ? c.linkedComplaints.join(', ') : 'CMP-2026-0001'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Submit to DB Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/complaints')}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{isSubmitting ? 'Saving to Database...' : 'Save Complaint to PostgreSQL'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
