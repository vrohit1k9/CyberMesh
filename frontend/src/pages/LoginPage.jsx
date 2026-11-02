import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Cpu, AlertTriangle, ArrowRight, Mail, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login form state (empty defaults, no hardcoded values)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('INVESTIGATOR');
  const [regShowPassword, setRegShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(loginUsername, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        roleName: regRole,
        fullName: regUsername
      });
      setSuccess('Account created successfully! Entering investigation portal...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to create account. Username or email may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cyber Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyber-cyan mb-4">
            <Cpu className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-extrabold text-white font-mono tracking-wide">
            CYBER<span className="text-cyan-400">MESH</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1 uppercase">
            Fraud Complaint & Fraud-Ring Tracker
          </p>
          <div className="inline-block mt-2 px-3 py-1 bg-cyan-950/60 border border-cyan-800/40 rounded-full text-[11px] text-cyan-300 font-mono">
            Investigator Intelligence Portal
          </div>
        </div>

        {/* Authentication Card */}
        <div className="cyber-glass-card rounded-2xl p-7 border border-[#1f293d] shadow-2xl">
          {/* Navigation Tabs (Login / Register) */}
          <div className="flex border-b border-[#1f293d] mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 pb-3 text-sm font-mono font-medium transition-all text-center relative ${
                activeTab === 'login'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-1 pb-3 text-sm font-mono font-medium transition-all text-center relative ${
                activeTab === 'register'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
              }`}
            >
              Register
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-xs text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Investigator Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    placeholder="Enter investigator username"
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
                    type={loginShowPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Show Password Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="login-show-password"
                  checked={loginShowPassword}
                  onChange={(e) => setLoginShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0a0f1d] border-[#1f293d] text-cyan-500 focus:ring-cyan-500/40 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="login-show-password" className="text-xs text-slate-400 font-mono cursor-pointer select-none">
                  Show Password
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm rounded-lg transition-all shadow-cyber-cyan flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Access Investigation Grid'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    placeholder="choose a display name"
                    className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="name@school.edu"
                    className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="at least 6 characters"
                    className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Show Password Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="reg-show-password"
                  checked={regShowPassword}
                  onChange={(e) => setRegShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0a0f1d] border-[#1f293d] text-cyan-500 focus:ring-cyan-500/40 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="reg-show-password" className="text-xs text-slate-400 font-mono cursor-pointer select-none">
                  Show Password
                </label>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1f293d] rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono transition-all appearance-none cursor-pointer"
                  >
                    <option value="INVESTIGATOR" className="bg-[#0a0f1d] text-slate-100">Investigator</option>
                    <option value="ANALYST" className="bg-[#0a0f1d] text-slate-100">Analyst</option>
                    <option value="ADMIN" className="bg-[#0a0f1d] text-slate-100">Admin</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm rounded-lg transition-all shadow-cyber-cyan flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500 font-mono">
          Prototype Investigation Platform • PostgreSQL 3NF • Recursive CTE • Synthetic Data Only
        </div>
      </div>
    </div>
  );
}
