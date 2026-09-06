import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Mail, Shield, Key, Eye, EyeOff, Crown, Image as ImageIcon } from 'lucide-react';

export function Settings() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [pwStatus, setPwStatus] = useState('');

  const roleBadge =
    user?.role === 'admin' ? (
      <Badge variant="warning" className="text-xs"><Crown className="w-3 h-3 mr-1 inline" />Admin</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">User</Badge>
    );

  const handleSaveProfile = async () => {
    try {
      setSaveStatus('saving');
      const res = await authAPI.updateProfile({ name, avatar });
      if (res.data?.success && res.data?.data?.user) {
        setUser(res.data.data.user);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2500);
      }
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwStatus('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwStatus('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwStatus('New password must be at least 8 characters long');
      return;
    }
    try {
      setPwStatus('saving');
      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPwStatus('Password changed successfully');
      setTimeout(() => setPwStatus(''), 3000);
    } catch (err) {
      setPwStatus(err.response?.data?.message || 'Failed to change password');
    }
  };

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((s) => s.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your DealPilot profile, authentication credentials, and preferences."
      />

      {/* Profile Card */}
      <Card
        title={
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-indigo-400" />
            <span>My Profile</span>
          </div>
        }
        subtitle="Personal information and account role display"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar + Role Summary */}
          <div className="flex flex-col items-center text-center p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-3">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-indigo-500/40 object-cover"
                onError={(e) => (e.target.style.display = 'none')}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-extrabold border-4 border-indigo-500/40 shadow-xl shadow-indigo-500/20">
                {initials}
              </div>
            )}
            <div className="space-y-1">
              <div className="font-bold text-white text-lg">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
              <div className="pt-1">{roleBadge}</div>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
              Role is assigned by system administrators. If you require elevated access,
              contact your DealPilot administrator.
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
              />
              <p className="mt-1.5 text-[10px] text-slate-500 font-mono">
                Email cannot be changed after registration
              </p>
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                Avatar URL (Optional)
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Assigned Role
              </label>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>{roleBadge}</div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Role managed by administrator
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Profile'}
              </Button>
              {saveStatus === 'error' && (
                <span className="text-rose-400 text-[11px] font-medium">Failed to save. Please try again.</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 text-[11px] font-semibold">Profile updated</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change Card */}
      <Card
        title={
          <div className="flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Change Password</span>
          </div>
        }
        subtitle="Update your authentication credentials"
      >
        <div className="space-y-4 max-w-lg text-xs">
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500 font-mono leading-relaxed">
              Minimum 8 characters • at least 1 uppercase, 1 lowercase, and 1 number
            </p>
          </div>
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button variant="primary" onClick={handleChangePassword}>
              Update Password
            </Button>
            {pwStatus && (
              <span
                className={`text-[11px] font-medium ${
                  pwStatus.includes('success') || pwStatus.includes('changed')
                    ? 'text-emerald-400'
                    : pwStatus === 'saving'
                    ? 'text-slate-400'
                    : 'text-rose-400'
                }`}
              >
                {pwStatus === 'saving' ? 'Updating...' : pwStatus}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Agent Config Shell (preserved existing section) */}
      <Card
        title={
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>AI Agent Configuration</span>
          </div>
        }
        subtitle="General operational parameters"
      >
        <div className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Agent Persona Display Name</label>
            <input
              type="text"
              defaultValue="DealPilot AI Sales Representative"
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Default Escalation Threshold</label>
            <input
              type="text"
              defaultValue="High Value (> $50,000 ARR)"
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button variant="outline">Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
}

export default Settings;
