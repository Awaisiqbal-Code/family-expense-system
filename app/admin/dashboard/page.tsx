'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DataStore, subscribe } from '@/services/store';
import { FamilyFinancialOverview, AuditLog, Expense } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import Link from 'next/link';
import {
  Wallet,
  TrendingDown,
  PieChart as PieIcon,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Receipt,
  FileBarChart2,
  Activity,
  UserCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState<FamilyFinancialOverview | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '10d' | '30d'>('30d');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const o = DataStore.getFamilyFinancialOverview();
        setOverview(o);
        setRecentLogs(DataStore.getAuditLogs().slice(0, 5));
        setRecentExpenses(DataStore.getExpenses().slice(0, 5));
      } catch (err) {
        console.error('Error loading admin overview', err);
      }
    };
    load();
    const unsub = subscribe(load);
    return () => unsub();
  }, []);

  if (!overview) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Member comparison chart data
  const memberComparisonData = overview.membersSummary.map((s) => ({
    name: s.member.full_name.split(' ')[0],
    Allocated: s.allocatedAmount,
    Spent: s.totalSpent,
    Remaining: Math.max(0, s.remainingBudget),
  }));

  // Budget status donut data
  const statusPieData = [
    { name: 'Healthy', value: overview.healthyMembersCount, color: '#10B981' },
    { name: 'Watch', value: overview.watchMembersCount, color: '#F59E0B' },
    { name: 'Over Budget', value: overview.overBudgetMembersCount, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header (Section 20) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Good Morning, {currentUser?.full_name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Here&apos;s your family&apos;s overall financial overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddExpenseOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Record Expense</span>
          </Button>
          <Link href="/admin/members">
            <Button variant="primary" size="sm">
              <Users className="w-3.5 h-3.5 mr-1" />
              <span>Manage Members</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Access Requests Banner Alert */}
      {DataStore.getAccessRequests().filter((r) => r.status === 'pending').length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-gray-900 dark:to-gray-900 border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {DataStore.getAccessRequests().filter((r) => r.status === 'pending').length} Pending Account Access Request(s)
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                New member sign-up requests require your approval. Approving sends account details to their email.
              </p>
            </div>
          </div>
          <Link href="/admin/members">
            <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              <span>Review Requests &rarr;</span>
            </Button>
          </Link>
        </Card>
      )}

      {/* Top 4 Metrics Cards (Section 20) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Total Allocated</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-primary flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatPKR(overview.totalAllocated)}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Across all family members</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Total Spent</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatPKR(overview.totalSpent)}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            {overview.overallUsagePercentage}% of family budget
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Remaining</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatPKR(overview.totalRemaining)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
            Family balance safe
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Active Members</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {overview.activeMembersCount}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            {overview.overBudgetMembersCount > 0 ? (
              <span className="text-red-500 font-bold">{overview.overBudgetMembersCount} over budget</span>
            ) : (
              'All budgets on track'
            )}
          </span>
        </Card>
      </div>

      {/* Main Charts Row: Family Spending Comparison & Budget Utilization (Section 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Comparison Bar Chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Member Spending Comparison</h3>
              <p className="text-[11px] text-gray-500">Compare allocated allowances vs recorded spending</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberComparisonData} barSize={14}>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [formatPKR(val), '']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Allocated" fill="#E0E7FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget Health Ring / Donut */}
        <Card className="p-5 flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Budget Health Status</h3>
            <p className="text-[11px] text-gray-500">Active member allocation distribution</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center text-xs">
            <div>
              <span className="block text-[10px] text-gray-400">Healthy</span>
              <span className="font-bold text-emerald-600">{overview.healthyMembersCount}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400">Watch</span>
              <span className="font-bold text-amber-600">{overview.watchMembersCount}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400">Over</span>
              <span className="font-bold text-red-600">{overview.overBudgetMembersCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Member Quick Health Overview Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Family Members Overview</h3>
            <p className="text-[11px] text-gray-500">Live budget usage across all family members</p>
          </div>
          <Link href="/admin/members" className="text-xs font-semibold text-primary hover:underline">
            View All Members &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overview.membersSummary.map((sum) => (
                <tr key={sum.member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={sum.member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt={sum.member.full_name}
                        className="w-7 h-7 rounded-full object-cover border"
                      />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {sum.member.full_name}
                        </span>
                        <span className="text-[10px] text-gray-400">{sum.member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                    {formatPKR(sum.allocatedAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-red-600 dark:text-red-400">
                    {formatPKR(sum.totalSpent)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                    {formatPKR(sum.remainingBudget)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sum.isOverBudget
                              ? 'bg-red-500'
                              : sum.health === 'watch'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, sum.spentPercentage)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                        {sum.spentPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={sum.health} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/members/${sum.member.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category-Wise Financial Breakdown Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Category-Wise Financial Breakdown</h3>
            <p className="text-[11px] text-gray-500">Comprehensive category totals, daily spending averages, and top spenders</p>
          </div>
          <Link href="/admin/reports" className="text-xs font-semibold text-primary hover:underline">
            Full Reports &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Today Spent</th>
                <th className="py-3 px-4">Daily Avg</th>
                <th className="py-3 px-4">Family Share</th>
                <th className="py-3 px-4">Txns</th>
                <th className="py-3 px-4">Top Spender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overview.categorySummaries && overview.categorySummaries.length > 0 ? (
                overview.categorySummaries.map((catSum) => (
                  <tr key={catSum.category.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon name={catSum.category.name} icon={catSum.category.icon} size={18} />
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {catSum.category.name}
                          </span>
                          <span className="text-[10px] text-gray-400">Category</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-red-600 dark:text-red-400">
                      {formatPKR(catSum.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                      {formatPKR(catSum.todaySpent)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      {formatPKR(catSum.avgDailySpent)} / day
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, catSum.percentageOfTotal)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          {catSum.percentageOfTotal}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {catSum.transactionCount}
                    </td>
                    <td className="py-3.5 px-4">
                      {catSum.topSpendingMember ? (
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {catSum.topSpendingMember.name} ({formatPKR(catSum.topSpendingMember.amount)})
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">None</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-gray-400">
                    No category data recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Activity Feeds: Recent Expenses & Audit Logs (Section 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Family Expenses */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Family Expenses</h3>
            </div>
            <Link href="/admin/expenses" className="text-xs text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CategoryIcon name={exp.category?.name} icon={exp.category?.icon} size={15} />
                  <div className="min-w-0">
                    <span className="font-bold text-gray-900 dark:text-white truncate block">
                      {exp.description}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {DataStore.getProfile(exp.member_id)?.full_name} &bull; {formatDate(exp.expense_date)}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400 shrink-0">
                  -{formatPKR(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Audit Log (Section 6 & 21) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Admin Audit Trail</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white block">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    By {log.actor_name || 'Admin'} &bull; {formatDateTime(log.created_at)}
                  </span>
                </div>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono">
                  {log.entity_type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
}
