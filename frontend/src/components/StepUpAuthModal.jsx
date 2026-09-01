import React, { useState } from 'react';
import { ShieldCheck, Fingerprint, KeyRound, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StepUpAuthModal = () => {
  const { stepUpRequired, stepUpReason, verifyStepUp, setStepUpRequired } = useAuth();
  const [method, setMethod] = useState('PASSKEY');
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!stepUpRequired) return null;

  const handleSimulateVerification = async () => {
    setScanning(true);
    setStatusMsg(`Performing ${method === 'PASSKEY' ? 'Simulated WebAuthn / Passkey Handshake' : 'Simulated Biometric Verification'}...`);

    setTimeout(async () => {
      const result = await verifyStepUp(
        method,
        method === 'PASSKEY' ? 'FIDO2_SEC_GOV_CHALLENGE_TOKEN_OK' : 'BIO_GOV_FP_VALID_SIGNATURE'
      );
      setScanning(false);
      if (result.success) {
        setStatusMsg('Clearance elevated successfully. Policy constraint unlocked.');
      } else {
        setStatusMsg(`Verification failed: ${result.error}`);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Step-Up Authentication Required
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-Trust Policy Clearance Elevation
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>{stepUpReason || 'This high-criticality operation or elevated threat index requires cryptographic multi-factor re-verification.'}</div>
          </div>

          {/* Verification Method Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('PASSKEY')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'PASSKEY'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <KeyRound className="w-6 h-6" />
              <div className="text-center">
                <span className="text-xs font-bold block">WebAuthn / Passkey</span>
                <span className="text-[10px] text-slate-400 font-mono">(Simulated)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod('BIOMETRIC')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'BIOMETRIC'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Fingerprint className="w-6 h-6" />
              <div className="text-center">
                <span className="text-xs font-bold block">Biometric Verification</span>
                <span className="text-[10px] text-slate-400 font-mono">(Simulated)</span>
              </div>
            </button>
          </div>

          {/* Action Area */}
          <div className="text-center py-2">
            {scanning ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 animate-pulse">
                  {statusMsg}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimulateVerification}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Verify with {method === 'PASSKEY' ? 'Simulated Passkey' : 'Simulated Fingerprint'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-mono">SECUROX-ZTRUST-GATEWAY</span>
          <button
            type="button"
            onClick={() => setStepUpRequired(false)}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
};

