import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  MessageCircle,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RenewalRecord, RenewalStatus } from '../../types';
import {
  formatINR,
  formatDate,
  getDaysDiff,
  generateWhatsAppReminder,
  openWhatsAppChat,
  exportToCSV,
} from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { RenewalFormModal } from './RenewalFormModal';

interface RenewalViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const RenewalView: React.FC<RenewalViewProps> = ({ onOpenQuickAction }) => {
  const {
    renewals,
    clients,
    companySettings,
    renewNow,
    markReminderSent,
    deleteRenewal,
    setCurrentTab,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'due_soon' | 'overdue' | 'renewed'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [renewalToEdit, setRenewalToEdit] = useState<RenewalRecord | null>(null);

  // Renew Now confirmation modal
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewingRecord, setRenewingRecord] = useState<RenewalRecord | null>(null);
  const [newRenewalDate, setNewRenewalDate] = useState<string>('');
  const [renewPaymentAmount, setRenewPaymentAmount] = useState<number>(0);

  const filteredRenewals = renewals.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.clientName.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q) ||
      (r.domainOrAsset && r.domainOrAsset.toLowerCase().includes(q)) ||
      r.provider.toLowerCase().includes(q);

    const days = getDaysDiff(r.renewalDate);

    if (activeTab === 'due_soon') {
      return matchesSearch && r.status !== 'Renewed' && days >= 0 && days <= 30;
    }
    if (activeTab === 'overdue') {
      return matchesSearch && r.status !== 'Renewed' && (r.status === 'Overdue' || days < 0);
    }
    if (activeTab === 'renewed') {
      return matchesSearch && r.status === 'Renewed';
    }
    return matchesSearch;
  });

  const handleSendWhatsApp = (r: RenewalRecord) => {
    const days = getDaysDiff(r.renewalDate);
    const client = clients.find((c) => c.id === r.clientId);
    const text = generateWhatsAppReminder({
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

    const phone = client?.whatsapp || client?.phone || companySettings.phone;
    openWhatsAppChat(phone, text);
    markReminderSent(r.id);
  };

  const handleCopyReminder = (r: RenewalRecord) => {
    const days = getDaysDiff(r.renewalDate);
    const text = generateWhatsAppReminder({
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
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
    markReminderSent(r.id);
  };

  const handleCreateEmail = (r: RenewalRecord) => {
    const client = clients.find((c) => c.id === r.clientId);
    const days = getDaysDiff(r.renewalDate);
    const subject = encodeURIComponent(
      `Service Renewal Notice: ${r.serviceName} - ${companySettings.companyName}`
    );
    const text = generateWhatsAppReminder({
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
    window.open(`mailto:${client?.email || ''}?subject=${subject}&body=${encodeURIComponent(text)}`, '_blank');
    markReminderSent(r.id);
  };

  const handleStartRenewNow = (r: RenewalRecord) => {
    setRenewingRecord(r);
    // Default +1 year from current expiry
    const curDate = new Date(r.renewalDate);
    const nextYear = new Date(curDate.setFullYear(curDate.getFullYear() + 1))
      .toISOString()
      .split('T')[0];
    setNewRenewalDate(nextYear);
    setRenewPaymentAmount(r.renewalAmount);
    setRenewModalOpen(true);
  };

  const handleConfirmRenewNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingRecord || !newRenewalDate) return;
    renewNow(renewingRecord.id, newRenewalDate, renewPaymentAmount);
    setRenewModalOpen(false);
    setRenewingRecord(null);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Service Name', 'Client', 'Domain/Asset', 'Provider', 'Renewal Date', 'Amount', 'Status', 'Days Remaining'],
      ...filteredRenewals.map((r) => [
        r.serviceName,
        r.clientName,
        r.domainOrAsset || '',
        r.provider,
        r.renewalDate,
        r.renewalAmount,
        r.status,
        getDaysDiff(r.renewalDate),
      ]),
    ];
    exportToCSV(`klyia_renewals_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Renewals & Service Expiry Tracker</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold font-mono">
              Auto-Reminder Engine
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Automated tracking and WhatsApp reminder generator for Domains, Hosting, AMC, SEO & Cloud Subscriptions
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
              setRenewalToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Renewal
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Renewals ({renewals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('due_soon')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'due_soon'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Due Soon (≤30 Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overdue'
              ? 'border-rose-500 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Overdue Expiries</span>
        </button>

        <button
          onClick={() => setActiveTab('renewed')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'renewed'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Renewed</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service, client name, domain, provider (GoDaddy, Hostinger)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Renewals Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredRenewals.length === 0 ? (
          <div className="text-center py-12 px-4">
            <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No renewals found</p>
            <p className="text-xs text-slate-500 mt-1">
              Add domain expiries, hosting packages, and AMC schedules to ensure zero downtime.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Service & Domain</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Renewal Amount</th>
                  <th className="py-3 px-4 text-center">Urgency</th>
                  <th className="py-3 px-4 text-center">Reminder Engine</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRenewals.map((r) => {
                  const days = getDaysDiff(r.renewalDate);
                  const isOverdue = days < 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="truncate max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">
                            {r.serviceName}
                          </span>
                          {r.domainOrAsset && (
                            <span className="text-[11px] font-mono text-cyan-700 font-semibold block truncate">
                              🌐 {r.domainOrAsset}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">{r.clientName}</td>
                      <td className="py-3 px-4 text-slate-600">{r.provider}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {formatDate(r.renewalDate)}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                        {formatINR(r.renewalAmount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            r.status === 'Renewed'
                              ? 'success'
                              : isOverdue
                              ? 'danger'
                              : days === 0
                              ? 'danger'
                              : days <= 7
                              ? 'warning'
                              : 'info'
                          }
                          dot
                        >
                          {r.status === 'Renewed'
                            ? 'Renewed'
                            : isOverdue
                            ? `Overdue by ${Math.abs(days)}d`
                            : days === 0
                            ? 'Due Today!'
                            : `Due in ${days}d`}
                        </Badge>
                      </td>

                      {/* Reminder Engine Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSendWhatsApp(r)}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Direct WhatsApp Message"
                          >
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleCopyReminder(r)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Copy Pre-formatted Text"
                          >
                            {copiedId === r.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCreateEmail(r)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Compose Email Reminder"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {r.lastReminderSentDate && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Sent: {formatDate(r.lastReminderSentDate)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartRenewNow(r)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          >
                            Renew Now
                          </button>
                          <button
                            onClick={() => {
                              setRenewalToEdit(r);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete renewal record "${r.serviceName}"?`)) {
                                deleteRenewal(r.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Renewal Form Modal */}
      <RenewalFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setRenewalToEdit(null);
        }}
        renewalToEdit={renewalToEdit}
      />

      {/* Renew Now Confirmation Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Extend Service & Mark Renewed"
        subtitle={`${renewingRecord?.serviceName} — ${renewingRecord?.clientName}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmRenewNow} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p>
              Current Expiry: <strong>{renewingRecord ? formatDate(renewingRecord.renewalDate) : ''}</strong>
            </p>
            <p>
              Provider: <strong>{renewingRecord?.provider}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Expiry Date (Extended) <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newRenewalDate}
              onChange={(e) => setNewRenewalDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Renewal Amount Collected (₹)
            </label>
            <input
              type="number"
              min={0}
              value={renewPaymentAmount}
              onChange={(e) => setRenewPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Automatically creates a completed purchase & payment entry in client financial ledger.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRenewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Confirm Renewal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
