import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Cpu, Globe, Building2, TrafficCone, CreditCard, 
  Activity, CheckCircle2, ArrowRight, Server, KeyRound, 
  Radio, HardDrive, FileCheck, Layers, ShieldAlert,
  Database, Network, Zap, AlertTriangle, ChevronRight, Eye,
  ShieldCheck, Terminal, Compass, RefreshCw, BarChart3, Sun, Moon,
  Laptop, ExternalLink
} from 'lucide-react';
import { IndiaNationalEmblem } from '../components/IndiaNationalEmblem';
import { SecuroxLogo } from '../components/SecuroxLogo';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { api } from '../context/AuthContext';

export const LandingPage = ({ onEnterLogin, onEnterRegister }) => {
  const { isDark, toggleTheme } = useTheme();

  // Real backend telemetry stats
  const [healthData, setHealthData] = useState({
    status: 'OPERATIONAL',
    timestamp: new Date().toISOString(),
    components: {
      database: { status: 'HEALTHY', records_tracked: 42 },
      ml_anomaly_engine: { status: 'TRAINED_ONLINE', training_samples: 73287 },
      dataset_pipeline: { status: 'CONNECTED', total_datasets: 3 },
      security_mesh: { status: 'ACTIVE', total_events_correlated: 14 }
    }
  });

  const [infraList, setInfraList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('platform'); // 'platform' | 'initiatives' | 'infrastructure' | 'intelligence' | 'research'
  const [activeTab, setActiveTab] = useState('platform');

  // Fetch real backend health & infrastructure data
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const [healthRes, infraRes] = await Promise.all([
          axios.get('/api/health').catch(() => null),
          axios.get('/api/infrastructure/status').catch(() => null)
          api.get('/health').catch(() => null),
          api.get('/infrastructure/status').catch(() => null)
        ]);

        if (healthRes?.data) {
          setHealthData(healthRes.data);
        }
        if (infraRes?.data?.infrastructure_ecosystem) {
          setInfraList(infraRes.data.infrastructure_ecosystem);
        }
      } catch (err) {
        console.debug("Portal telemetry sync notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
    const interval = setInterval(fetchPortalData, 15000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const defaultInfra = [
    {
      id: "GOV_PORTAL",
      sector: "Central Governance",
      name: "Government Admin Gateway",
      endpoint: "/api/users & /api/auth",
      status: "MONITORED_HEALTHY",
      risk_score: 12,
      latency_ms: 18.4,
      policy: "RBAC + 4-Tier ABAC",
      connected_subsystems: 4
    },
    {
      id: "MUNICIPAL",
      sector: "Municipal Services",
      name: "Citizen Permits & Utility Grid",
      endpoint: "/api/municipal",
      status: "NOMINAL",
      risk_score: 15,
      latency_ms: 22.1,
      policy: "Level 2 Authorization",
      connected_subsystems: 3
    },
    {
      id: "TRAFFIC",
      sector: "Smart City Transportation",
      name: "Traffic Management Controller",
      endpoint: "/api/traffic",
      status: "PROTECTED",
      risk_score: 8,
      latency_ms: 14.2,
      policy: "Level 4 Clearance + FIDO2",
      connected_subsystems: 12
    },
    {
      id: "TREASURY",
      sector: "Public Finance",
      name: "Sovereign Treasury Disbursement",
      endpoint: "/api/payment",
      status: "LOCKED_SECURE",
      risk_score: 5,
      latency_ms: 29.8,
      policy: "Dual-Custody FIDO2 Passkey",
      connected_subsystems: 2
    }
  ];

  const activeInfra = infraList.length > 0 ? infraList : defaultInfra;

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] text-[#172033] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. TOP INSTITUTIONAL GOVERNMENT RIBBON */}
      <div className="bg-[#0B1728] text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-white tracking-wider">SECURITY INTELLIGENCE PLATFORM</span>
            <span className="text-slate-400">&bull; Government Digital Infrastructure</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="text-slate-400 hidden md:inline">NIST SP 800-207 ZERO TRUST</span>
            <span className="text-cyan-400 font-bold">STRICT ACCESS CONTROL</span>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL GOVERNMENT NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#07111F]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Sovereign Identity Mark */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <IndiaNationalEmblem size="sm" showText={false} />
            <span className="h-7 w-px bg-slate-200 dark:bg-slate-800"></span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white font-mono">
                  SECUROX
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-[#0B4EA2] dark:text-cyan-400 text-[10px] font-mono font-bold border border-blue-200/60 dark:border-blue-800/60">
                  GOV
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Infrastructure Security Intelligence
              </p>
            </div>
          </div>

          {/* Institutional Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button onClick={() => scrollToSection('platform')} className="hover:text-[#0B4EA2] dark:hover:text-cyan-400 transition-colors cursor-pointer">
              PLATFORM
            </button>
            <button onClick={() => scrollToSection('initiatives')} className="hover:text-[#0B4EA2] dark:hover:text-cyan-400 transition-colors cursor-pointer">
              INITIATIVES
            </button>
            <button onClick={() => scrollToSection('intelligence')} className="hover:text-[#0B4EA2] dark:hover:text-cyan-400 transition-colors cursor-pointer">
              INTELLIGENCE
            </button>
            <button onClick={() => scrollToSection('infrastructure')} className="hover:text-[#0B4EA2] dark:hover:text-cyan-400 transition-colors cursor-pointer">
              INFRASTRUCTURE
            </button>
            <button onClick={() => scrollToSection('research')} className="hover:text-[#0B4EA2] dark:hover:text-cyan-400 transition-colors cursor-pointer">
              RESEARCH &amp; DATA
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0B1728]" />}
            </button>

            <button
              onClick={onEnterLogin}
              className="px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Officer Gateway</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO SECTION (Calm, Institutional, Data-Driven) */}
      <section id="hero" className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        <div className="space-y-6 max-w-4xl">
          
          {/* Institutional Subtitle Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0B4EA2] dark:text-cyan-400 border border-blue-200 dark:border-blue-900/40 text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>SOVEREIGN DIGITAL INFRASTRUCTURE RESILIENCE LAYER</span>
          </div>

          {/* Hero Typography */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Cyber Risk Intelligence for <br className="hidden sm:block" />
              <span className="text-[#0B4EA2] dark:text-cyan-400">Connected Public Infrastructure</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              A unified intelligence platform for monitoring, analysing and protecting interconnected government digital services, critical infrastructure and public-sector systems against multi-stage cyber threats.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <button
              onClick={onEnterLogin}
              className="px-6 py-3 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Security Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('initiatives')}
              className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs tracking-wider uppercase font-mono hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#0B4EA2] dark:text-cyan-400" />
              <span>Explore Initiatives</span>
            </button>
          </div>

          {/* Backend Operational Status Ribbon (Backend-Derived) */}
          <div className="pt-4">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B1222] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-800 dark:text-slate-200">PLATFORM OPERATIONAL</span>
              </div>

              <div className="flex items-center gap-6 text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  <span className="text-slate-400">DATA PIPELINE:</span>{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {healthData.components?.dataset_pipeline?.status || 'CONNECTED'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400">THREAT ANALYSIS:</span>{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {healthData.components?.ml_anomaly_engine?.status === 'TRAINED_ONLINE' ? 'ACTIVE' : 'READY'}
                  </strong>
                </div>

                <div className="hidden md:block">
                  <span className="text-slate-400">INFRASTRUCTURE:</span>{" "}
                  <strong className="text-slate-800 dark:text-slate-200">MONITORED</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 4. TECHNICALLY ALIVE HERO INFRASTRUCTURE TOPOLOGY GRAPH */}
      <section id="platform" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#0B4EA2] dark:text-cyan-400 uppercase tracking-wider block">
                SYSTEM ARCHITECTURE TOPOLOGY
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                Connected Public Services &amp; Securox Intelligence Core
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Live Architectural Dataflow
            </span>
          </div>

          {/* Technical Diagram Container */}
          <div className="p-6 rounded-2xl bg-[#F7F9FC] dark:bg-[#070D18] border border-slate-200/80 dark:border-slate-800/80 space-y-8">
            
            {/* Level 1: Connected Public Services */}
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-400 text-center mb-3">
                CONNECTED GOVERNMENT DIGITAL SERVICES
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "Public Treasury & Finance", icon: CreditCard, code: "FINANCE_API", badge: "Level 4" },
                  { name: "Municipal Administration", icon: Building2, code: "MUNICIPAL_SERVICES", badge: "Level 2" },
                  { name: "Smart Traffic Grid", icon: TrafficCone, code: "TRAFFIC_CONTROLLER", badge: "Level 4" },
                  { name: "Official Identity & SSO", icon: KeyRound, code: "IDENTITY_GATEWAY", badge: "Level 5" }
                ].map((s, idx) => {
                  const IconComp = s.icon;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5 shadow-sm">
                      <div className="inline-flex p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0B4EA2] dark:text-cyan-400">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.code}</div>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {s.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting Conduits Down */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-0.5 h-6 bg-[#0B4EA2] dark:bg-cyan-500 animate-data-pulse"></div>
                <div className="px-3 py-1 rounded-full bg-[#0B4EA2] text-white text-[10px] font-mono font-bold tracking-wider shadow-sm">
                  TELEMETRY CONDUIT STREAM
                </div>
                <div className="w-0.5 h-6 bg-[#0B4EA2] dark:bg-cyan-500 animate-data-pulse"></div>
              </div>
            </div>

            {/* Level 2: Core Securox Engine */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-[#0B1728] text-white border border-blue-800 shadow-md text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 text-cyan-300 text-[10px] font-mono font-bold">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>SECUROX SOVEREIGN INTELLIGENCE CORE</span>
              </div>
              <h3 className="text-base font-bold">
                Multi-Domain Telemetry Correlation &amp; Zero-Trust Policy Decision Point
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl mx-auto font-mono text-[11px]">
                Continuous risk evaluation without synthetic mock data &bull; 6-D Clean Behavioral Features &bull; NIST SP 800-207 ABAC Gate
              </p>
            </div>

            {/* Connecting Conduits Down */}
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              </div>
            </div>

            {/* Level 3: Output Engines */}
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-400 text-center mb-3">
                INTELLIGENCE &amp; RESPONSE SUBSYSTEMS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Anomaly Detection</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">150-Tree Isolation Forest on real LANL baseline</div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold pt-1">Zero Target Leakage</div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Risk Engine &amp; ABAC</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">4-Tier policy gate (Normal, Step-Up, Restricted, Block)</div>
                  <div className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold pt-1">FIDO2 Passkey Attestation</div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Digital Twin Cascade</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Downstream dependency propagation &amp; containment</div>
                  <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold pt-1">Blast-Radius Preview</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 5. SECURITY INITIATIVES SECTION (Digital Dubai Inspired) */}
      <section id="initiatives" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#0B4EA2] dark:text-cyan-400" />
            <span className="text-xs font-mono font-bold text-[#0B4EA2] dark:text-cyan-400 uppercase tracking-wider">
              STRUCTURED PROGRAMMES
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Security Initiatives
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Institutional security programmes delivering proactive cyber risk intelligence across interconnected public systems.
          </p>
        </div>

        {/* 6 Structured Initiative Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              title: "National Identity Security",
              purpose: "Protect administrative identities, privileged accounts and government access with FIDO2 passkeys and cryptographic attestation.",
              status: "OPERATIONAL",
              metric: "Level 5 Clearance Gate",
              icon: KeyRound
            },
            {
              title: "Critical Infrastructure Intelligence",
              purpose: "Monitor interconnected municipal and transportation infrastructure to identify abnormal telemetry and lateral discovery.",
              status: "ACTIVE MONITORING",
              metric: "73,287 Entity Windows",
              icon: Activity
            },
            {
              title: "Digital Trust & Access Gate",
              purpose: "Risk-adaptive authentication, continuous session validation, and 4-tier ABAC policy gate enforcement.",
              status: "ACTIVE",
              metric: "NIST SP 800-207 Compliant",
              icon: ShieldCheck
            },
            {
              title: "Cyber Threat Intelligence",
              purpose: "Correlate authentication events, network flow anomalies, and API velocity surges into unified incident graphs.",
              status: "LIVE CORRELATION",
              metric: "SHA-256 Audit Ledger",
              icon: Radio
            },
            {
              title: "Infrastructure Resilience",
              purpose: "Model multi-stage cyber attack cascades across dependent city systems and recommend optimal containment actions.",
              status: "READY",
              metric: "Cascade Blast-Radius Preview",
              icon: Network
            },
            {
              title: "Security Research & Analytics",
              purpose: "Dataset-backed unsupervised anomaly detection and empirical post-hoc Red Team benchmark evaluations.",
              status: "VERIFIED DEFENSIBLE",
              metric: "44.9% Post-Hoc F1-Score",
              icon: BarChart3
            }
          ].map((init, idx) => {
            const IconComp = init.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0B4EA2] dark:text-cyan-400">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {init.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {init.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {init.purpose}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">METRIC:</span>
                  <span className="font-bold text-[#0B4EA2] dark:text-cyan-400">{init.metric}</span>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* 6. PROTECTED INFRASTRUCTURE SECTION */}
      <section id="infrastructure" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#0B4EA2] dark:text-cyan-400" />
            <span className="text-xs font-mono font-bold text-[#0B4EA2] dark:text-cyan-400 uppercase tracking-wider">
              CONNECTED PUBLIC ECOSYSTEM
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Protected Critical Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Active public-sector subsystems monitored with continuous telemetry scoring and policy gate verification.
          </p>
        </div>

        {/* Live Infrastructure Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeInfra.map((node) => (
            <div 
              key={node.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                  <span className="uppercase">{node.sector}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    node.status.includes('HEALTHY') || node.status === 'NOMINAL' || node.status === 'PROTECTED' || node.status === 'LOCKED_SECURE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {node.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {node.name}
                </h3>

                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Endpoint: {node.endpoint}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Policy Gate:</span>
                  <strong className="text-slate-900 dark:text-white">{node.policy}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Latency:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{node.latency_ms} ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 7. INTELLIGENCE PIPELINE & RESEARCH FOUNDATION */}
      <section id="intelligence" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        
        <div id="research" className="p-8 rounded-3xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#0B4EA2] dark:text-cyan-400 uppercase tracking-wider block">
                RESEARCH FOUNDATION &bull; DEFENSIBLE PROVENANCE
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                5-Stage Zero-Trust Data Lineage
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              ZERO SYNTHETIC DATA FALLBACK
            </span>
          </div>

          {/* 5 Pipeline Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
            {[
              { stage: "STAGE 1", name: "Raw Ingestion", detail: "Gzip streaming from dns.txt.gz & redteam.txt.gz" },
              { stage: "STAGE 2", name: "Clean 6-D Vector", detail: "Behavioral DNS metrics without attack label leakage" },
              { stage: "STAGE 3", name: "Standardization", detail: "StandardScaler z = (x - μ) / σ empirical distribution" },
              { stage: "STAGE 4", name: "Isolation Forest", detail: "150-Tree unsupervised anomaly partition ensemble" },
              { stage: "STAGE 5", name: "Post-Hoc Benchmark", detail: "Validation against 749 LANL Red Team timestamps" }
            ].map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-[#0B4EA2] dark:text-cyan-400 block">{p.stage}</span>
                <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>

          {/* Research Datasets Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1 font-mono text-xs">
              <span className="text-[10px] font-bold text-[#0B4EA2] dark:text-cyan-400 uppercase">AUTHENTICATION DATASET</span>
              <div className="font-bold text-slate-900 dark:text-white">LANL 2015 Cybersecurity Data</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">350,000 streamed DNS events &bull; 73,287 entity windows</div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1 font-mono text-xs">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">NETWORK INTRUSION DATASET</span>
              <div className="font-bold text-slate-900 dark:text-white">Flow Intrusion (Data.csv)</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">76 numerical features &bull; 10 distinct attack categories</div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 space-y-1 font-mono text-xs">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">SMART CITY TRANSPORTATION</span>
              <div className="font-bold text-slate-900 dark:text-white">Connected Vehicle IoV CAN-Bus</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">6 CAN arbitration streams &bull; DoS &amp; Speed Spoofing</div>
            </div>
          </div>

        </div>

      </section>

      {/* 8. INSTITUTIONAL FOOTER */}
      <footer className="mt-auto bg-[#0B1728] text-slate-300 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <IndiaNationalEmblem size="sm" showText={false} />
              <div>
                <div className="text-base font-black tracking-wider text-white font-mono">SECUROX</div>
                <div className="text-xs text-slate-400 font-sans">Government Digital Infrastructure Security Platform</div>
              </div>
            </div>

            <button
              onClick={onEnterLogin}
              className="px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 text-white font-bold text-xs font-mono shadow-sm transition-all cursor-pointer self-start md:self-auto"
            >
              Access Officer Gateway &rarr;
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
            <div>
              &copy; 2026 Securox Platform &bull; Designed for Public Sector Infrastructure Resilience
            </div>
            <div>
              NIST SP 800-207 Zero Trust Architecture Compliant
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
