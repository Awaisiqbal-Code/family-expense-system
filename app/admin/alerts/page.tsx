'use client';

import React, { useState, useEffect } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { NotificationItem } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Check,
} from 'lucide-react';

export default function AdminAlertsPage() {
  const { success } = useToast();
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadAlerts = () => {
    setAlerts(DataStore.getNotifications());
  };

  useEffect(() => {
    loadAlerts();
    const unsub = subscribe(loadAlerts);
    return () => unsub();
  }, []);

  const handleMarkRead = (id: string) => {
    DataStore.markNotificationRead(id);
    success('Alert Dismissed', 'Notification marked as read.');
  };

  const handleMarkAll = () => {
    const admin = DataStore.getCurrentUser();
    if (admin) {
      DataStore.markAllNotificationsRead(admin.id);
      success('All Alerts Read', 'Cleared all pending notification alerts.');
    }
  };

  const filtered = filter === 'unread' ? alerts.filter((a) => !a.read) : alerts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Financial Alerts</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time notifications for budget thresholds, over-budget warnings, and large transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            <Check className="w-3.5 h-3.5 mr-1" />
            <span>Mark All Read</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-white'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Unread Only ({alerts.filter((a) => !a.read).length})
        </button>
      </div>

      {/* Alerts Feed */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            No active alerts found. All family spending is running within established thresholds.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => {
              const isWarning = item.type === 'budget_warning';
              const isOver = item.type === 'over_budget';
              const isLarge = item.type === 'large_expense';

              return (
                <div
                  key={item.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    item.read
                      ? 'bg-white dark:bg-gray-900 opacity-80'
                      : 'bg-indigo-50/30 dark:bg-indigo-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isOver
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-600'
                          : isWarning
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                          : isLarge
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 text-primary'
                      }`}
                    >
                      {isOver ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isLarge ? (
                        <DollarSign className="w-4 h-4" />
                      ) : (
                        <BellRing className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {!item.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(item.id)}
                      className="text-xs text-primary shrink-0"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
