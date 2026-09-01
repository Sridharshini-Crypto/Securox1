import React, { useState, useEffect } from 'react';
import { 
  TrafficCone, AlertTriangle, ShieldCheck, Siren, RefreshCw, 
  CheckCircle2, Play, Sliders, Zap, MapPin, Eye, Lock
} from 'lucide-react';
import { api } from '../context/AuthContext';
import { ThreatScoreBadge } from '../components/ThreatScoreBadge';

export const TrafficManagementPage = () => {
  const [signals, setSignals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [targetState, setTargetState] = useState('ALL_RED');
  const [processing, setProcessing] = useState(false);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const resp = await api.get('/traffic/signals');
      setSignals(resp.data.signals);
      setSummary(resp.data.grid_summary);
      if (resp.data.signals.length > 0 && !selectedSignal) {
        setSelectedSignal(resp.data.signals[0]);
      }
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to retrieve traffic signals grid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const handleOverrideSignal = async (e) => {
    e.preventDefault();
    if (!selectedSignal) return;

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const resp = await api.post('/traffic/override-signal', {
        intersection_code: selectedSignal.intersection_code,
        target_state: targetState,
        automated_mode: false
      });
      setActionSuccess(`Intersection ${selectedSignal.name} overridden to ${targetState}`);
      fetchSignals();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Override failed: Access Denied or Step-Up verification required.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTriggerEmergencyCorridor = async () => {
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const resp = await api.post('/traffic/emergency-corridor', {
        corridor_name: 'Downtown Trauma Center Priority Route',
        affected_intersections: ['INT-001', 'INT-003'],
        duration_minutes: 15
      });
      setActionSuccess('Emergency Corridor Active! Priority green wave dispatched to intersections.');
      fetchSignals();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to activate emergency corridor.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              CRITICAL LEVEL 4 INFRASTRUCTURE
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <TrafficCone className="w-6 h-6 text-amber-500" />
            <span>Smart City Traffic Grid & Emergency Signal Control</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitored municipal intersection network. All manual overrides are strictly evaluated under Zero-Trust ABAC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={processing}
            onClick={handleTriggerEmergencyCorridor}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            <span>Emergency Ambulance Corridor</span>
          </button>

          <button
            type="button"
            onClick={fetchSignals}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid Overview Metrics */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Monitored Intersections</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{summary.total_intersections}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Manual Overrides</span>
            <div className="text-2xl font-black text-amber-500 mt-1 font-mono">{summary.manual_overrides_active}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Corridors Active</span>
            <div className="text-2xl font-black text-rose-500 mt-1 font-mono">{summary.emergency_corridors_active}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Avg Congestion</span>
            <div className="text-2xl font-black text-blue-500 mt-1 font-mono">{summary.average_congestion_percent}%</div>
          </div>
        </div>
      )}

      {/* Main Dual Grid: Signal Cards + Manual Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Intersection Grid Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Intersection Grid Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {signals.map((sig) => {
              const isSelected = selectedSignal && selectedSignal.intersection_code === sig.intersection_code;
              return (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => setSelectedSignal(sig)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
                      {sig.intersection_code}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      sig.current_state === 'ALL_RED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      sig.current_state === 'EMERGENCY_OVERRIDE' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {sig.current_state}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {sig.name}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{sig.district}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Congestion: {sig.congestion_level}%</span>
                    <span className={sig.automated_mode ? 'text-emerald-500' : 'text-amber-500 font-bold'}>
                      {sig.automated_mode ? 'AI Cycle' : 'Manual Lock'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Manual Override Console (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Signal Override Console
                </h3>
              </div>
              <span className="text-xs font-mono text-rose-500 font-bold">
                Level 4 Clearance
              </span>
            </div>

            {selectedSignal ? (
              <form onSubmit={handleOverrideSignal} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-mono block mb-1">Target Intersection</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {selectedSignal.intersection_code} &bull; {selectedSignal.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-mono block mb-1">Signal State Directive</label>
                  <select
                    value={targetState}
                    onChange={(e) => setTargetState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  >
                    <option value="GREEN_NORTH_SOUTH">GREEN_NORTH_SOUTH (Cycle Corridor N/S)</option>
                    <option value="GREEN_EAST_WEST">GREEN_EAST_WEST (Cycle Corridor E/W)</option>
                    <option value="ALL_RED">ALL_RED (Full Intersection Lockdown)</option>
                    <option value="EMERGENCY_OVERRIDE">EMERGENCY_OVERRIDE (Priority Siren Wave)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>ABAC Policy Notice:</strong> Unauthorized override attempts by non-traffic accounts will be immediately blocked and dispatched as Critical Securox Events.
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Dispatch Signal State Override</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Select an intersection from the grid to configure overrides.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
            Audit logging: Cryptographically chained SHA-256 ledger.
          </div>
        </div>

      </div>

    </div>
  );
};

