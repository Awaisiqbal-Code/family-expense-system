-- ============================================================================
-- FAMILY EXPENSE MANAGEMENT SYSTEM - DATABASE SCHEMA & RLS POLICIES
-- PostgreSQL / Supabase Migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'disabled')) DEFAULT 'active',
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. FINANCIAL PERIODS TABLE
CREATE TABLE IF NOT EXISTS public.financial_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'closed')) DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id),
    closed_at TIMESTAMPTZ,
    closing_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. FAMILY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.family_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_name TEXT NOT NULL DEFAULT 'Al-Rashid Family',
    currency TEXT NOT NULL DEFAULT 'PKR',
    currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
    timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
    default_report_period TEXT NOT NULL DEFAULT '30d',
    allow_over_budget BOOLEAN NOT NULL DEFAULT true,
    current_period_id UUID REFERENCES public.financial_periods(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#4F46E5',
    status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_id UUID REFERENCES public.financial_periods(id) ON DELETE SET NULL,
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 6. MONEY RECEIVED TABLE
CREATE TABLE IF NOT EXISTS public.money_received (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_id UUID REFERENCES public.financial_periods(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    source TEXT NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    verified BOOLEAN NOT NULL DEFAULT true,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_id UUID REFERENCES public.financial_periods(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category_id UUID NOT NULL REFERENCES public.categories(id),
    description TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_expenses_member_date ON public.expenses(member_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_period ON public.expenses(period_id);
CREATE INDEX IF NOT EXISTS idx_budgets_member_period ON public.budgets(member_id, period_id);
CREATE INDEX IF NOT EXISTS idx_money_received_member ON public.money_received(member_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies:
-- Profiles
CREATE POLICY "Admins view/manage all profiles, members view self"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin() OR auth_user_id = auth.uid());

-- Financial Periods
CREATE POLICY "All members can read active/closed periods"
ON public.financial_periods FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage financial periods"
ON public.financial_periods FOR ALL
TO authenticated
USING (public.is_admin());

-- Budgets
CREATE POLICY "Members view own budgets, admins manage all"
ON public.budgets FOR ALL
TO authenticated
USING (
    public.is_admin() OR member_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
);

-- Expenses
CREATE POLICY "Members view and create own expenses, admins view all"
ON public.expenses FOR ALL
TO authenticated
USING (
    public.is_admin() OR member_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
);

-- Money Received
CREATE POLICY "Members view own money received, admins view/manage all"
ON public.money_received FOR ALL
TO authenticated
USING (
    public.is_admin() OR member_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
);

-- Audit logs: Admin only
CREATE POLICY "Only admins view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());
