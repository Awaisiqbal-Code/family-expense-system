import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'member']).optional(),
});

export const ExpenseCreateSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  category_id: z.string().min(1, 'Please select a category'),
  description: z
    .string()
    .min(2, 'Description must be at least 2 characters')
    .max(120, 'Description cannot exceed 120 characters'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)'),
});

export const MemberCreateSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  initial_budget: z
    .number({ invalid_type_error: 'Initial budget must be a number' })
    .min(0, 'Initial budget cannot be negative'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const BudgetUpdateSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  allocated_amount: z
    .number({ invalid_type_error: 'Budget amount must be a number' })
    .min(0, 'Budget cannot be negative'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required'),
});

export const FamilySettingsSchema = z.object({
  family_name: z.string().min(2, 'Family name is required'),
  currency: z.string().min(1, 'Currency is required'),
  currency_symbol: z.string().min(1, 'Currency symbol is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  default_report_period: z.enum(['7d', '10d', '30d']),
  allow_over_budget: z.boolean(),
});

export const CategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Valid hex color required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;
export type MemberCreateInput = z.infer<typeof MemberCreateSchema>;
export type BudgetUpdateInput = z.infer<typeof BudgetUpdateSchema>;
export type FamilySettingsInput = z.infer<typeof FamilySettingsSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
