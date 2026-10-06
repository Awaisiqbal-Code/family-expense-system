'use client';

import React, { useState, useEffect } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { Budget, Profile } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Wallet, Plus, Edit2, Calendar, CheckCircle2 } from 'lucide-react';

export default function AdminBudgetsPage() {
  const { success, error } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('25000');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  const loadData = () => {
    setBudgets(DataStore.getBudgets());
    const mems = DataStore.getProfiles().filter((p) => p.role === 'member');
    setProfiles(mems);
    if (mems.length > 0 && !selectedMemberId) {
      setSelectedMemberId(mems[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(loadData);
    return () => unsub();
  }, []);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      error('Invalid Amount', 'Please provide a valid budget amount.');
      return;
    }

    try {
      DataStore.updateBudget({
        member_id: selectedMemberId,
        allocated_amount: parsedAmount,
        start_date: startDate,
        end_date: endDate,
      });
      success('Budget Allocated', `Updated allowance to ${formatPKR(parsedAmount)}.`);
      setIsModalOpen(false);
    } catch (err: any) {
      error('Allocation Failed', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Budget Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure periodic allocations with comprehensive audit logging
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Allocation</span>
        </Button>
      </div>

      {/* Budgets Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Allocated Amount</th>
                <th className="py-3 px-4">Budget Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {budgets.map((b) => {
                const member = profiles.find((p) => p.id === b.member_id);
                return (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                          alt={member?.full_name || 'Member'}
                          className="w-7 h-7 rounded-full object-cover border"
                        />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {member?.full_name || 'Unknown Member'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      {formatPKR(b.allocated_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {formatDate(b.start_date)} &mdash; {formatDate(b.end_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedMemberId(b.member_id);
                          setAmount(b.allocated_amount.toString());
                          setStartDate(b.start_date);
                          setEndDate(b.end_date);
                          setIsModalOpen(true);
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Allocation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Budget Allocation"
        description="Allocate monthly funds to a family member"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Family Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary font-medium"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Amount (PKR)
            </label>
            <input
              type="number"
              required
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold bg-gray-50 dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary"
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
