import React, { useState, useEffect } from 'react';
import { Quotation, QuotationItem, QuotationStatus } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { formatINR, calculateGST } from '../../utils/formatters';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  defaultClientId?: string | null;
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  defaultClientId,
}) => {
  const { clients, companySettings, addQuotation, updateQuotation } = useApp();

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [quotationDate, setQuotationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + (companySettings.quotationValidityDays || 15) * 86400000)
      .toISOString()
      .split('T')[0]
  );
  const [isInterstate, setIsInterstate] = useState<boolean>(false);
  const [status, setStatus] = useState<QuotationStatus>('Draft');
  const [notes, setNotes] = useState<string>('Thank you for giving us the opportunity to quote.');
  const [terms, setTerms] = useState<string[]>(companySettings.quotationTerms);

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 'it-1',
      serviceName: 'Website Development',
      description: 'Custom modern responsive business website design and development',
      qty: 1,
      rate: 35000,
      discount: 0,
      gstPercent: companySettings.defaultGstPercent || 18,
      amount: 35000,
    },
  ]);

  useEffect(() => {
    if (quotationToEdit) {
      setSelectedClient(quotationToEdit.clientId);
      setQuotationDate(quotationToEdit.quotationDate);
      setValidUntil(quotationToEdit.validUntil);
      setIsInterstate(quotationToEdit.isInterstate);
      setStatus(quotationToEdit.status);
      setNotes(quotationToEdit.notes);
      setTerms(quotationToEdit.terms || companySettings.quotationTerms);
      setItems(quotationToEdit.items || []);
    } else {
      const clientId = defaultClientId || (clients[0]?.id ?? '');
      setSelectedClient(clientId);
      setQuotationDate(new Date().toISOString().split('T')[0]);
      setValidUntil(
        new Date(Date.now() + (companySettings.quotationValidityDays || 15) * 86400000)
          .toISOString()
          .split('T')[0]
      );
      setStatus('Draft');
      setNotes('Thank you for considering Klyia Technology. We look forward to working with you.');
      setTerms(companySettings.quotationTerms);
      setItems([
        {
          id: `it-${Date.now()}`,
          serviceName: 'Website Development',
          description: 'High-speed modern responsive website with SEO & mobile optimization',
          qty: 1,
          rate: 35000,
          discount: 0,
          gstPercent: companySettings.defaultGstPercent || 18,
          amount: 35000,
        },
      ]);
    }
  }, [quotationToEdit, defaultClientId, isOpen]);

  // When client changes, check if interstate (e.g. not Karnataka)
  useEffect(() => {
    const cl = clients.find((c) => c.id === selectedClient);
    if (cl && cl.state && cl.state.toLowerCase() !== (companySettings.state || 'karnataka').toLowerCase()) {
      setIsInterstate(true);
    } else {
      setIsInterstate(false);
    }
  }, [selectedClient, clients, companySettings.state]);

  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      // Recalculate line amount
      const qty = Number(item.qty) || 1;
      const rate = Number(item.rate) || 0;
      const discount = Number(item.discount) || 0;
      item.amount = Math.max(0, qty * rate - discount);

      copy[index] = item;
      return copy;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `it-${Date.now()}`,
        serviceName: 'Web Application',
        description: 'Custom software & cloud integration',
        qty: 1,
        rate: 25000,
        discount: 0,
        gstPercent: companySettings.defaultGstPercent || 18,
        amount: 25000,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) * Number(it.rate)), 0);
  const discountTotal = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);

  // Calculate weighted or average GST
  const avgGstPercent = items.length > 0 ? items[0].gstPercent : 18;
  const gstResult = calculateGST(taxableAmount, avgGstPercent, isInterstate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cl = clients.find((c) => c.id === selectedClient);
    if (!cl) {
      alert('Please select a valid client');
      return;
    }

    const payload = {
      quotationDate,
      validUntil,
      clientId: cl.id,
      clientName: cl.name,
      companyName: cl.companyName || cl.name,
      contactPerson: cl.contactPerson || cl.name,
      phone: cl.phone,
      email: cl.email,
      gstin: cl.gstin,
      address: [cl.address, cl.area, cl.city, cl.state, cl.pincode].filter(Boolean).join(', '),
      items,
      subtotal,
      discountTotal,
      taxableAmount,
      gstPercent: avgGstPercent,
      isInterstate,
      cgst: gstResult.cgst,
      sgst: gstResult.sgst,
      igst: gstResult.igst,
      grandTotal: gstResult.grandTotal,
      notes,
      terms,
      status,
    };

    if (quotationToEdit) {
      updateQuotation(quotationToEdit.id, payload);
    } else {
      addQuotation(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={quotationToEdit ? `Edit Quotation ${quotationToEdit.quotationNumber}` : 'Create New Quotation'}
      subtitle="Generate professional quotation with itemized billing, manual pricing and automatic GST breakdown"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Date Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Client <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Date</label>
            <input
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuotationStatus)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
              />
              <span>Interstate Client (Apply IGST instead of CGST + SGST)</span>
            </label>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quotation Line Items
            </h4>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Service & Description</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-24 text-right">Disc. (₹)</th>
                    <th className="py-2.5 px-3 w-20 text-center">GST %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                    <th className="py-2.5 px-2 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center text-slate-400 font-bold">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 space-y-1">
                        <input
                          type="text"
                          value={item.serviceName}
                          onChange={(e) => handleItemChange(index, 'serviceName', e.target.value)}
                          placeholder="Service Name (e.g. Website Development)"
                          className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          required
                        />
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Scope of work details..."
                          className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs text-center rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          className="w-full px-2 py-1 text-xs text-right font-mono font-semibold rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, 'discount', Number(e.target.value))
                          }
                          className="w-full px-2 py-1 text-xs text-right font-mono rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.gstPercent}
                          onChange={(e) =>
                            handleItemChange(index, 'gstPercent', Number(e.target.value))
                          }
                          className="w-full px-1 py-1 text-xs text-center rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-900 font-mono">
                        {formatINR(item.amount)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === items.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calculations Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Client Note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold font-mono">{formatINR(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold font-mono">-{formatINR(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatINR(taxableAmount)}</span>
            </div>

            {isInterstate ? (
              <div className="flex justify-between text-slate-600">
                <span>IGST ({avgGstPercent}%):</span>
                <span className="font-mono">{formatINR(gstResult.igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST ({avgGstPercent / 2}%):</span>
                  <span className="font-mono">{formatINR(gstResult.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST ({avgGstPercent / 2}%):</span>
                  <span className="font-mono">{formatINR(gstResult.sgst)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-slate-900 font-black text-sm border-t-2 border-slate-900 pt-2">
              <span>Grand Total:</span>
              <span className="text-cyan-700 font-mono">{formatINR(gstResult.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
            {quotationToEdit ? 'Update Quotation' : 'Save & Generate Quotation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
