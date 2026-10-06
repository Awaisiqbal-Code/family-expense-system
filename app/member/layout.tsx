'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  Plus,
  PieChart,
  User,
  LogOut,
  Sparkles,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, logout, updatePassword, isLoading } = useAuth();
  const { success, error } = useToast();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Mandatory First Login Password Change state (Section 6)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const handleFirstPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Password Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPass(true);
    const res = await updatePassword(newPassword);
    setIsUpdatingPass(false);
    if (res.success) {
      success('Password Updated', 'Your personal password has been set. You can now use your account.');
    } else {
      error('Error', res.error || 'Failed to update password');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/member/dashboard', icon: Home },
    { name: 'Expenses', href: '/member/expenses', icon: Receipt },
    { name: 'Analytics', href: '/member/analytics', icon: PieChart },
    { name: 'Profile', href: '/member/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 sm:pb-0">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-border px-4 sm:px-6 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/member/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 dark:text-white">Family Expense</span>
              <span className="text-[10px] text-gray-400 block -mt-1 font-medium">Personal Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 ml-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <span className="font-bold">{currentUser?.full_name}</span>
          </div>

          {/* Desktop Add Expense Button */}
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Mobile Bottom Navigation (Section 35 & 36) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-border z-40 sm:hidden">
        <div className="flex items-center justify-around h-16 px-2 relative">
          <Link
            href="/member/dashboard"
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
              pathname === '/member/dashboard' ? 'text-primary font-semibold' : 'text-gray-500'
            )}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </Link>

          <Link
            href="/member/expenses"
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
              pathname === '/member/expenses' ? 'text-primary font-semibold' : 'text-gray-500'
            )}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>Expenses</span>
          </Link>

          {/* Prominent Center + Button */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-5">
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="w-13 h-13 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 active:scale-95 transition-transform border-4 border-white dark:border-gray-900"
              aria-label="Add Expense"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-semibold text-primary mt-0.5">Add</span>
          </div>

          <Link
            href="/member/analytics"
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
              pathname === '/member/analytics' ? 'text-primary font-semibold' : 'text-gray-500'
            )}
          >
            <PieChart className="w-5 h-5 mb-0.5" />
            <span>Analytics</span>
          </Link>

          <Link
            href="/member/profile"
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
              pathname === '/member/profile' ? 'text-primary font-semibold' : 'text-gray-500'
            )}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </Link>
        </div>
      </nav>

      {/* Mandatory First-Login Password Change Modal (Section 6) */}
      {currentUser?.must_change_password && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-card border border-border shadow-2xl max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-primary flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Welcome, {currentUser.full_name}!</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6 leading-relaxed">
              You are currently logged in with a temporary password provided by your administrator. For your security, please create your personal password now.
            </p>

            <form onSubmit={handleFirstPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isUpdatingPass}>
                Set Password & Continue
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        memberId={currentUser?.id}
      />
    </div>
  );
}
