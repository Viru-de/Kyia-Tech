import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Calendar,
  Filter,
  Download,
  Building2,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';

export const FinanceDashboardView: React.FC = () => {
  const { payments, expenses, purchases, invoices, metrics } = useApp();

  const [dateFilter, setDateFilter] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Date range calculation
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filterByDateRange = (itemDateStr: string | undefined): boolean => {
    if (!itemDateStr) return false;
    const itemDate = new Date(itemDateStr);

    if (dateFilter === 'today') {
      return itemDateStr === todayStr;
    } else if (dateFilter === 'this_week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
      return itemDate >= oneWeekAgo && itemDate <= now;
    } else if (dateFilter === 'this_month') {
      const currentYearMonth = now.toISOString().slice(0, 7);
      return itemDateStr.startsWith(currentYearMonth);
    } else if (dateFilter === 'this_quarter') {
      const currentMonth = now.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
      return itemDate >= quarterStart && itemDate <= now;
    } else if (dateFilter === 'this_year') {
      const currentYear = now.getFullYear().toString();
      return itemDateStr.startsWith(currentYear);
    } else if (dateFilter === 'custom') {
      if (!customStart && !customEnd) return true;
      if (customStart && itemDateStr < customStart) return false;
      if (customEnd && itemDateStr > customEnd) return false;
      return true;
    }
    return true;
  };

  const periodPayments = payments.filter((p) => filterByDateRange(p.paymentDate));
  const periodExpenses = expenses.filter((e) => filterByDateRange(e.date));

  const periodRevenue = periodPayments.reduce((acc, p) => acc + p.amount, 0);
  const periodExpenseTotal = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const periodNetProfit = periodRevenue - periodExpenseTotal;

  // Category breakdown of expenses in selected period
  const expensesByCategory: Record<string, number> = {};
  periodExpenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Party / Vendor', 'Description / Mode', 'Debit (Expense)', 'Credit (Revenue)'],
      ...periodPayments.map((p) => [
        p.paymentDate,
        'Revenue / Receipt',
        p.clientName,
        `${p.paymentMode} (${p.receiptNo})`,
        0,
        p.amount,
      ]),
      ...periodExpenses.map((e) => [
        e.date,
        'Expense',
        e.vendor,
        `${e.category} - ${e.description}`,
        e.amount,
        0,
      ]),
    ];
    exportToCSV(`klyia_finance_statement_${dateFilter}_${todayStr}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Business Financial Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
              P&L Analysis
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time Profit & Loss ledger, revenue receipts, overhead bills, and receivables
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Statement
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_quarter', label: 'This Quarter' },
            { id: 'this_year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setDateFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateFilter === pill.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300"
            />
          </div>
        )}
      </div>

      {/* Core Profit & Loss Formula Cards: Net Profit = Revenue - Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Period Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-mono">{formatINR(periodRevenue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {periodPayments.length} client payment receipts cleared
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Period Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 mt-3 font-mono">
            {formatINR(periodExpenseTotal)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {periodExpenses.length} operating bills & purchases
          </p>
        </div>

        {/* Net Profit */}
        <div
          className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
            periodNetProfit >= 0
              ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-emerald-800 text-white'
              : 'bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border-rose-800 text-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-90">
            <span>Net Business Profit (Revenue - Expenses)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p
            className={`text-3xl font-black mt-3 font-mono ${
              periodNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatINR(periodNetProfit)}
          </p>
          <p className="text-[11px] opacity-75 mt-1">
            Net operating surplus for selected period
          </p>
        </div>
      </div>

      {/* Receivables & Advance Status */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Paid Revenue (All-time)</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {formatINR(metrics.totalRevenue)}
          </p>
          <span className="text-[11px] text-slate-400">Total collected funds</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-xs font-semibold text-rose-900">Outstanding Receivables</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1 font-mono">
            {formatINR(metrics.pendingPaymentsTotal)}
          </p>
          <span className="text-[11px] text-rose-800/80">Pending from client invoices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Advance Collected</span>
          <p className="text-xl font-extrabold text-indigo-600 mt-1 font-mono">
            {formatINR(metrics.advanceBalanceTotal)}
          </p>
          <span className="text-[11px] text-slate-400">Initial kickoff advances</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Lifetime Expenses</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1 font-mono">
            {formatINR(metrics.totalExpenses)}
          </p>
          <span className="text-[11px] text-slate-400">Total outgoing payments</span>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span>Expense Distribution for Selected Period</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
            {Object.keys(expensesByCategory).length} Categories Active
          </span>
        </h4>

        {Object.keys(expensesByCategory).length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No expenses logged in this date range.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory).map(([cat, amt]) => {
              const pct = periodExpenseTotal > 0 ? ((amt / periodExpenseTotal) * 100).toFixed(1) : 0;
              return (
                <div
                  key={cat}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{cat}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{pct}% of total</p>
                  </div>
                  <div className="font-extrabold text-rose-600 text-xs font-mono shrink-0">
                    -{formatINR(amt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
