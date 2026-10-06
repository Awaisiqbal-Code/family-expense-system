'use client';

import React, { useState, useEffect } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { FamilySettings, Category, FinancialPeriod, Profile, MemberFinancialSummary, AuditLog } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useToast } from '@/components/ui/Toast';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  Settings,
  Calendar,
  RotateCcw,
  AlertTriangle,
  History,
  ShieldAlert,
  Save,
  CheckCircle2,
  Users,
  Plus,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<FamilySettings>(DataStore.getSettings());
  const [activePeriod, setActivePeriod] = useState<FinancialPeriod | undefined>(DataStore.getActivePeriod());
  const [allPeriods, setAllPeriods] = useState<FinancialPeriod[]>(DataStore.getFinancialPeriods());
  const [members, setMembers] = useState<MemberFinancialSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>(DataStore.getCategories());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DataStore.getAuditLogs());

  // General Settings Form
  const [familyName, setFamilyName] = useState(settings.family_name);
  const [allowOverBudget, setAllowOverBudget] = useState(settings.allow_over_budget);

  // New Period Form Modal
  const [newPeriodModalOpen, setNewPeriodModalOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // Reset One Member Modal
  const [resetMemberModalOpen, setResetMemberModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Reset All Confirmation Modal (Requires typing 'RESET') (Section 14 & 20)
  const [resetAllModalOpen, setResetAllModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [nextPeriodName, setNextPeriodName] = useState('');

  const sync = () => {
    const s = DataStore.getSettings();
    setSettings(s);
    setFamilyName(s.family_name);
    setAllowOverBudget(s.allow_over_budget);
    setActivePeriod(DataStore.getActivePeriod());
    setAllPeriods(DataStore.getFinancialPeriods());
    const profiles = DataStore.getProfiles().filter((p) => p.role === 'member');
    setMembers(profiles.map((p) => DataStore.getMemberFinancialSummary(p.id)));
    setCategories(DataStore.getCategories());
    setAuditLogs(DataStore.getAuditLogs());
  };

  useEffect(() => {
    sync();
    const unsub = subscribe(sync);
    return () => unsub();
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      DataStore.updateSettings({
        family_name: familyName.trim(),
        allow_over_budget: allowOverBudget,
      });
      success('Settings Saved', 'Family preferences have been updated.');
    } catch (err: any) {
      error('Failed', err?.message);
    }
  };

  const handleStartNewPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      DataStore.startNewFinancialPeriod(newPeriodName, newStartDate, newEndDate);
      success('New Period Started', `Closed previous period and initiated "${newPeriodName}". Starting balance is Rs. 0.`);
      setNewPeriodModalOpen(false);
    } catch (err: any) {
      error('Failed', err?.message);
    }
  };

  const handleResetMember = () => {
    if (!selectedMemberId) return;
    try {
      DataStore.resetMemberBalance(selectedMemberId);
      success('Member Balance Reset', 'The member balance for the active period was reset to Rs. 0.');
      setResetMemberModalOpen(false);
    } catch (err: any) {
      error('Reset Failed', err?.message);
    }
  };

  const handleConfirmResetAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationInput.trim().toUpperCase() !== 'RESET') {
      error('Invalid Confirmation', 'You must type RESET exactly to confirm.');
      return;
    }
    try {
      DataStore.resetAllMembers(confirmationInput, nextPeriodName);
      success('Financial Reset Completed', 'All active balances closed and fresh zero-balance period initiated.');
      setResetAllModalOpen(false);
      setConfirmationInput('');
      setNextPeriodName('');
    } catch (err: any) {
      error('Reset Failed', err?.message);
    }
  };

  const totalFamilyBalance = members.reduce((sum, m) => sum + Math.max(0, m.remainingBudget), 0);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">System Settings & Controls</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Manage family parameters, financial periods, safety resets, and security audit logs
        </p>
      </div>

      {/* SECTION 1: FINANCIAL MANAGEMENT (Section 12 - 20) */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Financial Management</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Periods & Balances Control</h2>
          <p className="text-xs text-gray-500">
            Control family accounting cycles without deleting historical transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Period Card */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-gray-400">Current Financial Period</span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {activePeriod?.name || 'October 2026'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {activePeriod ? `${formatDate(activePeriod.start_date)} - ${formatDate(activePeriod.end_date)}` : 'Period Active'}
              </p>

              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Combined Family Balance:</span>
                  <strong className="text-emerald-600 font-bold">{formatPKR(totalFamilyBalance)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Family Members:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{members.length} members</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                  const endMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                  setNewPeriodName(nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));
                  setNewStartDate(nextMonth.toISOString().split('T')[0]);
                  setNewEndDate(endMonth.toISOString().split('T')[0]);
                  setNewPeriodModalOpen(true);
                }}
                className="flex-1"
              >
                Start New Period
              </Button>
            </div>
          </Card>

          {/* Reset Actions Card (Separate from password resets) */}
          <Card className="p-5 flex flex-col justify-between border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Period Balance Resets</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Safely close periods and set active balances to zero. <strong>Historical expense records and allowances are never deleted.</strong>
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-border text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">Reset One Member</span>
                    <span className="text-[11px] text-gray-400">Set single member available balance to Rs. 0</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (members.length > 0) setSelectedMemberId(members[0].member.id);
                      setResetMemberModalOpen(true);
                    }}
                  >
                    Select Member
                  </Button>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-border text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-600 dark:text-red-400 block">Reset All Members</span>
                    <span className="text-[11px] text-gray-400">Close cycle &amp; start new period with Rs. 0</span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setConfirmationInput('');
                      setResetAllModalOpen(true);
                    }}
                  >
                    Reset All
                  </Button>
                </div>

                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-700 dark:text-red-300 block">Purge Test Data (Factory Reset)</span>
                    <span className="text-[11px] text-red-600/80 dark:text-red-400">Wipe dummy test transactions &amp; ready for live launch</span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Clear all demo/test data and reset to fresh clean production state?')) {
                        if (typeof DataStore.resetToProductionState === 'function') {
                          DataStore.resetToProductionState();
                        } else {
                          localStorage.clear();
                        }
                        success('Production Ready', 'All test transactions purged. System is 100% fresh for live use.');
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      }
                    }}
                  >
                    Clean Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Previous Financial Periods Archive Table (Section 15 & 19) */}
        <Card className="p-0 overflow-hidden mt-4">
          <div className="p-4 border-b border-border bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Previous Financial Periods (Historical Archive)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Period Name</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Allocated / Received</th>
                  <th className="py-2.5 px-4">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allPeriods.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(p.start_date)} - {formatDate(p.end_date)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {p.closing_summary ? formatPKR(p.closing_summary.total_allocated) : 'In Progress'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {p.closing_summary ? formatPKR(p.closing_summary.closing_balance) : 'Live'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION 2: ACCOUNT MANAGEMENT (Section 19) */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Account Management</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Member Credentials & Access</h2>
          <p className="text-xs text-gray-500">
            Control individual member accounts, password resets, and login permissions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Add Member</h4>
            <p className="text-xs text-gray-500 mb-4">Create account and generate temporary password.</p>
            <Link href="/admin/members">
              <Button variant="outline" size="sm" className="w-full">
                Go to Members
              </Button>
            </Link>
          </Card>

          <Card className="p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Password Resets</h4>
            <p className="text-xs text-gray-500 mb-4">Generate new temporary password for any member.</p>
            <Link href="/admin/members">
              <Button variant="outline" size="sm" className="w-full">
                Reset Credentials
              </Button>
            </Link>
          </Card>

          <Card className="p-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Disable Accounts</h4>
            <p className="text-xs text-gray-500 mb-4">Temporarily block access without deleting data.</p>
            <Link href="/admin/members">
              <Button variant="outline" size="sm" className="w-full">
                Manage Access
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* SECTION 3: GENERAL SETTINGS (Section 9) */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">System Preferences</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Family Rules & Categories</h2>
        </div>

        <form onSubmit={handleSaveGeneral}>
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Family Name
              </label>
              <input
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Allow Over-Budget Spending</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  When enabled, members can still record expenses beyond allocated budgets (showing OVER BUDGET warning).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverBudget}
                  onChange={(e) => setAllowOverBudget(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm">
                Save Preferences
              </Button>
            </div>
          </Card>
        </form>
      </div>

      {/* SECTION 4: SECURITY AUDIT LOG (Section 21) */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Security</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Administrator Audit Log</h2>
          <p className="text-xs text-gray-500">Track all administrative actions, period resets, and credential changes</p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Administrator</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{log.actor_name || 'Admin'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-primary">{log.entity_type}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* MODAL: Start New Period (Section 16 & 17) */}
      <Modal
        isOpen={newPeriodModalOpen}
        onClose={() => setNewPeriodModalOpen(false)}
        title="Start New Financial Period"
        description="Close the active cycle and start with a fresh Rs. 0 balance"
      >
        <form onSubmit={handleStartNewPeriod} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Period Name
            </label>
            <input
              type="text"
              required
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              placeholder="e.g. November 2026"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                required
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                required
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
            Starting a new period will archive the current period&apos;s totals. Existing historical expenses are preserved. Members will start with Rs. 0.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setNewPeriodModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm &amp; Start
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reset One Member Balance (Section 13) */}
      <Modal
        isOpen={resetMemberModalOpen}
        onClose={() => setResetMemberModalOpen(false)}
        title="Reset Member Available Balance"
        description="Set current period allocation to Rs. 0 for a specific member"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary"
            >
              {members.map((m) => (
                <option key={m.member.id} value={m.member.id}>
                  {m.member.full_name} (@{m.member.username}) - Current Remaining: {formatPKR(m.remainingBudget)}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            This will set the member&apos;s available balance for this period to Rs. 0. Historical transaction records will NOT be deleted.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setResetMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleResetMember}>
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Reset All Members (Requires typing RESET) (Section 14 & 20) */}
      <Modal
        isOpen={resetAllModalOpen}
        onClose={() => setResetAllModalOpen(false)}
        title="⚠ Reset Entire Family Financial Period"
        description="Strong Confirmation Required"
      >
        <form onSubmit={handleConfirmResetAll} className="space-y-4">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 leading-relaxed">
            <strong>Warning:</strong> This will close the current period and reset all members to a Rs. 0 starting balance. Existing historical records will remain intact in reports.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              New Period Name (Optional)
            </label>
            <input
              type="text"
              value={nextPeriodName}
              onChange={(e) => setNextPeriodName(e.target.value)}
              placeholder="e.g. November 2026"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wider">
              Type RESET to continue
            </label>
            <input
              type="text"
              required
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="RESET"
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 dark:bg-gray-800 border border-red-300 dark:border-red-800 rounded-xl focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setResetAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={confirmationInput.trim() !== 'RESET'}
            >
              Confirm &amp; Start New Period
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
