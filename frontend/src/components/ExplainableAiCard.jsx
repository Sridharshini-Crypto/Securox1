import React from 'react';
import { Cpu, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export const ExplainableAiCard = ({ anomalyScore = 0.0, evidence = [], featureBreakdown = null, contributingSignals = null, mitigation = null }) => {
  const breakdown = contributingSignals || featureBreakdown;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Isolation Forest Anomaly Intelligence
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contributing Signals & Outlier Evidence Attribution
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono uppercase text-slate-400">Anomaly Index</div>
          <div className={`text-lg font-mono font-bold ${
            anomalyScore >= 0.7 ? 'text-rose-600 dark:text-rose-400' :
            anomalyScore >= 0.4 ? 'text-amber-600 dark:text-amber-400' :
            'text-emerald-600 dark:text-emerald-400'
          }`}>
            {(anomalyScore * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Structured Evidence Tags */}
      <div className="mt-4">
        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2 font-mono">
          Securox Anomaly Evidence Vector
        </span>
        <div className="flex flex-wrap gap-1.5">
          {evidence && evidence.length > 0 ? (
            evidence.map((ev, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                {ev}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">No anomaly flags triggered. Telemetry is nominal.</span>
          )}
        </div>
      </div>

      {/* Contributing Signals Breakdown Table */}
      {breakdown && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2 font-mono">
            Contributing Signals (Telemetry Z-Score Deviations)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(breakdown).map(([feat, details]) => {
              const isOutlier = details.is_outlier;
              return (
                <div 
                  key={feat} 
                  className={`p-2 rounded border text-xs ${
                    isOutlier 
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-300 font-medium' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="truncate capitalize font-mono text-[11px]">{feat.replace(/_/g, ' ')}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold font-mono">{details.value}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isOutlier ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      z: {details.z_score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Automated Policy Mitigation */}
      {mitigation && (
        <div className="mt-4 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs">
          <span className="text-blue-700 dark:text-blue-400 font-medium">Policy Action:</span>
          <span className="font-mono font-bold text-blue-900 dark:text-blue-200">{mitigation}</span>
        </div>
      )}
    </div>
  );
};

