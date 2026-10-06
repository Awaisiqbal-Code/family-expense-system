'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DataStore, subscribe } from '@/services/store';
import { NotificationItem } from '@/types';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

interface AdminHeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [familyName, setFamilyName] = useState('Al-Rashid Family');

  useEffect(() => {
    const update = () => {
      if (currentUser) {
        setNotifications(DataStore.getNotifications(currentUser.id));
      }
      setFamilyName(DataStore.getSettings().family_name);
    };

    update();
    const unsub = subscribe(update);
    return () => unsub();
  }, [currentUser]);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{familyName}</span>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Admin Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>{currentUser?.full_name}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-border overflow-hidden z-50">
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && currentUser && (
                  <button
                    onClick={() => DataStore.markAllNotificationsRead(currentUser.id)}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">No new notifications</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => DataStore.markNotificationRead(n.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer ${
                        n.read
                          ? 'bg-white dark:bg-gray-900 text-gray-500'
                          : 'bg-indigo-50/40 dark:bg-indigo-950/20 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{n.title}</div>
                      <div className="text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 text-center border-t border-border bg-gray-50 dark:bg-gray-800/30">
                <Link
                  href="/admin/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  View all alerts &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
