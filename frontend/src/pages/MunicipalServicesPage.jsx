import React, { useState, useEffect } from 'react';
import { 
  Landmark, Plus, FileText, CheckCircle2, XCircle, 
  AlertTriangle, RefreshCw, Send, Radio, Shield
} from 'lucide-react';
import { api } from '../context/AuthContext';

export const MunicipalServicesPage = () => {
  const [permits, setPermits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // New Permit Form
  const [showNewModal, setShowNewModal] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [permitType, setPermitType] = useState('Commercial Construction');
  const [feeAmount, setFeeAmount] = useState(12500);
  const [zoneCode, setZoneCode] = useState('ZONE-CBD-08');

  // Emergency Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('WARNING');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const resp = await api.get('/municipal/permits');
      setPermits(resp.data.permits);
      setStats(resp.data.stats);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to fetch municipal permits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermits();
  }, []);

  const handleCreatePermit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const resp = await api.post('/municipal/permits', {
        applicant_name: applicantName,
        permit_type: permitType,
        fee_amount: parseFloat(feeAmount),
        zone_code: zoneCode
      });
      setActionSuccess(`Permit ${resp.data.permit.permit_number} submitted successfully!`);
      setShowNewModal(false);
      setApplicantName('');
      fetchPermits();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Permit creation failed.');
    }
  };

  const handleUpdateStatus = async (permitId, newStatus) => {
    try {
      await api.post('/municipal/permits/update-status', {
        permit_id: permitId,
        status: newStatus
      });
      setActionSuccess(`Permit status updated to ${newStatus}`);
      fetchPermits();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Permit update failed.');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const resp = await api.post('/municipal/emergency-broadcast', {
        broadcast_title: broadcastTitle,
        affected_zones: ['ZONE-CBD-04', 'ZONE-METRO-02'],
        severity_level: broadcastSeverity,
        message_body: broadcastMessage
      });
      setActionSuccess(`Emergency Broadcast (${resp.data.broadcast_id}) dispatched to municipal network!`);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to dispatch broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
            <span>Municipal Infrastructure & Citizen Permits</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zoning authorizations, infrastructure excavation permits, and municipal public safety dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Permit Application</span>
          </button>

          <button
            type="button"
            onClick={fetchPermits}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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

      {/* Metrics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Total Permits</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{stats.total}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Approved</span>
            <div className="text-2xl font-black text-emerald-500 mt-1 font-mono">{stats.approved}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Under Review</span>
            <div className="text-2xl font-black text-amber-500 mt-1 font-mono">{stats.pending}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono">Revoked</span>
            <div className="text-2xl font-black text-rose-500 mt-1 font-mono">{stats.revoked}</div>
          </div>
        </div>
      )}

      {/* Permits Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Active Infrastructure Permits Registry
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Zero-Trust Audited</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Permit #</th>
                <th className="p-3.5">Applicant Name</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Zone</th>
                <th className="p-3.5">Fee</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permits.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-blue-600 dark:text-cyan-400">{p.permit_number}</td>
                  <td className="p-3.5 text-slate-900 dark:text-white font-medium font-sans">{p.applicant_name}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-sans">{p.permit_type}</td>
                  <td className="p-3.5 text-slate-500">{p.zone_code}</td>
                  <td className="p-3.5 text-slate-900 dark:text-white font-bold">${p.fee_amount.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                      p.status === 'REVOKED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' :
                      'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 font-sans">
                    {p.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                      >
                        Approve
                      </button>
                    )}
                    {p.status !== 'REVOKED' && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, 'REVOKED')}
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency City Broadcast Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Emergency Municipal Alert Dispatch
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Broadcast critical infrastructure advisories directly to city dashboards.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4">
          <div className="sm:col-span-4">
            <label className="text-xs text-slate-400 font-mono block mb-1">Alert Headline</label>
            <input
              type="text"
              required
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Water Main Valve Closure"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="text-xs text-slate-400 font-mono block mb-1">Message Body</label>
            <input
              type="text"
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Subsurface fiber excavation underway. Reduced lanes on Capitol East."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

