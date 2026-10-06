import { MemberBudgetHealth, GamificationBadge } from '@/types';

/**
 * Format currency in Pakistani Rupees (PKR) standard format:
 * Example: Rs. 30,000 or -Rs. 450
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-Rs. ${formatted}` : `Rs. ${formatted}`;
}

/**
 * Server-safe Remaining Budget Calculation
 * Remaining Budget = Allocated Budget - SUM(valid expenses in the active budget period)
 */
export function calculateRemainingBudget(allocated: number, spent: number): number {
  return Number((allocated - spent).toFixed(2));
}

/**
 * Spent Percentage = (Spent / Allocated) * 100
 */
export function calculateSpentPercentage(allocated: number, spent: number): number {
  if (allocated <= 0) return spent > 0 ? 100 : 0;
  return Number(((spent / allocated) * 100).toFixed(1));
}

/**
 * Remaining Percentage = (Remaining / Allocated) * 100
 */
export function calculateRemainingPercentage(allocated: number, remaining: number): number {
  if (allocated <= 0) return 0;
  const pct = (remaining / allocated) * 100;
  return Number(Math.max(0, pct).toFixed(1));
}

/**
 * Days remaining in budget period (inclusive of today)
 */
export function calculateDaysRemaining(startDateStr: string, endDateStr: string): {
  daysRemaining: number;
  totalDays: number;
  hasExpired: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  const totalDiffTime = Math.max(0, end.getTime() - start.getTime());
  const totalDays = Math.max(1, Math.ceil(totalDiffTime / (1000 * 60 * 60 * 24)));

  const remainingDiffTime = end.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(remainingDiffTime / (1000 * 60 * 60 * 24)));
  const hasExpired = today.getTime() > end.getTime();

  return { daysRemaining, totalDays, hasExpired };
}

/**
 * Calculate estimated daily target: Remaining budget / remaining days
 * Section 10: "Use this only as guidance metric. Show Suggested daily pace, e.g. Rs. 620/day"
 */
export function calculateSuggestedDailyPace(remainingBudget: number, daysRemaining: number): number {
  if (daysRemaining <= 0 || remainingBudget <= 0) {
    return 0;
  }
  return Number((remainingBudget / daysRemaining).toFixed(0));
}

/**
 * Determine Budget Health status
 */
export function getBudgetHealthStatus(allocated: number, spent: number): MemberBudgetHealth {
  if (allocated <= 0 && spent > 0) return 'over_budget';
  if (spent > allocated) return 'over_budget';
  const ratio = allocated > 0 ? spent / allocated : 0;
  if (ratio >= 0.85) return 'watch';
  return 'healthy';
}

/**
 * Dynamic friendly non-judgmental spending feedback (Section 16)
 */
export function generateSpendingFeedback(
  allocated: number,
  spent: number,
  remaining: number,
  daysRemaining: number
): {
  title: string;
  message: string;
  type: 'healthy' | 'caution' | 'warning' | 'danger';
} {
  if (allocated <= 0) {
    return {
      title: 'Awaiting Budget Allocation',
      message: 'Your family administrator has not allocated a budget for this period yet.',
      type: 'healthy',
    };
  }

  const usage = (spent / allocated) * 100;

  if (remaining < 0 || spent > allocated) {
    return {
      title: 'Over Budget',
      message: "You've crossed your allocated budget. Review your recent expenses with your family admin.",
      type: 'danger',
    };
  }

  if (usage >= 90 || remaining <= allocated * 0.1) {
    return {
      title: 'Budget Running Low',
      message: 'Your remaining budget is getting low. Consider slowing down discretionary spending.',
      type: 'warning',
    };
  }

  if (usage >= 75) {
    return {
      title: 'Pace Increasing',
      message: 'Your spending pace has increased. Keep an eye on your remaining budget for the rest of the period.',
      type: 'caution',
    };
  }

  return {
    title: 'Spending On Track',
    message: "You're doing great! Your spending is currently within a healthy, sustainable range.",
    type: 'healthy',
  };
}

/**
 * Member gamification badges calculation (Section 17)
 */
export function calculateGamificationBadges(
  allocated: number,
  spent: number,
  daysRemaining: number,
  expenseCount: number
): GamificationBadge[] {
  const usageRatio = allocated > 0 ? spent / allocated : 0;
  const isHealthy = usageRatio <= 0.85;

  return [
    {
      id: 'budget_master',
      title: 'Budget Master',
      description: 'Maintained healthy spending for 7+ days within allocation.',
      icon: 'ShieldCheck',
      unlocked: isHealthy && expenseCount >= 3,
      progress: Math.min(100, Math.round((expenseCount / 3) * 100)),
    },
    {
      id: 'smart_spender',
      title: 'Smart Spender',
      description: 'Kept discretionary expenses balanced throughout the cycle.',
      icon: 'TrendingUp',
      unlocked: usageRatio <= 0.70 && expenseCount >= 2,
      progress: Math.min(100, Math.round(Math.max(0, (1 - usageRatio) * 100))),
    },
    {
      id: 'consistent_tracker',
      title: 'Consistent Tracker',
      description: 'Recorded daily expenses consistently as transactions occur.',
      icon: 'CalendarCheck',
      unlocked: expenseCount >= 4,
      progress: Math.min(100, Math.round((expenseCount / 4) * 100)),
    },
    {
      id: 'savings_champion',
      title: 'Savings Champion',
      description: 'Maintained significant remaining budget with few days left.',
      icon: 'Award',
      unlocked: usageRatio < 0.6 && daysRemaining <= 10 && allocated > 0,
      progress: Math.min(100, Math.round(Math.max(0, (1 - usageRatio) * 100))),
    },
  ];
}
