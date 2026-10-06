'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  WalletCards,
  Receipt,
  FileBarChart2,
  PieChart,
  BellRing,
  Settings,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/admin/members', icon: Users },
  { name: 'Budgets', href: '/admin/budgets', icon: WalletCards },
  { name: 'Expenses', href: '/admin/expenses', icon: Receipt },
  { name: 'Reports', href: '/admin/reports', icon: FileBarChart2 },
  { name: 'Analytics', href: '/admin/analytics', icon: PieChart },
  { name: 'Alerts', href: '/admin/alerts', icon: BellRing },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({
  className,
  onItemClick,
}: {
  className?: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const { logout, currentUser } = useAuth();

  return (
    <aside
      className={cn(
        'w-64 bg-white dark:bg-gray-900 border-r border-border flex flex-col h-full select-none',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-none">
            Family Expense
          </h1>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mt-1">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/25 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser?.full_name || 'Admin'}
            className="w-9 h-9 rounded-full object-cover border border-border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {currentUser?.full_name || 'Admin'}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{currentUser?.email || 'admin@family.com'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
