import React from 'react';
import { 
  LayoutDashboard, TrafficCone, Landmark, CreditCard, 
  Users, ShieldAlert, BrainCircuit, Terminal, Radio
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { connected } = useSocket();

  const navigationTabs = [
    {
      id: 'dashboard',
      label: 'SOC Command Center',
      icon: LayoutDashboard,
      badge: 'Live',
      color: 'text-cyan-500'
    },
    {
      id: 'traffic',
      label: 'Traffic Infrastructure',
      icon: TrafficCone,
      badge: 'Level 4',
      color: 'text-amber-500'
    },
    {
      id: 'municipal',
      label: 'Municipal Services',
      icon: Landmark,
      badge: 'Permits',
      color: 'text-blue-500'
    },
    {
      id: 'payment',
      label: 'Municipal Treasury',
      icon: CreditCard,
      badge: 'Payouts',
      color: 'text-emerald-500'
    },
    {
      id: 'users',
      label: 'Identity & RBAC/ABAC',
      icon: Users,
      badge: 'Clearance',
      color: 'text-purple-500'
    },
    {
      id: 'logs',
      label: 'Tamper-Evident Logs',
      icon: ShieldAlert,
      badge: 'SHA-256',
      color: 'text-rose-500'
    },
    {
      id: 'ml',
      label: 'Isolation Forest AI',
      icon: BrainCircuit,
      badge: 'LANL Benchmark',
      color: 'text-teal-500'
    }
  ];

  return (
    <aside className="w-64 shrink-0 py-6 pr-6 hidden md:block border-r border-slate-200 dark:border-slate-800">
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono px-3 mb-2 block">
          Government Domains
        </span>

        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isActive
                  ? 'bg-blue-700/60 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Securox Telemetry Feed Status */}
      <div className="mt-8 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400">SIEM Uplink:</span>
          <span className={`font-bold flex items-center gap-1 ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Continuous Zero-Trust behavioral profiling active.
        </div>
      </div>
    </aside>
  );
};

