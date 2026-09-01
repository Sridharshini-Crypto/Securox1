import React, { useState } from 'react';

export const IndiaNationalEmblem = ({ size = 44, showText = true, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const numSize = typeof size === 'number' ? size : size === 'sm' ? 32 : size === 'lg' ? 64 : 44;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Authentic Indian State Emblem Medallion with Tricolour (Saffron, White, Green) Ring */}
      <div 
        style={{ width: numSize, height: numSize }} 
        className="relative flex items-center justify-center shrink-0 rounded-full p-[2px] bg-gradient-to-b from-[#FF9933] via-white to-[#138808] shadow-md shadow-amber-500/10"
      >
        {/* Inner Black/Navy Medallion Base */}
        <div className="w-full h-full rounded-full bg-[#0B1220] overflow-hidden flex items-center justify-center relative border border-amber-400/40">
          {!imgError ? (
            <img 
              src="/emblem.png" 
              alt="State Emblem of India - Satyameva Jayate"
              className="w-full h-full object-cover transform scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Fallback Vector Emblem */
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full p-1 drop-shadow-sm" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="2" />
              <circle cx="50" cy="50" r="20" stroke="#FF9933" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="4" fill="#138808" />
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                return (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={50 + 20 * Math.cos((angle * Math.PI) / 180)}
                    y2={50 + 20 * Math.sin((angle * Math.PI) / 180)}
                    stroke="#D4AF37"
                    strokeWidth="1.2"
                  />
                );
              })}
            </svg>
          )}

          {/* Subtle Tricolour Radial Highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#138808]/15 via-transparent to-[#FF9933]/20 pointer-events-none"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white font-sans">
              भारत सरकार
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-sans">
              &bull; GOVT OF INDIA
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
            <span className="text-[#FF9933]">सत्यमेव</span>
            <span className="text-slate-700 dark:text-slate-200">जयते</span>
            <span className="text-[#138808]">&bull; SATYAMEVA JAYATE</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaNationalEmblem;
