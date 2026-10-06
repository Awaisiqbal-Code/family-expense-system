'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useToast } from '@/components/ui/Toast';
import { DataStore } from '@/services/store';
import { Category, Profile } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import confetti from 'canvas-confetti';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string; // If admin is creating or defaults to current logged in member
  onExpenseAdded?: () => void;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  memberId,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const { success, error, warning } = useToast();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMember, setActiveMember] = useState<Profile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategories(DataStore.getCategories().filter((c) => c.status === 'active'));
      const currentUser = DataStore.getCurrentUser();
      const targetId = memberId || currentUser?.id;
      if (targetId) {
        const p = DataStore.getProfile(targetId);
        setActiveMember(p || null);
      }
      // Reset form
      setAmount('');
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, memberId]);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error('Invalid Amount', 'Expense amount must be greater than zero.');
      return;
    }

    if (!categoryId) {
      error('Category Required', 'Please select an expense category.');
      return;
    }

    if (!description.trim()) {
      error('Description Required', 'Please enter a description for the expense.');
      return;
    }

    if (!expenseDate) {
      error('Date Required', 'Please select a valid date.');
      return;
    }

    const targetMemberId = activeMember?.id || DataStore.getCurrentUser()?.id;
    if (!targetMemberId) {
      error('User Error', 'Unable to determine target member.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = DataStore.createExpense({
        member_id: targetMemberId,
        amount: parsedAmount,
        category_id: categoryId,
        description: description.trim(),
        expense_date: expenseDate,
      });

      // Feedback according to spec Section 41
      success(
        'Expense added successfully',
        `${formatPKR(parsedAmount)} deducted from your remaining budget.`
      );

      // Trigger subtle celebration if healthy
      if (result.summary.health === 'healthy') {
        try {
          confetti({
            particleCount: 25,
            spread: 45,
            origin: { y: 0.8 },
            colors: ['#4F46E5', '#10B981', '#3B82F6'],
          });
        } catch {}
      } else if (result.summary.health === 'over_budget') {
        warning(
          'Budget Limit Exceeded',
          `You have exceeded your allocated budget by ${formatPKR(Math.abs(result.summary.remainingBudget))}.`
        );
      }

      onExpenseAdded?.();
      onClose();
    } catch (err: any) {
      error('Transaction Failed', err?.message || 'Unable to record expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      description={activeMember ? `Recording expense for ${activeMember.full_name}` : 'Record a new family expense'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            Amount (PKR)
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-gray-400 font-semibold text-base">Rs.</span>
            </div>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-3 text-2xl font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
              autoFocus
            />
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Select Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-primary bg-indigo-50/70 dark:bg-indigo-950/50 text-primary font-semibold ring-2 ring-primary/30'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <CategoryIcon name={cat.name} icon={cat.icon} size={16} />
                  </div>
                  <span className="text-xs truncate w-full">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            Description
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Burger + Drink, Books, Fuel"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* Expense Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            Date
          </label>
          <input
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="min-w-[120px]">
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
