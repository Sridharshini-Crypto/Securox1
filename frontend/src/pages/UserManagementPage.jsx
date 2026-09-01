import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Key, Lock, Fingerprint, KeyRound, 
  CheckCircle2, AlertTriangle, RefreshCw, Sliders, ShieldCheck
} from 'lucide-react';
import { api } from '../context/AuthContext';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const resp = await api.get('/users');
      setUsers(resp.data.users);
      setRoles(resp.data.available_roles);
      if (resp.data.users.length > 0 && !selectedUser) {
        setSelectedUser(resp.data.users[0]);
        setTargetRole(resp.data.users[0].role);
      }
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to fetch government users registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdating(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const resp = await api.post('/users/assign-role', {
        user_id: selectedUser.id,
        new_role_name: targetRole,
        justification: 'Zero-Trust Administrative Privilege Reallocation'
      });
      setActionSuccess(resp.data.message);
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Role reassignment denied: Super Admin clearance required.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleCredential = async (userId, type, currentVal) => {
    try {
      const payload = {
        user_id: userId,
        [type]: !currentVal
      };
      await api.post('/users/update-credentials', payload);
      setActionSuccess('Multi-factor credential status updated.');
      fetchUsers();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update credentials.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              LEVEL 5 IDENTITY GOVERNANCE
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <Users className="w-6 h-6 text-purple-500" />
            <span>Government Identity & RBAC/ABAC Clearance Registry</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer security clearance levels, FIDO2 WebAuthn bindings, and fine-grained permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
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

      {/* Dual Layout: User Table + Privilege Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: User Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Government Identities & Clearance Levels
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{users.length} Active Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Clearance</th>
                  <th className="p-3">MFA Hardware</th>
                  <th className="p-3 text-right">Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr 
                    key={u.id} 
                    onClick={() => { setSelectedUser(u); setTargetRole(u.role); }}
                    className={`cursor-pointer transition-colors ${
                      selectedUser?.id === u.id 
                        ? 'bg-purple-50/60 dark:bg-purple-950/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white font-sans">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400">{u.username} &bull; {u.department}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-purple-600 dark:text-purple-400">
                      Level {u.security_clearance_level}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleCredential(u.id, 'passkey_registered', u.passkey_registered); }}
                          title="Toggle WebAuthn Passkey"
                          className={`p-1 rounded ${u.passkey_registered ? 'text-blue-500 bg-blue-500/10' : 'text-slate-300'}`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleCredential(u.id, 'biometric_registered', u.biometric_registered); }}
                          title="Toggle Biometrics"
                          className={`p-1 rounded ${u.biometric_registered ? 'text-cyan-500 bg-cyan-500/10' : 'text-slate-300'}`}
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-[10px] font-sans px-2 py-1 rounded font-semibold ${
                        selectedUser?.id === u.id ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}>
                        Inspect
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Privilege Modifier (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Clearance & Role Reassignment
              </h3>
              <span className="text-xs font-mono text-purple-500 font-bold">SUPER_ADMIN Only</span>
            </div>

            {selectedUser ? (
              <form onSubmit={handleAssignRole} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-400 font-mono">Selected Identity</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedUser.full_name}</div>
                  <div className="text-xs font-mono text-purple-500">{selectedUser.email}</div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-mono block mb-1">Target Role Clearance</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name} &bull; {r.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-mono block mb-1">Granted Permissions</label>
                  <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-h-28 overflow-y-auto">
                    {selectedUser.permissions.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-800 dark:text-purple-300">
                  🛡️ <strong>Zero-Trust ABAC:</strong> Modifying Level 5 privileges requires active executive clearance. All permission modifications emit Securox SIEM telemetry.
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Authorize Role Reassignment</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Select an identity to review permissions.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
            FIDO2 WebAuthn & Hardware Token bindings enforced.
          </div>
        </div>

      </div>

    </div>
  );
};

