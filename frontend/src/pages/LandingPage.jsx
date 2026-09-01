import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Cpu, Globe, Building2, TrafficCone, DollarSign, 
  Activity, CheckCircle2, ArrowRight, Server, KeyRound, Fingerprint,
  Radio, HardDrive, FileCheck, Layers, Sparkles, UserCheck, ShieldAlert,
  Database, Network, Award, Zap, AlertTriangle, ChevronRight, Eye,
  Sliders, ShieldCheck, Terminal, Compass, RefreshCw, BarChart2
} from 'lucide-react';
import { IndiaNationalEmblem } from '../components/IndiaNationalEmblem';
import { SecuroxLogo } from '../components/SecuroxLogo';
import { useTheme } from '../context/ThemeContext';
import { api } from '../context/AuthContext';

export const LandingPage = ({ onEnterLogin, onEnterRegister }) => {
  const { isDark, toggleTheme } = useTheme();

  // Real backend telemetry stats
  const [backendHealth, setBackendHealth] = useState({
    pipelineActive: true,
    modelTrained: true,
    totalEvents: 12,
    treesCount: 150,
    windowsCount: 73287,
    threatIndex: 12.5,
    contamination: 0.20
  });

  // Active hover node in the Hero Infrastructure Topology
  const [activeNodeKey, setActiveNodeKey] = useState('TRAFFIC');
  
  // Real-time animation cycle states
  const [telemetryPhase, setTelemetryPhase] = useState(0);
  const [activeIncidentPulse, setActiveIncidentPulse] = useState(false);

  // Fetch real backend health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const [mlRes, statsRes] = await Promise.all([
          api.get('/ml/status').catch(() => null),
          api.get('/security/stats').catch(() => null)
        ]);

        if (mlRes?.data) {
          setBackendHealth(prev => ({
            ...prev,
            pipelineActive: mlRes.data.is_trained,
            modelTrained: mlRes.data.is_trained,
            treesCount: mlRes.data.model_hyperparameters?.n_estimators || 150,
            windowsCount: mlRes.data.baseline_entity_windows || 73287,
            contamination: mlRes.data.model_hyperparameters?.contamination || 0.20
          }));
        }

        if (statsRes?.data) {
          setBackendHealth(prev => ({
            ...prev,
            totalEvents: statsRes.data.counts?.total_security_events || 14,
            threatIndex: statsRes.data.threat_index || 12.5
          }));
        }
      } catch (err) {
        console.debug("Landing telemetry sync notice:", err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry phase cycling animation
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryPhase(prev => (prev + 1) % 5);
    }, 3200);

    // Periodic threat simulation pulse
    const incidentTimer = setInterval(() => {
      setActiveIncidentPulse(true);
      setTimeout(() => setActiveIncidentPulse(false), 2400);
    }, 9000);

    return () => {
      clearInterval(timer);
      clearInterval(incidentTimer);
    };
  }, []);

  const telemetrySteps = [
    { label: "Original Dataset Ingestion", detail: "Streaming 350K records from dns.txt.gz & Data.csv", tag: "DATA_PIPELINE" },
    { label: "Temporal Entity Windowing", detail: "73,287 sliding windows with 7-D behavioral vectors", tag: "FEATURE_EXTRACTION" },
    { label: "Isolation Forest Evaluation", detail: "150 Ensemble partition trees scoring anomaly depth", tag: "ML_ANOMALY_CORE" },
    { label: "12-Factor ABAC Policy Gate", detail: "Validating clearance level, device trust & geovelocity", tag: "ZERO_TRUST_ENGINE" },
    { label: "SHA-256 Ledger Persistence", detail: "Cryptographic event chained to tamper-evident SIEM stream", tag: "AUDIT_VERIFIED" }
  ];

  const infrastructureNodes = [
    {
      id: 'ADMIN',
      title: 'Gov Administration',
      sector: 'Governance & Identity',
      status: 'Protected',
      clearance: 'Level 5 (Super Admin)',
      dataset: 'LANL Auth & Admin Logs',
      metrics: '350K DNS & Auth Events',
      capability: 'Privilege escalation & unauthorized role assignment detection',
      icon: Building2,
      coords: { x: '18%', y: '32%' },
      color: '#3B82F6'
    },
    {
      id: 'TRAFFIC',
      title: 'Smart Traffic Grid',
      sector: 'Critical Transportation',
      status: 'Protected',
      clearance: 'Level 4 (Traffic Controller)',
      dataset: 'CICIoV2024 / CAN-Bus (decimal/)',
      metrics: '62.6 MB CAN Arbitration Logs',
      capability: 'Vehicle CAN speed/RPM spoofing & signal grid DoS flood defense',
      icon: TrafficCone,
      coords: { x: '82%', y: '32%' },
      color: '#F59E0B'
    },
    {
      id: 'TREASURY',
      title: 'Sovereign Treasury',
      sector: 'Financial Vault',
      status: 'Guarded',
      clearance: 'Level 4 (Finance Officer)',
      dataset: 'Zero-Trust Financial Gate',
      metrics: 'Dual-Custody Cryptographic Gate',
      capability: 'High-value transfer exfiltration & unverified step-up blocking',
      icon: DollarSign,
      coords: { x: '24%', y: '80%' },
      color: '#10B981'
    },
    {
      id: 'MUNICIPAL',
      title: 'Municipal & OT',
      sector: 'Urban Infrastructure',
      status: 'Enforced',
      clearance: 'Level 3 (Director)',
      dataset: 'Modbus / SCADA Permitting Logs',
      metrics: 'Zoning & Operational Registry',
      capability: 'Industrial control sabotage & permit tampering prevention',
      icon: Server,
      coords: { x: '76%', y: '80%' },
      color: '#8B5CF6'
    }
  ];

  const activeNode = infrastructureNodes.find(n => n.id === activeNodeKey) || infrastructureNodes[1];

  const intelligenceDatasets = [
    {
      id: 'LANL_2015',
      name: 'Los Alamos National Laboratory (LANL) 2015',
      files: 'dns.txt.gz (176.5 MB) & redteam.txt.gz (4.8 KB)',
      role: 'Authentication & DNS Behavioral Anomaly Intelligence',
      records: '350,000 streamed records → 73,287 entity windows',
      badge: 'Active & Model Pretrained',
      features: 'Query frequency, unique destinations, destination entropy, fanout ratio, new destination velocity'
    },
    {
      id: 'UNSW_FLOW',
      name: 'UNSW-NB15 / Network Flow Intrusion Telemetry',
      files: 'Data.csv (187.2 MB) & Label.csv (895 KB)',
      role: 'API Burst, DoS, Exploits & Lateral Movement Defense',
      records: '76 numerical flow features mapped across 10 attack classes',
      badge: 'Flow Telemetry Ingested',
      features: 'TCP/IP packet inter-arrival, payload entropy, protocol jitter, rate bursts, exploit signatures'
    },
    {
      id: 'CICIOV_2024',
      name: 'CICIoV2024 / Smart City Traffic IoV CAN-Bus',
      files: 'dataset/decimal/ (6 CSV files, 62.6 MB)',
      role: 'Urban Traffic Signal Sabotage & CAN-Bus Defense',
      records: '8-byte CAN arbitration IDs, Speed & RPM spoofing',
      badge: 'Traffic Grid Ingested',
      features: 'Arbitration IDs, DATA_0..DATA_7 byte entropy, speed tampering deltas, signal override anomalies'
    },
    {
      id: 'MODBUS_OT',
      name: 'Critical Infrastructure SCADA / Modbus OT',
      files: 'Municipal & Industrial Control System Logs',
      role: 'Public Water, Power & Zoning Registry Protection',
      records: 'Function code telemetry & coil read/write audits',
      badge: 'ABAC Guarded',
      features: 'Substation telemetry, coil state overrides, clearance level constraints, zoning perimeter limits'
    },
    {
      id: 'API_BURST',
      name: 'Sliding-Window API Rate & DoS Telemetry',
      files: 'In-Memory Sliding Window & Database Access Logs',
      role: 'Credential Stuffing & Gateway Flood Mitigation',
      records: 'Real-time sliding window (30 calls/min threshold)',
      badge: 'Active Guard',
      features: 'Call velocity per user/IP, failed attempt rate, automated 15-minute account lock trigger'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070C18] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* 1. Sovereign Tricolour Accent Line */}
      <div className="h-1.5 w-full flex sticky top-0 z-50">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-[#FFFFFF] border-y border-slate-200 dark:border-slate-800"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* 2. Official Government Header */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#091022]/95 backdrop-blur-md sticky top-1.5 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Government of India Identity Area */}
          <div className="flex items-center gap-3.5">
            <IndiaNationalEmblem size={44} showText={false} />
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                  Government of India
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 font-bold hidden md:inline-block">
                  NATIONAL CRITICAL INFRASTRUCTURE DEFENSE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                National Critical Information Infrastructure Protection Centre (NCIIPC) &bull; CERT-In
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <SecuroxLogo size={26} />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-mono cursor-pointer"
              title="Toggle Color Scheme"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              type="button"
              onClick={onEnterLogin}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Officer Login</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION with LIVE SECUROX INTELLIGENCE NETWORK BACKGROUND */}
      <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/40 via-white to-slate-50 dark:from-[#091124] dark:via-[#070C18] dark:to-[#070C18]">
        
        {/* Subtle Animated Background Grid & Network Telemetry Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gov-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? "#1E293B" : "#E2E8F0"} strokeWidth="0.8" />
              </pattern>
              
              {/* Radial 24-Spoke Ashoka Chakra Background Grid */}
              <radialGradient id="ashokaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isDark ? "#38BDF8" : "#3B82F6"} stopOpacity="0.15" />
                <stop offset="100%" stopColor={isDark ? "#0284C7" : "#1D4ED8"} stopOpacity="0.0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#gov-grid)" />
            
            {/* Background 24-spoke subtle chakra geometry behind hero */}
            <g transform="translate(680, 260)" opacity="0.35">
              <circle cx="0" cy="0" r="190" fill="url(#ashokaGlow)" stroke={isDark ? "#38BDF8" : "#3B82F6"} strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="0" cy="0" r="120" fill="none" stroke={isDark ? "#0EA5E9" : "#2563EB"} strokeWidth="0.8" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={190 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={190 * Math.sin((i * 15 * Math.PI) / 180)}
                  stroke={isDark ? "#0284C7" : "#60A5FA"}
                  strokeWidth="0.6"
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Hero Column: Mandate, Status Bar & Direct CTAs (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* Sovereign Security Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/25 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-400 text-xs font-mono font-bold tracking-wide shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                <span>SECURING SOVEREIGN DIGITAL INFRASTRUCTURE</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                  SECURING SOVEREIGN<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-400 dark:to-blue-500">
                    DIGITAL INFRASTRUCTURE
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  AI-driven zero-trust security for government systems, critical infrastructure, smart cities, and digital services powered by continuous 12-factor Attribute-Based Access Control and multi-dataset Isolation Forest anomaly intelligence.
                </p>
              </div>

              {/* Live Technical Status Bar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    LIVE DEFENSE TELEMETRY
                  </span>
                  <span className="text-blue-600 dark:text-cyan-400">
                    {backendHealth.windowsCount.toLocaleString()} PRETRAINED WINDOWS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ORIGINAL DATA ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">AI ENGINE ONLINE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ZERO-TRUST GUARD</span>
                  </div>
                </div>
              </div>

              {/* Primary Call-to-Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={onEnterLogin}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Access SOC Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onEnterRegister && (
                  <button
                    type="button"
                    onClick={onEnterRegister}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Register Official Identity</span>
                  </button>
                )}
              </div>

              {/* Dynamic Technical Phase Indicator */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-blue-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                  {telemetrySteps[telemetryPhase].tag}
                </span>
                <span className="text-[11px] truncate">
                  &bull; {telemetrySteps[telemetryPhase].label}: {telemetrySteps[telemetryPhase].detail}
                </span>
              </div>

            </div>

            {/* Right Hero Column: LIVE INFRASTRUCTURE TOPOLOGY VISUALIZATION (6 cols) */}
            <div className="lg:col-span-6">
              <div className="relative p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B1428] border border-slate-200 dark:border-slate-800/90 shadow-xl space-y-6">
                
                {/* Header of Topology Panel */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-white">
                      Live Infrastructure Topology
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CORRELATION ACTIVE
                  </span>
                </div>

                {/* Central Securox AI Correlation Engine Hub */}
                <div className="text-center space-y-2">
                  <div className="relative inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white shadow-lg shadow-blue-500/20 border border-blue-400/40">
                    <Cpu className={`w-6 h-6 ${activeIncidentPulse ? 'text-amber-300 animate-spin' : 'text-cyan-300'}`} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono uppercase text-slate-900 dark:text-white tracking-wide">
                      SECUROX AI CORRELATION ENGINE
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400">
                      150-Tree Isolation Forest &bull; 7-D Statistical Deviation Matrix
                    </p>
                  </div>
                </div>

                {/* 4 Connected Infrastructure Sector Nodes Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {infrastructureNodes.map((node) => {
                    const Icon = node.icon;
                    const isSelected = node.id === activeNodeKey;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setActiveNodeKey(node.id)}
                        onMouseEnter={() => setActiveNodeKey(node.id)}
                        className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/30' 
                            : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {node.status}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {node.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {node.sector}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Node Telemetry & Provenance Drawer */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-left space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      {activeNode.title} Sector
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 font-semibold">
                      {activeNode.clearance}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Dataset Source</span>
                      <strong className="text-slate-800 dark:text-slate-200">{activeNode.dataset}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Detection Capability</span>
                      <strong className="text-slate-800 dark:text-slate-200">{activeNode.capability}</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SECTION 2: CRITICAL INFRASTRUCTURE DOMAINS UNDER PROTECTION */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-400">
            NATIONAL CRITICAL INFRASTRUCTURE DOMAINS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Integrated Defense Across Sovereign Sectors
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Every critical sector is continuously monitored with 12-factor ABAC subject-resource validation and real-time behavioral ML scoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {infrastructureNodes.concat([
            {
              id: 'AI_CORE',
              title: 'AI Anomaly Intelligence Core',
              sector: 'Zero-Day Detection',
              status: 'Trained (150 Trees)',
              clearance: 'Level 5 Clearance',
              dataset: 'LANL dns.txt.gz & redteam.txt.gz',
              capability: '7-D feature extraction & standardized Z-score outlier attribution',
              icon: Cpu,
              color: '#06B6D4'
            },
            {
              id: 'IDENTITY',
              title: 'Zero-Trust Identity & Geovelocity',
              sector: 'Access Governance',
              status: 'Continuous Guard',
              clearance: 'FIDO2 / WebAuthn Passkey',
              dataset: 'Adaptive Geovelocity Engine',
              capability: 'Haversine travel velocity calculation & adaptive step-up challenge',
              icon: Fingerprint,
              color: '#3B82F6'
            }
          ]).map((sec) => {
            const Icon = sec.icon;
            return (
              <div 
                key={sec.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sec.clearance}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {sec.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {sec.capability}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Zero-Trust Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{sec.dataset}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SECTION 3: SECURITY INTELLIGENCE FOUNDATION (DATASET PIPELINE CONDUIT) */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-mono font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>SECURITY INTELLIGENCE FOUNDATION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Trained on Authentic Cybersecurity Datasets
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              The detection core operates directly on statistical features extracted from authentic datasets on disk. Zero synthetic data.
            </p>
          </div>

          {/* 5-Conduit Dataset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intelligenceDatasets.map((ds) => (
              <div 
                key={ds.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-blue-600 dark:text-cyan-400">
                      {ds.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                      {ds.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {ds.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {ds.role}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono space-y-1 text-slate-700 dark:text-slate-300">
                    <div><strong>Files:</strong> {ds.files}</div>
                    <div><strong>Extraction:</strong> {ds.records}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[11px] font-mono text-teal-600 dark:text-teal-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Feeds Securox AI Core</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. SOVEREIGN GATEWAY ACCESS COMMAND CARD */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-12 lg:p-14 text-center space-y-6">
          
          {/* Subtle Ashoka Watermark Background */}
          <div className="absolute -right-12 -bottom-12 opacity-5 dark:opacity-10 pointer-events-none">
            <IndiaNationalEmblem size={240} showText={false} />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/25 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-400 text-xs font-mono font-bold tracking-wide">
            <Award className="w-3.5 h-3.5" />
            <span>SOVEREIGN COMMAND READY &bull; LEVEL 1-5 CLEARANCE</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Access National Security Command Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Authorized administrative officers, traffic grid controllers, municipal directors, and finance officials may authenticate using enrolled FIDO2 WebAuthn hardware passkeys or departmental clearance credentials.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onEnterLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Official Gateway Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onEnterRegister && (
              <button
                type="button"
                onClick={onEnterRegister}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>Register New Official Account</span>
              </button>
            )}
          </div>

          {/* Security Compliance Micro-Bar */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              256-Bit TLS &amp; SHA-256 Ledger
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              NIC &amp; CERT-In Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              FIDO2 WebAuthn Enforced
            </span>
          </div>

        </div>
      </section>

      {/* 8. Sovereign National Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A14] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <IndiaNationalEmblem size={24} showText={false} />
            <span>Government of India &bull; Securox Sovereign Cyber Defense Architecture v1.1</span>
          </div>

          <div>
            Compliant with Digital India &bull; CERT-In &bull; NIST SP 800-207 Zero-Trust Standards
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
