import React, { useState, useEffect } from 'react';
import { DigitalAsset } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface DigitalAssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: DigitalAsset | null;
}

export const DigitalAssetFormModal: React.FC<DigitalAssetFormModalProps> = ({
  isOpen,
  onClose,
  assetToEdit,
}) => {
  const { clients, addDigitalAsset, updateDigitalAsset } = useApp();

  const [clientId, setClientId] = useState<string>('');
  const [serviceType, setServiceType] = useState<DigitalAsset['serviceType']>('Domain');
  const [assetName, setAssetName] = useState<string>('');
  const [provider, setProvider] = useState<string>('Hostinger');
  const [customProvider, setCustomProvider] = useState<string>('');
  const [accountReference, setAccountReference] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [renewalDate, setRenewalDate] = useState<string>(
    new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
  );
  const [costPrice, setCostPrice] = useState<number>(1000);
  const [sellingPrice, setSellingPrice] = useState<number>(2500);
  const [status, setStatus] = useState<DigitalAsset['status']>('Active');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (assetToEdit) {
      setClientId(assetToEdit.clientId);
      setServiceType(assetToEdit.serviceType);
      setAssetName(assetToEdit.assetName);
      setProvider(assetToEdit.provider);
      setAccountReference(assetToEdit.accountReference || '');
      setPurchaseDate(assetToEdit.purchaseDate);
      setRenewalDate(assetToEdit.renewalDate);
      setCostPrice(assetToEdit.costPrice);
      setSellingPrice(assetToEdit.sellingPrice);
      setStatus(assetToEdit.status);
      setNotes(assetToEdit.notes || '');
    } else {
      setClientId(clients[0]?.id || '');
      setServiceType('Domain');
      setAssetName('');
      setProvider('Hostinger');
      setAccountReference('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setRenewalDate(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
      setCostPrice(1299);
      setSellingPrice(2499);
      setStatus('Active');
      setNotes('');
    }
  }, [assetToEdit, isOpen, clients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cl = clients.find((c) => c.id === clientId);
    if (!cl) {
      alert('Please select a valid client');
      return;
    }

    const finalProvider = provider === 'Other' && customProvider.trim() ? customProvider.trim() : provider;

    const payload = {
      clientId: cl.id,
      clientName: cl.name,
      serviceType,
      assetName,
      provider: finalProvider,
      accountReference,
      purchaseDate,
      expiryDate: renewalDate,
      renewalDate,
      costPrice,
      sellingPrice,
      status,
      notes,
    };

    if (assetToEdit) {
      updateDigitalAsset(assetToEdit.id, payload);
    } else {
      addDigitalAsset(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={assetToEdit ? `Edit Asset: ${assetToEdit.assetName}` : 'Add Digital Asset'}
      subtitle="Track domain names, cloud hosting nodes, business email accounts, and provider margins"
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
              Asset / Service Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Domain">Domain Name</option>
              <option value="Hosting">Web / VPS Hosting</option>
              <option value="Business Email">Business Email (Workspace/Zoho)</option>
              <option value="SSL">SSL & Security Certificate</option>
              <option value="Server">Dedicated Server / Cloud Instance</option>
              <option value="Software Subscription">Software Subscription</option>
              <option value="Other Digital Service">Other Digital Service</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asset Name / Domain / Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. klyiatechnology.com or Cloud VPS 4GB RAM"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provider / Registrar
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Hostinger">Hostinger</option>
              <option value="GoDaddy">GoDaddy</option>
              <option value="Namecheap">Namecheap</option>
              <option value="AWS">Amazon Web Services (AWS)</option>
              <option value="Google Cloud">Google Cloud</option>
              <option value="Cloudflare">Cloudflare</option>
              <option value="DigitalOcean">DigitalOcean</option>
              <option value="Other">Other (Custom Provider)</option>
            </select>
          </div>

          {provider === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Provider Name
              </label>
              <input
                type="text"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                placeholder="Enter provider name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Registrar Reference
            </label>
            <input
              type="text"
              value={accountReference}
              onChange={(e) => setAccountReference(e.target.value)}
              placeholder="e.g. HST-ACC-99128"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Date</label>
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
              Our Cost Price (₹)
            </label>
            <input
              type="number"
              min={0}
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selling / Billing Price to Client (₹)
            </label>
            <input
              type="number"
              min={0}
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="DNS records, server IP, credentials reference, nameservers..."
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
            {assetToEdit ? 'Save Changes' : 'Register Digital Asset'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
