'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataStore, subscribe } from '@/services/store';
import { MemberFinancialSummary, Expense, FamilySettings } from '@/types';
import { formatPKR } from '@/lib/calculations/financial';
import { formatDate, downloadCSV } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  TrendingDown,
  Award,
  ShieldAlert,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportTab = 'daily' | '10d' | '30d';

export default function AdminReportsPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState<ReportTab>('30d');
  const [summaries, setSummaries] = useState<MemberFinancialSummary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<FamilySettings>(DataStore.getSettings());

  const loadData = () => {
    const mems = DataStore.getProfiles().filter((p) => p.role === 'member');
    setSummaries(mems.map((m) => DataStore.getMemberFinancialSummary(m.id)));
    setExpenses(DataStore.getExpenses());
    setSettings(DataStore.getSettings());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(loadData);
    return () => unsub();
  }, []);

  // Filter expenses based on period tab
  const periodDays = tab === 'daily' ? 1 : tab === '10d' ? 10 : 30;
  const filteredExpenses = useMemo(() => {
    const past = new Date();
    past.setDate(past.getDate() - (periodDays - 1));
    const pastStr = past.toISOString().split('T')[0];
    return expenses.filter((e) => e.expense_date >= pastStr);
  }, [expenses, periodDays]);

  // Aggregate metrics
  const totalAllocated = summaries.reduce((sum, s) => sum + s.allocatedAmount, 0);
  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const averageDailySpend = periodDays > 0 ? Number((totalSpent / periodDays).toFixed(0)) : 0;

  // Highest spending member
  const memberSpentMap = new Map<string, number>();
  filteredExpenses.forEach((e) => {
    memberSpentMap.set(e.member_id, (memberSpentMap.get(e.member_id) || 0) + e.amount);
  });
  let highestSpendingMember = { name: 'None', amount: 0 };
  memberSpentMap.forEach((amt, memId) => {
    if (amt > highestSpendingMember.amount) {
      const mem = summaries.find((s) => s.member.id === memId);
      highestSpendingMember = { name: mem?.member.full_name || 'Member', amount: amt };
    }
  });

  // Highest spending category
  const categorySpentMap = new Map<string, number>();
  filteredExpenses.forEach((e) => {
    const catName = e.category?.name || 'Other';
    categorySpentMap.set(catName, (categorySpentMap.get(catName) || 0) + e.amount);
  });
  let highestCategory = { name: 'None', amount: 0 };
  categorySpentMap.forEach((amt, cat) => {
    if (amt > highestCategory.amount) {
      highestCategory = { name: cat, amount: amt };
    }
  });

  // Budget risk members
  const riskMembers = summaries.filter((s) => s.health === 'over_budget' || s.health === 'watch');

  // Category-wise summary for this report period
  const categoryReportSummaries = useMemo(() => {
    const categories = DataStore.getCategories();
    const totalPeriodSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return categories.map((cat) => {
      const catExpenses = filteredExpenses.filter((e) => e.category_id === cat.id);
      const totalSpent = Number(catExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2));
      const avgDailySpent = periodDays > 0 ? Number((totalSpent / periodDays).toFixed(2)) : 0;
      const percentageOfTotal = totalPeriodSpent > 0 ? Number(((totalSpent / totalPeriodSpent) * 100).toFixed(1)) : 0;

      return {
        category: cat,
        totalSpent,
        avgDailySpent,
        transactionCount: catExpenses.length,
        percentageOfTotal,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredExpenses, periodDays]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Member', 'Allocated Budget', 'Total Spent', 'Remaining', 'Usage %', 'Health Status'];
    const rows = summaries.map((s) => [
      s.member.full_name,
      s.allocatedAmount,
      s.totalSpent,
      s.remainingBudget,
      `${s.spentPercentage}%`,
      s.health,
    ]);
    rows.push(['FAMILY TOTAL', totalAllocated, totalSpent, totalRemaining, `${((totalSpent / totalAllocated) * 100).toFixed(1)}%`, 'ALL']);

    rows.push([]);
    rows.push(['--- CATEGORY BREAKDOWN ---', '', '', '', '', '']);
    rows.push(['Category', 'Total Spent (PKR)', 'Avg Daily Spend (PKR)', 'Family Share %', 'Transaction Count', '']);
    categoryReportSummaries.forEach((c) => {
      rows.push([c.category.name, c.totalSpent, c.avgDailySpent, `${c.percentageOfTotal}%`, c.transactionCount, '']);
    });

    downloadCSV(`family-${tab}-financial-report`, headers, rows);
    success('CSV Exported', 'Report CSV with Category Breakdown has been downloaded.');
  };

  // Export PDF using real jsPDF and autoTable (Section 28)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const generatedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Header
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text('Family Expense Management System', 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.text(`Family: ${settings.family_name}`, 14, 28);
      doc.text(`Report Period: ${tab.toUpperCase()} (${periodDays} Days)`, 14, 34);
      doc.text(`Generated Date: ${generatedDate}`, 14, 40);

      // Summary block
      doc.setFontSize(10);
      doc.text(
        `Total Allocated: Rs. ${totalAllocated.toLocaleString()} | Total Spent: Rs. ${totalSpent.toLocaleString()} | Balance: Rs. ${totalRemaining.toLocaleString()}`,
        14,
        48
      );

      // Member Table
      const tableData = summaries.map((s) => [
        s.member.full_name,
        `Rs. ${s.allocatedAmount.toLocaleString()}`,
        `Rs. ${s.totalSpent.toLocaleString()}`,
        `Rs. ${s.remainingBudget.toLocaleString()}`,
        `${s.spentPercentage}%`,
        s.health.toUpperCase(),
      ]);

      tableData.push([
        'FAMILY TOTAL',
        `Rs. ${totalAllocated.toLocaleString()}`,
        `Rs. ${totalSpent.toLocaleString()}`,
        `Rs. ${totalRemaining.toLocaleString()}`,
        `${((totalSpent / totalAllocated) * 100).toFixed(1)}%`,
        '-',
      ]);

      autoTable(doc, {
        startY: 54,
        head: [['Member', 'Allocated', 'Spent', 'Remaining', 'Usage %', 'Health']],
        body: tableData,
        headStyles: { fillColor: [79, 70, 229] },
        theme: 'striped',
      });

      // Category Table in PDF
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 120;
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text('Category-Wise Spending Breakdown', 14, finalY);

      const catTableData = categoryReportSummaries.map((c) => [
        c.category.name,
        `Rs. ${c.totalSpent.toLocaleString()}`,
        `Rs. ${c.avgDailySpent.toLocaleString()}/day`,
        `${c.percentageOfTotal}%`,
        c.transactionCount.toString(),
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Category', 'Total Spent', 'Avg Daily Spend', 'Share %', 'Transactions']],
        body: catTableData,
        headStyles: { fillColor: [16, 185, 129] },
        theme: 'grid',
      });

      doc.save(`family-${tab}-report.pdf`);
      success('PDF Report Generated', 'Official financial report PDF with Category Breakdown downloaded.');
    } catch (err: any) {
      error('PDF Generation Failed', err?.message || 'Unable to build PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions (Section 28) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Family Financial Reports
            </h1>
            <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
              Admin Confidential
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit periods, generate PDF certificates, and analyze family metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Export CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportPDF}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Generate PDF</span>
          </Button>
        </div>
      </div>

      {/* Report Period Tabs: Daily, 10 Days, 30 Days (Section 27) */}
      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-full sm:w-80">
        {(
          [
            { id: 'daily', label: 'Daily Report' },
            { id: '10d', label: '10-Day Report' },
            { id: '30d', label: '30-Day Report' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Allocation</span>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
            {formatPKR(totalAllocated)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Period Spending</span>
          <div className="text-xl font-black text-red-600 dark:text-red-400 mt-1">
            {formatPKR(totalSpent)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Remaining Balance</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatPKR(totalRemaining)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Daily Spend</span>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatPKR(averageDailySpend)}/day
          </div>
        </Card>
      </div>

      {/* 10-Day and 30-Day Specific Analytical Highlights (Section 27) */}
      {tab !== 'daily' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
              Highest Spending Member
            </span>
            <div className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {highestSpendingMember.name}
            </div>
            <span className="text-xs text-indigo-600 font-semibold">
              {formatPKR(highestSpendingMember.amount)}
            </span>
          </Card>

          <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
              Highest Spending Category
            </span>
            <div className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {highestCategory.name}
            </div>
            <span className="text-xs text-emerald-600 font-semibold">
              {formatPKR(highestCategory.amount)}
            </span>
          </Card>

          <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
              Budget Risk Members
            </span>
            <div className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {riskMembers.length} Members
            </div>
            <span className="text-xs text-amber-700 font-semibold">
              {riskMembers.map((m) => m.member.full_name.split(' ')[0]).join(', ') || 'None'}
            </span>
          </Card>
        </div>
      )}

      {/* Main Report Table with Family Total Row (Section 27) */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {tab === 'daily' ? 'Daily Ledger' : tab === '10d' ? '10-Day Period Audit' : '30-Day Monthly Audit'}
            </h3>
            <span className="text-[11px] text-gray-400">
              Family Expense Management System &bull; Period: {periodDays} days
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Spent</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4">Usage %</th>
                <th className="py-3 px-4">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summaries.map((s) => (
                <tr key={s.member.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/40">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    {s.member.full_name}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {formatPKR(s.allocatedAmount)}
                  </td>
                  <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">
                    {formatPKR(s.totalSpent)}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    {formatPKR(s.remainingBudget)}
                  </td>
                  <td className="py-3 px-4">{s.spentPercentage}%</td>
                  <td className="py-3 px-4">
                    <Badge status={s.health} />
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Family Total Row (Section 27) */}
            <tfoot className="bg-gray-100/80 dark:bg-gray-800 font-bold border-t-2 border-border text-gray-900 dark:text-white">
              <tr>
                <td className="py-3.5 px-4 font-extrabold uppercase tracking-wider text-primary">
                  Family Total
                </td>
                <td className="py-3.5 px-4">{formatPKR(totalAllocated)}</td>
                <td className="py-3.5 px-4 text-red-600 dark:text-red-400">{formatPKR(totalSpent)}</td>
                <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400">{formatPKR(totalRemaining)}</td>
                <td className="py-3.5 px-4">{((totalSpent / totalAllocated) * 100).toFixed(1)}%</td>
                <td className="py-3.5 px-4">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
