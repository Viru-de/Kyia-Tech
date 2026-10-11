import React, { useState, useEffect } from 'react';
import { RenewalRecord, RenewalStatus } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface RenewalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewalToEdit?: RenewalRecord | null;
  defaultClientId?: string | null;
}

export const RenewalFormModal: React.FC<RenewalFormModalProps> = ({
  isOpen,
  onClose,
  renewalToEdit,
  defaultClientId,
}) => {
  const { clients, addRenewal, updateRenewal } = useApp();

  const [clientId, setClientId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('Domain & Cloud Hosting Renewal');
  const [domainOrAsset, setDomainOrAsset] = useState<string>('');
  const [provider, setProvider] = useState<string>('Hostinger');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [renewalDate, setRenewalDate] = useState<string>(
    new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
  );
  const [renewalAmount, setRenewalAmount] = useState<number>(5000);
  const [reminderDays, setReminderDays] = useState<number>(30);
  const [status, setStatus] = useState<RenewalStatus>('Upcoming');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (renewalToEdit) {
      setClientId(renewalToEdit.clientId);
      setServiceName(renewalToEdit.serviceName);
      setDomainOrAsset(renewalToEdit.domainOrAsset || '');
      setProvider(renewalToEdit.provider);
      setPurchaseDate(renewalToEdit.purchaseDate);
      setRenewalDate(renewalToEdit.renewalDate);
      setRenewalAmount(renewalToEdit.renewalAmount);
      setReminderDays(renewalToEdit.reminderDays);
      setStatus(renewalToEdit.status);
      setNotes(renewalToEdit.notes || '');
    } else {
      setClientId(defaultClientId || clients[0]?.id || '');
      setServiceName('Website AMC & Cloud Hosting');
      setDomainOrAsset('');
      setProvider('Hostinger');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setRenewalDate(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
      setRenewalAmount(15000);
      setReminderDays(30);
      setStatus('Upcoming');
      setNotes('');
    }
  }, [renewalToEdit, defaultClientId, isOpen, clients]);

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
      serviceName,
      domainOrAsset,
      provider,
      purchaseDate,
      expiryDate: renewalDate,
      renewalDate,
      renewalAmount,
      reminderDays,
      status,
      notes,
    };

    if (renewalToEdit) {
      updateRenewal(renewalToEdit.id, payload);
    } else {
      addRenewal(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={renewalToEdit ? `Edit Renewal: ${renewalToEdit.serviceName}` : 'Add Renewal Record'}
      subtitle="Track recurring service expiries (domains, hosting, emails, AMC, SEO) and set automatic reminder triggers"
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
              Service / Product Requiring Renewal <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Annual Website AMC, Cloud VPS Hosting"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Domain Name / Asset Identifier (Optional)
            </label>
            <input
              type="text"
              value={domainOrAsset}
              onChange={(e) => setDomainOrAsset(e.target.value)}
              placeholder="e.g. clientdomain.com or VPS-SGP-01"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hosting / Domain Provider
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. Hostinger, GoDaddy, AWS, Klyia Tech"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase / Previous Start Date
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
              Expiry / Next Renewal Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Renewal Billing Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={renewalAmount}
              onChange={(e) => setRenewalAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reminder Schedule Trigger
            </label>
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value={7}>7 days before expiry</option>
              <option value={15}>15 days before expiry</option>
              <option value={30}>30 days before expiry (Standard)</option>
              <option value={45}>45 days before expiry</option>
              <option value={60}>60 days before expiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Renewal Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RenewalStatus)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Due Today">Due Today</option>
              <option value="Overdue">Overdue</option>
              <option value="Renewed">Renewed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, auto-renew status in registrar..."
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
            {renewalToEdit ? 'Save Changes' : 'Add Renewal Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
