import React, { useState, useEffect } from 'react';
import { 
  Shield, Sun, Moon, Zap, User, LogOut, Bell, Radio, 
  CheckCircle2, AlertTriangle, Key, Terminal, Cpu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ThreatScoreBadge } from './ThreatScoreBadge';
import { IndiaNationalEmblem } from './IndiaNationalEmblem';
import { SecuroxLogo } from './SecuroxLogo';
import { api } from '../context/AuthContext';

export const Navbar = ({ onOpenSimulator }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { connected, lastEvent } = useSocket();

  const [stats, setStats] = useState({
    threat_index: 12.5,
    system_severity: 'NORMAL'
  });
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/security/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Sovereign Portal Identity */}
        <div className="flex items-center gap-3">
          <IndiaNationalEmblem size="sm" showText={false} />
          <span className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></span>
          <SecuroxLogo size="sm" showSubtitle={false} />
          <span className="hidden lg:inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60">
            Gov Zero-Trust Gateway
          </span>
        </div>

        {/* Center Live SOC Threat Score Pill */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
              SOC Live Feed
            </span>
          </div>
          <span className="h-3 w-px bg-slate-300 dark:bg-slate-700"></span>
          <ThreatScoreBadge
            severity={stats.system_severity}
            score={stats.threat_index / 100}
            size="sm"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Cyber Attack Simulator Button */}
          <button
            type="button"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Attack Sandbox</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.full_name || user.username}
                </span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  {user.role} &bull; L{user.clearance_level || 1}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                title="End Authenticated Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
