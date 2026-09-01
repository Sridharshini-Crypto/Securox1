import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Hash, Download, Filter, RefreshCw, 
  CheckCircle2, AlertTriangle, Terminal, Lock, Key
} from 'lucide-react';
import { api } from '../context/AuthContext';

export const SecurityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const resp = await api.get(`/security/audit-logs?limit=100&blocked_only=${blockedOnly}`);
      setLogs(resp.data.audit_logs);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [blockedOnly]);

  const handleExportSecurox = async () => {
    try {
      setExporting(true);
      const resp = await api.get('/security/export-securox-stream');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resp.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `securox_stream_export_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              TAMPER-EVIDENT SHA-256 HASH CHAIN
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>Government Audit Trail & Securox Event Stream</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Every HTTP invocation is cryptographically hashed with predecessor linkage for forensic tamper-evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportSecurox}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Securox Schema JSON</span>
          </button>

          <button
            type="button"
            onClick={fetchLogs}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(e) => setBlockedOnly(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Show Zero-Trust Intercepted & Blocked Requests Only</span>
        </label>
        <span className="text-slate-400 font-mono">{logs.length} Log Entries Displayed</span>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Endpoint & Method</th>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Source IP / Geo</th>
                <th className="p-3.5">Response Time</th>
                <th className="p-3.5">Tamper-Evident SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.status_code < 300 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                      l.status_code === 403 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' :
                      'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    }`}>
                      {l.status_code} {l.was_blocked ? 'BLOCKED' : 'OK'}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    <span className="text-blue-500 mr-1.5">{l.http_method}</span>
                    {l.endpoint}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    <div>{l.user_id}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{l.role}</div>
                  </td>
                  <td className="p-3.5 text-slate-500">
                    <div>{l.source_ip}</div>
                    <div className="text-[10px] text-slate-400">{l.location}</div>
                  </td>
                  <td className="p-3.5 text-slate-500">{l.response_time_ms.toFixed(1)}ms</td>
                  <td className="p-3.5 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] truncate max-w-[160px]">
                    {l.log_hash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

