import React from 'react';
import {
  Users,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Calendar,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, getDaysDiff, generateWhatsAppReminder, openWhatsAppChat } from '../../utils/formatters';
import { Badge } from '../common/Badge';

interface DashboardViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQuickAction }) => {
  const {
    metrics,
    clients,
    renewals,
    payments,
    quotations,
    expenses,
    purchases,
    setCurrentTab,
    companySettings,
    renewNow,
    markReminderSent,
  } = useApp();

  // Filter urgent renewals
  const urgentRenewals = renewals
    .filter((r) => r.status !== 'Renewed' && r.status !== 'Cancelled')
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
    .slice(0, 5);

  // Clients with outstanding balance
  const clientsWithBalance = clients
    .map((c) => {
      const clientPurchases = purchases.filter((p) => p.clientId === c.id);
      const clientPayments = payments.filter((p) => p.clientId === c.id);
      const totalBilled = clientPurchases.reduce((acc, p) => acc + p.grandTotal, 0);
      const totalPaid = clientPayments.reduce((acc, p) => acc + p.amount, 0);
      const balance = Math.max(0, totalBilled - totalPaid);
      return {
        ...c,
        balance,
        totalBilled,
        totalPaid,
      };
    })
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // Recent quotations
  const recentQuotations = [...quotations]
    .sort((a, b) => new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime())
    .slice(0, 5);

  // Recent expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Pipeline counts
  const pipelineStages = [
    { name: 'Upcoming / Requirement / Project Discussion', shortName: 'Upcoming / Discussion', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { name: 'New Lead', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { name: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Quotation Sent', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Negotiation', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'Confirmed', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { name: 'Work in Progress', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { name: 'Completed', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { name: 'Renewal Due', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    { name: 'Renewed', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    { name: 'Lost', color: 'bg-slate-200 text-slate-600 border-slate-300' },
  ];

  const handleSendRenewalWhatsApp = (r: (typeof urgentRenewals)[0]) => {
    const days = getDaysDiff(r.renewalDate);
    const message = generateWhatsAppReminder({
      clientName: r.clientName,
      serviceName: r.serviceName,
      domainOrAsset: r.domainOrAsset,
      renewalDate: r.renewalDate,
      amount: r.renewalAmount,
      daysRemaining: days,
      companyName: companySettings.companyName,
      companyPhone: companySettings.phone,
      upiId: companySettings.upiId,
    });

    const client = clients.find((c) => c.id === r.clientId);
    const phone = client?.whatsapp || client?.phone || companySettings.phone;
    openWhatsAppChat(phone, message);
    markReminderSent(r.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-sky-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Business Control Center
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              {companySettings.companyName}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-0.5">
              {companySettings.tagline} • Client CRM, Quotations, Invoices, Renewals & Financials
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0">
            <div>
              <p className="text-[11px] font-medium text-slate-300">This Month Revenue</p>
              <p className="text-lg font-black text-cyan-300">{formatINR(metrics.thisMonthRevenue)}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[11px] font-medium text-slate-300">Net Business Profit</p>
              <p
                className={`text-lg font-black ${
                  metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatINR(metrics.netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Large Quick Actions Bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <button
              onClick={() => onOpenQuickAction('client')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-600/80 hover:border-cyan-400 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer group shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mb-1 text-cyan-400 group-hover:text-white" />
              <span>New Client</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('quotation')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-600/80 hover:border-cyan-400 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer group shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 mb-1 text-sky-400 group-hover:text-white" />
              <span>New Quotation</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('payment')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/80 hover:border-emerald-400 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer group shadow-sm"
            >
              <CreditCard className="w-4 h-4 mb-1 text-emerald-400 group-hover:text-white" />
              <span>Add Payment</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('purchase')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/80 hover:border-indigo-400 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer group shadow-sm"
            >
              <Briefcase className="w-4 h-4 mb-1 text-indigo-400 group-hover:text-white" />
              <span>Add Service</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('renewal')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-600/80 hover:border-amber-400 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer group shadow-sm"
            >
              <RefreshCw className="w-4 h-4 mb-1 text-amber-400 group-hover:text-white" />
              <span>Add Renewal</span>
            </button>
            <button
              onClick={() => onOpenQuickAction('expense')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-600/80 hover:border-rose-400 border border-slate-700 text-xs font-semibold text-white transition-all cursor-pointer group shadow-sm"
            >
              <TrendingDown className="w-4 h-4 mb-1 text-rose-400 group-hover:text-white" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => setCurrentTab('renewals')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 transition-all cursor-pointer group shadow-sm"
            >
              <Clock className="w-4 h-4 mb-1 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>View Renewals</span>
            </button>
            <button
              onClick={() => setCurrentTab('sales-invoices')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-rose-300 transition-all cursor-pointer group shadow-sm"
            >
              <AlertCircle className="w-4 h-4 mb-1 text-rose-300 group-hover:scale-110 transition-transform" />
              <span>Outstanding</span>
            </button>
          </div>
        </div>
      </div>

      {/* 14 Core Summary Cards Required in Section 2 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Financial & Operations Snapshot
          </h3>
          <span className="text-xs text-slate-500">Real-time calculations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {/* Total Clients */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Clients</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2">{metrics.totalClients}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.activeClients} Active • {metrics.upcomingClientsCount} Upcoming
            </p>
          </div>

          {/* Active Clients */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Clients</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-extrabold text-emerald-600 mt-2">{metrics.activeClients}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ongoing projects/services</p>
          </div>

          {/* New Clients */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">New Clients</span>
              <Sparkles className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-xl font-extrabold text-cyan-600 mt-2">{metrics.newClients}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.returningClients} returning clients
            </p>
          </div>

          {/* Renewal Due */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-900">Renewal Due</span>
              <RefreshCw className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-amber-700 mt-2">{metrics.renewalDueCount}</p>
            <p className="text-[11px] text-amber-800/80 mt-0.5">Due in next 30 days</p>
          </div>

          {/* Renewal Overdue */}
          <div className="bg-white p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-xs hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-900">Renewal Overdue</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-extrabold text-rose-700 mt-2">{metrics.renewalOverdueCount}</p>
            <p className="text-[11px] text-rose-800/80 mt-0.5">Requires immediate renewal</p>
          </div>

          {/* Pending Payments */}
          <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Payments</span>
              <CreditCard className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-xl font-extrabold text-rose-600 mt-2">
              {formatINR(metrics.pendingPaymentsTotal)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Rejoy ₹1.41L • Fruit ERP ₹42K
            </p>
          </div>

          {/* Advance Balance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Advance Balance</span>
              <Wallet className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xl font-extrabold text-indigo-600 mt-2">
              {formatINR(metrics.advanceBalanceTotal)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total advances received</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2">
              {formatINR(metrics.totalRevenue)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Lifetime receipts</p>
          </div>

          {/* This Month Revenue */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">This Month Rev.</span>
              <DollarSign className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-xl font-extrabold text-cyan-700 mt-2">
              {formatINR(metrics.thisMonthRevenue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Received current month</p>
          </div>

          {/* This Month Expenses */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Month Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-xl font-extrabold text-rose-600 mt-2">
              {formatINR(metrics.thisMonthExpenses)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bills & operational cost</p>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Net Profit</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <p
              className={`text-xl font-extrabold mt-2 ${
                metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatINR(metrics.netProfit)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Revenue - Expenses</p>
          </div>

          {/* Active Projects */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Projects</span>
              <Briefcase className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2">
              {metrics.activeProjectsCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">In dev or deployment</p>
          </div>

          {/* Pending Quotations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Quotes</span>
              <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-extrabold text-purple-600 mt-2">
              {metrics.pendingQuotationsCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting client decision</p>
          </div>

          {/* Accepted Quotations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Accepted Quotes</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-extrabold text-emerald-600 mt-2">
              {metrics.acceptedQuotationsCount}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Converted into jobs</p>
          </div>
        </div>
      </div>

      {/* Client Pipeline (Kanban / Visual Stages) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Client Pipeline</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                CRM
              </span>
            </h3>
            <p className="text-xs text-slate-500">Distribution of leads and ongoing client engagements</p>
          </div>
          <button
            onClick={() => setCurrentTab('crm-pipeline')}
            className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Pipeline Board</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {pipelineStages.map((stage) => {
            const count = clients.filter((c) => c.pipelineStage === stage.name).length;
            return (
              <div
                key={stage.name}
                onClick={() => setCurrentTab('crm-pipeline')}
                className={`p-3 rounded-xl border ${stage.color} cursor-pointer hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div className="text-[11px] font-bold truncate" title={stage.name}>
                  {stage.shortName || stage.name}
                </div>
                <div className="text-lg font-black mt-2">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Upcoming Renewals + Outstanding Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900">Upcoming Renewals</h4>
              <Badge variant="warning">{urgentRenewals.length}</Badge>
            </div>
            <button
              onClick={() => setCurrentTab('renewals')}
              className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {urgentRenewals.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No upcoming renewals due in this period.
              </div>
            ) : (
              urgentRenewals.map((r) => {
                const days = getDaysDiff(r.renewalDate);
                const isOverdue = days < 0;
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{r.clientName}</span>
                        <Badge variant={isOverdue ? 'danger' : days <= 7 ? 'warning' : 'info'}>
                          {isOverdue ? `Overdue by ${Math.abs(days)}d` : `Due in ${days}d`}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{r.serviceName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Amount: <strong className="text-slate-700">{formatINR(r.renewalAmount)}</strong> • Due Date: {formatDate(r.renewalDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSendRenewalWhatsApp(r)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => {
                          const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
                          renewNow(r.id, nextYear, r.renewalAmount);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Renew Now
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-600" />
              <h4 className="text-sm font-bold text-slate-900">Outstanding Client Balances</h4>
              <Badge variant="danger">{clientsWithBalance.length}</Badge>
            </div>
            <button
              onClick={() => setCurrentTab('crm-clients')}
              className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View clients
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {clientsWithBalance.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                All client accounts are clear! Zero outstanding balances.
              </div>
            ) : (
              clientsWithBalance.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all flex items-center justify-between gap-3 bg-white"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {c.clientId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {c.contactPerson} • {c.phone}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-rose-600 block">
                      {formatINR(c.balance)}
                    </span>
                    <button
                      onClick={() => setCurrentTab('client-statement', { clientId: c.id })}
                      className="text-[11px] text-cyan-600 hover:underline font-semibold cursor-pointer"
                    >
                      Statement →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Three Columns: Recent Payments, Recent Quotations, Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Recent Payments
            </h4>
            <button
              onClick={() => setCurrentTab('sales-payments')}
              className="text-[11px] text-cyan-600 hover:underline font-semibold cursor-pointer"
            >
              All receipts
            </button>
          </div>
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-900 truncate">{p.clientName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatDate(p.paymentDate)} • {p.paymentMode} ({p.receiptNo})
                  </p>
                </div>
                <div className="font-extrabold text-emerald-600 text-right shrink-0">
                  +{formatINR(p.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
              Recent Quotations
            </h4>
            <button
              onClick={() => setCurrentTab('sales-quotations')}
              className="text-[11px] text-cyan-600 hover:underline font-semibold cursor-pointer"
            >
              All quotes
            </button>
          </div>
          <div className="space-y-3">
            {recentQuotations.map((q) => (
              <div key={q.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-900 truncate">{q.clientName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {q.quotationNumber} • Valid: {formatDate(q.validUntil)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900 block">{formatINR(q.grandTotal)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-cyan-50 text-cyan-700">
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Recent Expenses
            </h4>
            <button
              onClick={() => setCurrentTab('expenses')}
              className="text-[11px] text-cyan-600 hover:underline font-semibold cursor-pointer"
            >
              All expenses
            </button>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-900 truncate">{e.category}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatDate(e.date)} • {e.vendor}
                  </p>
                </div>
                <div className="font-extrabold text-rose-600 text-right shrink-0">
                  -{formatINR(e.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
