import React, { useState, useEffect } from 'react';
import { 
  Shield, Sun, Moon, Zap, User, LogOut, Radio, 
  CheckCircle2, ShieldAlert, KeyRound, Activity
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
  const { connected } = useSocket();

  const [stats, setStats] = useState({
    threat_index: 10.0,
    security_posture: 'NORMAL'
  });

  const fetchStats = async () => {
    try {
      const res = await api.get('/security/stats');
      setStats(res.data);
    } catch (err) {
      console.debug("Navbar stats fetch:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#07111F]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      
      {/* Top Institutional Government Banner */}
      <div className="bg-[#0B1728] text-slate-300 text-[11px] font-mono py-1 px-4 sm:px-8 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white tracking-wider">SECURITY INTELLIGENCE PLATFORM</span>
          <span className="hidden sm:inline text-slate-400">&bull; Government Digital Infrastructure</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden md:inline text-slate-400">NIST SP 800-207 ZERO TRUST</span>
          <span className="text-cyan-400 font-bold">STRICT ACCESS GATEWAY</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Sovereign Portal Identity */}
        <div className="flex items-center gap-3">
          <IndiaNationalEmblem size="sm" showText={false} />
          <span className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></span>
          <SecuroxLogo size="sm" showSubtitle={false} />
          <span className="hidden lg:inline-block px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md bg-[#0B4EA2]/10 text-[#0B4EA2] dark:text-cyan-400 border border-[#0B4EA2]/20">
            Sovereign Command Console
          </span>
        </div>

        {/* Center Live SOC Threat Score Pill */}
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
              Live Telemetry
            </span>
          </div>
          <span className="h-3 w-px bg-slate-300 dark:bg-slate-700"></span>
          <ThreatScoreBadge
            severity={stats.security_posture}
            score={stats.threat_index / 100}
            size="sm"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Controlled What-If Scenario Sandbox Button */}
          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">What-If Sandbox</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0B1728]" />}
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.full_name || user.username}
                </span>
                <span className="text-[10px] font-mono text-[#0B4EA2] dark:text-cyan-400 font-semibold">
                  {user.role} &bull; L{user.clearance_level || 5}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer"
                title="Logout Session"
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

export default Navbar;
