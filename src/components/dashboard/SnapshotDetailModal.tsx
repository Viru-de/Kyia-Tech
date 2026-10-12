import React, { useState, useMemo } from 'react';
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
  ArrowUpRight,
  Briefcase,
  FileSpreadsheet,
  DollarSign,
  Search,
  Filter,
  ArrowUpDown,
  Phone,
  MessageCircle,
  Eye,
  Edit2,
  X,
  ExternalLink,
  Calendar,
  Building2,
  Clock,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, PurchaseRecord, RenewalRecord, Quotation, PaymentRecord, ExpenseRecord } from '../../types';
import { formatINR, formatDate, getDaysDiff, openWhatsAppChat, generateWhatsAppReminder, exportToCSV } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export type SnapshotMetricType =
  | 'total-clients'
  | 'active-clients'
  | 'new-clients'
  | 'renewal-due'
  | 'renewal-overdue'
  | 'pending-payments'
  | 'advance-balance'
  | 'total-revenue'
  | 'this-month-revenue'
  | 'this-month-expenses'
  | 'net-profit'
  | 'active-projects'
  | 'pending-quotes'
  | 'accepted-quotes';

interface SnapshotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: SnapshotMetricType | null;
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onViewQuotation?: (quotationId: string) => void;
}

export const SnapshotDetailModal: React.FC<SnapshotDetailModalProps> = ({
  isOpen,
  onClose,
  metricType,
  onViewClient,
  onEditClient,
  onViewQuotation,
}) => {
  const {
    clients,
    purchases,
    payments,
    renewals,
    quotations,
    expenses,
    companySettings,
    metrics,
    getClientFinancials,
    renewNow,
    markReminderSent,
    setCurrentTab,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Reset filters when metric changes
  React.useEffect(() => {
    setSearch('');
    setStatusFilter('all');
    setDueFilter('all');
    setSortBy('default');
  }, [metricType, isOpen]);

  if (!isOpen || !metricType) return null;

  const activeClientsList = clients.filter((c) => !c.isArchived);
  const currentYearMonth = new Date().toISOString().slice(0, 7);

  // --------------------------------------------------------------------------
  // 1. PENDING PAYMENTS (OUTSTANDING RECEIVABLES)
  // --------------------------------------------------------------------------
  const pendingClientsData = activeClientsList
    .map((c) => {
      const fin = getClientFinancials(c.id);
      return {
        client: c,
        totalBill: fin.totalBilled,
        advanceReceived: fin.totalAdvance,
        pendingAmount: fin.totalBalance,
        dueDate: fin.dueDate,
        paymentStatus: fin.paymentStatus,
        isOverdue: fin.isOverdue,
      };
    })
    .filter((item) => item.pendingAmount > 0);

  const filteredPendingClients = pendingClientsData
    .filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.client.name.toLowerCase().includes(q) ||
        item.client.companyName?.toLowerCase().includes(q) ||
        item.client.phone.includes(q) ||
        item.client.clientId.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'Pending' && item.paymentStatus === 'Pending') ||
        (statusFilter === 'Partially Paid' && item.paymentStatus === 'Partially Paid') ||
        (statusFilter === 'Overdue' && (item.isOverdue || item.paymentStatus === 'Overdue'));

      const matchesDue =
        dueFilter === 'all' ||
        (dueFilter === 'overdue' && item.dueDate && getDaysDiff(item.dueDate) < 0) ||
        (dueFilter === 'this-month' && item.dueDate && item.dueDate.startsWith(currentYearMonth)) ||
        (dueFilter === 'no-date' && !item.dueDate);

      return matchesSearch && matchesStatus && matchesDue;
    })
    .sort((a, b) => {
      if (sortBy === 'pending-desc') return b.pendingAmount - a.pendingAmount;
      if (sortBy === 'pending-asc') return a.pendingAmount - b.pendingAmount;
      if (sortBy === 'oldest-due') {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return da - db;
      }
      if (sortBy === 'name-asc') return a.client.name.localeCompare(b.client.name);
      return b.pendingAmount - a.pendingAmount; // Default: highest pending first
    });

  const totalOutstandingSum = filteredPendingClients.reduce((acc, i) => acc + i.pendingAmount, 0);
  const totalBillSum = filteredPendingClients.reduce((acc, i) => acc + i.totalBill, 0);
  const totalAdvanceSum = filteredPendingClients.reduce((acc, i) => acc + i.advanceReceived, 0);

  // --------------------------------------------------------------------------
  // 2. TOTAL CLIENTS
  // --------------------------------------------------------------------------
  const filteredTotalClients = activeClientsList
    .filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.clientId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

  // --------------------------------------------------------------------------
  // 3. ACTIVE CLIENTS
  // --------------------------------------------------------------------------
  const activeClientsRecords = activeClientsList.filter(
    (c) =>
      c.status === 'Active' ||
      c.pipelineStage === 'Work Started' ||
      c.pipelineStage === 'Work in Progress' ||
      c.pipelineStage === 'Confirmed'
  );

  const filteredActiveClients = activeClientsRecords.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  // --------------------------------------------------------------------------
  // 4. NEW CLIENTS
  // --------------------------------------------------------------------------
  const newClientsRecords = activeClientsList.filter(
    (c) => c.clientType === 'NEW CLIENT' || c.status === 'New'
  );

  const filteredNewClients = newClientsRecords.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  // --------------------------------------------------------------------------
  // 5. RENEWAL DUE (NEXT 30 DAYS)
  // --------------------------------------------------------------------------
  const renewalDueRecords = renewals
    .filter((r) => {
      if (r.status === 'Renewed' || r.status === 'Cancelled') return false;
      const days = getDaysDiff(r.renewalDate);
      return days >= 0 && days <= 30;
    })
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  const filteredRenewalDue = renewalDueRecords.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.clientName.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q) ||
      (r.domainOrAsset && r.domainOrAsset.toLowerCase().includes(q))
    );
  });

  // --------------------------------------------------------------------------
  // 6. RENEWAL OVERDUE
  // --------------------------------------------------------------------------
  const renewalOverdueRecords = renewals
    .filter((r) => {
      if (r.status === 'Renewed' || r.status === 'Cancelled') return false;
      return getDaysDiff(r.renewalDate) < 0;
    })
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  const filteredRenewalOverdue = renewalOverdueRecords.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.clientName.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q) ||
      (r.domainOrAsset && r.domainOrAsset.toLowerCase().includes(q))
    );
  });

  // --------------------------------------------------------------------------
  // 7. ADVANCE BALANCE
  // --------------------------------------------------------------------------
  const advanceClientsData = activeClientsList
    .map((c) => {
      const fin = getClientFinancials(c.id);
      return {
        client: c,
        totalAdvance: fin.totalAdvance,
        totalBilled: fin.totalBilled,
        pendingBalance: fin.totalBalance,
        paymentStatus: fin.paymentStatus,
      };
    })
    .filter((i) => i.totalAdvance > 0)
    .sort((a, b) => b.totalAdvance - a.totalAdvance);

  const filteredAdvanceClients = advanceClientsData.filter((i) => {
    const q = search.toLowerCase();
    return (
      !q ||
      i.client.name.toLowerCase().includes(q) ||
      i.client.companyName?.toLowerCase().includes(q) ||
      i.client.phone.includes(q)
    );
  });

  // --------------------------------------------------------------------------
  // 8. TOTAL REVENUE (LIFETIME RECEIPTS)
  // --------------------------------------------------------------------------
  const filteredPayments = [...payments]
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        !q ||
        p.clientName.toLowerCase().includes(q) ||
        p.receiptNo.toLowerCase().includes(q) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // --------------------------------------------------------------------------
  // 9. THIS MONTH REVENUE
  // --------------------------------------------------------------------------
  const monthPayments = payments.filter(
    (p) => p.paymentDate && p.paymentDate.startsWith(currentYearMonth)
  );
  const filteredMonthPayments = monthPayments
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        !q ||
        p.clientName.toLowerCase().includes(q) ||
        p.receiptNo.toLowerCase().includes(q) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // --------------------------------------------------------------------------
  // 10. THIS MONTH EXPENSES
  // --------------------------------------------------------------------------
  const monthExpenses = expenses.filter(
    (e) => e.date && e.date.startsWith(currentYearMonth)
  );
  const filteredMonthExpenses = monthExpenses
    .filter((e) => {
      const q = search.toLowerCase();
      return (
        !q ||
        e.category.toLowerCase().includes(q) ||
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --------------------------------------------------------------------------
  // 11. ACTIVE PROJECTS
  // --------------------------------------------------------------------------
  const activeProjectsList = purchases
    .filter((p) => p.paymentStatus !== 'Paid' || p.serviceType)
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  const filteredActiveProjects = activeProjectsList.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.clientName.toLowerCase().includes(q) ||
      p.serviceType.toLowerCase().includes(q) ||
      (p.customServiceTitle && p.customServiceTitle.toLowerCase().includes(q))
    );
  });

  // --------------------------------------------------------------------------
  // 12. PENDING QUOTATIONS
  // --------------------------------------------------------------------------
  const pendingQuotations = quotations
    .filter((q) => q.status === 'Sent' || q.status === 'Draft' || q.status === 'Negotiation')
    .sort((a, b) => new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime());

  const filteredPendingQuotes = pendingQuotations.filter((q) => {
    const term = search.toLowerCase();
    return (
      !term ||
      q.quotationNumber.toLowerCase().includes(term) ||
      q.clientName.toLowerCase().includes(term) ||
      (q.companyName && q.companyName.toLowerCase().includes(term))
    );
  });

  // --------------------------------------------------------------------------
  // 13. ACCEPTED QUOTATIONS
  // --------------------------------------------------------------------------
  const acceptedQuotations = quotations
    .filter((q) => q.status === 'Accepted')
    .sort((a, b) => new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime());

  const filteredAcceptedQuotes = acceptedQuotations.filter((q) => {
    const term = search.toLowerCase();
    return (
      !term ||
      q.quotationNumber.toLowerCase().includes(term) ||
      q.clientName.toLowerCase().includes(term) ||
      (q.companyName && q.companyName.toLowerCase().includes(term))
    );
  });

  // Handler for WhatsApp renewal reminder
  const handleSendRenewalWhatsApp = (r: RenewalRecord) => {
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

  // Config for each metric type
  const metricConfig = {
    'total-clients': {
      title: 'Total Registered Clients',
      subtitle: `${filteredTotalClients.length} client account(s) on record`,
      icon: Users,
      color: 'text-slate-700',
    },
    'active-clients': {
      title: 'Active Clients',
      subtitle: `${filteredActiveClients.length} client(s) with active projects or service engagements`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    'new-clients': {
      title: 'New Clients & Prospects',
      subtitle: `${filteredNewClients.length} new client profile(s) logged`,
      icon: Sparkles,
      color: 'text-cyan-600',
    },
    'renewal-due': {
      title: 'Renewals Due (Next 30 Days)',
      subtitle: `${filteredRenewalDue.length} service/domain contract(s) expiring within 30 days`,
      icon: RefreshCw,
      color: 'text-amber-600',
    },
    'renewal-overdue': {
      title: 'Renewal Overdue — Action Required',
      subtitle: `${filteredRenewalOverdue.length} renewal(s) past expiration date`,
      icon: AlertTriangle,
      color: 'text-rose-600',
    },
    'pending-payments': {
      title: 'Pending Payments / Outstanding Receivables',
      subtitle: `${filteredPendingClients.length} client(s) with outstanding unpaid balance`,
      icon: CreditCard,
      color: 'text-rose-600',
    },
    'advance-balance': {
      title: 'Advance Balance & Client Deposits',
      subtitle: `${filteredAdvanceClients.length} client(s) with advance deposits on file`,
      icon: Wallet,
      color: 'text-indigo-600',
    },
    'total-revenue': {
      title: 'Total Revenue — Lifetime Receipts',
      subtitle: `${filteredPayments.length} receipt record(s) totaling ${formatINR(metrics.totalRevenue)}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    'this-month-revenue': {
      title: 'This Month Revenue',
      subtitle: `${filteredMonthPayments.length} receipt(s) collected in current calendar month`,
      icon: DollarSign,
      color: 'text-cyan-600',
    },
    'this-month-expenses': {
      title: 'Month Expenses & Operational Costs',
      subtitle: `${filteredMonthExpenses.length} expense bill(s) recorded for current calendar month`,
      icon: TrendingDown,
      color: 'text-rose-600',
    },
    'net-profit': {
      title: 'Cash Flow & Net Business Profit',
      subtitle: `Cash-based accounting: Lifetime Receipts minus Recorded Expenses`,
      icon: ArrowUpRight,
      color: metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
    },
    'active-projects': {
      title: 'Active Projects & Service Deployments',
      subtitle: `${filteredActiveProjects.length} ongoing project contract(s)`,
      icon: Briefcase,
      color: 'text-sky-600',
    },
    'pending-quotes': {
      title: 'Pending Quotations',
      subtitle: `${filteredPendingQuotes.length} quotation(s) awaiting client decision`,
      icon: FileSpreadsheet,
      color: 'text-purple-600',
    },
    'accepted-quotes': {
      title: 'Accepted Quotations',
      subtitle: `${filteredAcceptedQuotes.length} quotation(s) approved and confirmed by clients`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
  }[metricType];

  const IconComponent = metricConfig?.icon || Users;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-2xs border border-slate-200 ${metricConfig?.color}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {metricConfig?.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {metricConfig?.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Scrolling */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {/* ========================================================================= */}
          {/* VIEW: PENDING PAYMENTS (OUTSTANDING RECEIVABLES)                          */}
          {/* ========================================================================= */}
          {metricType === 'pending-payments' && (
            <div className="space-y-5">
              {/* Top 4 Summary Cards as per Section 2 Specification */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200">
                  <span className="text-xs font-semibold text-rose-800">Total Outstanding Amount</span>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {formatINR(totalOutstandingSum)}
                  </p>
                  <span className="text-[11px] text-rose-600/80 font-medium">Remaining to collect</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Pending Clients</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {filteredPendingClients.length}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">With balance &gt; ₹0</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Total Bill Amount</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {formatINR(totalBillSum)}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">Across pending accounts</span>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-800">Total Advance Received</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">
                    {formatINR(totalAdvanceSum)}
                  </p>
                  <span className="text-[11px] text-emerald-600/80 font-medium">Deposited to date</span>
                </div>
              </div>

              {/* Search, Filters, and Sorting Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by client name, company, phone..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending (No Advance)</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Due Date:</span>
                    <select
                      value={dueFilter}
                      onChange={(e) => setDueFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">All Dates</option>
                      <option value="overdue">Overdue</option>
                      <option value="this-month">Due This Month</option>
                      <option value="no-date">No Due Date</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="pending-desc">Highest Pending First</option>
                      <option value="pending-asc">Lowest Pending First</option>
                      <option value="oldest-due">Oldest Due Date First</option>
                      <option value="name-asc">Client Name (A–Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Outstanding Receivables Table */}
              {filteredPendingClients.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">No pending payments. All client balances are clear.</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    There are no outstanding client receivables matching your search and filter criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4 text-right">Total Bill</th>
                        <th className="py-3 px-4 text-right">Advance Received</th>
                        <th className="py-3 px-4 text-right">Pending Amount</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-center">Payment Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 bg-white">
                      {filteredPendingClients.map((item) => (
                        <tr key={item.client.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <button
                              onClick={() => {
                                onClose();
                                onViewClient(item.client);
                              }}
                              className="text-left font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                            >
                              {item.client.name}
                            </button>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {item.client.clientId}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.client.companyName || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono">
                            <a
                              href={`tel:${item.client.phone}`}
                              className="hover:underline text-slate-800 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.client.phone}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            {formatINR(item.totalBill)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                            {formatINR(item.advanceReceived)}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                            {formatINR(item.pendingAmount)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.dueDate ? (
                              <div className="flex items-center gap-1">
                                <span>{formatDate(item.dueDate)}</span>
                                {getDaysDiff(item.dueDate) < 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                item.paymentStatus === 'Paid'
                                  ? 'success'
                                  : item.paymentStatus === 'Partially Paid'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {item.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  onClose();
                                  onViewClient(item.client);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer flex items-center gap-1"
                                title="View Client Details"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => {
                                  onClose();
                                  onEditClient(item.client);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                                title="Edit Client Billing"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 uppercase text-[11px] tracking-wider text-slate-700">
                          Total ({filteredPendingClients.length} accounts)
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900 font-bold">
                          {formatINR(totalBillSum)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                          {formatINR(totalAdvanceSum)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-black text-sm">
                          {formatINR(totalOutstandingSum)}
                        </td>
                        <td colSpan={3} className="py-3 px-4 text-right text-[11px] font-medium text-slate-500">
                          Total Outstanding Receivables
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: TOTAL CLIENTS                                                      */}
          {/* ========================================================================= */}
          {metricType === 'total-clients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clients by name, company, phone, ID..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="New">New</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Client ID</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredTotalClients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-700">{c.clientId}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 text-slate-600">{c.companyName || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {c.clientType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={c.status === 'Active' ? 'success' : 'neutral'}>{c.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(c.dateAdded)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                onClose();
                                onViewClient(c);
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                onClose();
                                onEditClient(c);
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: ACTIVE CLIENTS                                                     */}
          {/* ========================================================================= */}
          {metricType === 'active-clients' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search active clients..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Pipeline Stage</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredActiveClients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.name}
                          <span className="block text-[10px] text-slate-400 font-mono">{c.clientId}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{c.companyName || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {c.pipelineStage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono">{c.phone}</td>
                        <td className="py-3 px-4 text-slate-600">{c.assignedTo || 'Viru Patel'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              onClose();
                              onViewClient(c);
                            }}
                            className="px-3 py-1 font-bold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
                          >
                            View Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: NEW CLIENTS                                                        */}
          {/* ========================================================================= */}
          {metricType === 'new-clients' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search new clients..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4">Date Onboarded</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredNewClients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 text-slate-600">{c.companyName || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                            {c.clientType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(c.dateAdded)}</td>
                        <td className="py-3 px-4 font-mono">{c.phone}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              onClose();
                              onViewClient(c);
                            }}
                            className="px-3 py-1 font-bold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: RENEWAL DUE (NEXT 30 DAYS)                                          */}
          {/* ========================================================================= */}
          {metricType === 'renewal-due' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search renewals by client, service, or domain..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {filteredRenewalDue.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">No renewals due in the next 30 days</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    All client domains, hosting packages, and AMCs are currently up to date.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4">Service / Asset</th>
                        <th className="py-3 px-4">Renewal Date</th>
                        <th className="py-3 px-4">Days Left</th>
                        <th className="py-3 px-4 text-right">Renewal Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredRenewalDue.map((r) => {
                        const days = getDaysDiff(r.renewalDate);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{r.clientName}</td>
                            <td className="py-3 px-4 text-slate-700">
                              <span className="font-semibold">{r.serviceName}</span>
                              {r.domainOrAsset && (
                                <span className="block text-[11px] text-slate-400 font-mono">
                                  {r.domainOrAsset}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-semibold">{formatDate(r.renewalDate)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                                {days === 0 ? 'Due Today' : `Due in ${days} day(s)`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900">
                              {formatINR(r.renewalAmount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleSendRenewalWhatsApp(r)}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const nextYear = new Date(r.renewalDate);
                                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                                    renewNow(r.id, nextYear.toISOString().split('T')[0], r.renewalAmount);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 cursor-pointer flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Renew Now</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: RENEWAL OVERDUE                                                     */}
          {/* ========================================================================= */}
          {metricType === 'renewal-overdue' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search overdue renewals..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {filteredRenewalOverdue.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">No overdue renewals</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    There are no contracts or digital assets currently past their expiration date.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4">Service / Asset</th>
                        <th className="py-3 px-4">Expired On</th>
                        <th className="py-3 px-4">Days Overdue</th>
                        <th className="py-3 px-4 text-right">Renewal Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredRenewalOverdue.map((r) => {
                        const days = Math.abs(getDaysDiff(r.renewalDate));
                        return (
                          <tr key={r.id} className="hover:bg-slate-50 bg-rose-50/20">
                            <td className="py-3 px-4 font-bold text-slate-900">{r.clientName}</td>
                            <td className="py-3 px-4 text-slate-700">
                              <span className="font-semibold">{r.serviceName}</span>
                              {r.domainOrAsset && (
                                <span className="block text-[11px] text-slate-400 font-mono">
                                  {r.domainOrAsset}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-rose-700 font-bold">{formatDate(r.renewalDate)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                {days} day(s) overdue
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-rose-600">
                              {formatINR(r.renewalAmount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleSendRenewalWhatsApp(r)}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Send Reminder</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const nextYear = new Date();
                                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                                    renewNow(r.id, nextYear.toISOString().split('T')[0], r.renewalAmount);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 cursor-pointer flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Renew</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: ADVANCE BALANCE                                                     */}
          {/* ========================================================================= */}
          {metricType === 'advance-balance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200">
                  <span className="text-xs font-semibold text-indigo-900">Total Advance Received</span>
                  <p className="text-xl font-black text-indigo-700 mt-1">
                    {formatINR(metrics.advanceBalanceTotal)}
                  </p>
                  <span className="text-[11px] text-indigo-600/80">Across all clients</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Accounts with Advance</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{advanceClientsData.length}</p>
                  <span className="text-[11px] text-slate-500">Active client accounts</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients with advance balance..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4 text-right">Total Bill Amount</th>
                      <th className="py-3 px-4 text-right">Advance Received</th>
                      <th className="py-3 px-4 text-right">Pending Balance</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredAdvanceClients.map((item) => (
                      <tr key={item.client.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.client.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.client.companyName || '—'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatINR(item.totalBilled)}</td>
                        <td className="py-3 px-4 text-right font-black text-indigo-600">{formatINR(item.totalAdvance)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">{formatINR(item.pendingBalance)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={item.pendingBalance === 0 ? 'success' : 'warning'}>
                            {item.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              onClose();
                              onViewClient(item.client);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: TOTAL REVENUE & THIS MONTH REVENUE                                  */}
          {/* ========================================================================= */}
          {(metricType === 'total-revenue' || metricType === 'this-month-revenue') && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-900">
                  {metricType === 'total-revenue' ? 'Total Lifetime Receipts' : 'Current Month Receipts'}
                </span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {formatINR(metricType === 'total-revenue' ? metrics.totalRevenue : metrics.thisMonthRevenue)}
                </p>
                <span className="text-[11px] text-emerald-600/80">
                  {metricType === 'total-revenue'
                    ? `${filteredPayments.length} payment receipts cleared to bank / cash`
                    : `${filteredMonthPayments.length} receipts collected in ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search receipts by client, receipt #, reference #..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Reference No.</th>
                      <th className="py-3 px-4 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(metricType === 'total-revenue' ? filteredPayments : filteredMonthPayments).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-700">{p.receiptNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.clientName}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{p.referenceNo || '—'}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600">
                          {formatINR(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: MONTH EXPENSES                                                      */}
          {/* ========================================================================= */}
          {metricType === 'this-month-expenses' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-xs font-semibold text-rose-900">Current Month Operational Costs</span>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {formatINR(metrics.thisMonthExpenses)}
                </p>
                <span className="text-[11px] text-rose-600/80">
                  {filteredMonthExpenses.length} expense bill(s) in {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses by category, payee, or description..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Payee / Vendor</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredMonthExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{e.category}</td>
                        <td className="py-3 px-4 text-slate-700">{e.vendor || '—'}</td>
                        <td className="py-3 px-4 text-slate-500">{e.description || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(e.date)}</td>
                        <td className="py-3 px-4 text-slate-600">{e.paymentMode}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">
                          {formatINR(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: NET PROFIT                                                          */}
          {/* ========================================================================= */}
          {metricType === 'net-profit' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-900">Total Inflow (Receipts)</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">{formatINR(metrics.totalRevenue)}</p>
                  <span className="text-[11px] text-emerald-600">Lifetime client payments</span>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-xs font-semibold text-rose-900">Total Outflow (Expenses)</span>
                  <p className="text-xl font-black text-rose-600 mt-1">{formatINR(metrics.totalExpenses)}</p>
                  <span className="text-[11px] text-rose-600">Lifetime business expenses</span>
                </div>

                <div className={`p-4 rounded-xl border ${metrics.netProfit >= 0 ? 'bg-cyan-50 border-cyan-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className="text-xs font-semibold text-slate-800">Net Business Cash Profit</span>
                  <p className={`text-xl font-black mt-1 ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatINR(metrics.netProfit)}
                  </p>
                  <span className="text-[11px] text-slate-500">Receipts − Expenses</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Financial Accounting Notes</h4>
                <p className="text-slate-600 leading-relaxed">
                  Net Business Profit is computed on cash basis, reflecting confirmed receipts actually cleared against expenses recorded. Invoices created but not yet collected remain under Outstanding Receivables and are excluded from revenue until settled.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: ACTIVE PROJECTS                                                     */}
          {/* ========================================================================= */}
          {metricType === 'active-projects' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects by client or service..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Purchase ID</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Service Type</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4 text-right">Project Value</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredActiveProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-700">{p.purchaseId}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.clientName}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {p.customServiceTitle || p.serviceType}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(p.purchaseDate)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {formatINR(p.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={p.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                            {p.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: PENDING QUOTATIONS & ACCEPTED QUOTATIONS                           */}
          {/* ========================================================================= */}
          {(metricType === 'pending-quotes' || metricType === 'accepted-quotes') && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quotations by quote #, client, or company..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Quotation #</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Valid Until</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(metricType === 'pending-quotes' ? filteredPendingQuotes : filteredAcceptedQuotes).map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-700">{q.quotationNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{q.clientName}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(q.quotationDate)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(q.validUntil)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {formatINR(q.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={q.status === 'Accepted' ? 'success' : 'warning'}>
                            {q.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              onClose();
                              setCurrentTab('sales-quotations', { quotationId: q.id });
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer"
                          >
                            Open Quote
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Klyia Technology • Financial & Operations Control
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
