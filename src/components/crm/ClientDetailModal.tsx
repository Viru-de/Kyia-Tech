import React, { useState } from 'react';
import {
  Client,
  PurchaseRecord,
  PaymentRecord,
  RenewalRecord,
  Quotation,
  Invoice,
  ClientServiceItem,
} from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import {
  formatINR,
  formatDate,
  openWhatsAppChat,
  generateWhatsAppReminder,
  getDaysDiff,
} from '../../utils/formatters';
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Building2,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  RefreshCw,
  Plus,
  Printer,
  FileDown,
  Edit2,
  Trash2,
  ExternalLink,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  onEdit: (client: Client) => void;
  onAddPurchase: (clientId: string) => void;
  onAddPayment: (clientId: string) => void;
  onCreateQuotation: (clientId: string) => void;
  onAddRenewal: (clientId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onEdit,
  onAddPurchase,
  onAddPayment,
  onCreateQuotation,
  onAddRenewal,
}) => {
  const {
    clients,
    purchases,
    payments,
    renewals,
    quotations,
    invoices,
    expenses,
    companySettings,
    deleteClient,
    updateClient,
    setCurrentTab,
    getClientFinancials,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'quotations' | 'payments' | 'renewals' | 'notes'>('overview');

  // Individual service editing state
  const [editingService, setEditingService] = useState<ClientServiceItem | null>(null);
  const [serviceRateInput, setServiceRateInput] = useState<string>('');
  const [serviceStatusInput, setServiceStatusInput] = useState<string>('');
  const [serviceDescInput, setServiceDescInput] = useState<string>('');

  if (!isOpen || !clientId) return null;

  const client = clients.find((c) => c.id === clientId);
  if (!client) return null;

  const clientPurchases = purchases.filter((p) => p.clientId === client.id);
  const clientPayments = payments.filter((p) => p.clientId === client.id);
  const clientRenewals = renewals.filter((r) => r.clientId === client.id);
  const clientQuotations = quotations.filter((q) => q.clientId === client.id);
  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const financials = getClientFinancials(client.id);

  const handleStartEditService = (svc: ClientServiceItem) => {
    setEditingService(svc);
    setServiceRateInput(svc.amount !== undefined ? svc.amount.toString() : '');
    setServiceStatusInput(svc.status || 'Active');
    setServiceDescInput(svc.description || '');
  };

  const handleSaveService = () => {
    if (!editingService || !client.services) return;
    const rateNum = serviceRateInput.trim() === '' ? undefined : parseFloat(serviceRateInput);
    const updatedServices = client.services.map((s) =>
      s.id === editingService.id
        ? {
            ...s,
            amount: rateNum && !isNaN(rateNum) ? rateNum : undefined,
            status: serviceStatusInput || s.status,
            description: serviceDescInput || s.description,
          }
        : s
    );
    updateClient(client.id, { services: updatedServices });
    setEditingService(null);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete client "${client.name}"? This action cannot be undone.`
      )
    ) {
      deleteClient(client.id);
      onClose();
    }
  };

  const handleOpenStatement = () => {
    onClose();
    setCurrentTab('client-statement', { clientId: client.id });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="5xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{client.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-600 font-semibold">
                {client.clientId}
              </span>
              <Badge
                variant={
                  client.clientType === 'RETURNING CLIENT'
                    ? 'purple'
                    : client.clientType === 'NEW CLIENT'
                    ? 'primary'
                    : 'neutral'
                }
              >
                {client.clientType}
              </Badge>
              <Badge
                variant={
                  client.status === 'Active'
                    ? 'success'
                    : client.status === 'Overdue'
                    ? 'danger'
                    : client.status === 'Renewal Due'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {client.status}
              </Badge>
            </div>
            {client.companyName && (
              <p className="text-xs text-slate-500 font-normal">{client.companyName}</p>
            )}
          </div>
        </div>
      }
      headerActions={
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(client)}
            className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Edit Client Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddPurchase(client.id)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Purchase/Service
            </button>
            <button
              onClick={() => onAddPayment(client.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </button>
            <button
              onClick={() => onCreateQuotation(client.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Create Quotation
            </button>
            <button
              onClick={() => onAddRenewal(client.id)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Add Renewal
            </button>
          </div>

          <button
            onClick={handleOpenStatement}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Client Statement & Ledger →
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Total Billed</span>
            <p className="text-base font-black text-slate-900 mt-1">
              {formatINR(financials.totalBilled)}
            </p>
            <span className="text-[10px] text-slate-400">
              {clientPurchases.length} service contract(s)
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Total Paid</span>
            <p className="text-base font-black text-emerald-600 mt-1">
              {formatINR(financials.totalPaid)}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {clientPayments.length} receipt(s) cleared
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Advance Balance</span>
            <p className="text-base font-black text-indigo-600 mt-1">
              {formatINR(financials.totalAdvance)}
            </p>
            <span className="text-[10px] text-slate-400">Paid in advance</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20">
            <span className="text-[11px] font-medium text-rose-900">Remaining Balance</span>
            <p className="text-base font-black text-rose-600 mt-1">
              {formatINR(financials.totalBalance)}
            </p>
            <span
              className={`text-[10px] font-bold ${
                financials.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {financials.totalBalance > 0 ? 'Pending collection' : 'Fully Settled ✓'}
            </span>
          </div>
        </div>

        {/* Contact & Address Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Contact & Comms
            </span>
            <p className="font-semibold text-slate-800">
              {client.contactPerson || client.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={`tel:${client.phone}`}
                className="text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <Phone className="w-3 h-3" />
                {client.phone}
              </a>
              {client.whatsapp && (
                <button
                  onClick={() => openWhatsAppChat(client.whatsapp, `Hi ${client.contactPerson || client.name}, greetings from Klyia Technology!`)}
                  className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <MessageCircle className="w-3 h-3" />
                  Chat
                </button>
              )}
            </div>
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="text-slate-600 hover:underline flex items-center gap-1 mt-1 truncate"
              >
                <Mail className="w-3 h-3 text-slate-400" />
                {client.email}
              </a>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Address & Presence
            </span>
            <p className="text-slate-700 leading-tight">
              {client.address || 'No street address recorded'}
            </p>
            <p className="text-slate-500 mt-0.5">
              {[client.area, client.city, client.state, client.pincode].filter(Boolean).join(', ')}
            </p>
            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 hover:underline flex items-center gap-1 mt-1 font-semibold truncate"
              >
                <Globe className="w-3 h-3" />
                {client.website}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tax & Classification
            </span>
            <div className="space-y-1">
              <p className="text-slate-700">
                GSTIN: <span className="font-mono font-bold">{client.gstin || 'Unregistered'}</span>
              </p>
              <p className="text-slate-700">
                PAN: <span className="font-mono font-bold">{client.pan || '—'}</span>
              </p>
              <p className="text-slate-700">
                Industry: <span className="font-semibold">{client.industry || 'General'}</span>
              </p>
              <p className="text-slate-500 text-[11px]">
                Added: {formatDate(client.dateAdded)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Client History */}
        <div>
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview & Summary
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'purchases'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Purchases & Services ({clientPurchases.length})
            </button>
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'quotations'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Quotations ({clientQuotations.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Payments & Timeline ({clientPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('renewals')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'renewals'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Renewals ({clientRenewals.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Notes & Scope
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="py-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Services Breakdown (Section 2 Requirement) */}
                {client.services && client.services.length > 0 && (
                  <div className="p-4 rounded-xl border border-cyan-200/90 bg-cyan-50/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200/60 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Services Breakdown & Deliverables ({client.services.length})
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                            Package Scope
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Solar ERP + Website + SEO + GEO / AI services developed and provided by Klyia Technology.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-700">Commercial Package Value:</span>
                        <p className="text-sm font-black text-cyan-900">
                          ₹1,20,000 + 18% GST (₹21,600) = ₹1,41,600
                        </p>
                        <span className="text-[10px] text-rose-600 font-bold">
                          Payment Status: Pending / Not Paid (Advance: ₹0, Balance: ₹1,41,600)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {client.services.map((svc, idx) => (
                        <div
                          key={svc.id || idx}
                          className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-cyan-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-slate-900">
                                SERVICE {idx + 1}: {svc.name}
                              </span>
                              <Badge variant={svc.status === 'Active' ? 'success' : 'info'} size="sm">
                                {svc.status || 'Active'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {svc.description || 'Full solution deliverable'}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500">
                              Amount:{' '}
                              <strong className="text-slate-800">
                                {svc.amount !== undefined
                                  ? formatINR(svc.amount)
                                  : 'Associated with ₹1.20L Package'}
                              </strong>
                            </span>
                            <button
                              onClick={() => handleStartEditService(svc)}
                              className="text-[10px] text-cyan-600 hover:text-cyan-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit Rate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-500 italic">
                      * Commercial amount is associated with the overall project/package rate (₹1,20,000 + 18% GST = ₹1,41,600). Individual service amounts remain editable and are not automatically divided unless manually specified.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Latest purchases */}
                  <div className="p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Active Services & Contracts
                    </h4>
                    {clientPurchases.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">No purchases recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {clientPurchases.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="truncate pr-2">
                              <p className="font-bold text-slate-900 truncate">
                                {p.customServiceTitle || p.serviceType}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {formatDate(p.purchaseDate)} • Mode: {p.paymentMode}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-slate-900 block">
                                {formatINR(p.grandTotal)}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  p.paymentStatus === 'Paid'
                                    ? 'text-emerald-600'
                                    : p.paymentStatus === 'Overdue'
                                    ? 'text-rose-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {p.paymentStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Renewals */}
                  <div className="p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Renewals & Subscriptions
                    </h4>
                    {clientRenewals.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">No active renewals tracked for this client.</p>
                    ) : (
                      <div className="space-y-2">
                        {clientRenewals.map((r) => {
                          const diff = getDaysDiff(r.renewalDate);
                          return (
                            <div
                              key={r.id}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div className="truncate pr-2">
                                <p className="font-bold text-slate-900 truncate">{r.serviceName}</p>
                                <p className="text-[11px] text-slate-500">
                                  Expires: {formatDate(r.renewalDate)} ({r.provider})
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-slate-900 block">
                                  {formatINR(r.renewalAmount)}
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    diff < 0
                                      ? 'text-rose-600'
                                      : diff <= 7
                                      ? 'text-amber-600'
                                      : 'text-sky-600'
                                  }`}
                                >
                                  {diff < 0 ? `Overdue ${Math.abs(diff)}d` : `In ${diff}d`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div className="space-y-3">
                {clientPurchases.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No services or purchases recorded. Click "Add Purchase/Service" above to add one.
                  </div>
                ) : (
                  clientPurchases.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {p.customServiceTitle || p.serviceType}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                              {p.purchaseId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Purchased on {formatDate(p.purchaseDate)} • Due: {formatDate(p.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-slate-900 block">
                            {formatINR(p.grandTotal)}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              p.paymentStatus === 'Paid'
                                ? 'text-emerald-600'
                                : p.paymentStatus === 'Overdue'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-3">{p.description}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2.5 rounded-lg bg-slate-50">
                        <div>
                          <span className="text-slate-400 block">Base Amount</span>
                          <span className="font-semibold text-slate-800">{formatINR(p.baseAmount)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Discount</span>
                          <span className="font-semibold text-slate-800">
                            {p.discount ? `-${formatINR(p.discount)}` : '₹0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">
                            GST ({p.gstApplicable ? `${p.gstPercent}%` : 'Non-GST'})
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatINR((p.cgst || 0) + (p.sgst || 0) + (p.igst || 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Balance Due</span>
                          <span className="font-bold text-rose-600">{formatINR(p.balanceDue)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Quotations Tab */}
            {activeTab === 'quotations' && (
              <div className="space-y-3">
                {clientQuotations.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No quotations generated for this client yet.
                  </div>
                ) : (
                  clientQuotations.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs bg-white"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{q.quotationNumber}</span>
                          <Badge
                            variant={
                              q.status === 'Accepted'
                                ? 'success'
                                : q.status === 'Sent'
                                ? 'primary'
                                : 'neutral'
                            }
                          >
                            {q.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Date: {formatDate(q.quotationDate)} • Valid Until: {formatDate(q.validUntil)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {formatINR(q.grandTotal)}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            setCurrentTab('sales-quotations', { quotationId: q.id });
                          }}
                          className="text-[11px] text-cyan-600 hover:underline font-semibold"
                        >
                          View Quotation PDF →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                {clientPayments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No payment receipts logged yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="py-2.5 px-3">Receipt No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientPayments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {pay.receiptNo}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{formatDate(pay.paymentDate)}</td>
                            <td className="py-2.5 px-3 text-slate-600">{pay.paymentMode}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                              {pay.referenceNo || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                              +{formatINR(pay.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Renewals Tab */}
            {activeTab === 'renewals' && (
              <div className="space-y-3">
                {clientRenewals.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No services marked for renewal for this client.
                  </div>
                ) : (
                  clientRenewals.map((r) => {
                    const days = getDaysDiff(r.renewalDate);
                    return (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{r.serviceName}</span>
                            <Badge variant={days < 0 ? 'danger' : days <= 7 ? 'warning' : 'info'}>
                              {days < 0 ? `Overdue ${Math.abs(days)}d` : `Due in ${days}d`}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Provider: {r.provider} • Expiry: {formatDate(r.renewalDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 block">
                            {formatINR(r.renewalAmount)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Reminder: {r.reminderDays} days prior
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {client.notes ? (
                  <p className="whitespace-pre-line">{client.notes}</p>
                ) : (
                  <p className="text-slate-400 italic">No notes added for this client.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Edit Sub-Modal */}
      {editingService && (
        <Modal
          isOpen={true}
          onClose={() => setEditingService(null)}
          title={`Edit Service: ${editingService.name}`}
          subtitle="Configure individual service rate, deliverables, and service lifecycle status"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Individual Commercial Rate (₹)
              </label>
              <input
                type="number"
                value={serviceRateInput}
                onChange={(e) => setServiceRateInput(e.target.value)}
                placeholder="Leave blank to keep tied to overall package"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave empty if associated with overall ₹1,20,000 package.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Status
              </label>
              <select
                value={serviceStatusInput}
                onChange={(e) => setServiceStatusInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Upcoming / Discussion">Upcoming / Discussion</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deliverable Description
              </label>
              <textarea
                value={serviceDescInput}
                onChange={(e) => setServiceDescInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
