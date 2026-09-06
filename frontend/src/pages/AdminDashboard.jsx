import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  Shield,
  TrendingUp,
  Building2,
  Target,
  DollarSign,
  MessageSquare,
  Activity,
  UserCheck,
  UserCog,
  Crown,
  Calendar,
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [userForm, setUserForm] = useState({ companyId: '', name: '', email: '', password: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, usersRes, companiesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getCompanies(),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data?.success) {
        setUsers(usersRes.data.data);
      }
      if (companiesRes.data?.success) {
        setCompanies(companiesRes.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load admin data';
      setError(msg);
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePromoteDemote = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    if (!companyName.trim()) return;
    try {
      const response = await adminAPI.createCompany({ name: companyName.trim() });
      setCompanies((prev) => [response.data.data, ...prev]);
      setCompanyName('');
      setSuccessMessage('Company added successfully.');
      window.setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add company');
    }
  };

  const handleCreateCompanyUser = async (event) => {
    event.preventDefault();
    if (!userForm.companyId) return;
    try {
      await adminAPI.createCompanyUser(userForm.companyId, userForm);
      setUserForm({ companyId: userForm.companyId, name: '', email: '', password: '' });
      setSuccessMessage('Company user added successfully.');
      window.setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company user');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 text-purple-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Loading Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Admin Console
          </span>
        }
        subtitle="System-wide intelligence, account administration, and pipeline oversight."
        action={
          <Badge variant="warning" className="text-xs">
            <Shield className="w-3 h-3 mr-1 inline" />
            {user?.name || user?.email} • Admin
          </Badge>
        }
      />

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          ⚠ {error}
        </div>
      )}

      {successMessage && (
        <div role="status" className="fixed right-6 top-6 z-50 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-xl">
          {successMessage}
        </div>
      )}

      <Card className="border-cyan-500/30 bg-slate-900/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-400" /> Companies</h2>
            <p className="text-xs text-slate-400 mt-1">Company tenants and user counts</p>
          </div>
          <Badge variant="secondary">{companies.length} companies</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <form onSubmit={handleCreateCompany} className="flex gap-2">
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="New company name" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <Button type="submit" size="sm">Add company</Button>
          </form>
          <form onSubmit={handleCreateCompanyUser} className="grid grid-cols-2 gap-2">
            <select value={userForm.companyId} onChange={(event) => setUserForm({ ...userForm, companyId: event.target.value })} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200">
              <option value="">Select company</option>
              {companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
            </select>
            <input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} placeholder="User name" className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white" />
            <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="User email" type="email" className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white" />
            <div className="flex gap-2"><input value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder="Temporary password" type="password" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white" /><Button type="submit" size="sm">Create user</Button></div>
          </form>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {companies.map((company) => (
            <div key={company._id} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3">
              <div className="text-sm font-semibold text-slate-100">{company.name}</div>
              <div className="mt-1 text-xs text-slate-400">{company.users || 0} users · {company.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          ))}
          {!companies.length && <div className="text-sm text-slate-500">No companies have been created yet.</div>}
        </div>
      </Card>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Total Accounts
            </span>
            <Badge variant="primary" className="text-[10px]">SYSTEM</Badge>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {stats?.users?.total ?? 0}
          </h3>
          <div className="mt-1 flex gap-3 text-[11px]">
            <span className="text-amber-400 font-semibold">
              {stats?.users?.admins ?? 0} Admin
            </span>
            <span className="text-slate-400">
              {stats?.users?.users ?? 0} User
            </span>
          </div>
        </Card>

        <Card className="border-emerald-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Customers
            </span>
            <Badge variant="success" className="text-[10px]">DB</Badge>
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {stats?.customers ?? 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">All customer records</p>
        </Card>

        <Card className="border-amber-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Leads + Deals
            </span>
            <Badge variant="warning" className="text-[10px]">PIPELINE</Badge>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-2xl font-extrabold text-amber-300 tracking-tight">
              {stats?.leads ?? 0}
            </h3>
            <span className="text-xs font-semibold text-blue-400">
              {stats?.deals?.active ?? 0} / {stats?.deals?.total ?? 0} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total leads + deal activity</p>
        </Card>

        <Card className="border-purple-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              Pipeline Value
            </span>
            <Badge variant="purple" className="text-[10px]">QUOTES</Badge>
          </div>
          <h3 className="text-2xl font-extrabold text-purple-300 tracking-tight">
            ${Number(stats?.pipelineValue ?? 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.conversations ?? 0} Conversations logged
          </p>
        </Card>
      </div>

      {/* System Activity Banner */}
      {stats?.systemActivity && (
        <Card className="border-slate-700 bg-slate-950/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                System Activity
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
              <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Last Signup
                  </div>
                  <div className="text-slate-200 font-semibold text-[11px]">
                    {stats.systemActivity.lastUserSignup?.name || '—'}
                    {' · '}
                    <span className="text-slate-400 font-normal">
                      {formatDateTime(stats.systemActivity.lastUserSignup?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Last Deal Update
                  </div>
                  <div className="text-slate-200 font-semibold text-[11px]">
                    {stats.systemActivity.lastDealUpdate?.company || '—'}
                    {' · '}
                    <span className="text-slate-400 font-normal">
                      {formatDateTime(stats.systemActivity.lastDealUpdate?.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card
        title={
          <div className="flex items-center gap-2 text-sm">
            <UserCog className="w-4 h-4 text-indigo-400" />
            <span>User Accounts & Role Administration</span>
          </div>
        }
        subtitle={`${users.length} total accounts — system-wide listing with role management controls`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created
                  </span>
                </th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                    No user accounts in the system yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = (user?._id || user?.id) === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(u.name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {u.name || 'Unnamed User'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'admin' ? (
                          <Badge variant="warning" className="text-[10px]">
                            <Crown className="w-3 h-3 mr-1 inline" />
                            ADMIN
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            USER
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px]">INACTIVE</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDateTime(u.lastLogin) || (
                          <span className="italic text-slate-500">Never</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role === 'admin' ? (
                          <button
                            onClick={() => handlePromoteDemote(u._id, 'admin')}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot demote your own account' : 'Demote to User'}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition-colors"
                          >
                            Demote
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteDemote(u._id, 'user')}
                            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            ⬆ Promote Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboard;
