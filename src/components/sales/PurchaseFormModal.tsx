import React, { useState, useEffect } from 'react';
import { PurchaseRecord, ServiceType } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { calculateGST } from '../../utils/formatters';

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseToEdit?: PurchaseRecord | null;
  defaultClientId?: string | null;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  purchaseToEdit,
  defaultClientId,
}) => {
  const { clients, companySettings, addPurchase, updatePurchase } = useApp();

  const [clientId, setClientId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState<ServiceType>('Website Development');
  const [customServiceTitle, setCustomServiceTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Financial fields
  const [baseAmount, setBaseAmount] = useState<number>(35000);
  const [discount, setDiscount] = useState<number>(0);
  const [gstApplicable, setGstApplicable] = useState<boolean>(true);
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [isInterstate, setIsInterstate] = useState<boolean>(false);
  const [advancePaid, setAdvancePaid] = useState<number>(15000);
  const [paymentMode, setPaymentMode] = useState<string>('Bank Transfer');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (purchaseToEdit) {
      setClientId(purchaseToEdit.clientId);
      setPurchaseDate(purchaseToEdit.purchaseDate);
      setServiceType(purchaseToEdit.serviceType);
      setCustomServiceTitle(purchaseToEdit.customServiceTitle || '');
      setDescription(purchaseToEdit.description);
      setBaseAmount(purchaseToEdit.baseAmount);
      setDiscount(purchaseToEdit.discount || 0);
      setGstApplicable(purchaseToEdit.gstApplicable);
      setGstPercent(purchaseToEdit.gstPercent || 18);
      setIsInterstate(purchaseToEdit.isInterstate || false);
      setAdvancePaid(purchaseToEdit.advancePaid || 0);
      setPaymentMode(purchaseToEdit.paymentMode || 'Bank Transfer');
      setDueDate(purchaseToEdit.dueDate || '');
      setRenewalDate(purchaseToEdit.renewalDate || '');
      setNotes(purchaseToEdit.notes || '');
    } else {
      const cId = defaultClientId || clients[0]?.id || '';
      setClientId(cId);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setServiceType('Website Development');
      setCustomServiceTitle('');
      setDescription('Custom design & full-stack development');
      setBaseAmount(35000);
      setDiscount(0);
      setGstApplicable(true);
      setGstPercent(companySettings.defaultGstPercent || 18);
      setAdvancePaid(15000);
      setPaymentMode('Bank Transfer');
      setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setRenewalDate('');
      setNotes('');
    }
  }, [purchaseToEdit, defaultClientId, isOpen, clients, companySettings]);

  // When client changes, check interstate
  useEffect(() => {
    const cl = clients.find((c) => c.id === clientId);
    if (cl && cl.state && cl.state.toLowerCase() !== (companySettings.state || 'karnataka').toLowerCase()) {
      setIsInterstate(true);
    } else {
      setIsInterstate(false);
    }
  }, [clientId, clients, companySettings.state]);

  // Real-time calculations
  const taxableAmount = Math.max(0, baseAmount - discount);
  const effectiveGstPercent = gstApplicable ? gstPercent : 0;
  const gstBreakdown = calculateGST(taxableAmount, effectiveGstPercent, isInterstate);
  const grandTotal = gstBreakdown.grandTotal;
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  const paymentStatus =
    balanceDue <= 0
      ? 'Paid'
      : advancePaid > 0
      ? 'Partial'
      : dueDate && new Date(dueDate).getTime() < Date.now()
      ? 'Overdue'
      : 'Pending';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      alert('Please select a valid client');
      return;
    }

    const payload = {
      clientId: client.id,
      clientName: client.name,
      purchaseDate,
      serviceType,
      customServiceTitle: customServiceTitle || undefined,
      description,
      baseAmount,
      discount,
      gstApplicable,
      gstPercent: effectiveGstPercent,
      isInterstate,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      igst: gstBreakdown.igst,
      grandTotal,
      advancePaid,
      balanceDue,
      paymentStatus: paymentStatus as any,
      paymentMode,
      dueDate,
      renewalDate: renewalDate || undefined,
      notes,
    };

    if (purchaseToEdit) {
      updatePurchase(purchaseToEdit.id, payload);
    } else {
      addPurchase(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={purchaseToEdit ? `Edit Service Entry: ${purchaseToEdit.purchaseId}` : 'Add Purchase / Service Record'}
      subtitle="Manual pricing, optional GST calculation, advance logging and automatic balance tracking"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service / Contract Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {companySettings.serviceCategories.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Service Title (Optional)
            </label>
            <input
              type="text"
              value={customServiceTitle}
              onChange={(e) => setCustomServiceTitle(e.target.value)}
              placeholder="e.g. AI Customer Service Chatbot"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scope of Work / Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details of deliverables, milestones, technologies used..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          {/* Pricing & GST Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Base Service Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={baseAmount}
              onChange={(e) => setBaseAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discount Allowed (₹)
            </label>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* GST Controls */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gstApplicable}
                  onChange={(e) => setGstApplicable(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
                <span>Apply GST on this Transaction</span>
              </label>

              {gstApplicable && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">GST Rate:</span>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              )}
            </div>

            {gstApplicable && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isInterstate}
                  onChange={(e) => setIsInterstate(e.target.checked)}
                  className="w-3.5 h-3.5 text-cyan-600 rounded"
                />
                <span>Interstate Client (Apply IGST instead of CGST + SGST)</span>
              </label>
            )}
          </div>

          {/* Advance & Payment Tracking */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Advance Paid Upfront (₹)
            </label>
            <input
              type="number"
              min={0}
              max={grandTotal}
              value={advancePaid}
              onChange={(e) => setAdvancePaid(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Balance Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Renewal Date (If Recurring Service)
            </label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Calculation Summary Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500">Taxable Value:</span>
            <p className="font-bold text-slate-900 font-mono">{taxableAmount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-slate-500">
              GST ({gstApplicable ? `${gstPercent}%` : 'Non-GST'}):
            </span>
            <p className="font-bold text-slate-900 font-mono">
              {gstApplicable ? gstBreakdown.totalGst.toLocaleString('en-IN') : '₹0'}
            </p>
          </div>
          <div>
            <span className="text-slate-900 font-bold">Grand Total:</span>
            <p className="font-black text-cyan-700 font-mono text-sm">
              {grandTotal.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-rose-600 font-bold">Balance Due:</span>
            <p className="font-black text-rose-600 font-mono text-sm">
              {balanceDue.toLocaleString('en-IN')}
            </p>
          </div>
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
            className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {purchaseToEdit ? 'Save Changes' : 'Record Service & Generate Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
