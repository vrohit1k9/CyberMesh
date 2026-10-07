import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  FolderLock, 
  Network, 
  ArrowLeftRight, 
  ShieldCheck, 
  PlusCircle,
  Cpu,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Complaints', path: '/complaints', icon: FileText },
    { name: 'New Complaint', path: '/complaints/new', icon: PlusCircle, badge: 'AI' },
    { name: 'Cases Board', path: '/cases', icon: FolderLock },
    { name: 'Fraud Networks', path: '/networks', icon: Network },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, role: ['ADMIN', 'INVESTIGATOR'] },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-[#1f293d] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#1f293d] gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-cyber-cyan">
          <Cpu className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-extrabold text-lg tracking-wider text-white font-mono flex items-center gap-1.5">
            CYBER<span className="text-cyan-400">MESH</span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-widest font-mono uppercase">
            Fraud Syndicate Radar
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
          Intelligence Workspace
        </div>
        {navItems.map((item) => {
          if (item.role && user && !item.role.includes(user.role)) return null;

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131c31]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-[#1f293d] bg-[#090d18]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {user?.fullName || user?.username}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                {user?.role || 'INVESTIGATOR'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {user?.badgeNumber || 'OFFICER'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
