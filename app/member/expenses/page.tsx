'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DataStore, subscribe } from '@/services/store';
import { Expense, Category } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import { useToast } from '@/components/ui/Toast';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Calendar,
  Receipt,
  X,
} from 'lucide-react';

type TabPeriod = 'today' | '7d' | '10d' | '30d' | 'all';

export default function MemberExpensesPage() {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<TabPeriod>('30d');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      if (!currentUser) return;
      const exps = DataStore.getExpenses({ member_id: currentUser.id });
      setExpenses(exps);
      setCategories(DataStore.getCategories());
    };
    load();
    const unsub = subscribe(load);
    return () => unsub();
  }, [currentUser]);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Filter by period tabs
    if (tab === 'today') {
      list = list.filter((e) => e.expense_date === todayStr);
    } else if (tab === '7d') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      const pastStr = past.toISOString().split('T')[0];
      list = list.filter((e) => e.expense_date >= pastStr);
    } else if (tab === '10d') {
      const past = new Date();
      past.setDate(past.getDate() - 10);
      const pastStr = past.toISOString().split('T')[0];
      list = list.filter((e) => e.expense_date >= pastStr);
    } else if (tab === '30d') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const pastStr = past.toISOString().split('T')[0];
      list = list.filter((e) => e.expense_date >= pastStr);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category_id === selectedCategory);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category?.name.toLowerCase().includes(q) ||
          e.amount.toString().includes(q)
      );
    }

    return list;
  }, [expenses, tab, selectedCategory, search]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string, description: string) => {
    if (!currentUser) return;
    if (window.confirm(`Delete expense "${description}"?`)) {
      try {
        DataStore.deleteExpense(id, currentUser.id);
        success('Expense Deleted', 'Transaction removed and budget recalculated.');
      } catch (err: any) {
        error('Delete Failed', err?.message || 'Unable to delete');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Expense History</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            View, filter, and track all your recorded expenses
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsAddExpenseOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Tabs (Section 14: Today, 7 Days, 10 Days, 30 Days, All) */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-border">
        {(
          [
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '10d', label: '10 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'all', label: 'All Time' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filters & Search Row */}
      <Card className="p-4 bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or category..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs">
          <span className="text-gray-500">
            Showing <strong className="text-gray-900 dark:text-white">{filteredExpenses.length}</strong> transactions
          </span>
          <span className="text-gray-500">
            Total Spent:{' '}
            <strong className="text-red-600 dark:text-red-400 font-bold">{formatPKR(totalFiltered)}</strong>
          </span>
        </div>
      </Card>

      {/* Expense Items List */}
      <Card className="p-0 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No expenses found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No transactions match your current filters. Try selecting another period or adding a new expense.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                    <CategoryIcon name={exp.category?.name} icon={exp.category?.icon} size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                      {exp.description}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {exp.category?.name || 'Expense'}
                      </span>
                      <span>&bull;</span>
                      <span>{formatDate(exp.expense_date)}</span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span className="hidden sm:inline">{formatDateTime(exp.created_at).split(', ')[1]}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-red-600 dark:text-red-400">
                    -{formatPKR(exp.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(exp.id, exp.description)}
                    className="p-1.5 text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        memberId={currentUser?.id}
      />
    </div>
  );
}
