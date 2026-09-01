import React from 'react';

export const ThreatScoreBadge = ({ severity = 'normal', score = null, size = 'md' }) => {
  const sev = (severity || 'normal').toLowerCase();

  const colorMap = {
    normal: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'NORMAL'
    },
    elevated: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
      label: 'ELEVATED'
    },
    high: {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/30',
      dot: 'bg-orange-500',
      label: 'HIGH'
    },
    critical: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500 animate-ping',
      label: 'CRITICAL'
    }
  };

  const style = colorMap[sev] || colorMap.normal;
  const isSmall = size === 'sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${
      isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    }`}>
      <span className="relative flex h-2 w-2">
        {sev === 'critical' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`}></span>
      </span>
      <span>{style.label}</span>
      {score !== null && (
        <span className="opacity-80 font-normal pl-1 border-l border-current">
          {(score * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
};

