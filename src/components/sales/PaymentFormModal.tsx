import React, { useState, useEffect } from 'react';
import { PaymentMode } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string | null;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  defaultClientId,
}) => {
  const { clients, purchases, invoices, addPayment, getClientFinancials } = useApp();

  const [clientId, setClientId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(10000);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [againstType, setAgainstType] = useState<'Quotation' | 'Invoice' | 'Purchase' | 'Direct Advance'>('Invoice');
  const [againstId, setAgainstId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const cId = defaultClientId || clients[0]?.id || '';
    setClientId(cId);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmount(10000);
    setPaymentMode('UPI');
    setReferenceNo(`UPI-${Date.now().toString().slice(-6)}`);
    setAgainstType('Invoice');
    setAgainstId('');
    setNotes('');
  }, [defaultClientId, isOpen, clients]);

  const client = clients.find((c) => c.id === clientId);
  const fin = client ? getClientFinancials(client.id) : null;

  const clientInvoices = invoices.filter((i) => i.clientId === clientId && i.balanceDue > 0);
  const clientPurchases = purchases.filter((p) => p.clientId === clientId && p.balanceDue > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      alert('Please select a valid client');
      return;
    }
    if (amount <= 0) {
      alert('Payment amount must be greater than zero');
      return;
    }

    let againstTitle = 'Direct Advance';
    if (againstType === 'Invoice' && againstId) {
      const inv = invoices.find((i) => i.id === againstId);
      if (inv) againstTitle = `Invoice #${inv.invoiceNumber}`;
    } else if (againstType === 'Purchase' && againstId) {
      const pur = purchases.find((p) => p.id === againstId);
      if (pur) againstTitle = pur.customServiceTitle || pur.serviceType;
    }

    addPayment({
      clientId: client.id,
      clientName: client.name,
      paymentDate,
      amount,
      paymentMode,
      referenceNo,
      notes: notes || undefined,
      againstType,
      againstId: againstId || undefined,
      againstTitle,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Record Payment & Generate Receipt"
      subtitle="Log incoming bank transfer, UPI or cash payment and issue official receipt voucher"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Client Account <span className="text-rose-500">*</span>
          </label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setAgainstId('');
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.clientId})
              </option>
            ))}
          </select>
        </div>

        {fin && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
            <span className="text-slate-500">Current Outstanding Balance:</span>
            <span className="font-black text-rose-600 font-mono">{formatINR(fin.totalBalance)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount Received (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="UPI">UPI (Google Pay / PhonePe)</option>
              <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / UTR Number
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UTR-998822"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Allocated To</label>
          <select
            value={againstType}
            onChange={(e) => setAgainstType(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="Invoice">Specific Tax Invoice</option>
            <option value="Purchase">Project / Service Order</option>
            <option value="Direct Advance">Direct Client Advance Balance</option>
          </select>
        </div>

        {againstType === 'Invoice' && clientInvoices.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Open Invoice</label>
            <select
              value={againstId}
              onChange={(e) => setAgainstId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Choose Invoice --</option>
              {clientInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} (Balance: {formatINR(inv.balanceDue)})
                </option>
              ))}
            </select>
          </div>
        )}

        {againstType === 'Purchase' && clientPurchases.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Service Contract</label>
            <select
              value={againstId}
              onChange={(e) => setAgainstId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Choose Service --</option>
              {clientPurchases.map((pur) => (
                <option key={pur.id} value={pur.id}>
                  {pur.customServiceTitle || pur.serviceType} (Due: {formatINR(pur.balanceDue)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 50% milestone payment received"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Record Payment & Generate Receipt
          </button>
        </div>
      </form>
    </Modal>
  );
};
