import React, { useState } from 'react';
import { 
  Shield, Key, User, Lock, Fingerprint, KeyRound, Globe, 
  Laptop, AlertCircle, CheckCircle2, RefreshCw, ChevronRight, Sliders, ArrowLeft,
  Building, Mail, UserPlus, ShieldCheck, Cpu, Smartphone
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
  const [useBiometrics, setUseBiometrics] = useState(true);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('National Cyber Coordination Centre (NCCC)');
  const [regRole, setRegRole] = useState('AUDITOR');
  const [regDeviceName, setRegDeviceName] = useState('Gov-Issued ThinkPad T14s');
  const [regPasskeyEnrolled, setRegPasskeyEnrolled] = useState(true);
  const [regBiometricEnrolled, setRegBiometricEnrolled] = useState(true);

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
      passkey_credential: usePasskey ? 'FIDO2_SEC_ADMIN01_TOKEN' : null,
      biometric_signature: useBiometrics ? 'BIO_FP_VERIFIED_SEC_ADMIN' : null
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
      passkey_credential: regPasskeyEnrolled ? `FIDO2_SEC_KEY_${regUsername.toUpperCase()}_TOKEN` : null,
      biometric_signature: regBiometricEnrolled ? `BIO_SIG_${regUsername.toUpperCase()}_ENROLLED` : null
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
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1220] flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* Top Sovereign Government Identity Banner */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
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

            <div className="h-6 w-px bg-slate-200 dark:border-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <IndiaNationalEmblem size={32} showText={false} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Government of India
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                    OFFICIAL ACCESS
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  National Critical Information Infrastructure Protection Centre (NCIIPC) &bull; CERT-In
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SecuroxLogo size={22} />
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
          
          {/* Left Context Side: Sovereign Shield & Information */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>ZERO-TRUST ADAPTIVE GATEWAY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Sovereign Cyber Command Access
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Continuous 12-factor Attribute-Based Access Control (ABAC), device trust attestation, and Isolation Forest anomaly intelligence.
              </p>
            </div>

            {/* Quick Demo Identities Autofill */}
            {authMode === 'login' && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">
                  Quick Official Identity Presets
                </span>

                <div className="space-y-2">
                  {predefinedAccounts.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        username === acc.username
                          ? 'border-blue-500 dark:border-cyan-500 bg-blue-50/50 dark:bg-slate-800'
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
              <span>Compliant with CERT-In Directive 2022 &amp; NIST SP 800-207 Zero-Trust Architecture.</span>
            </div>

          </div>

          {/* Right Side: Auth Card (Tabs: Login & Register) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* Tab Controls */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Official Login</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Official</span>
              </button>
            </div>

            {/* Error / Success Alerts */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Government Username / Official ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Security Passphrase
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Cryptographic Passkey & Biometric Hardware Options */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Multi-Factor Hardware Attestation
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={usePasskey}
                        onChange={(e) => setUsePasskey(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">FIDO2 Passkey</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={useBiometrics}
                        onChange={(e) => setUseBiometrics(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <Fingerprint className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Biometric Sensor</span>
                    </label>
                  </div>
                </div>

                {/* Zero-Trust Context Simulator Toggle */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] space-y-2 font-mono">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Zero-Trust Environmental Context:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useUntrustedDev}
                        onChange={(e) => setUseUntrustedDev(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span className={useUntrustedDev ? 'text-rose-500 font-bold' : 'text-slate-500'}>Untrusted Device</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useExternalIp}
                        onChange={(e) => setUseExternalIp(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span className={useExternalIp ? 'text-rose-500 font-bold' : 'text-slate-500'}>Tor/Foreign IP</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useForeignLocation}
                        onChange={(e) => setUseForeignLocation(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span className={useForeignLocation ? 'text-rose-500 font-bold' : 'text-slate-500'}>Impossible Travel</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating with Zero-Trust Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Department / Ministry</label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="National Cyber Coordination Centre (NCCC)">NCCC (Homeland Security)</option>
                      <option value="Ministry of Electronics & IT (MeitY)">MeitY (Digital India)</option>
                      <option value="Smart City Transportation Authority">Smart City Transportation</option>
                      <option value="Ministry of Finance (Expenditure)">Ministry of Finance</option>
                      <option value="Municipal Governance">Municipal Governance</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Security Clearance Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="AUDITOR">Auditor / Inspector (Clearance Level 2)</option>
                      <option value="MUNICIPAL_DIRECTOR">Municipal Director (Clearance Level 3)</option>
                      <option value="TRAFFIC_CONTROLLER">Traffic Controller (Clearance Level 4)</option>
                      <option value="FINANCE_OFFICER">Finance Officer (Clearance Level 4)</option>
                      <option value="SUPER_ADMIN">Cyber Commander (Clearance Level 5)</option>
                    </select>
                  </div>
                </div>

                {/* Device & Passkey Enrollment */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Cryptographic Device &amp; Passkey Enrollment
                  </span>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regPasskeyEnrolled}
                        onChange={(e) => setRegPasskeyEnrolled(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Enroll FIDO2 Hardware Passkey</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regBiometricEnrolled}
                        onChange={(e) => setRegBiometricEnrolled(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <Fingerprint className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Enroll Biometric Profile</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Sovereign Official Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Official Account</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>
      </main>

      {/* Sovereign Footer */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        Securox Government Cyber Defense Platform &bull; Protected under Indian IT Act 2000 &bull; Sovereign Encryption 256-bit
      </footer>

    </div>
  );
};
