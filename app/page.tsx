'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Wallet,
  PieChart,
  Users,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="h-16 border-b border-border bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-gray-900 dark:text-white">Family Expense</span>
            <span className="text-[10px] text-primary block -mt-1 font-semibold tracking-wider uppercase">
              Fintech Platform
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="primary" size="sm">
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-primary mb-6 animate-pulse-subtle">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Ready Family Expense Management System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight max-w-3xl">
          Manage Family Spending. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
            Build Better Financial Habits.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
          An enterprise-grade financial management system for families. Dual portals empower administrators with family-wide allocation and auditing, while members enjoy personal budgets, real-time pace metrics, and spending insights.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-lg shadow-primary/25">
              <span>Enter Member & Admin Portals</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-card border border-border shadow-premium">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-primary flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Personal Budgets</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Allocated allowances in PKR with instant deduction, daily pace guidance, and automated budget health monitoring.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 rounded-card border border-border shadow-premium">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-4">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Comprehensive Reports</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Daily, 10-day, and 30-day family audits with instant CSV and PDF generation exclusively for administrators.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 rounded-card border border-border shadow-premium">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Strict Member Isolation</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Family members never see another member&apos;s expenses or family totals. Protected by PostgreSQL Row Level Security.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-xs text-gray-400">
        Family Expense Management System &bull; Production Blueprint Version 1.0 &bull; Default Currency: PKR
      </footer>
    </div>
  );
}
