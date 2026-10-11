import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Download,
  Calendar,
  Clock,
  Repeat,
  Tag,
  Edit2,
  Trash2,
  AlertCircle,
  Building2,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseRecord } from '../../types';
import { formatINR, formatDate, exportToCSV, getDaysDiff } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { ExpenseFormModal } from './ExpenseFormModal';

interface ExpensesViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenQuickAction }) => {
  const { expenses, deleteExpense, companySettings, addExpenseCategory } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'recurring' | 'categories'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseRecord | null>(null);

  // New category inline input
  const [newCatInput, setNewCatInput] = useState('');

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalGstInputCredit = expenses.reduce((acc, e) => acc + (e.gstAmount || 0), 0);

  const recurringExpenses = expenses.filter((e) => e.isRecurring);
  const monthlyRecurringRunrate = recurringExpenses.reduce((acc, e) => {
    if (e.recurringFrequency === 'Monthly') return acc + e.amount;
    if (e.recurringFrequency === 'Quarterly') return acc + e.amount / 3;
    if (e.recurringFrequency === 'Half-Yearly') return acc + e.amount / 6;
    if (e.recurringFrequency === 'Yearly') return acc + e.amount / 12;
    return acc + e.amount;
  }, 0);

  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.description.toLowerCase().includes(q) ||
      e.vendor.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.expenseId.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    if (activeTab === 'recurring') {
      return matchesSearch && matchesCategory && e.isRecurring;
    }
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (exp: ExpenseRecord) => {
    setExpenseToEdit(exp);
    setIsFormOpen(true);
  };

  const handleDelete = (exp: ExpenseRecord) => {
    if (window.confirm(`Delete expense "${exp.expenseId} - ${exp.description}"?`)) {
      deleteExpense(exp.id);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    addExpenseCategory(newCatInput.trim());
    setNewCatInput('');
  };

  const handleExportCSV = () => {
    const rows = [
      ['Expense ID', 'Date', 'Category', 'Description', 'Vendor', 'Amount', 'GST Amount', 'Mode', 'Bill No', 'Recurring', 'Next Due Date'],
      ...filteredExpenses.map((e) => [
        e.expenseId,
        e.date,
        e.category,
        e.description,
        e.vendor,
        e.amount,
        e.gstAmount || 0,
        e.paymentMode,
        e.billInvoiceNumber || '',
        e.isRecurring ? 'Yes' : 'No',
        e.nextDueDate || '',
      ]),
    ];
    exportToCSV(`klyia_expenses_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Business Expenses & Bills</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
              {expenses.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Track operational bills, vendor software subscriptions, office overheads and recurring commitments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs shadow-cyan-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Business Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatINR(totalExpenseAmount)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime recorded costs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Est. Monthly Recurring Runrate</span>
            <Repeat className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-cyan-700 mt-2 font-mono">
            {formatINR(monthlyRecurringRunrate)}/mo
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {recurringExpenses.length} recurring bill schedules
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Input GST Credit Tracked</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            {formatINR(totalGstInputCredit)}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Eligible purchase tax credits
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Expenses ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'recurring'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Recurring Bills ({recurringExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Category Directory ({companySettings.expenseCategories.length})</span>
        </button>
      </div>

      {activeTab !== 'categories' ? (
        <>
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, vendor, invoice number, category..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="w-full sm:w-60">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Categories</option>
                {companySettings.expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 px-4">
                <TrendingDown className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No expenses found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Log business hosting, recharge, internet or software bills to monitor net profit.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Expense ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description & Vendor</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => {
                      const days = exp.nextDueDate ? getDaysDiff(exp.nextDueDate) : null;
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {exp.expenseId}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(exp.date)}</td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {exp.category}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {exp.description}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate block">
                              Vendor: {exp.vendor} {exp.billInvoiceNumber ? `• Bill: ${exp.billInvoiceNumber}` : ''}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600">{exp.paymentMode}</td>

                          <td className="py-3 px-4">
                            {exp.isRecurring ? (
                              <div>
                                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
                                  {exp.recurringFrequency}
                                </span>
                                {exp.nextDueDate && (
                                  <span className="text-[10px] text-slate-500 block mt-0.5">
                                    Next: {formatDate(exp.nextDueDate)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">One-time</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-black text-rose-600 font-mono text-sm">
                            -{formatINR(exp.amount)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(exp)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(exp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </>
      ) : (
        /* Categories Manager Section */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Custom Business Expense Categories</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add custom categories to tag non-standard corporate costs (advertising campaigns, server hardware, travel, etc.)
            </p>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="e.g. Meta / Google Ads, Legal & IP Audit"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Add Category
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
            {companySettings.expenseCategories.map((cat) => {
              const count = expenses.filter((e) => e.category === cat).length;
              return (
                <div
                  key={cat}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate" title={cat}>
                    {cat}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};
