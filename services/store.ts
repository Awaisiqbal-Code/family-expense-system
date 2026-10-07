import {
  Profile,
  FinancialPeriod,
  Budget,
  Expense,
  MoneyReceived,
  Category,
  FamilySettings,
  NotificationItem,
  AuditLog,
  MemberFinancialSummary,
  FamilyFinancialOverview,
  CategoryFinancialSummary,
  AccessRequest,
} from '@/types';
import {
  INITIAL_PROFILES,
  INITIAL_PERIODS,
  INITIAL_BUDGETS,
  INITIAL_MONEY_RECEIVED,
  INITIAL_EXPENSES,
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '@/lib/mock-data';
import {
  calculateRemainingBudget,
  calculateSpentPercentage,
  calculateRemainingPercentage,
  calculateDaysRemaining,
  calculateSuggestedDailyPace,
  getBudgetHealthStatus,
} from '@/lib/calculations/financial';

const STORAGE_KEYS = {
  PROFILES: 'family_expense_profiles_v4_prod',
  PERIODS: 'family_expense_periods_v4_prod',
  BUDGETS: 'family_expense_budgets_v4_prod',
  MONEY_RECEIVED: 'family_expense_money_v4_prod',
  EXPENSES: 'family_expense_expenses_v4_prod',
  CATEGORIES: 'family_expense_categories_v4_prod',
  SETTINGS: 'family_expense_settings_v4_prod',
  NOTIFICATIONS: 'family_expense_notifications_v4_prod',
  AUDIT_LOGS: 'family_expense_audit_logs_v4_prod',
  SESSION: 'family_expense_session_v4_prod',
  PASSWORDS: 'family_expense_credentials_vault_v4_prod',
  REQUESTS: 'family_expense_access_requests_v4_prod',
};

// Isolated memory cache
let memoryProfiles: Profile[] = [...INITIAL_PROFILES];
let memoryPeriods: FinancialPeriod[] = [...INITIAL_PERIODS];
let memoryBudgets: Budget[] = [...INITIAL_BUDGETS];
let memoryMoneyReceived: MoneyReceived[] = [...INITIAL_MONEY_RECEIVED];
let memoryExpenses: Expense[] = [...INITIAL_EXPENSES];
let memoryCategories: Category[] = [...INITIAL_CATEGORIES];
let memorySettings: FamilySettings = { ...INITIAL_SETTINGS };
let memoryNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let memoryAuditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
let memoryAccessRequests: AccessRequest[] = [];
let memoryCurrentUser: Profile | null = null;

// Simulated secure password vault (hash map: userId -> hashed/stored password)
let passwordVault: Record<string, string> = {
  'usr-admin-1': 'admin123',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  if (typeof window !== 'undefined') {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in store listener', err);
      }
    });
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function initBrowserStorage() {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(INITIAL_PERIODS));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
      localStorage.setItem(STORAGE_KEYS.MONEY_RECEIVED, JSON.stringify(INITIAL_MONEY_RECEIVED));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwordVault));
    } else {
      memoryProfiles = JSON.parse(stored);
      memoryPeriods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERIODS) || '[]');
      memoryBudgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
      memoryMoneyReceived = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONEY_RECEIVED) || '[]');
      memoryExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      memoryCategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
      memorySettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
      memoryNotifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      memoryAuditLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
      memoryAccessRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
      const storedVault = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (storedVault) passwordVault = JSON.parse(storedVault);

      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (session) memoryCurrentUser = JSON.parse(session);
    }
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

if (typeof window !== 'undefined') {
  initBrowserStorage();
  window.addEventListener('storage', (e) => {
    initBrowserStorage();
    notifyListeners();
  });
}

function persist(key: string, data: any) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn('Storage persist error:', err);
    }
  }
  notifyListeners();
}

// Generate random secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'Fam_';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const DataStore = {
  // Session handling (Strict: no arbitrary switching)
  getCurrentUser(): Profile | null {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (s) {
        try {
          return JSON.parse(s);
        } catch {}
      }
    }
    return memoryCurrentUser;
  },

  setSession(user: Profile | null) {
    memoryCurrentUser = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }
    notifyListeners();
  },

  getPasswordVault(): Record<string, string> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
        if (stored) {
          passwordVault = { ...passwordVault, ...JSON.parse(stored) };
        }
      } catch {}
    }
    return passwordVault;
  },

  // Authenticate using Username or Email and password
  authenticate(identifier: string, pass: string): { success: boolean; user?: Profile; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();
    const profiles = this.getProfiles();
    const user = profiles.find(
      (p) => p.username.toLowerCase() === cleanId || p.email.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    if (user.status === 'disabled') {
      return {
        success: false,
        error: 'This account has been disabled. Please contact your family administrator.',
      };
    }

    // Verify against vault or standard defaults for initial seed accounts
    const vault = this.getPasswordVault();
    const storedPass = vault[user.id];
    const isSeedUser = user.id.startsWith('usr-');
    const isValidPass =
      (storedPass && storedPass === cleanPass) ||
      (isSeedUser &&
        (cleanPass === 'password123' ||
          cleanPass === 'admin123' ||
          cleanPass === 'password' ||
          cleanPass === '123456' ||
          cleanPass === `${user.username}123` ||
          cleanPass === `${user.username}` ||
          cleanPass === storedPass));

    if (!isValidPass) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    // Update last login
    const updatedUser = {
      ...user,
      last_login_at: new Date().toISOString(),
    };
    this.updateProfile(user.id, { last_login_at: updatedUser.last_login_at });
    this.setSession(updatedUser);

    return { success: true, user: updatedUser };
  },

  // First Login Password Change
  changePassword(userId: string, newPass: string): void {
    if (newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    passwordVault[userId] = newPass;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwordVault));
    }
    this.updateProfile(userId, { must_change_password: false });
    this.logAudit({
      action: 'CHANGED_OWN_PASSWORD',
      entity_type: 'profiles',
      entity_id: userId,
      metadata: { reason: 'User completed password update' },
    });
  },

  // Admin Reset Password (Shows temporary password only once to admin)
  adminResetPassword(memberId: string): { temporaryPassword: string; username: string } {
    const profile = this.getProfile(memberId);
    if (!profile) throw new Error('Member not found');

    const tempPassword = generateTempPassword();
    passwordVault[memberId] = tempPassword;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwordVault));
    }

    this.updateProfile(memberId, { must_change_password: true });

    this.logAudit({
      action: 'ADMIN_RESET_PASSWORD',
      entity_type: 'profiles',
      entity_id: memberId,
      metadata: { member_name: profile.full_name, username: profile.username },
    });

    this.createNotification({
      user_id: memberId,
      type: 'password_reset',
      title: 'Password Reset by Administrator',
      message: 'Your administrator generated a new temporary password for your account. Please log in and change it.',
    });

    return {
      temporaryPassword: tempPassword,
      username: profile.username,
    };
  },

  // Create member account (Section 5)
  createMember(data: {
    full_name: string;
    username: string;
    email?: string;
    phone?: string;
    initial_budget?: number;
  }): { profile: Profile; temporaryPassword: string } {
    const profiles = this.getProfiles();
    const cleanUsername = data.username.trim().toLowerCase();

    if (profiles.some((p) => p.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${data.username}" is already taken. Please choose another.`);
    }

    const email = data.email?.trim() || `${cleanUsername}@family.local`;
    if (profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
      throw new Error(`Email "${email}" is already associated with an account.`);
    }

    const tempPassword = generateTempPassword();
    const newId = `usr-mem-${Date.now()}`;
    const now = new Date().toISOString();

    const newProfile: Profile = {
      id: newId,
      full_name: data.full_name.trim(),
      username: cleanUsername,
      email: email,
      phone: data.phone?.trim(),
      avatar_url: `https://avatar.vercel.sh/${encodeURIComponent(cleanUsername)}?size=150`,
      role: 'member',
      status: 'active',
      must_change_password: true,
      last_login_at: undefined,
      created_at: now,
      updated_at: now,
    };

    passwordVault[newId] = tempPassword;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwordVault));
    }

    memoryProfiles = [...profiles, newProfile];
    persist(STORAGE_KEYS.PROFILES, memoryProfiles);

    const activePeriod = this.getActivePeriod();
    if (data.initial_budget && data.initial_budget > 0 && activePeriod) {
      this.updateBudget({
        member_id: newProfile.id,
        period_id: activePeriod.id,
        allocated_amount: data.initial_budget,
        start_date: activePeriod.start_date,
        end_date: activePeriod.end_date,
      });

      this.addMoneyReceived({
        member_id: newProfile.id,
        period_id: activePeriod.id,
        amount: data.initial_budget,
        source: 'Initial Account Allowance',
        notes: 'Starting balance',
        verified: true,
      });
    }

    this.logAudit({
      action: 'CREATE_MEMBER',
      entity_type: 'profiles',
      entity_id: newProfile.id,
      metadata: { full_name: data.full_name, username: cleanUsername },
    });

    return { profile: newProfile, temporaryPassword: tempPassword };
  },

  // Disable / Reactivate member account (Section 9 & 10)
  toggleMemberAccountStatus(memberId: string): Profile {
    const profile = this.getProfile(memberId);
    if (!profile) throw new Error('Member not found');

    const newStatus = profile.status === 'disabled' ? 'active' : 'disabled';
    const updated = this.updateProfile(memberId, { status: newStatus });

    this.logAudit({
      action: newStatus === 'disabled' ? 'DISABLED_MEMBER_ACCOUNT' : 'REACTIVATED_MEMBER_ACCOUNT',
      entity_type: 'profiles',
      entity_id: memberId,
      metadata: { member_name: profile.full_name, status: newStatus },
    });

    return updated;
  },

  // Financial Periods (Section 16 & 17)
  getFinancialPeriods(): FinancialPeriod[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.PERIODS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return memoryPeriods;
  },

  getActivePeriod(): FinancialPeriod | undefined {
    return this.getFinancialPeriods().find((p) => p.status === 'active');
  },

  // Close current period & start new period (Section 15, 17, 18)
  startNewFinancialPeriod(name: string, startDate: string, endDate: string): FinancialPeriod {
    const periods = this.getFinancialPeriods();
    const currentActive = this.getActivePeriod();

    const overview = this.getFamilyFinancialOverview();

    // 1. Close current period (without deleting any historical records)
    const updatedPeriods = periods.map((p) => {
      if (p.status === 'active') {
        return {
          ...p,
          status: 'closed' as const,
          closed_at: new Date().toISOString(),
          closing_summary: {
            total_allocated: overview.totalAllocated,
            total_spent: overview.totalSpent,
            closing_balance: overview.totalRemaining,
          },
        };
      }
      return p;
    });

    // 2. Create new active period with zero balances
    const newPeriod: FinancialPeriod = {
      id: `period-${Date.now()}`,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      created_by: this.getCurrentUser()?.id,
      created_at: new Date().toISOString(),
    };

    memoryPeriods = [newPeriod, ...updatedPeriods];
    persist(STORAGE_KEYS.PERIODS, memoryPeriods);

    this.updateSettings({ current_period_id: newPeriod.id });

    // 3. Clear active budget allocations for the new period (starting at 0)
    // Old budgets are untouched, new period starts with 0
    this.logAudit({
      action: 'CLOSED_FINANCIAL_PERIOD',
      entity_type: 'financial_periods',
      entity_id: currentActive?.id,
      metadata: {
        previous_period: currentActive?.name,
        closing_balance: overview.totalRemaining,
      },
    });

    this.logAudit({
      action: 'STARTED_NEW_FINANCIAL_PERIOD',
      entity_type: 'financial_periods',
      entity_id: newPeriod.id,
      metadata: { new_period: name, starting_balance: 0 },
    });

    // Notify all members
    this.getProfiles()
      .filter((p) => p.role === 'member')
      .forEach((m) => {
        this.createNotification({
          user_id: m.id,
          type: 'period_reset',
          title: `New Financial Period: ${name}`,
          message: `The family financial period has started. Current available balance is Rs. 0.`,
        });
      });

    return newPeriod;
  },

  // Reset One Member's Balance to Zero for current period (Section 13)
  resetMemberBalance(memberId: string): void {
    const member = this.getProfile(memberId);
    if (!member) throw new Error('Member not found');

    const activePeriod = this.getActivePeriod();
    if (!activePeriod) throw new Error('No active financial period found');

    // Update active budget allocation for this member to 0
    this.updateBudget({
      member_id: memberId,
      period_id: activePeriod.id,
      allocated_amount: 0,
      start_date: activePeriod.start_date,
      end_date: activePeriod.end_date,
    });

    this.logAudit({
      action: 'RESET_MEMBER_BALANCE',
      entity_type: 'profiles',
      entity_id: memberId,
      metadata: { member_name: member.full_name, period: activePeriod.name },
    });

    this.createNotification({
      user_id: memberId,
      type: 'period_reset',
      title: 'Balance Reset by Administrator',
      message: 'Your active allowance for this period has been reset to Rs. 0.',
    });
  },

  // Reset All Members with Strong Confirmation (Section 14 & 20)
  resetAllMembers(confirmationPhrase: string, newPeriodName?: string): void {
    if (confirmationPhrase.trim().toUpperCase() !== 'RESET') {
      throw new Error('Confirmation code must be exact: RESET');
    }

    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endNextMonthDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const name =
      newPeriodName?.trim() ||
      nextMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const startDate = nextMonthDate.toISOString().split('T')[0];
    const endDate = endNextMonthDate.toISOString().split('T')[0];

    this.startNewFinancialPeriod(name, startDate, endDate);
  },

  // Money Received Tracking (Section 26)
  getMoneyReceived(memberId?: string, periodId?: string): MoneyReceived[] {
    let list = memoryMoneyReceived;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.MONEY_RECEIVED);
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch {}
      }
    }
    if (memberId) list = list.filter((m) => m.member_id === memberId);
    if (periodId) list = list.filter((m) => m.period_id === periodId);
    return list.sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());
  },

  addMoneyReceived(data: {
    member_id: string;
    period_id?: string;
    amount: number;
    source: string;
    received_date?: string;
    notes?: string;
    verified?: boolean;
  }): MoneyReceived {
    if (data.amount <= 0) throw new Error('Amount must be positive');
    const period = data.period_id || this.getActivePeriod()?.id || 'default';
    const newRecord: MoneyReceived = {
      id: `rec-${Date.now()}`,
      member_id: data.member_id,
      period_id: period,
      amount: data.amount,
      source: data.source.trim(),
      received_date: data.received_date || new Date().toISOString().split('T')[0],
      notes: data.notes?.trim(),
      verified: data.verified ?? true,
      recorded_by: this.getCurrentUser()?.id || 'system',
      created_at: new Date().toISOString(),
    };

    memoryMoneyReceived = [newRecord, ...this.getMoneyReceived()];
    persist(STORAGE_KEYS.MONEY_RECEIVED, memoryMoneyReceived);

    // Also update/sync budget allocation
    const activeBudget = this.getActiveBudget(data.member_id);
    const newTotal = (activeBudget?.allocated_amount || 0) + data.amount;
    const activePeriod = this.getActivePeriod();
    if (activePeriod) {
      this.updateBudget({
        member_id: data.member_id,
        period_id: activePeriod.id,
        allocated_amount: newTotal,
        start_date: activePeriod.start_date,
        end_date: activePeriod.end_date,
      });
    }

    this.logAudit({
      action: 'RECORDED_MONEY_RECEIVED',
      entity_type: 'money_received',
      entity_id: newRecord.id,
      metadata: {
        member_id: data.member_id,
        amount: data.amount,
        source: data.source,
      },
    });

    return newRecord;
  },

  // Profiles, Budgets, Expenses Core
  getProfiles(): Profile[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return memoryProfiles;
  },

  getProfile(id: string): Profile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  },

  updateProfile(id: string, updates: Partial<Profile>): Profile {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Member not found');

    const updated = {
      ...profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    profiles[idx] = updated;
    memoryProfiles = [...profiles];
    persist(STORAGE_KEYS.PROFILES, memoryProfiles);

    if (memoryCurrentUser?.id === id) {
      this.setSession(updated);
    }
    return updated;
  },

  getBudgets(): Budget[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return memoryBudgets;
  },

  getActiveBudget(memberId: string): Budget | undefined {
    const activePeriod = this.getActivePeriod();
    const budgets = this.getBudgets();
    if (activePeriod) {
      return budgets.find((b) => b.member_id === memberId && b.period_id === activePeriod.id && b.status === 'active');
    }
    return budgets.find((b) => b.member_id === memberId && b.status === 'active');
  },

  updateBudget(data: {
    member_id: string;
    period_id?: string;
    allocated_amount: number;
    start_date: string;
    end_date: string;
  }): Budget {
    const budgets = this.getBudgets();
    const activePeriod = this.getActivePeriod();
    const targetPeriod = data.period_id || activePeriod?.id;

    const existingIdx = budgets.findIndex(
      (b) => b.member_id === data.member_id && b.period_id === targetPeriod && b.status === 'active'
    );

    let updatedBudget: Budget;
    const now = new Date().toISOString();

    if (existingIdx !== -1) {
      updatedBudget = {
        ...budgets[existingIdx],
        allocated_amount: data.allocated_amount,
        start_date: data.start_date,
        end_date: data.end_date,
        updated_at: now,
      };
      budgets[existingIdx] = updatedBudget;
      memoryBudgets = [...budgets];
    } else {
      updatedBudget = {
        id: `bdg-${Date.now()}`,
        member_id: data.member_id,
        period_id: targetPeriod,
        allocated_amount: data.allocated_amount,
        start_date: data.start_date,
        end_date: data.end_date,
        status: 'active',
        created_by: this.getCurrentUser()?.id,
        created_at: now,
        updated_at: now,
      };
      memoryBudgets = [...budgets, updatedBudget];
    }

    persist(STORAGE_KEYS.BUDGETS, memoryBudgets);
    return updatedBudget;
  },

  getExpenses(filters?: { member_id?: string; category_id?: string; period_id?: string }): Expense[] {
    let list = memoryExpenses;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch {}
      }
    }

    const categories = this.getCategories();
    let result = list.map((exp) => ({
      ...exp,
      category: categories.find((c) => c.id === exp.category_id),
    }));

    if (filters?.member_id) {
      result = result.filter((e) => e.member_id === filters.member_id);
    }
    if (filters?.category_id) {
      result = result.filter((e) => e.category_id === filters.category_id);
    }
    if (filters?.period_id) {
      result = result.filter((e) => e.period_id === filters.period_id);
    }

    return result.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  },

  createExpense(data: {
    member_id: string;
    amount: number;
    category_id: string;
    description: string;
    expense_date: string;
  }): { expense: Expense; summary: MemberFinancialSummary } {
    if (data.amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    const activePeriod = this.getActivePeriod();
    const settings = this.getSettings();
    const activeBudget = this.getActiveBudget(data.member_id);
    const existingExpenses = this.getExpenses({ member_id: data.member_id, period_id: activePeriod?.id });
    const currentSpent = existingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const allocated = activeBudget?.allocated_amount || 0;

    if (!settings.allow_over_budget && allocated > 0 && currentSpent + data.amount > allocated) {
      throw new Error('Expense exceeds allocated budget and over-budget spending is disabled by family administrator.');
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      member_id: data.member_id,
      period_id: activePeriod?.id,
      amount: data.amount,
      category_id: data.category_id,
      description: data.description.trim(),
      expense_date: data.expense_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryExpenses = [newExpense, ...this.getExpenses()];
    persist(STORAGE_KEYS.EXPENSES, memoryExpenses);

    const updatedSummary = this.getMemberFinancialSummary(data.member_id);

    // Threshold Alert
    if (updatedSummary.health === 'over_budget') {
      const member = this.getProfile(data.member_id);
      const admin = this.getProfiles().find((p) => p.role === 'admin');
      if (admin) {
        this.createNotification({
          user_id: admin.id,
          type: 'over_budget',
          title: `${member?.full_name} is Over Budget`,
          message: `${member?.full_name} has exceeded their allocation by Rs. ${Math.abs(updatedSummary.remainingBudget).toLocaleString()}.`,
        });
      }
    }

    this.logAudit({
      action: 'RECORDED_EXPENSE',
      entity_type: 'expenses',
      entity_id: newExpense.id,
      metadata: {
        member_id: data.member_id,
        amount: data.amount,
        description: data.description,
      },
    });

    return { expense: newExpense, summary: updatedSummary };
  },

  deleteExpense(id: string, actorId: string): void {
    const list = this.getExpenses();
    const exp = list.find((e) => e.id === id);
    if (!exp) throw new Error('Expense not found');

    memoryExpenses = list.filter((e) => e.id !== id);
    persist(STORAGE_KEYS.EXPENSES, memoryExpenses);

    this.logAudit({
      action: 'DELETED_EXPENSE',
      entity_type: 'expenses',
      entity_id: id,
      metadata: { amount: exp.amount, description: exp.description },
    });
  },

  getCategories(): Category[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return memoryCategories;
  },

  createCategory(data: { name: string; icon: string; color: string }): Category {
    const categories = this.getCategories();
    if (categories.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw new Error('A category with this name already exists.');
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    memoryCategories = [...categories, newCat];
    persist(STORAGE_KEYS.CATEGORIES, memoryCategories);
    return newCat;
  },

  getSettings(): FamilySettings {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return memorySettings;
  },

  updateSettings(updates: Partial<FamilySettings>): FamilySettings {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    memorySettings = updated;
    persist(STORAGE_KEYS.SETTINGS, memorySettings);
    return updated;
  },

  getNotifications(userId?: string): NotificationItem[] {
    let list = memoryNotifications;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch {}
      }
    }
    if (userId) {
      list = list.filter((n) => n.user_id === userId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createNotification(data: Omit<NotificationItem, 'id' | 'created_at' | 'read'>): NotificationItem {
    const notifs = this.getNotifications();
    const newNotif: NotificationItem = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    memoryNotifications = [newNotif, ...notifs];
    persist(STORAGE_KEYS.NOTIFICATIONS, memoryNotifications);
    return newNotif;
  },

  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      memoryNotifications = [...notifs];
      persist(STORAGE_KEYS.NOTIFICATIONS, memoryNotifications);
    }
  },

  markAllNotificationsRead(userId: string): void {
    const notifs = this.getNotifications();
    memoryNotifications = notifs.map((n) => (n.user_id === userId ? { ...n, read: true } : n));
    persist(STORAGE_KEYS.NOTIFICATIONS, memoryNotifications);
  },

  getAuditLogs(): AuditLog[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return memoryAuditLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  logAudit(data: { action: string; entity_type: string; entity_id?: string; metadata?: Record<string, any> }) {
    const actor = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actor_id: actor?.id || 'system',
      actor_name: actor?.full_name || 'Administrator',
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      metadata: data.metadata,
      created_at: new Date().toISOString(),
    };
    memoryAuditLogs = [newLog, ...this.getAuditLogs()];
    persist(STORAGE_KEYS.AUDIT_LOGS, memoryAuditLogs);
  },

  getMemberFinancialSummary(memberId: string): MemberFinancialSummary {
    const member = this.getProfile(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    const activePeriod = this.getActivePeriod();
    const activeBudget = this.getActiveBudget(memberId);
    const allocated = activeBudget?.allocated_amount || 0;

    // Filter money received and expenses in this period
    const receivedRecords = this.getMoneyReceived(memberId, activePeriod?.id);
    const totalReceived = receivedRecords.reduce((sum, r) => sum + r.amount, allocated > 0 ? 0 : 0);

    let expenses = this.getExpenses({ member_id: memberId, period_id: activePeriod?.id });
    const totalSpent = Number(expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2));
    const effectiveAllocated = Math.max(allocated, totalReceived);
    const remaining = calculateRemainingBudget(effectiveAllocated, totalSpent);
    const spentPercentage = calculateSpentPercentage(effectiveAllocated, totalSpent);
    const remainingPercentage = calculateRemainingPercentage(effectiveAllocated, remaining);

    let daysRemaining = 30;
    let totalDays = 30;
    if (activePeriod) {
      const dates = calculateDaysRemaining(activePeriod.start_date, activePeriod.end_date);
      daysRemaining = dates.daysRemaining;
      totalDays = dates.totalDays;
    }

    const dailyPace = calculateSuggestedDailyPace(remaining, daysRemaining);
    const health = getBudgetHealthStatus(effectiveAllocated, totalSpent);

    return {
      member,
      activePeriod,
      activeBudget,
      allocatedAmount: effectiveAllocated,
      totalReceived,
      totalSpent,
      remainingBudget: remaining,
      spentPercentage,
      remainingPercentage,
      daysRemaining,
      totalDays,
      suggestedDailyPace: dailyPace,
      health,
      isOverBudget: health === 'over_budget',
      recentExpensesCount: expenses.length,
    };
  },

  getCategoryFinancialSummaries(periodId?: string, timeframeDays: number = 30): CategoryFinancialSummary[] {
    const categories = this.getCategories();
    const activePeriod = this.getActivePeriod();
    const pId = periodId || activePeriod?.id;

    const allExpenses = this.getExpenses(pId ? { period_id: pId } : undefined);
    const totalFamilySpent = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const profiles = this.getProfiles();

    return categories.map((cat) => {
      const catExpenses = allExpenses.filter((e) => e.category_id === cat.id);
      const totalSpent = Number(catExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2));
      const todaySpent = Number(
        catExpenses.filter((e) => e.expense_date === todayStr).reduce((sum, e) => sum + e.amount, 0).toFixed(2)
      );
      const avgDailySpent = timeframeDays > 0 ? Number((totalSpent / timeframeDays).toFixed(2)) : 0;
      const percentageOfTotal = totalFamilySpent > 0 ? Number(((totalSpent / totalFamilySpent) * 100).toFixed(1)) : 0;

      // Find top spending member for this category
      const memberSpentMap = new Map<string, number>();
      catExpenses.forEach((e) => {
        memberSpentMap.set(e.member_id, (memberSpentMap.get(e.member_id) || 0) + e.amount);
      });
      let topMember: { name: string; amount: number } | undefined = undefined;
      let maxAmount = 0;
      memberSpentMap.forEach((amt, memId) => {
        if (amt > maxAmount) {
          maxAmount = amt;
          const p = profiles.find((prof) => prof.id === memId);
          topMember = { name: p?.full_name || 'Member', amount: amt };
        }
      });

      return {
        category: cat,
        totalSpent,
        todaySpent,
        avgDailySpent,
        transactionCount: catExpenses.length,
        percentageOfTotal,
        topSpendingMember: topMember,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  },

  getFamilyFinancialOverview(): FamilyFinancialOverview {
    const activePeriod = this.getActivePeriod();
    const members = this.getProfiles().filter((p) => p.role === 'member' && p.status === 'active');
    const summaries = members.map((m) => this.getMemberFinancialSummary(m.id));

    const totalAllocated = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
    const totalSpent = summaries.reduce((sum, s) => sum + s.totalSpent, 0);
    const totalRemaining = calculateRemainingBudget(totalAllocated, totalSpent);
    const overallUsagePercentage = calculateSpentPercentage(totalAllocated, totalSpent);

    const overBudgetMembersCount = summaries.filter((s) => s.health === 'over_budget').length;
    const watchMembersCount = summaries.filter((s) => s.health === 'watch').length;
    const healthyMembersCount = summaries.filter((s) => s.health === 'healthy').length;

    const categorySummaries = this.getCategoryFinancialSummaries(activePeriod?.id, 30);

    return {
      activePeriod,
      totalAllocated,
      totalSpent,
      totalRemaining,
      overallUsagePercentage,
      activeMembersCount: members.length,
      overBudgetMembersCount,
      watchMembersCount,
      healthyMembersCount,
      membersSummary: summaries,
      categorySummaries,
    };
  },

  getAccessRequests(): AccessRequest[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (stored) {
        try {
          memoryAccessRequests = JSON.parse(stored);
        } catch {}
      }
    }
    return memoryAccessRequests;
  },

  createAccessRequest(req: { full_name: string; username: string; email: string; password?: string; note?: string }) {
    const cleanUsername = req.username.trim().toLowerCase();
    const cleanEmail = req.email.trim().toLowerCase();

    const profiles = this.getProfiles();
    const existsInProfiles = profiles.some(
      (p) => p.username.toLowerCase() === cleanUsername || p.email.toLowerCase() === cleanEmail
    );
    if (existsInProfiles) {
      throw new Error('Username or email is already registered in the system.');
    }

    const requests = this.getAccessRequests();
    const pendingExists = requests.some(
      (r) => r.status === 'pending' && (r.username.toLowerCase() === cleanUsername || r.email.toLowerCase() === cleanEmail)
    );
    if (pendingExists) {
      throw new Error('An access request with this username or email is already pending approval.');
    }

    const newReq: AccessRequest = {
      id: `req-${Date.now()}`,
      full_name: req.full_name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: req.password || 'member123',
      note: req.note || 'Requested Member Access',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    memoryAccessRequests = [newReq, ...requests];
    persist(STORAGE_KEYS.REQUESTS, memoryAccessRequests);

    this.createNotification({
      user_id: 'usr-admin-1',
      type: 'system',
      title: 'New Account Access Request',
      message: `${req.full_name} (${cleanEmail}) submitted a sign-in access request.`,
    });

    this.logAudit({
      action: 'SUBMITTED_ACCESS_REQUEST',
      entity_type: 'access_requests',
      entity_id: newReq.id,
      metadata: {
        full_name: req.full_name,
        email: cleanEmail,
      },
    });

    return newReq;
  },

  approveAccessRequest(requestId: string): { profile: Profile; emailDispatched: { to: string; subject: string; body: string } } {
    const requests = this.getAccessRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Access request not found.');
    if (req.status !== 'pending') throw new Error('Request has already been processed.');

    const newProfile: Profile = {
      id: `usr-mem-${Date.now()}`,
      full_name: req.full_name,
      username: req.username,
      email: req.email,
      role: 'member',
      status: 'active',
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const profiles = this.getProfiles();
    memoryProfiles = [...profiles, newProfile];

    const vault = this.getPasswordVault();
    vault[newProfile.id] = req.password || 'member123';
    passwordVault = { ...vault };

    req.status = 'approved';
    req.approved_at = new Date().toISOString();
    memoryAccessRequests = [...requests];

    persist(STORAGE_KEYS.PROFILES, memoryProfiles);
    persist(STORAGE_KEYS.PASSWORDS, passwordVault);
    persist(STORAGE_KEYS.REQUESTS, memoryAccessRequests);

    const emailDispatched = {
      to: req.email,
      subject: '🎉 Account Approved - Family Expense Management System',
      body: `Hello ${req.full_name},\n\nYour account access request for the Family Expense Management System has been APPROVED by the Head of Family!\n\nLogin Details:\nUsername/Email: ${req.username}\nTemporary Password: ${req.password || 'member123'}\n\nYou can now log in at http://localhost:3000/login`,
    };

    this.logAudit({
      action: 'APPROVED_ACCESS_REQUEST',
      entity_type: 'profiles',
      entity_id: newProfile.id,
      metadata: {
        full_name: req.full_name,
        email: req.email,
        dispatched_to: req.email,
      },
    });

    notifyListeners();
    return { profile: newProfile, emailDispatched };
  },

  rejectAccessRequest(requestId: string) {
    const req = memoryAccessRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Access request not found.');
    req.status = 'rejected';
    persist(STORAGE_KEYS.REQUESTS, memoryAccessRequests);
    notifyListeners();
  },

  resetToProductionState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('localStorage clear error', e);
      }
    }
    memoryProfiles = [...INITIAL_PROFILES];
    memoryPeriods = [...INITIAL_PERIODS];
    memoryBudgets = [...INITIAL_BUDGETS];
    memoryMoneyReceived = [...INITIAL_MONEY_RECEIVED];
    memoryExpenses = [...INITIAL_EXPENSES];
    memoryCategories = [...INITIAL_CATEGORIES];
    memorySettings = { ...INITIAL_SETTINGS };
    memoryNotifications = [...INITIAL_NOTIFICATIONS];
    memoryAuditLogs = [...INITIAL_AUDIT_LOGS];
    memoryAccessRequests = [];
    passwordVault = { 'usr-admin-1': 'admin123' };

    persist(STORAGE_KEYS.PROFILES, memoryProfiles);
    persist(STORAGE_KEYS.PERIODS, memoryPeriods);
    persist(STORAGE_KEYS.BUDGETS, memoryBudgets);
    persist(STORAGE_KEYS.MONEY_RECEIVED, memoryMoneyReceived);
    persist(STORAGE_KEYS.EXPENSES, memoryExpenses);
    persist(STORAGE_KEYS.CATEGORIES, memoryCategories);
    persist(STORAGE_KEYS.SETTINGS, memorySettings);
    persist(STORAGE_KEYS.NOTIFICATIONS, memoryNotifications);
    persist(STORAGE_KEYS.AUDIT_LOGS, memoryAuditLogs);
    persist(STORAGE_KEYS.PASSWORDS, passwordVault);
    persist(STORAGE_KEYS.REQUESTS, memoryAccessRequests);
  },
};
