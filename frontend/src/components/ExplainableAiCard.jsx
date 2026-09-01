import React from 'react';
import { Cpu, AlertTriangle, CheckCircle, ShieldCheck, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';

export const ExplainableAiCard = ({ selectedEvent, onOpenDeepDive, anomalyScore, evidence, contributingSignals, mitigation }) => {
  // Support both direct event object and standalone props
  const score = selectedEvent ? selectedEvent.anomaly_score : (anomalyScore || 0.0);
  const evList = selectedEvent ? (selectedEvent.evidence || []) : (evidence || []);
  const signals = selectedEvent?.contributing_signals || contributingSignals;
  const policyAction = selectedEvent ? selectedEvent.mitigation_action : mitigation;
  const incidentId = selectedEvent?.event_id || (selectedEvent?.id ? String(selectedEvent.id) : null);
  const isSim = selectedEvent?.is_simulated || selectedEvent?.origin_badge?.includes('SIMULATED');

  return (
    <div className="bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Model-Generated Anomaly Assessment
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Isolation Forest (6-D Clean Behavioral Core)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">RISK SCORE</span>
          <span className={`text-lg font-mono font-black ${
            score >= 0.7 ? 'text-rose-600 dark:text-rose-400' :
            score >= 0.4 ? 'text-amber-600 dark:text-amber-400' :
            'text-emerald-600 dark:text-emerald-400'
          }`}>
            {(score * 100).toFixed(1)}/100
          </span>
        </div>
      </div>

      {/* Origin Badge */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500 dark:text-slate-400">Source Stream:</span>
        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
          isSim 
            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
        }`}>
          {isSim ? 'CONTROLLED WHAT-IF SIMULATION' : 'LIVE PRODUCTION TELEMETRY'}
        </span>
      </div>

      {/* Structured Evidence Tags */}
      <div>
        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-2 font-mono">
          Anomaly Contributing Signals (Features)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {evList && evList.length > 0 ? (
            evList.map((ev, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                {typeof ev === 'object' ? (ev.feature_name || JSON.stringify(ev)) : ev}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">Telemetry is nominal. No anomaly flags triggered.</span>
          )}
        </div>
      </div>

      {/* Detailed Signals / Z-Scores */}
      {signals && Array.isArray(signals) && signals.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block font-mono">
            Empirical Baseline Deviations (Z-Scores)
          </span>
          <div className="space-y-1.5">
            {signals.map((sig, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">{sig.feature_name || sig}</strong>
                  {sig.interpretation && (
                    <div className="text-[10px] text-slate-500">{sig.interpretation}</div>
                  )}
                </div>
                {sig.empirical_z_score && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                    {sig.empirical_z_score > 0 ? `+${sig.empirical_z_score}` : sig.empirical_z_score}&sigma;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automated Mitigation */}
      {policyAction && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs font-mono">
          <span className="text-blue-700 dark:text-cyan-400 font-medium">Policy Action:</span>
          <span className="font-bold text-blue-900 dark:text-cyan-200 uppercase">{policyAction}</span>
        </div>
      )}

      {/* Deep-Dive Investigation Action Button */}
      {incidentId && onOpenDeepDive && (
        <button
          onClick={() => onOpenDeepDive(incidentId)}
          className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Full Incident Investigation</span>
        </button>
      )}

    </div>
  );
};

export default ExplainableAiCard;
