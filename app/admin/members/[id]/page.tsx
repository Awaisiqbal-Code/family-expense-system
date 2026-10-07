'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DataStore, subscribe } from '@/services/store';
import { MemberFinancialSummary, Expense } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
  ArrowLeft as BackIcon,
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
  FileText,
  Clock,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const memberId = params.id as string;

  const [summary, setSummary] = useState<MemberFinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'budget' | 'notes'>('overview');

  // Budget Adjust Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notes
  const [notes, setNotes] = useState('Member allowance allocated for recurring monthly living expenses.');

  useEffect(() => {
    const load = () => {
      try {
        const sum = DataStore.getMemberFinancialSummary(memberId);
        setSummary(sum);
        setNewBudget(sum.allocatedAmount.toString());
        setExpenses(DataStore.getExpenses({ member_id: memberId }));
      } catch (err) {
        console.error('Member not found', err);
      }
    };
    load();
    const unsub = subscribe(load);
    return () => unsub();
  }, [memberId]);

  if (!summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount < 0) {
      error('Invalid Amount', 'Please provide a valid allocation.');
      return;
    }
    try {
      DataStore.updateBudget({
        member_id: summary.member.id,
        allocated_amount: amount,
        start_date: '2026-10-01',
        end_date: '2026-10-31',
      });
      success('Budget Updated', `Allocated budget set to ${formatPKR(amount)}.`);
      setIsBudgetModalOpen(false);
    } catch (err: any) {
      error('Failed', err?.message);
    }
  };

  const handleDeleteMember = () => {
    if (!summary) return;
    try {
      DataStore.deleteMember(summary.member.id);
      success('Account Deleted', `Member account for ${summary.member.full_name} has been permanently deleted.`);
      router.push('/admin/members');
    } catch (err: any) {
      error('Deletion Failed', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Member Header */}
      <div>
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline mb-3"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>Back to Members</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={summary.member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
              alt={summary.member.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {summary.member.full_name}
                </h1>
                <Badge status={summary.health} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {summary.member.email} {summary.member.phone && `&bull; ${summary.member.phone}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsBudgetModalOpen(true)}>
              <WalletIcon className="w-3.5 h-3.5 mr-1.5" />
              <span>Adjust Budget</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Delete Member</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs (Section 24: Overview, Expenses, Budget, Notes) */}
      <div className="flex border-b border-border gap-2">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'expenses', label: `Expenses (${expenses.length})` },
            { id: 'budget', label: 'Budget Plan' },
            { id: 'notes', label: 'Admin Notes' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-2 px-4 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-primary text-primary bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[11px] text-gray-400 block">Allocated Budget</span>
              <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatPKR(summary.allocatedAmount)}
              </div>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] text-gray-400 block">Total Spent</span>
              <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatPKR(summary.totalSpent)}
              </div>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] text-gray-400 block">Remaining</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatPKR(summary.remainingBudget)}
              </div>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] text-gray-400 block">Suggested Daily Pace</span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatPKR(summary.suggestedDailyPace)}/day
              </div>
            </Card>
          </div>

          <Card className="p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Active Period Progress</h3>
              <p className="text-xs text-gray-500 max-w-md">
                This member has used {summary.spentPercentage}% of their allocation. There are {summary.daysRemaining} days remaining in this cycle.
              </p>
            </div>
            <ProgressRing
              percentage={summary.remainingPercentage}
              size={140}
              strokeWidth={12}
              label={summary.isOverBudget ? 'Over Budget' : 'Remaining'}
              sublabel={`${summary.spentPercentage}% spent`}
              isOverBudget={summary.isOverBudget}
            />
          </Card>
        </div>
      )}

      {/* Tab: Expenses */}
      {activeTab === 'expenses' && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-border">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center">
                    <CategoryIcon name={exp.category?.name} icon={exp.category?.icon} size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">{exp.description}</span>
                    <span className="text-[11px] text-gray-400">
                      {exp.category?.name} &bull; {formatDate(exp.expense_date)}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                  -{formatPKR(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Budget Plan */}
      {activeTab === 'budget' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Current Allocation Terms</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-gray-400 block text-[10px]">Start Date</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {summary.activeBudget?.start_date || '2026-10-01'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-gray-400 block text-[10px]">End Date</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {summary.activeBudget?.end_date || '2026-10-31'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsBudgetModalOpen(true)}>
            Edit Allocation Amount
          </Button>
        </Card>
      )}

      {/* Tab: Admin Notes */}
      {activeTab === 'notes' && (
        <Card className="p-6 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Internal Administrator Notes</h3>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => success('Notes Saved', 'Internal note updated.')}>
              Save Note
            </Button>
          </div>
        </Card>
      )}

      {/* Adjust Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Adjust Budget"
        description={`Set new allowance amount for ${summary.member.full_name}`}
      >
        <form onSubmit={handleUpdateBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Allocated Amount (PKR)
            </label>
            <input
              type="number"
              required
              min="0"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Member Account"
          description="Permanently scrub account and all financial records"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900 dark:text-red-200 space-y-1">
                <p className="font-bold">Critical Action Warning</p>
                <p>
                  You are about to permanently delete <strong>{summary.member.full_name}</strong> (@{summary.member.username}).
                </p>
                <p className="text-[11px] opacity-90">
                  All budget allocations, expense records, notes, and credentials for this member will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteMember}
                className="bg-red-600 hover:bg-red-700 text-white gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Permanent Deletion</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
