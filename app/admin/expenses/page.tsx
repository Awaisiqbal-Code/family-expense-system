'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { Expense, Profile, Category } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import { useToast } from '@/components/ui/Toast';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Receipt,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import { downloadCSV } from '@/lib/utils';

export default function AdminExpensesPage() {
  const { success, error } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const loadData = () => {
    setExpenses(DataStore.getExpenses());
    setProfiles(DataStore.getProfiles());
    setCategories(DataStore.getCategories());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(loadData);
    return () => unsub();
  }, []);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    // Member filter
    if (selectedMember !== 'all') {
      list = list.filter((e) => e.member_id === selectedMember);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category_id === selectedCategory);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const mem = profiles.find((p) => p.id === e.member_id);
        return (
          e.description.toLowerCase().includes(q) ||
          e.category?.name.toLowerCase().includes(q) ||
          mem?.full_name.toLowerCase().includes(q) ||
          e.amount.toString().includes(q)
        );
      });
    }

    // Sorting (Section 26: Newest, Oldest, Highest, Lowest)
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      if (sortBy === 'oldest') return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [expenses, selectedMember, selectedCategory, search, sortBy, profiles]);

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`Delete expense "${desc}"?`)) {
      try {
        DataStore.deleteExpense(id, 'admin');
        success('Expense Deleted', 'Transaction removed and budget recalculated.');
      } catch (err: any) {
        error('Delete Failed', err?.message);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Member', 'Category', 'Description', 'Amount (PKR)'];
    const rows = filteredExpenses.map((e) => [
      e.expense_date,
      profiles.find((p) => p.id === e.member_id)?.full_name || 'Member',
      e.category?.name || 'Category',
      e.description,
      e.amount,
    ]);
    downloadCSV('family-expenses-report', headers, rows);
    success('Export Completed', 'CSV file downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Family Expenses</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit, filter, and inspect every recorded family transaction
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Export CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddExpenseOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Record Expense</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar (Section 26) */}
      <Card className="p-4 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search description or member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          {/* Member Filter */}
          <div>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Family Members</option>
              {profiles
                .filter((p) => p.role === 'member')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest">Sort: Highest Amount</option>
              <option value="lowest">Sort: Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs">
          <span className="text-gray-500">
            Filtered: <strong className="text-gray-900 dark:text-white">{filteredExpenses.length}</strong> transactions
          </span>
          <span className="text-gray-500">
            Total Spent:{' '}
            <strong className="text-red-600 dark:text-red-400 font-bold">{formatPKR(totalFilteredAmount)}</strong>
          </span>
        </div>
      </Card>

      {/* Category-Wise Quick Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const catExpenses = filteredExpenses.filter((e) => e.category_id === cat.id);
          const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
          const todayStr = new Date().toISOString().split('T')[0];
          const catToday = catExpenses
            .filter((e) => e.expense_date === todayStr)
            .reduce((sum, e) => sum + e.amount, 0);

          return (
            <Card key={cat.id} className="p-3 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}>
              <div className="flex items-center justify-between mb-1.5">
                <CategoryIcon name={cat.name} icon={cat.icon} size={16} />
                <span className="text-[10px] text-gray-400 font-medium">{catExpenses.length} txns</span>
              </div>
              <div className="font-bold text-gray-900 dark:text-white text-xs truncate" title={cat.name}>
                {cat.name}
              </div>
              <div className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                {formatPKR(catTotal)}
              </div>
              {catToday > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Today: {formatPKR(catToday)}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Expenses Table */}
      <Card className="p-0 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExpenses.map((exp) => {
                  const mem = profiles.find((p) => p.id === exp.member_id);
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={mem?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={mem?.full_name || 'Member'}
                            className="w-6 h-6 rounded-full object-cover border"
                          />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {mem?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <CategoryIcon name={exp.category?.name} icon={exp.category?.icon} size={14} />
                          <span>{exp.category?.name || 'Category'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(exp.expense_date)}</td>
                      <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">
                        -{formatPKR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id, exp.description)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
}
