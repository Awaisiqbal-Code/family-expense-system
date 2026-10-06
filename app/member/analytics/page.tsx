'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DataStore, subscribe } from '@/services/store';
import { Expense } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react';

const COLORS = ['#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#6366F1', '#14B8A6', '#6B7280'];

type AnalyticsPeriod = '7d' | '10d' | '30d';

export default function MemberAnalyticsPage() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  useEffect(() => {
    const load = () => {
      if (!currentUser) return;
      const exps = DataStore.getExpenses({ member_id: currentUser.id });
      setExpenses(exps);
    };
    load();
    const unsub = subscribe(load);
    return () => unsub();
  }, [currentUser]);

  // Filter expenses by selected period
  const filteredExpenses = useMemo(() => {
    const days = period === '7d' ? 7 : period === '10d' ? 10 : 30;
    const past = new Date();
    past.setDate(past.getDate() - days);
    const pastStr = past.toISOString().split('T')[0];
    return expenses.filter((e) => e.expense_date >= pastStr);
  }, [expenses, period]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number }>();
    filteredExpenses.forEach((e) => {
      const name = e.category?.name || 'Other';
      const existing = map.get(name) || { name, amount: 0, count: 0 };
      existing.amount += e.amount;
      existing.count += 1;
      map.set(name, existing);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        percentage: totalSpent > 0 ? Number(((item.amount / totalSpent) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalSpent]);

  // Daily spending trend
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    const days = period === '7d' ? 7 : period === '10d' ? 10 : 30;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map.set(key, 0);
    }

    filteredExpenses.forEach((e) => {
      if (map.has(e.expense_date)) {
        map.set(e.expense_date, (map.get(e.expense_date) || 0) + e.amount);
      }
    });

    return Array.from(map.entries()).map(([date, amount]) => {
      const d = new Date(date);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return { date: label, amount };
    });
  }, [filteredExpenses, period]);

  return (
    <div className="space-y-6">
      {/* Header with Period Selector (Section 15) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Personal Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Spending insights and trends for your personal allowance
          </p>
        </div>

        {/* Period Selector: 7 Days / 10 Days / 30 Days */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 self-start sm:self-auto">
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

      {/* Overview Stat */}
      <Card className="p-5 bg-gradient-to-br from-indigo-500 to-primary text-white border-none shadow-premium">
        <span className="text-xs font-semibold opacity-90 uppercase tracking-wider block">
          Total Spent ({period === '7d' ? 'Last 7 Days' : period === '10d' ? 'Last 10 Days' : 'Last 30 Days'})
        </span>
        <div className="text-3xl font-black tracking-tight mt-1">{formatPKR(totalSpent)}</div>
        <div className="text-xs opacity-80 mt-1">
          Across {filteredExpenses.length} transactions in this timeframe
        </div>
      </Card>

      {/* Category Breakdown: Donut Chart & List (Section 15) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Category Breakdown</h3>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-12">
              No expenses recorded for this period
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatPKR(val), 'Amount']}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Category Percentages List */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Category Distribution</h3>
          {categoryData.length === 0 ? (
            <div className="text-xs text-gray-400 py-12 text-center">No categories to display</div>
          ) : (
            <div className="space-y-3">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gray-500 font-medium">{item.percentage}%</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatPKR(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Spending Trend Bar Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Daily Spending Trend</h3>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `Rs.${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val: number) => [formatPKR(val), 'Spent']}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
