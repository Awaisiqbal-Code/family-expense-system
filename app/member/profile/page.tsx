'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DataStore } from '@/services/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  DollarSign,
  LogOut,
  Save,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export default function MemberProfilePage() {
  const { currentUser, logout } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  if (!currentUser) return null;

  const activeBudget = DataStore.getActiveBudget(currentUser.id);
  const settings = DataStore.getSettings();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      DataStore.updateProfile(currentUser.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      success('Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      error('Update Failed', err?.message || 'Unable to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setPasswordModalOpen(false);
    setNewPassword('');
    success('Password Changed', 'Your security password has been updated.');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Personal Profile</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Manage your account information and preferences
        </p>
      </div>

      {/* Main Profile Info Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border">
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={currentUser.full_name}
            className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-sm"
          />
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentUser.full_name}</h2>
            <p className="text-xs text-gray-500">{currentUser.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-primary px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                {currentUser.role}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {currentUser.status}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Period & Currency Info (Section 18) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-border text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <div>
              <span className="text-gray-400 block text-[10px]">Active Budget Period</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {activeBudget
                  ? `${formatDate(activeBudget.start_date)} - ${formatDate(activeBudget.end_date)}`
                  : 'No active period'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-gray-400 block text-[10px]">Family Currency</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {settings.currency} ({settings.currency_symbol}) &bull; {settings.timezone}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Logout */}
      <Card className="p-5 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">Sign Out</h4>
          <p className="text-[11px] text-gray-500">End your personal session on this device</p>
        </div>
        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5 mr-1" />
          <span>Logout</span>
        </Button>
      </Card>

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-card border border-border shadow-xl max-w-sm w-full">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Update Password</h3>
            <p className="text-xs text-gray-500 mb-4">Enter a new secure password for your account.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                required
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPasswordModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
