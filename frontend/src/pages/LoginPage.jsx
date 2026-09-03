import React, { useState } from 'react';
import { 
  Shield, Key, User, Lock, KeyRound, Globe, 
  Laptop, AlertCircle, CheckCircle2, RefreshCw, ChevronRight, ArrowLeft,
  Building, Mail, UserPlus, ShieldCheck, Cpu, HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThreatScoreBadge } from '../components/ThreatScoreBadge';
import { IndiaNationalEmblem } from '../components/IndiaNationalEmblem';
import { SecuroxLogo } from '../components/SecuroxLogo';

export const LoginPage = ({ onBackToLanding }) => {
  const { login, register, loading, authError, setAuthError } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');
  const [regSuccessMsg, setRegSuccessMsg] = useState(null);

  // Login form state
  const [username, setUsername] = useState('admin01');
  const [password, setPassword] = useState('Securox@Gov2026!');
  const [useUntrustedDev, setUseUntrustedDev] = useState(false);
  const [useExternalIp, setUseExternalIp] = useState(false);
  const [useForeignLocation, setUseForeignLocation] = useState(false);
  const [usePasskey, setUsePasskey] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('National Cyber Coordination Centre (NCCC)');
  const [regRole, setRegRole] = useState('AUDITOR');
  const [regDeviceName, setRegDeviceName] = useState('Gov-Issued ThinkPad T14s');
  const [regPasskeyEnrolled, setRegPasskeyEnrolled] = useState(true);

  const predefinedAccounts = [
    { username: 'admin01', role: 'SUPER_ADMIN', name: 'Dr. Sarah Connor', desc: 'Full Homeland Security & Critical Infrastructure Access' },
    { username: 'muni_lead', role: 'MUNICIPAL_DIRECTOR', name: 'Marcus Vance', desc: 'Municipal Infrastructure & Emergency Services' },
    { username: 'traffic_ops', role: 'TRAFFIC_CONTROLLER', name: 'Elena Rostova', desc: 'Smart City Traffic Grid & Ambulance Corridors' },
    { username: 'treasury_lead', role: 'FINANCE_OFFICER', name: 'Richard Hendricks', desc: 'Municipal Treasury & Payout Vault' }
  ];

  const handleSelectAccount = (acc) => {
    setUsername(acc.username);
    setPassword('Securox@Gov2026!');
    setAuthError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setRegSuccessMsg(null);

    const payload = {
      username: username.trim(),
      password: password,
      device_fingerprint: useUntrustedDev ? 'DEV-UNRECOGNIZED-X9' : 'DEV-SEC-LAPTOP-HQ-01',
      device_name: useUntrustedDev ? 'External Unknown Terminal' : 'Gov-Issued ThinkPad T14s',
      source_ip: useExternalIp ? '185.220.101.42' : '10.14.22.105',
      location_city: useForeignLocation ? 'Amsterdam' : 'Austin',
      location_country: useForeignLocation ? 'Netherlands' : 'USA',
      passkey_credential: usePasskey ? 'FIDO2_SEC_ADMIN01_TOKEN' : null
    };

    await login(payload);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setRegSuccessMsg(null);

    if (!regUsername || !regEmail || !regPassword || !regFullName) {
      setAuthError('Please fill in all required official registration fields.');
      return;
    }

    const payload = {
      username: regUsername.trim().toLowerCase(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      full_name: regFullName.trim(),
      department: regDepartment,
      role_name: regRole,
      device_name: regDeviceName,
      device_fingerprint: `DEV-OFFICIAL-${regUsername.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      passkey_credential: regPasskeyEnrolled ? `FIDO2_SEC_KEY_${regUsername.toUpperCase()}_TOKEN` : null
    };

    const res = await register(payload);
    if (res.success) {
      setRegSuccessMsg(`Official account '${payload.username}' registered successfully! You can now log in.`);
      setUsername(payload.username);
      setPassword(regPassword);
      setAuthMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07111F] flex flex-col justify-between text-[#172033] dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* Top Institutional Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#07111F]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Public Gateway</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <IndiaNationalEmblem size="sm" showText={false} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                    SECUROX OFFICER GATEWAY
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-[#0B4EA2] dark:text-cyan-400 border border-blue-200 dark:border-blue-800 font-bold">
                    AUTHORIZED ACCESS
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Government Digital Infrastructure &bull; NIST SP 800-207 Zero-Trust Architecture
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SecuroxLogo size="sm" showSubtitle={false} />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-mono"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Side Context */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[#0B4EA2] dark:text-cyan-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ZERO-TRUST ADAPTIVE GATEWAY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Sovereign Command Access
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Risk-adaptive Attribute-Based Access Control (ABAC), FIDO2 device passkey attestation, and Isolation Forest anomaly intelligence.
              </p>
            </div>

            {/* Quick Demo Identities Autofill */}
            {authMode === 'login' && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">
                  Official Identity Profiles
                </span>

                <div className="space-y-2">
                  {predefinedAccounts.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        username === acc.username
                          ? 'border-[#0B4EA2] dark:border-cyan-500 bg-blue-50/50 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            {acc.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{acc.desc}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Security Assurance Footer */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Compliant with NIST SP 800-207 Zero-Trust Architecture.</span>
            </div>

          </div>

          {/* Right Side: Auth Card (Tabs: Login & Register) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`pb-2 px-4 text-xs font-bold font-mono uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  authMode === 'login'
                    ? 'border-[#0B4EA2] text-[#0B4EA2] dark:border-cyan-400 dark:text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Official Sign In
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`pb-2 px-4 text-xs font-bold font-mono uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  authMode === 'register'
                    ? 'border-[#0B4EA2] text-[#0B4EA2] dark:border-cyan-400 dark:text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                New Officer Registration
              </button>
            </div>

            {/* Error or Success Alert */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Official Identifier
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0B4EA2]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Password / Master Token
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0B4EA2]"
                    />
                  </div>
                </div>

                {/* Adaptive Environmental Risk Switches */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                    Zero-Trust Context Modifiers (Sandbox Testing)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useUntrustedDev}
                        onChange={(e) => setUseUntrustedDev(e.target.checked)}
                        className="rounded text-[#0B4EA2]"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">Unrecognized Device</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useExternalIp}
                        onChange={(e) => setUseExternalIp(e.target.checked)}
                        className="rounded text-[#0B4EA2]"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">External Untrusted IP</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useForeignLocation}
                        onChange={(e) => setUseForeignLocation(e.target.checked)}
                        className="rounded text-[#0B4EA2]"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">Impossible Travel (EU)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePasskey}
                        onChange={(e) => setUsePasskey(e.target.checked)}
                        className="rounded text-[#0B4EA2]"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">FIDO2 Hardware Key</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 text-white font-bold text-xs font-mono tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating with Zero-Trust Gateway...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Authenticate Session</span>
                    </>
                  )}
                </button>

              </form>
            )}

            {/* REGISTRATION FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Vikramaditya Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Government Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="official@nic.in"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Official Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. vsharma_nccc"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Passphrase</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Assigned Ministry / Department</label>
                  <input
                    type="text"
                    required
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Role &amp; Clearance</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white font-mono"
                    >
                      <option value="AUDITOR">AUDITOR (Level 2)</option>
                      <option value="MUNICIPAL_DIRECTOR">MUNICIPAL_DIRECTOR (Level 3)</option>
                      <option value="TRAFFIC_CONTROLLER">TRAFFIC_CONTROLLER (Level 4)</option>
                      <option value="FINANCE_OFFICER">FINANCE_OFFICER (Level 4)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Level 5)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Registered Workstation</label>
                    <input
                      type="text"
                      value={regDeviceName}
                      onChange={(e) => setRegDeviceName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regPasskeyEnrolled}
                      onChange={(e) => setRegPasskeyEnrolled(e.target.checked)}
                      className="rounded text-[#0B4EA2]"
                    />
                    <Key className="w-3.5 h-3.5 text-[#0B4EA2] dark:text-cyan-400" />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Enroll FIDO2 Cryptographic Hardware Passkey</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 text-white font-bold text-xs font-mono tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Official Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Official Identity</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1222]/80 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        Securox Government Digital Infrastructure Platform &bull; NIST SP 800-207 Zero-Trust Architecture
      </footer>

    </div>
  );
};

export default LoginPage;
