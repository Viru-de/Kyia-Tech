import React, { useState, useEffect } from 'react';
import { ExpenseRecord, RecurringFrequency } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: ExpenseRecord | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { companySettings, addExpense, updateExpense, addExpenseCategory } = useApp();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('Internet Bill');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [amount, setAmount] = useState<number>(1000);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [billInvoiceNumber, setBillInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('Monthly');
  const [nextDueDate, setNextDueDate] = useState<string>('');

  useEffect(() => {
    if (expenseToEdit) {
      setDate(expenseToEdit.date);
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setVendor(expenseToEdit.vendor);
      setAmount(expenseToEdit.amount);
      setGstAmount(expenseToEdit.gstAmount || 0);
      setPaymentMode(expenseToEdit.paymentMode);
      setBillInvoiceNumber(expenseToEdit.billInvoiceNumber || '');
      setNotes(expenseToEdit.notes || '');
      setIsRecurring(expenseToEdit.isRecurring);
      setRecurringFrequency(expenseToEdit.recurringFrequency || 'Monthly');
      setNextDueDate(expenseToEdit.nextDueDate || '');
      setIsCustomCategory(false);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(companySettings.expenseCategories[0] || 'Internet Bill');
      setDescription('');
      setVendor('');
      setAmount(1000);
      setGstAmount(0);
      setPaymentMode('UPI');
      setBillInvoiceNumber('');
      setNotes('');
      setIsRecurring(false);
      setRecurringFrequency('Monthly');
      setNextDueDate('');
      setIsCustomCategory(false);
      setCustomCategoryName('');
    }
  }, [expenseToEdit, isOpen, companySettings.expenseCategories]);

  // When recurring frequency changes, suggest next due date
  const handleFrequencyChange = (freq: RecurringFrequency) => {
    setRecurringFrequency(freq);
    const d = new Date(date || Date.now());
    if (freq === 'Monthly') {
      d.setMonth(d.getMonth() + 1);
    } else if (freq === 'Quarterly') {
      d.setMonth(d.getMonth() + 3);
    } else if (freq === 'Half-Yearly') {
      d.setMonth(d.getMonth() + 6);
    } else if (freq === 'Yearly') {
      d.setFullYear(d.getFullYear() + 1);
    }
    setNextDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategory = category;
    if (isCustomCategory && customCategoryName.trim()) {
      finalCategory = customCategoryName.trim();
      addExpenseCategory(finalCategory);
    }

    const payload = {
      date,
      category: finalCategory,
      description,
      vendor: vendor || 'Vendor',
      amount,
      gstAmount,
      paymentMode,
      billInvoiceNumber,
      notes,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      nextDueDate: isRecurring ? nextDueDate : undefined,
    };

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, payload);
    } else {
      addExpense(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={expenseToEdit ? `Edit Expense: ${expenseToEdit.expenseId}` : 'Log Business Expense'}
      subtitle="Track operating expenditures, GST input credits, vendor bills and recurring schedules"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Expense Category</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] font-bold text-cyan-600 hover:text-cyan-800 cursor-pointer"
              >
                {isCustomCategory ? '← Choose Existing' : '+ Add Other Expense'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="Enter custom category (e.g. Meta Ads, CA Audit Fees)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-cyan-400 bg-cyan-50/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {companySettings.expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Hostinger VPS server annual subscription or Office Wi-Fi recharge"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vendor / Service Provider <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Hostinger, Airtel, GoDaddy, Landlord"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Amount Paid (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GST Amount Included (₹)
            </label>
            <input
              type="number"
              min={0}
              value={gstAmount}
              onChange={(e) => setGstAmount(Number(e.target.value))}
              placeholder="Input tax credit (optional)"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bill / Invoice Number
            </label>
            <input
              type="text"
              value={billInvoiceNumber}
              onChange={(e) => setBillInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-998821"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recurring Expense Setting
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isRecurringCheck"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (e.target.checked && !nextDueDate) {
                    handleFrequencyChange(recurringFrequency);
                  }
                }}
                className="w-4 h-4 text-cyan-600 rounded border-slate-300"
              />
              <label htmlFor="isRecurringCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Mark as Recurring Bill
              </label>
            </div>
          </div>

          {isRecurring && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recurrence Frequency
                </label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => handleFrequencyChange(e.target.value as RecurringFrequency)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required={isRecurring}
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
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
            className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
