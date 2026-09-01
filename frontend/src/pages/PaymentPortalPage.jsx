import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Lock, AlertTriangle, CheckCircle2, 
  RefreshCw, ShieldCheck, ArrowRight, ShieldAlert, FileText
} from 'lucide-react';
import { api } from '../context/AuthContext';
import { ThreatScoreBadge } from '../components/ThreatScoreBadge';

export const PaymentPortalPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // New Payout Form
  const [recipient, setRecipient] = useState('Apex Civil Engineering Corp');
  const [department, setDepartment] = useState('Public Infrastructure');
  const [amount, setAmount] = useState(75000);
  const [purpose, setPurpose] = useState('Traffic Grid Telemetry & Sensor Deployment');
  const [disbursing, setDisbursing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const resp = await api.get('/payment/transactions');
      setTransactions(resp.data.transactions);
      setOverview(resp.data.treasury_overview);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to fetch treasury disbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDisburse = async (e) => {
    e.preventDefault();
    setDisbursing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const resp = await api.post('/payment/disburse', {
        recipient,
        department,
        amount: parseFloat(amount),
        purpose
      });
      setActionSuccess(resp.data.message);
      fetchTransactions();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Disbursement failed: Zero-Trust ABAC denied');
    } finally {
      setDisbursing(false);
    }
  };

  const handleReview = async (txId, action) => {
    try {
      const resp = await api.post('/payment/review', {
        transaction_id: txId,
        action
      });
      setActionSuccess(`Transaction ${txId} marked as ${resp.data.new_status}`);
      fetchTransactions();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Review action failed.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              LEVEL 3 TREASURY DISBURSEMENTS
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            <span>Municipal Treasury & Financial Disbursements</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-Trust ABAC Constraint: High-value payouts ($50,000+) strictly enforce cryptographic step-up elevation.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTransactions}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Treasury KPI Grid */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Municipal Budget</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ${(overview.total_budget / 1000000).toFixed(1)}M
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Disbursed YTD</span>
            <div className="text-2xl font-black text-emerald-500 mt-1 font-mono">
              ${(overview.disbursed_year_to_date / 1000).toFixed(1)}k
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">High-Risk Approvals</span>
            <div className="text-2xl font-black text-amber-500 mt-1 font-mono">
              {overview.pending_high_risk_approvals}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Treasury Policy</span>
            <div className="text-sm font-black text-blue-500 mt-2 font-mono">
              $50k Step-Up Lock
            </div>
          </div>
        </div>
      )}

      {/* Dual Layout: Payout Creation + Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Disbursement Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Initiate Treasury Transfer
              </h3>
              <span className="text-xs font-mono text-emerald-500 font-bold">ABAC Level 3</span>
            </div>

            <form onSubmit={handleDisburse} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Contractor / Recipient Entity</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Authorizing Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                >
                  <option value="Public Infrastructure">Public Infrastructure</option>
                  <option value="Smart City Transit">Smart City Transit</option>
                  <option value="Homeland & Public Safety">Homeland & Public Safety</option>
                  <option value="Clean Waterworks">Clean Waterworks</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Disbursement Amount ($ USD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Statutory Justification / Purpose</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-800 dark:text-cyan-300">
                🔒 <strong>Policy Rule:</strong> Amounts $\ge \$50,000$ automatically require executive biometric step-up challenge before settlement.
              </div>

              <button
                type="submit"
                disabled={disbursing}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {disbursing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Authorize Disbursement</span>
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
            Treasury Gate: Automated AML and Anomaly Isolation.
          </div>
        </div>

        {/* Right: Transactions Ledger (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Municipal Disbursement Ledger
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{transactions.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">Tx ID</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-blue-600 dark:text-cyan-400">{tx.transaction_id}</td>
                    <td className="p-3 text-slate-900 dark:text-white font-sans truncate max-w-[140px]">{tx.recipient}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">${tx.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.approval_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                        tx.approval_status === 'PENDING_STEP_UP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                        'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                      }`}>
                        {tx.approval_status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 font-sans">
                      {tx.approval_status === 'PENDING_STEP_UP' && (
                        <button
                          onClick={() => handleReview(tx.transaction_id, 'APPROVE')}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleReview(tx.transaction_id, 'FLAG_SOC')}
                        className="px-2 py-1 rounded bg-rose-600/80 hover:bg-rose-700 text-white text-[10px] font-semibold"
                      >
                        Flag SOC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

