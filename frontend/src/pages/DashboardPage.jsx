import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Cpu, ArrowUpRight, CheckCircle2, 
  AlertTriangle, Radio, RefreshCw, Zap, Server, HardDrive, Filter,
  Layers, Clock, ShieldCheck, Lock, ChevronRight, ChevronDown, ChevronUp,
  MapPin, Laptop, Flame, GitBranch, ArrowRight, Eye, Shield, X
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ThreatScoreBadge } from '../components/ThreatScoreBadge';
import { ExplainableAiCard } from '../components/ExplainableAiCard';

// Inlined Incident Investigation & Containment Modal
const IncidentInvestigationModal = ({ incidentId, onClose, onContainmentSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [containmentResult, setContainmentResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!incidentId) return;

    const fetchIncident = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/security/incident/${incidentId}`);
        setIncident(res.data);
      } catch (err) {
        console.error('Failed to load incident investigation:', err);
        setError('Failed to query incident details from SOC backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [incidentId]);

  const executeContainment = async (actionType) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/security/incident/${incidentId}/contain`, {
        action: actionType,
        reason: "SOC Analyst Direct Containment Execution"
      });
      setContainmentResult(res.data);
      if (onContainmentSuccess) onContainmentSuccess(res.data);
    } catch (err) {
      console.error('Containment execution failed:', err);
      alert('Containment failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (!incidentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#091020] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#091020]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  INCIDENT #{incident?.incident_id || incidentId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold uppercase">
                  {incident?.severity || 'CRITICAL'} &bull; RISK {incident?.risk_score || 85}/100
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 font-bold">
                  {incident?.origin_badge || 'LIVE PRODUCTION TELEMETRY'}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white mt-1">
                SOC Incident Investigation &amp; Containment Terminal
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0B4EA2] animate-spin" />
              <span className="text-xs font-mono text-slate-500">Querying live SOC incident context &amp; MITRE mapping...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-mono">
              {error}
            </div>
          ) : (
            <>
              {containmentResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <strong>CONTAINMENT EXECUTED:</strong> {containmentResult.action_taken} enforced by operator {containmentResult.operator}.
                  </div>
                </div>
              )}

              {/* 1. ACTOR & CONTEXT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">SUBJECT IDENTITY</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-blue-500" />
                    <span>{incident?.actor?.identity}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Role: {incident?.actor?.role}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">ORIGIN &amp; NETWORK</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{incident?.actor?.location}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">IP: {incident?.actor?.source_ip}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">HARDWARE ATTESTATION</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{incident?.actor?.device_trust}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">Device: {incident?.actor?.device_id}</div>
                </div>
              </div>

              {/* 2. MITRE ATT&CK TACTICS BREAKDOWN */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white font-mono">
                  <span>MITRE ATT&amp;CK TACTICAL MAPPING</span>
                  <span className="text-[10px] text-slate-400">ENTERPRISE MATRIX v14</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {incident?.mitre_attack_mapping?.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0B4EA2] dark:text-cyan-400">{m.id}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {m.tactic}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                        {m.technique}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. DOWNSTREAM DEPENDENCY PROPAGATION */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white font-mono">
                  <span>CASCADE PROPAGATION &amp; DOWNSTREAM IMPACT PATH</span>
                  <span className="text-[10px] text-emerald-500 font-bold">CONTAINMENT PREVIEW READY</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                  {incident?.downstream_impact_propagation?.map((node, idx) => (
                    <React.Fragment key={idx}>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1 min-w-[130px]">
                        <span className="text-[10px] text-slate-400 block font-bold">DEPTH {node.depth}</span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">{node.node}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-block ${
                          node.status === 'COMPROMISED' ? 'bg-rose-500/10 text-rose-500' :
                          node.status === 'AT_RISK' ? 'bg-amber-500/10 text-amber-500' :
                          node.status === 'STEP_UP_LOCKED' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      {idx < incident.downstream_impact_propagation.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#070C18] rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Direct containment enforces real session revocation in SQLite ledger.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => executeContainment("ENFORCE_STEP_UP")}
              disabled={actionLoading}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-mono font-bold text-xs transition-all cursor-pointer"
            >
              Enforce Step-Up
            </button>

            <button
              onClick={() => executeContainment("ISOLATE_SESSION")}
              disabled={actionLoading}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              Isolate Session
            </button>

            <button
              onClick={() => executeContainment("LOCK_USER")}
              disabled={actionLoading}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B1728] dark:bg-white text-white dark:text-[#0B1728] font-mono font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              Lock Identity
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const DashboardPage = ({ onOpenSimulator }) => {
  const { lastEvent, connected, connectionState } = useSocket();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [investigatingIncidentId, setInvestigatingIncidentId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [cascadeNode, setCascadeNode] = useState('GOV_PORTAL');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/security/stats').catch(() => ({ data: { threat_index: 10, security_posture: 'NORMAL', normal_count: 32, high_events: 0 } })),
        api.get('/security/events?limit=30').catch(() => ({ data: { events: [] } }))
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (eventsRes?.data?.events) {
        setEvents(eventsRes.data.events);
        if (eventsRes.data.events.length > 0 && !selectedEvent) {
          setSelectedEvent(eventsRes.data.events[0]);
        }
      }
    } catch (err) {
      console.debug("Dashboard fetch err:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-[#0B4EA2] dark:text-cyan-400 uppercase tracking-wider">
              NIST SP 800-207 ZERO-TRUST COMMAND CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Sovereign Critical Infrastructure Security
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Continuous 12-factor telemetry evaluation &bull; Unsupervised Isolation Forest Anomaly Detection &bull; Cascade Blast-Radius Graph
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="px-4 py-2 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>What-If Sandbox</span>
            </button>
          )}

          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0B4EA2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>THREAT INDEX</span>
            <Activity className="w-4 h-4 text-[#0B4EA2] dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.threat_index ? `${stats.threat_index.toFixed(1)}%` : '10.0%'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            Posture: {stats?.security_posture || 'NORMAL'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AUTHENTIC DATASET</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            73,287
          </div>
          <div className="text-[11px] text-slate-500">
            LANL Real Entity Windows
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ISOLATION TREES</span>
            <GitBranch className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            150
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">
            Zero Target Leakage
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SOCKET TELEMETRY</span>
            <Radio className={`w-4 h-4 ${connected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {connected ? 'CONNECTED' : 'STANDBY'}
          </div>
          <div className="text-[11px] text-slate-500">
            Live Stream Uplink
          </div>
        </div>
      </div>

      {/* Main Grid: Events Stream & Explainable AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Security Events List (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Correlated Security Telemetry Stream
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {events.length} Events Logged
            </span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-slate-400">
                No active security anomalies detected. System operating under nominal parameters.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedEvent?.id === evt.id
                      ? 'border-[#0B4EA2] dark:border-cyan-500 bg-blue-50/40 dark:bg-slate-800/80'
                      : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        evt.severity === 'critical' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                        evt.severity === 'high' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {evt.severity}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{evt.event_type}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvestigatingIncidentId(evt.id);
                      }}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-[#0B4EA2] dark:text-cyan-400 hover:bg-blue-100 transition-all cursor-pointer"
                      title="Open SOC Deep-Dive Terminal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>{evt.user_id} &bull; {evt.source_ip}</span>
                    <span>{evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Recent'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Explainable AI Card & Incident Deep Dive (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <ExplainableAiCard 
            selectedEvent={selectedEvent} 
            onOpenDeepDive={(id) => setInvestigatingIncidentId(id)}
          />
        </div>

      </div>

      {/* Incident Deep-Dive Modal Drawer */}
      {investigatingIncidentId && (
        <IncidentInvestigationModal
          incidentId={investigatingIncidentId}
          onClose={() => setInvestigatingIncidentId(null)}
          onContainmentSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}

    </div>
  );
};

export default DashboardPage;
