import React from 'react';
import { cn } from '@/lib/utils';
import { MemberBudgetHealth } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'healthy' | 'watch' | 'over_budget' | 'primary' | 'secondary' | 'neutral';
  status?: MemberBudgetHealth;
}

export function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  // If status prop is provided, resolve directly to health variant
  const effectiveVariant = status || variant || 'neutral';

  const styles = {
    healthy:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    watch:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    over_budget:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-semibold',
    primary:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    secondary:
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const labelText =
    status === 'healthy'
      ? 'Healthy'
      : status === 'watch'
      ? 'Watch'
      : status === 'over_budget'
      ? 'Over Budget'
      : children;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        styles[effectiveVariant],
        className
      )}
      {...props}
    >
      {labelText}
    </span>
  );
}
