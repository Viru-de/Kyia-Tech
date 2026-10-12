import React, { useState, useEffect } from 'react';
import { Client, ClientStatus, ClientType, PipelineStage } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
}) => {
  const { addClient, updateClient } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    whatsapp: '',
    email: '',
    gstin: '',
    pan: '',
    address: '',
    area: '',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '',
    country: 'India',
    website: '',
    industry: 'Technology',
    clientType: 'NEW CLIENT' as ClientType,
    status: 'Active' as ClientStatus,
    pipelineStage: 'New Lead' as PipelineStage,
    notes: '',
    mapUrl: '',
    assignedTo: 'Viru Patel',
    totalBillAmount: 0,
    advanceReceived: 0,
    pendingAmount: 0,
    dueDate: '',
    paymentStatus: 'Pending',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clientToEdit) {
      const bill = Number(clientToEdit.totalBillAmount || 0);
      const adv = Number(clientToEdit.advanceReceived || 0);
      const pend = clientToEdit.pendingAmount !== undefined ? Number(clientToEdit.pendingAmount) : Math.max(0, bill - adv);
      setFormData({
        name: clientToEdit.name || '',
        companyName: clientToEdit.companyName || '',
        contactPerson: clientToEdit.contactPerson || '',
        phone: clientToEdit.phone || '',
        whatsapp: clientToEdit.whatsapp || '',
        email: clientToEdit.email || '',
        gstin: clientToEdit.gstin || '',
        pan: clientToEdit.pan || '',
        address: clientToEdit.address || '',
        area: clientToEdit.area || '',
        city: clientToEdit.city || 'Bengaluru',
        district: clientToEdit.district || 'Bengaluru Urban',
        state: clientToEdit.state || 'Karnataka',
        pincode: clientToEdit.pincode || '',
        country: clientToEdit.country || 'India',
        website: clientToEdit.website || '',
        industry: clientToEdit.industry || 'Technology',
        clientType: clientToEdit.clientType || 'NEW CLIENT',
        status: clientToEdit.status || 'Active',
        pipelineStage: clientToEdit.pipelineStage || 'New Lead',
        notes: clientToEdit.notes || '',
        mapUrl: clientToEdit.mapUrl || '',
        assignedTo: clientToEdit.assignedTo || 'Viru Patel',
        totalBillAmount: bill,
        advanceReceived: adv,
        pendingAmount: pend,
        dueDate: clientToEdit.dueDate || '',
        paymentStatus: clientToEdit.paymentStatus || (pend === 0 && bill > 0 ? 'Paid' : adv > 0 ? 'Partially Paid' : 'Pending'),
      });
    } else {
      setFormData({
        name: '',
        companyName: '',
        contactPerson: '',
        phone: '',
        whatsapp: '',
        email: '',
        gstin: '',
        pan: '',
        address: '',
        area: '',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '',
        country: 'India',
        website: '',
        industry: 'Technology',
        clientType: 'NEW CLIENT',
        status: 'Active',
        pipelineStage: 'New Lead',
        notes: '',
        mapUrl: '',
        assignedTo: 'Viru Patel',
        totalBillAmount: 0,
        advanceReceived: 0,
        pendingAmount: 0,
        dueDate: '',
        paymentStatus: 'Pending',
      });
    }
    setErrors({});
  }, [clientToEdit, isOpen]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Client or Business Name is required';
    if (!formData.phone.trim()) {
      err.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      err.phone = 'Valid 10-digit mobile number required';
    }

    if (formData.email && !formData.email.includes('@')) {
      err.email = 'Valid email address is required';
    }

    if (formData.gstin && formData.gstin.length !== 15) {
      err.gstin = 'Indian GSTIN must be exactly 15 characters (or leave empty if unregistered)';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleBillChange = (val: string) => {
    const bill = Math.max(0, parseFloat(val) || 0);
    const adv = Number(formData.advanceReceived) || 0;
    const pend = Math.max(0, bill - adv);
    const status = pend === 0 && bill > 0 ? 'Paid' : adv > 0 && pend > 0 ? 'Partially Paid' : 'Pending';
    setFormData((prev) => ({
      ...prev,
      totalBillAmount: bill,
      pendingAmount: pend,
      paymentStatus: status,
    }));
  };

  const handleAdvanceChange = (val: string) => {
    const adv = Math.max(0, parseFloat(val) || 0);
    const bill = Number(formData.totalBillAmount) || 0;
    const pend = Math.max(0, bill - adv);
    const status = pend === 0 && bill > 0 ? 'Paid' : adv > 0 && pend > 0 ? 'Partially Paid' : 'Pending';
    setFormData((prev) => ({
      ...prev,
      advanceReceived: adv,
      pendingAmount: pend,
      paymentStatus: status,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (clientToEdit) {
      updateClient(clientToEdit.id, formData);
    } else {
      addClient(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? `Edit Client: ${clientToEdit.name}` : 'Add New Client'}
      subtitle="Complete client profile, tax info, address and engagement status"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Client Info */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Primary Contact & Identity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client / Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rejoy Solar Power"
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Apex Healthcare Systems Pvt Ltd"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    phone: val,
                    whatsapp: formData.whatsapp ? formData.whatsapp : val,
                  });
                }}
                placeholder="e.g. 9845012345"
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="e.g. 9845012345"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. contact@apexhealthcare.in"
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Tax & Business Details */}
        <div className="pt-2 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Tax, Category & Industry
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN / GST Number
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="29ABCDE1234F1Z5"
                maxLength={15}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-mono ${
                  errors.gstin ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              {errors.gstin && <p className="text-[11px] text-rose-500 mt-1">{errors.gstin}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Healthcare, Retail, Real Estate"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Classification
              </label>
              <select
                value={formData.clientType}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value as ClientType })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="NEW CLIENT">NEW CLIENT</option>
                <option value="OLD CLIENT">OLD CLIENT</option>
                <option value="RETURNING CLIENT">RETURNING CLIENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Active">Active</option>
                <option value="Upcoming Client">Upcoming Client</option>
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Renewal Due">Renewal Due</option>
                <option value="Overdue">Overdue</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pipeline Stage
              </label>
              <select
                value={formData.pipelineStage}
                onChange={(e) => setFormData({ ...formData, pipelineStage: e.target.value as PipelineStage })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Upcoming / Requirement / Project Discussion">Upcoming / Requirement / Project Discussion</option>
                <option value="New Lead">New Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Requirement Received">Requirement Received</option>
                <option value="Quotation Prepared">Quotation Prepared</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Advance Received">Advance Received</option>
                <option value="Work Started">Work Started</option>
                <option value="Work in Progress">Work in Progress</option>
                <option value="Work Completed">Work Completed</option>
                <option value="Completed">Completed</option>
                <option value="Payment Pending">Payment Pending</option>
                <option value="Renewal Due">Renewal Due</option>
                <option value="Renewed">Renewed</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billing & Outstanding Receivables */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Billing & Financial Snapshot
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Synchronized with Dashboard Financials & Outstanding Receivables
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 mb-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Bill Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.totalBillAmount || ''}
                    onChange={(e) => handleBillChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Total contract / project billing</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advance Received (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.advanceReceived || ''}
                    onChange={(e) => handleAdvanceChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Advance payment received to date</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pending Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    readOnly
                    value={(formData.pendingAmount || 0).toLocaleString('en-IN')}
                    className="w-full pl-7 pr-3 py-2 text-xs font-extrabold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Auto-computed (Bill − Advance)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus || 'Pending'}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Address & Location */}
        <div className="pt-2 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Address & Web Presence
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / Building
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot 18, Health City, Outer Ring Road"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Bellandur / Indiranagar"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bengaluru"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Karnataka"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="560103"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://clientwebsite.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Maps / Location Link (Optional)
              </label>
              <input
                type="text"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Internal Notes & Project Scope
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special requirements, previous interactions, key decision makers..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
            {clientToEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
