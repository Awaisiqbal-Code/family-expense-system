export type Role = 'admin' | 'member';
export type MemberStatus = 'active' | 'inactive' | 'disabled' | 'pending_approval';
export type BudgetStatus = 'active' | 'completed' | 'cancelled';
export type MemberBudgetHealth = 'healthy' | 'watch' | 'over_budget';
export type PeriodStatus = 'active' | 'closed';

export interface AccessRequest {
  id: string;
  full_name: string;
  username: string;
  email: string;
  password?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface Profile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: Role;
  status: MemberStatus;
  must_change_password?: boolean;
  password_hash?: string; // Secure simulated hash for demo/standalone persistence
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialPeriod {
  id: string;
  name: string; // e.g. "October 2026"
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  created_by?: string;
  closed_at?: string;
  closing_summary?: {
    total_allocated: number;
    total_spent: number;
    closing_balance: number;
  };
  created_at: string;
}

export interface MoneyReceived {
  id: string;
  member_id: string;
  period_id: string;
  amount: number;
  source: string; // e.g. "Monthly Family Allowance", "Gift", "Dad"
  received_date: string;
  notes?: string;
  verified: boolean;
  recorded_by: string; // profile id
  created_at: string;
}

export interface FamilySettings {
  id: string;
  family_name: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  default_report_period: '7d' | '10d' | '30d';
  allow_over_budget: boolean;
  current_period_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface Budget {
  id: string;
  member_id: string;
  period_id?: string;
  allocated_amount: number;
  start_date: string;
  end_date: string;
  status: BudgetStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  member_id: string;
  period_id?: string;
  amount: number;
  category_id: string;
  category?: Category;
  description: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'budget_warning' | 'over_budget' | 'budget_assigned' | 'large_expense' | 'system' | 'password_reset' | 'period_reset';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface MemberFinancialSummary {
  member: Profile;
  activePeriod?: FinancialPeriod;
  activeBudget?: Budget;
  allocatedAmount: number;
  totalReceived: number;
  totalSpent: number;
  remainingBudget: number;
  spentPercentage: number;
  remainingPercentage: number;
  daysRemaining: number;
  totalDays: number;
  suggestedDailyPace: number;
  health: MemberBudgetHealth;
  isOverBudget: boolean;
  recentExpensesCount: number;
}

export interface CategoryFinancialSummary {
  category: Category;
  totalSpent: number;
  todaySpent: number;
  avgDailySpent: number;
  transactionCount: number;
  percentageOfTotal: number;
  topSpendingMember?: { name: string; amount: number };
}

export interface FamilyFinancialOverview {
  activePeriod?: FinancialPeriod;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  overallUsagePercentage: number;
  activeMembersCount: number;
  overBudgetMembersCount: number;
  watchMembersCount: number;
  healthyMembersCount: number;
  membersSummary: MemberFinancialSummary[];
  categorySummaries: CategoryFinancialSummary[];
}

export interface GamificationBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
}
