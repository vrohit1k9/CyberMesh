import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Sparkles, 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Cpu, 
  Phone, 
  CreditCard, 
  Globe, 
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { api } from '../services/api';

const DEMO_PRESETS = [
  {
    name: 'Syndicate Alpha: Task Scam (Closes the Loop)',
    title: 'Telegram High-Yield Commission Scam',
    category: 'INVESTMENT_SCAM',
    amount: '65000',
    description: 'Victim contacted on Telegram by caller +919876543210. Instructed to send commission money to beneficiary account 987654321012@HDFC0001234 and UPI handle fastrefund@okaxis. Directed to login on secure-kyc-update.xyz.'
  },
  {
    name: 'Phishing KYC SMS Alert',
    title: 'Electricity Power Disconnection Threat',
    category: 'PHISHING',
    amount: '42000',
    description: 'Received SMS alert regarding power meter disconnection. Called back helper on +919811223344 and entered banking details on easy-earn-careers.top.'
  }
];

export default function ComplaintNewPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('UPI_FRAUD');
  const [priority, setPriority] = useState('HIGH');
  const [location, setLocation] = useState('Bengaluru Cyber Cell');
  const [victimName, setVictimName] = useState('Citizen Complainant');
  
  const [extractedEntities, setExtractedEntities] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setAmount(preset.amount);
    setExtractedEntities([]);
    setAnalysisDone(false);
    setError('');
  };

  const handleAnalyzeWithAi = async () => {
    if (!description || description.trim().length < 5) {
      setError('Please provide at least a few details in the description before triggering AI analysis.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 1. Entity Extraction
      const extractRes = await api.extractEntities(description);
      if (extractRes.success && extractRes.data.entities) {
        setExtractedEntities(extractRes.data.entities);
      }

      // 2. Category Classification
      const classRes = await api.classifyText(title, description);
      if (classRes.success && classRes.data.category) {
        setCategory(classRes.data.category);
      }

      setAnalysisDone(true);
    } catch (err) {
      setError(`AI analysis warning: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveEntity = (index) => {
    setExtractedEntities(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRoleChange = (index, newRole) => {
    setExtractedEntities(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], role: newRole };
      return copy;
    });
  };

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
        identifiers: extractedEntities.map(e => ({
          type: e.type,
          value: e.value,
          roleInFraud: e.role || 'BENEFICIARY',
          confidenceScore: e.confidence || 1.0,
          extractedBy: 'AI_EXTRACTOR',
          details: e.meta || {}
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-wide text-white flex items-center gap-2.5">
          <Plus className="w-6 h-6 text-cyan-400" />
          INGEST NEW CYBERCRIME COMPLAINT
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Input citizen incident details • AI extracts financial and cyber endpoints • Commits normalized 3NF entities
        </p>
      </div>

      {/* Preset Quick Loader */}
      <div className="cyber-glass-card p-4 rounded-xl border border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Bookmark className="w-4 h-4 text-cyan-400" />
          <span>Quick Demo Presets:</span>
        </div>
        <div className="flex items-center gap-2">
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1 bg-[#111827] hover:bg-cyan-950/40 border border-[#1f293d] hover:border-cyan-500/40 text-xs text-cyan-300 font-mono rounded-lg transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cyber-glass-card p-6 rounded-xl border border-[#1f293d] space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                Complaint Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fraudulent Telegram Task Scam via UPI"
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                Incident Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="UPI_FRAUD">UPI Fraud</option>
                <option value="PHISHING">Phishing Portal</option>
                <option value="BANK_FRAUD">Bank Fraud</option>
                <option value="INVESTMENT_SCAM">Investment Scam</option>
                <option value="JOB_SCAM">Job Scam</option>
                <option value="SHOPPING_FRAUD">Shopping Fraud</option>
                <option value="IDENTITY_THEFT">Identity Theft</option>
                <option value="ACCOUNT_TAKEOVER">Account Takeover</option>
                <option value="OTHER">Other Cybercrime</option>
              </select>
            </div>
          </div>

          {/* Amount, Priority, Victim */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                Reported Amount Lost (INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                Investigation Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase">
                Citizen / Victim Name
              </label>
              <input
                type="text"
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="e.g. Confidential Citizen"
                className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 font-mono"
              />
            </div>
          </div>

          {/* Description & AI Extraction Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase">
                Incident Narrative / Complaint Body
              </label>
              <button
                type="button"
                onClick={handleAnalyzeWithAi}
                disabled={isAnalyzing}
                className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-lg font-mono transition-all shadow-cyber-cyan flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Extracting Identifiers...' : 'Analyze with AI'}</span>
              </button>
            </div>
            <textarea
              rows="4"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter full text of the complaint describing the phone numbers, UPI handles, bank accounts, or websites used by the fraudster..."
              className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg p-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
            />
          </div>

          {/* AI Extracted Identifiers Review Section */}
          {extractedEntities.length > 0 && (
            <div className="p-4 bg-[#0a0f1d] rounded-xl border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                    AI Extracted Identifiers ({extractedEntities.length} Detected)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Review & Confirm Before Committing to Database
                </span>
              </div>

              <div className="space-y-2">
                {extractedEntities.map((ent, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#111827] border border-[#1f293d] rounded-lg text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {ent.type}
                      </span>
                      <span className="font-semibold text-slate-100">{ent.value}</span>
                      <span className="text-[10px] text-slate-500">
                        Conf: {(ent.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={ent.role || 'BENEFICIARY'}
                        onChange={(e) => handleRoleChange(idx, e.target.value)}
                        className="bg-[#070b14] border border-[#1f293d] rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      >
                        <option value="BENEFICIARY">Beneficiary Node</option>
                        <option value="COMMUNICATION_CHANNEL">Communication Channel</option>
                        <option value="PHISHING_PORTAL">Phishing Portal</option>
                        <option value="IMPERSONATION">Impersonation Node</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveEntity(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove false positive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#1f293d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/complaints')}
              className="px-4 py-2 bg-[#111827] hover:bg-[#1a233a] border border-[#1f293d] text-slate-300 font-mono text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold font-mono text-xs rounded-lg transition-all shadow-cyber-cyan flex items-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving to Database...' : 'Commit Complaint & Open Investigation'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
