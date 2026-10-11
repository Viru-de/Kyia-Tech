import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Trash2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice, PaymentRecord, PaymentMode } from '../../types';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { InvoiceDocumentModal } from './InvoiceDocumentModal';
import { ReceiptDocumentModal } from './ReceiptDocumentModal';

interface InvoiceAndReceiptViewProps {
  onOpenQuickAction: (actionType: string) => void;
  defaultTab?: 'invoices' | 'payments';
}

export const InvoiceAndReceiptView: React.FC<InvoiceAndReceiptViewProps> = ({
  onOpenQuickAction,
  defaultTab = 'invoices',
}) => {
  const {
    invoices,
    payments,
    clients,
    deleteInvoice,
    deletePayment,
    recordInvoicePayment,
    selectedInvoiceId,
    setSelectedInvoiceId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>(defaultTab);
  const [search, setSearch] = useState('');

  // Invoice modal preview
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Receipt modal preview
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Record payment against invoice modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>('UPI');
  const [payRef, setPayRef] = useState<string>('');

  useEffect(() => {
    if (selectedInvoiceId) {
      const inv = invoices.find((i) => i.id === selectedInvoiceId);
      if (inv) {
        setSelectedInvoice(inv);
        setInvoiceModalOpen(true);
        setActiveTab('invoices');
      }
    }
  }, [selectedInvoiceId, invoices]);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    );
  });

  const filteredPayments = payments.filter((pay) => {
    const q = search.toLowerCase();
    return (
      !q ||
      pay.receiptNo.toLowerCase().includes(q) ||
      pay.clientName.toLowerCase().includes(q) ||
      pay.referenceNo.toLowerCase().includes(q) ||
      pay.paymentMode.toLowerCase().includes(q)
    );
  });

  const handleOpenInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setSelectedInvoiceId(inv.id);
    setInvoiceModalOpen(true);
  };

  const handleOpenReceipt = (pay: PaymentRecord) => {
    setSelectedReceipt(pay);
    setReceiptModalOpen(true);
  };

  const handleStartPayment = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPayAmount(inv.balanceDue);
    setPayRef(`UPI-${Date.now().toString().slice(-6)}`);
    setPayModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || payAmount <= 0) return;
    recordInvoicePayment(payingInvoice.id, payAmount, payMode, payRef);
    setPayModalOpen(false);
    setPayingInvoice(null);
  };

  const handleExportInvoicesCSV = () => {
    const rows = [
      ['Invoice No', 'Client', 'Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status'],
      ...filteredInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.clientName,
        inv.invoiceDate,
        inv.dueDate,
        inv.grandTotal,
        inv.paidAmount,
        inv.balanceDue,
        inv.status,
      ]),
    ];
    exportToCSV(`klyia_invoices_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleExportPaymentsCSV = () => {
    const rows = [
      ['Receipt No', 'Client', 'Payment Date', 'Amount', 'Payment Mode', 'Reference No', 'Notes'],
      ...filteredPayments.map((p) => [
        p.receiptNo,
        p.clientName,
        p.paymentDate,
        p.amount,
        p.paymentMode,
        p.referenceNo,
        p.notes || '',
      ]),
    ];
    exportToCSV(`klyia_payments_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Invoices & Payment Receipts</span>
          </h2>
          <p className="text-xs text-slate-500">
            GST compliant tax invoices, partial payments, receipts and transaction ledgers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={activeTab === 'invoices' ? handleExportInvoicesCSV : handleExportPaymentsCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => onOpenQuickAction(activeTab === 'invoices' ? 'quotation' : 'payment')}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs shadow-cyan-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'invoices' ? 'New Quotation / Invoice' : 'Record Payment'}
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Tax Invoices vs Payment Receipts */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payments'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts ({payments.length})</span>
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
            placeholder={
              activeTab === 'invoices'
                ? 'Search invoice number, client, payment status...'
                : 'Search receipt number, client, mode, reference...'
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Table Section */}
      {activeTab === 'invoices' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No invoices found</p>
              <p className="text-xs text-slate-500 mt-1">
                You can convert accepted quotations to tax invoices automatically with one click.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenInvoice(inv)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-cyan-700">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block truncate">{inv.clientName}</span>
                        {inv.quotationNumber && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: {inv.quotationNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(inv.dueDate)}</td>

                      <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                        {formatINR(inv.grandTotal)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatINR(inv.paidAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-black font-mono">
                        <span className={inv.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatINR(inv.balanceDue)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'success'
                              : inv.status === 'Overdue'
                              ? 'danger'
                              : 'warning'
                          }
                          dot
                        >
                          {inv.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => handleStartPayment(inv)}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                              title="Record Payment"
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                            title="Print / View Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Payment Receipts Table */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No payment receipts logged yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Record client advances, partial installments, or full bill clearance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Date Received</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Against Project / Invoice</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((pay) => (
                    <tr
                      key={pay.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenReceipt(pay)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-cyan-700">
                        {pay.receiptNo}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{pay.clientName}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(pay.paymentDate)}</td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                          {pay.paymentMode}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">{pay.referenceNo || '—'}</td>

                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {pay.againstTitle || pay.againstType || 'Service Contract'}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono text-sm">
                        +{formatINR(pay.amount)}
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenReceipt(pay)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                            title="Print Voucher Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete payment receipt ${pay.receiptNo}?`)) {
                                deletePayment(pay.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Payment Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment against Invoice Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment against Invoice"
        subtitle={`Invoice #${payingInvoice?.invoiceNumber} — ${payingInvoice?.clientName}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-bold text-slate-900">
                {payingInvoice ? formatINR(payingInvoice.grandTotal) : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Already Paid:</span>
              <span className="font-bold text-emerald-600">
                {payingInvoice ? formatINR(payingInvoice.paidAmount) : ''}
              </span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
              <span>Outstanding Balance:</span>
              <span>{payingInvoice ? formatINR(payingInvoice.balanceDue) : ''}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={payingInvoice?.balanceDue || 99999999}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={payMode}
              onChange={(e) => setPayMode(e.target.value as PaymentMode)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (IMPS / NEFT / RTGS)</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / UTR Reference
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. UTR-99882241 or Cheque #123456"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Confirm & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Document Modal */}
      <InvoiceDocumentModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      {/* Receipt Document Modal */}
      <ReceiptDocumentModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
        payment={selectedReceipt}
      />
    </div>
  );
};
