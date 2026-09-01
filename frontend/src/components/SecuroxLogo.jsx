import React from 'react';
import { Shield } from 'lucide-react';

export const SecuroxLogo = ({ size = 28, showText = true, showSubtitle = true, className = '' }) => {
  const numSize = typeof size === 'number' ? size : size === 'sm' ? 24 : size === 'lg' ? 40 : 28;

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* High-Tech Shield Icon */}
      <div 
        style={{ width: numSize, height: numSize }} 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/25 shrink-0 border border-blue-400/30"
      >
        <Shield style={{ width: numSize * 0.58, height: numSize * 0.58 }} className="fill-current/20 stroke-white" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400"></span>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white font-sans">
              SECUROX
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 font-bold uppercase">
              ZERO-TRUST
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 tracking-tight">
              Gov Defense v1.1
            </span>
          )}
        </div>
      )}
    </div>
  );
};

