'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { Expense, Profile, MemberFinancialSummary } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { Card } from '@/components/ui/Card';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Sparkles, TrendingUp, PieChart as PieIcon, Lightbulb, BarChart3 } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6'];

export default function AdminAnalyticsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [summaries, setSummaries] = useState<MemberFinancialSummary[]>([]);
  const [period, setPeriod] = useState<'7d' | '10d' | '30d'>('30d');

  const loadData = () => {
    const mems = DataStore.getProfiles().filter((p) => p.role === 'member');
    setProfiles(mems);
    setSummaries(mems.map((m) => DataStore.getMemberFinancialSummary(m.id)));
    setExpenses(DataStore.getExpenses());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(loadData);
    return () => unsub();
  }, []);

  const periodDays = period === '7d' ? 7 : period === '10d' ? 10 : 30;
  const filteredExpenses = useMemo(() => {
    const past = new Date();
    past.setDate(past.getDate() - periodDays);
    const pastStr = past.toISOString().split('T')[0];
    return expenses.filter((e) => e.expense_date >= pastStr);
  }, [expenses, periodDays]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category distribution
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const name = e.category?.name || 'Other';
      map.set(name, (map.get(name) || 0) + e.amount);
    });

    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSpent > 0 ? Number(((amount / totalSpent) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalSpent]);

  // Spending trend by date
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().split('T')[0], 0);
    }

    filteredExpenses.forEach((e) => {
      if (map.has(e.expense_date)) {
        map.set(e.expense_date, (map.get(e.expense_date) || 0) + e.amount);
      }
    });

    return Array.from(map.entries()).map(([date, amount]) => {
      const d = new Date(date);
      return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        amount,
      };
    });
  }, [filteredExpenses, periodDays]);

  // Dynamic Data-Backed Insights (Section 30)
  const insights = useMemo(() => {
    const list: string[] = [];
    if (categoryData.length > 0) {
      list.push(`${categoryData[0].name} represents the largest share of family spending (${categoryData[0].percentage}% of total).`);
    }

    const fastPaceMembers = summaries.filter(
      (s) => s.allocatedAmount > 0 && s.totalSpent / s.allocatedAmount > (30 - s.daysRemaining) / 30
    );
    if (fastPaceMembers.length > 0) {
      list.push(`${fastPaceMembers.length} family members are currently spending faster than their expected linear budget pace.`);
    }

    const totalAllocated = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
    if (totalAllocated > 0) {
      const usage = ((totalSpent / totalAllocated) * 100).toFixed(0);
      list.push(`The family has utilized ${usage}% of total allocated reserves for this ${period} period.`);
    }

    const overBudgetMembers = summaries.filter((s) => s.health === 'over_budget');
    if (overBudgetMembers.length > 0) {
      list.push(`${overBudgetMembers.length} member has crossed their allocated allowance.`);
    } else {
      list.push('No member has exceeded their hard budget limit.');
    }

    return list;
  }, [categoryData, summaries, totalSpent, period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Family Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Holistic data visualization and financial intelligence
          </p>
        </div>

        {/* Period Selector (Section 29) */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {(
            [
              { id: '7d', label: '7 Days' },
              { id: '10d', label: '10 Days' },
              { id: '30d', label: '30 Days' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === p.id
                  ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Insights Card (Section 30) */}
      <Card className="p-5 bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900 border-indigo-200 dark:border-indigo-900">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Automated Family Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((text, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-border text-xs text-gray-700 dark:text-gray-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts Grid (Section 29) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Family Spending Trend</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [formatPKR(val), 'Spent']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4F46E5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution Pie */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Category Distribution</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {categoryData.map((e, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [formatPKR(v), 'Amount']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Financial Analytics Matrix (Total, Daily, Average, Share) */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Category Financial Analytics ({periodDays}-Day Window)
              </h3>
              <p className="text-[11px] text-gray-500">
                Detailed category totals, daily average expenditure rate, transaction frequency, and top spender
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Period Total</th>
                <th className="py-3 px-4">Daily Avg</th>
                <th className="py-3 px-4">Today Spent</th>
                <th className="py-3 px-4">Timeframe Share</th>
                <th className="py-3 px-4">Txn Count</th>
                <th className="py-3 px-4">Top Spender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categoryData.length > 0 ? (
                categoryData.map((cat) => {
                  const catExpenses = filteredExpenses.filter(
                    (e) => (e.category?.name || 'Other') === cat.name
                  );
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todaySpent = catExpenses
                    .filter((e) => e.expense_date === todayStr)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const avgDaily = Number((cat.amount / periodDays).toFixed(0));

                  // Member spend map
                  const memberMap = new Map<string, number>();
                  catExpenses.forEach((e) => {
                    memberMap.set(e.member_id, (memberMap.get(e.member_id) || 0) + e.amount);
                  });

                  let topMemberName = 'None';
                  let topMemberAmount = 0;
                  memberMap.forEach((amt, mId) => {
                    if (amt > topMemberAmount) {
                      topMemberAmount = amt;
                      const p = profiles.find((prof) => prof.id === mId);
                      if (p) topMemberName = p.full_name;
                    }
                  });

                  return (
                    <tr key={cat.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <CategoryIcon name={cat.name} size={18} />
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-red-600 dark:text-red-400">
                        {formatPKR(cat.amount)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        {formatPKR(avgDaily)} / day
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                        {formatPKR(todaySpent)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, cat.percentage)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                            {cat.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        {catExpenses.length}
                      </td>
                      <td className="py-3.5 px-4">
                        {topMemberAmount > 0 ? (
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {topMemberName.split(' ')[0]} ({formatPKR(topMemberAmount)})
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-gray-400">
                    No data recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
