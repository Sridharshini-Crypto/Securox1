import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldAlert, X, Play, RefreshCw, Terminal, CheckCircle2,
  Lock, Globe, AlertTriangle, ShieldCheck, DollarSign, TrafficCone,
  Flame, ArrowRight, Shield, Activity, Radio, ChevronDown, ChevronUp,
  Cpu, MapPin, Gauge, Database
} from 'lucide-react';
import { api } from '../context/AuthContext';
import { ThreatScoreBadge } from './ThreatScoreBadge';

export const AttackSimulatorModal = ({ isOpen, onClose }) => {
  const [runningId, setRunningId] = useState(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [stagesProgress, setStagesProgress] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'SCENARIO_FLAGSHIP_CHAIN',
      name: '🔥 Flagship: Multi-Stage Cyber Attack Chain',
      icon: Flame,
      color: 'rose',
      desc: 'Master End-to-End Flow: Admin login → Unrecognized device → Haversine geovelocity calculation → Step-up challenge → Privilege escalation attempt → Traffic API override → Sliding-window rate burst → Isolation Forest anomaly detection → Structured Securox SIEM event.',
      type: 'Full 8-Stage Attack Chain',
      isFlagship: true,
      stagesCount: 8
    },
    {
      id: 'SCENARIO_NORMAL',
      name: 'Baseline Administrative Access',
      icon: ShieldCheck,
      color: 'emerald',
      desc: 'Admin logs in from trusted ThinkPad hardware inside Austin HQ network. Isolation Forest evaluates normal parameters (Score < 0.20).',
      type: 'Normal Baseline',
      isFlagship: false,
      stagesCount: 1
    },
    {
      id: 'SCENARIO_BRUTE_FORCE',
      name: 'Credential Stuffing & Auto-Lockout',
      icon: Lock,
      color: 'rose',
      desc: 'Botnet fires 5 rapid failed logins from Tor node. Increments real database failure counter and triggers 15-minute account lockout.',
      type: 'Authentication Threat',
      isFlagship: false,
      stagesCount: 5
    },
    {
      id: 'SCENARIO_IMPOSSIBLE_TRAVEL',
      name: 'Impossible Travel & Geovelocity',
      icon: Globe,
      color: 'orange',
      desc: 'Session established from Amsterdam (8,124 km delta) 5 minutes after Austin activity (> 9,000 km/h calculated velocity).',
      type: 'Session Hijacking',
      isFlagship: false,
      stagesCount: 2
    },
    {
      id: 'SCENARIO_PRIVILEGE_ESCALATION',
      name: 'Privilege Crossing into Traffic Grid',
      icon: TrafficCone,
      color: 'rose',
      desc: 'Municipal Director account attempts unauthorized signal override on Downtown Grid. ABAC denies with HTTP 403.',
      type: 'Infrastructure Sabotage',
      isFlagship: false,
      stagesCount: 1
    },
    {
      id: 'SCENARIO_API_BURST',
      name: 'Sliding-Window Rate Burst (DoS)',
      icon: Zap,
      color: 'rose',
      desc: 'Script fires rapid signal overrides against Gateway API. Measured by live sliding-window rate limiter.',
      type: 'API Velocity Anomaly',
      isFlagship: false,
      stagesCount: 1
    },
    {
      id: 'SCENARIO_TREASURY_FRAUD',
      name: 'High-Value Treasury Exfiltration',
      icon: DollarSign,
      color: 'amber',
      desc: 'Attempt to disburse $150,000 without executive biometric clearance. Zero-trust financial policy halts transaction.',
      type: 'Financial Policy Gate',
      isFlagship: false,
      stagesCount: 1
    }
  ];

  const handleRunScenario = async (scId) => {
    setRunningId(scId);
    setLastResult(null);
    setErrorMsg(null);
    setStagesProgress([]);
    setActiveStageIndex(0);
    setExpandedStage(null);

    try {
      const resp = await api.post('/simulator/trigger', {
        scenario_id: scId
      });
      const data = resp.data;

      if (data.stages_executed && data.stages_executed.length > 0) {
        // Step-by-step progression animation
        const rawStages = data.stages_executed;
        for (let i = 0; i < rawStages.length; i++) {
          setActiveStageIndex(i);
          setStagesProgress(prev => [...prev, rawStages[i]]);
          // Small realistic progression delay
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      }

      setLastResult(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Scenario execution failed');
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Realistic Cyber Attack Simulation Platform
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Event-Driven
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  LANL ML Model
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every scenario executes through actual backend auth, geovelocity calculation, sliding-window rate tracking, ABAC policy, and Isolation Forest ML scoring.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scenario Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isRunning = runningId === sc.id;

              return (
                <div
                  key={sc.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    sc.isFlagship
                      ? 'md:col-span-2 lg:col-span-3 bg-gradient-to-r from-rose-50/60 via-purple-50/40 to-blue-50/60 dark:from-rose-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-rose-500/30 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          sc.isFlagship ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {sc.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        {sc.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {sc.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {sc.stagesCount} {sc.stagesCount === 1 ? 'Event Stage' : 'Sequential Stages'}
                    </span>

                    <button
                      type="button"
                      disabled={!!runningId}
                      onClick={() => handleRunScenario(sc.id)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer ${
                        sc.isFlagship
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Simulating...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Execute Attack</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Live Step-by-Step Attack Progression Timeline */}
          {(runningId || stagesProgress.length > 0) && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono">
                    Live Event-Driven Attack Execution Timeline
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">
                    Stage {stagesProgress.length} / {lastResult?.total_stages || 8}
                  </span>
                  {runningId ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-1 text-[10px]">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Executing</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Complete</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Sequential Progression Steps */}
              <div className="space-y-3">
                {stagesProgress.map((stg, idx) => {
                  const isExpanded = expandedStage === idx;
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all text-xs font-mono"
                    >
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedStage(isExpanded ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-[11px]">
                            {stg.stage || idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-100 block font-sans text-xs">
                              {stg.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {stg.details}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                            {stg.status}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expandable Technical Telemetry Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1.5 bg-slate-900/60 p-3 rounded-xl">
                          {stg.calculated_velocity_kmh && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Calculated Velocity:</span>
                              <span className="text-rose-400 font-bold">{stg.calculated_velocity_kmh.toLocaleString()} km/h (Physically Impossible)</span>
                            </div>
                          )}
                          {stg.distance_km && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Haversine Distance:</span>
                              <span>{stg.distance_km.toLocaleString()} km ({stg.prev_location} → {stg.current_location})</span>
                            </div>
                          )}
                          {stg.measured_requests_per_min && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Sliding Window Rate:</span>
                              <span className="text-rose-400 font-bold">{stg.measured_requests_per_min} req/min (Threshold: 30)</span>
                            </div>
                          )}
                          {stg.anomaly_score && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Isolation Forest Score:</span>
                              <span className="text-rose-400 font-bold">{stg.anomaly_score} ({stg.severity?.toUpperCase()})</span>
                            </div>
                          )}
                          {stg.event_id && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Securox Event ID:</span>
                              <span className="text-cyan-400 font-bold">{stg.event_id}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Timestamp:</span>
                            <span>{stg.timestamp}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Final System Reaction Box */}
              {lastResult && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-rose-300 block font-sans">
                      Zero-Trust Gateway Enforcement Verdict:
                    </span>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                      {lastResult.system_reaction}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Securox Event-Driven Simulator v1.1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close Sandbox
          </button>
        </div>

      </div>
    </div>
  );
};
