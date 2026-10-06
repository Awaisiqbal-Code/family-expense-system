'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DataStore, subscribe } from '@/services/store';
import { MemberFinancialSummary, Expense } from '@/types';
import { formatPKR, generateSpendingFeedback, calculateGamificationBadges } from '@/lib/calculations/financial';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatDate } from '@/lib/utils';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  Wallet,
  TrendingDown,
  Calendar,
  Zap,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CalendarCheck,
  Award,
  AlertCircle,
  Coins,
} from 'lucide-react';
import Link from 'next/link';

export default function MemberDashboardPage() {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const [summary, setSummary] = useState<MemberFinancialSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Add Money Form state
  const [moneyAmount, setMoneyAmount] = useState('');
  const [moneySource, setMoneySource] = useState('Allowance from Admin');
  const [moneyNotes, setMoneyNotes] = useState('');

  useEffect(() => {
    const loadData = () => {
      if (!currentUser) return;
      try {
        const sum = DataStore.getMemberFinancialSummary(currentUser.id);
        setSummary(sum);
        const expenses = DataStore.getExpenses({ member_id: currentUser.id }).slice(0, 5);
        setRecentExpenses(expenses);
      } catch (err) {
        console.error('Error loading member summary', err);
      }
    };

    loadData();
    const unsub = subscribe(loadData);
    return () => unsub();
  }, [currentUser]);

  if (!currentUser || !summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
        <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const feedback = generateSpendingFeedback(
    summary.allocatedAmount,
    summary.totalSpent,
    summary.remainingBudget,
    summary.daysRemaining
  );

  const badges = calculateGamificationBadges(
    summary.allocatedAmount,
    summary.totalSpent,
    summary.daysRemaining,
    summary.recentExpensesCount
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const badgeIcons: Record<string, React.ReactNode> = {
    ShieldCheck: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    TrendingUp: <TrendingUp className="w-4 h-4 text-indigo-500" />,
    CalendarCheck: <CalendarCheck className="w-4 h-4 text-blue-500" />,
    Award: <Award className="w-4 h-4 text-amber-500" />,
  };

  const handleRecordMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(moneyAmount);
    if (isNaN(amt) || amt <= 0) {
      error('Invalid Amount', 'Please enter a positive amount.');
      return;
    }

    try {
      DataStore.addMoneyReceived({
        member_id: currentUser.id,
        amount: amt,
        source: moneySource.trim(),
        notes: moneyNotes.trim(),
        verified: true,
      });
      success('Money Recorded', `Rs. ${amt.toLocaleString()} added to your period balance.`);
      setIsAddMoneyOpen(false);
      setMoneyAmount('');
      setMoneyNotes('');
    } catch (err: any) {
      error('Failed', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {getGreeting()}, {currentUser.full_name.split(' ')[0]} 👋
            </h1>
            {summary.activePeriod && (
              <span className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-primary px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                {summary.activePeriod.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Here&apos;s your personal spending overview for this period.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddMoneyOpen(true)}>
            <Coins className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>Add Money</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddExpenseOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Friendly Spending Feedback */}
      <div
        className={`p-4 rounded-card border flex items-start gap-3 transition-colors ${
          feedback.type === 'danger'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
            : feedback.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
            : feedback.type === 'caution'
            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="mt-0.5">
          {feedback.type === 'danger' ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">{feedback.title}</h4>
          <p className="text-xs mt-0.5 leading-relaxed opacity-90">{feedback.message}</p>
        </div>
      </div>

      {/* Main Hero Card with Animated Progress Ring */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-white via-white to-indigo-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 text-center md:text-left flex-1">
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Remaining Budget
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                    summary.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatPKR(summary.remainingBudget)}
                </span>
                <Badge status={summary.health} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-border/60">
              <div>
                <span className="text-[11px] text-gray-400 block">Money Received</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPKR(summary.allocatedAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Total Spent</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPKR(summary.totalSpent)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Days Left</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {summary.daysRemaining} days
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <ProgressRing
              percentage={summary.remainingPercentage}
              size={150}
              strokeWidth={12}
              label={summary.isOverBudget ? 'Over Budget' : 'Remaining'}
              sublabel={`${summary.spentPercentage}% used`}
              isOverBudget={summary.isOverBudget}
            />
          </div>
        </div>
      </Card>

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-500">Remaining</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPKR(summary.remainingBudget)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {summary.remainingPercentage}% available
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Spent</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPKR(summary.totalSpent)}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{summary.spentPercentage}% of allocation</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-primary flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-500">Allocated</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPKR(summary.allocatedAmount)}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{summary.activePeriod?.name || 'Period allowance'}</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-500">Daily Pace</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPKR(summary.suggestedDailyPace)}
            <span className="text-xs font-normal text-gray-400">/day</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Suggested guidance pace</span>
        </Card>
      </div>

      {/* Gamification Achievements */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Habit Milestones</h3>
            <p className="text-[11px] text-gray-500">Track and build positive budgeting habits</p>
          </div>
          <span className="text-xs font-semibold text-primary">
            {badges.filter((b) => b.unlocked).length} of {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3 rounded-xl border text-center transition-all ${
                b.unlocked
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                  : 'bg-gray-50/50 dark:bg-gray-800/40 border-border opacity-60'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center mx-auto mb-1.5">
                {badgeIcons[b.icon]}
              </div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{b.title}</h4>
              <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">{b.description}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${b.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Personal Transactions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Expenses</h3>
            <p className="text-[11px] text-gray-500">Latest activity from your personal allowance</p>
          </div>
          <Link
            href="/member/expenses"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No expenses recorded for this period yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                    <CategoryIcon name={exp.category?.name} icon={exp.category?.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span>{exp.category?.name}</span>
                      <span>&bull;</span>
                      <span>{formatDate(exp.expense_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    -{formatPKR(exp.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Money Modal (Section 26) */}
      <Modal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        title="Record Received Money"
        description="Add money received to your available balance for this period"
      >
        <form onSubmit={handleRecordMoney} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Amount (PKR)
            </label>
            <input
              type="number"
              required
              min="1"
              value={moneyAmount}
              onChange={(e) => setMoneyAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-lg font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Source / Giver
            </label>
            <input
              type="text"
              required
              value={moneySource}
              onChange={(e) => setMoneySource(e.target.value)}
              placeholder="e.g. Monthly Allowance, Dad, Gift"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={moneyNotes}
              onChange={(e) => setMoneyNotes(e.target.value)}
              placeholder="Any details"
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMoneyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Record Money
            </Button>
          </div>
        </form>
      </Modal>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        memberId={currentUser.id}
      />
    </div>
  );
}
