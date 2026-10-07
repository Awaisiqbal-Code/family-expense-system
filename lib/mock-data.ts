import {
  Profile,
  FinancialPeriod,
  FamilySettings,
  Category,
  Budget,
  Expense,
  MoneyReceived,
  NotificationItem,
  AuditLog,
} from '@/types';

export const INITIAL_PERIODS: FinancialPeriod[] = [
  {
    id: 'period-active',
    name: 'Active Cycle',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active',
    created_by: 'usr-admin-1',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_SETTINGS: FamilySettings = {
  id: 'settings-1',
  family_name: 'My Family',
  currency: 'PKR',
  currency_symbol: 'Rs.',
  timezone: 'Asia/Karachi',
  default_report_period: '30d',
  allow_over_budget: true,
  current_period_id: 'period-active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food & Grocery', icon: 'Utensils', color: '#EF4444', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Fuel & Transport', icon: 'Car', color: '#3B82F6', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Shopping & Apparel', icon: 'ShoppingBag', color: '#EC4899', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Education & Books', icon: 'GraduationCap', color: '#8B5CF6', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Healthcare & Medicines', icon: 'HeartPulse', color: '#10B981', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Home & Utilities', icon: 'Home', color: '#F59E0B', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Bills & Subscriptions', icon: 'FileText', color: '#6366F1', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Personal & Care', icon: 'UserCheck', color: '#14B8A6', status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-9', name: 'Miscellaneous & Other', icon: 'MoreHorizontal', color: '#6B7280', status: 'active', created_at: new Date().toISOString() },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-admin-1',
    full_name: 'Awais Iqbal',
    username: 'admin',
    email: 'admin@family.local',
    phone: '+92 300 0000000',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'active',
    must_change_password: false,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_MONEY_RECEIVED: MoneyReceived[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-init',
    actor_id: 'usr-admin-1',
    actor_name: 'Awais Iqbal',
    action: 'SYSTEM_INITIALIZED',
    entity_type: 'system',
    entity_id: 'system-1',
    metadata: { note: 'Production instance initialized for Awais Iqbal.' },
    created_at: new Date().toISOString(),
  },
];
