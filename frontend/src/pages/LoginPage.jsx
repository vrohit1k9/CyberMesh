import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Cpu, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('investigator_raj');
  const [password, setPassword] = useState('CyberMesh2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cyber Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyber-cyan mb-4">
            <Cpu className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-extrabold text-white font-mono tracking-wide">
            CYBER<span className="text-cyan-400">MESH</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1 uppercase">
            Fraud Complaint & Fraud-Ring Tracker
          </p>
          <div className="inline-block mt-2.5 px-3 py-1 bg-cyan-950/60 border border-cyan-800/40 rounded-full text-[11px] text-cyan-300 font-mono">
            Investigator Intelligence Portal
          </div>
        </div>

        {/* Login Panel */}
        <div className="cyber-glass-card rounded-2xl p-8 border border-[#1f293d] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-xs text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Investigator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. investigator_raj"
                  className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Secure Key / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm rounded-lg transition-all shadow-cyber-cyan flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Access Investigation Grid'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-8 pt-6 border-t border-[#1f293d]/80">
            <div className="text-[11px] font-mono text-slate-400 mb-3 text-center uppercase tracking-wider">
              1-Click Academic Demo Credentials
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('investigator_raj', 'CyberMesh2026!')}
                className="p-2 bg-[#090d18] hover:bg-cyan-950/40 border border-[#1f293d] hover:border-cyan-500/40 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-bold text-cyan-400 font-mono">Investigator</div>
                <div className="text-[9px] text-slate-400 truncate">Rajesh Kumar</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('analyst_priya', 'CyberMesh2026!')}
                className="p-2 bg-[#090d18] hover:bg-purple-950/40 border border-[#1f293d] hover:border-purple-500/40 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-bold text-purple-400 font-mono">Analyst</div>
                <div className="text-[9px] text-slate-400 truncate">Priya Nair</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('admin', 'CyberMesh2026!')}
                className="p-2 bg-[#090d18] hover:bg-emerald-950/40 border border-[#1f293d] hover:border-emerald-500/40 rounded-lg text-left transition-all"
              >
                <div className="text-[11px] font-bold text-emerald-400 font-mono">Admin</div>
                <div className="text-[9px] text-slate-400 truncate">Vikram Sharma</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500 font-mono">
          Prototype Investigation Platform • PostgreSQL 3NF • Recursive CTE • Synthetic Data Only
        </div>
      </div>
    </div>
  );
}
