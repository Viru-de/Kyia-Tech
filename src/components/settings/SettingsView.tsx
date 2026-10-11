import React, { useState } from 'react';
import {
  Settings,
  Building2,
  FileSpreadsheet,
  Receipt,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Save,
  CreditCard,
  Plus,
  AlertTriangle,
  Database,
  Server,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanySettings, UserRole } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    currentUser,
    setCurrentUser,
    exportAllDataJSON,
    importAllDataJSON,
    resetToSampleData,
    clearAllData,
    dbStatus,
    refreshDbStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'company' | 'billing' | 'terms' | 'roles' | 'backup'>('company');
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  // Handle company setting updates
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataJSON(content);
      if (success) {
        alert('Database restored successfully from JSON backup!');
        setImportError('');
      } else {
        setImportError('Invalid JSON backup file format. Please check file and try again.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    if (
      window.confirm(
        'Reset database to initial Klyia Technology sample data? Current unsaved edits will be refreshed.'
      )
    ) {
      resetToSampleData();
      setFormData(companySettings);
      alert('Sample data restored.');
    }
  };

  const handleClearAll = () => {
    const confirmation = prompt(
      'DANGER: To delete all transactional data, type "CLEAR" in capital letters:'
    );
    if (confirmation === 'CLEAR') {
      clearAllData();
      alert('All transactional records cleared.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>System Settings & Configuration</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure company branding, GSTIN, bank details, quotation terms, watermark and database backups
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'company'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Profile & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing, Bank & Watermark</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'terms'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quotation Terms & Conditions</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roles'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>User Roles & Access Control</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'backup'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Backup & Database Restore</span>
        </button>
      </div>

      {/* Tab: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Company Identity & Contact
            </h3>
            <p className="text-xs text-slate-500">
              Displayed on quotation document headers, invoices, receipts and WhatsApp templates
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Helpline Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Street</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Billing, Bank & Watermark */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Banking & Watermark Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Bank details printed on documents & document watermark transparency
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID for Direct QR / Payment</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Number Prefix</label>
              <input
                type="text"
                value={formData.quotationPrefix}
                onChange={(e) => setFormData({ ...formData, quotationPrefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Watermark Section (Section 12 requirement) */}
            <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Document Watermark Controls</h4>
                  <p className="text-[11px] text-slate-500">
                    Renders a subtle background watermark on Quotation and Invoice PDF prints
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.watermarkEnabled}
                  onChange={(e) => setFormData({ ...formData, watermarkEnabled: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={formData.watermarkText}
                    onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opacity ({Math.round(formData.watermarkOpacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={formData.watermarkOpacity}
                    onChange={(e) =>
                      setFormData({ ...formData, watermarkOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Billing & Watermark</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Quotation Terms (Section 33 requirement) */}
      {activeTab === 'terms' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Default Quotation Terms & Conditions
            </h3>
            <p className="text-xs text-slate-500">
              These terms will automatically populate on every newly generated client quotation
            </p>
          </div>

          <div className="space-y-2.5">
            {formData.quotationTerms.map((term, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="w-6 text-center font-bold text-slate-400 text-xs pt-2">
                  {index + 1}.
                </span>
                <textarea
                  rows={2}
                  value={term}
                  onChange={(e) => {
                    const copy = [...formData.quotationTerms];
                    copy[index] = e.target.value;
                    setFormData({ ...formData, quotationTerms: copy });
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const copy = formData.quotationTerms.filter((_, i) => i !== index);
                    setFormData({ ...formData, quotationTerms: copy });
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  quotationTerms: [
                    ...formData.quotationTerms,
                    'All deliverables are subject to Klyia Technology service level agreements.',
                  ],
                });
              }}
              className="px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Term
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Quotation Terms</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: User Roles & Permissions */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Role-Based Access Control (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Configure organizational roles for staff, managers and system administrators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">Admin</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete access to all modules, financial ledgers, settings, company profiles, bank configuration and database restore.
              </p>
              <button
                onClick={() => setCurrentUser({ ...currentUser, role: 'Admin' })}
                className={`w-full py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  currentUser.role === 'Admin'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {currentUser.role === 'Admin' ? 'Active Role ✓' : 'Switch to Admin'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">Manager</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Operations
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full access to Clients, CRM Pipeline, Quotations, Payments, Renewals, Expenses and Reports. Restricted from database clear.
              </p>
              <button
                onClick={() => setCurrentUser({ ...currentUser, role: 'Manager' })}
                className={`w-full py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  currentUser.role === 'Manager'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {currentUser.role === 'Manager' ? 'Active Role ✓' : 'Switch to Manager'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">Staff</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                  Front Office
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client management, CRM pipeline follow-up, quotation drafting, and basic payment entry receipt creation.
              </p>
              <button
                onClick={() => setCurrentUser({ ...currentUser, role: 'Staff' })}
                className={`w-full py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  currentUser.role === 'Staff'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {currentUser.role === 'Staff' ? 'Active Role ✓' : 'Switch to Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* Database Health & Hostinger MySQL Status Card */}
          <div className="p-5 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/70 to-slate-50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Database Engine Status</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      dbStatus?.type === 'mysql'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {dbStatus?.type === 'mysql' ? 'Hostinger MySQL (Connected)' : 'Server Persistent Storage (Active)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {dbStatus?.message || 'Persistent server database connected. Ready for Hostinger MySQL deployment.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => refreshDbStatus()}
                className="px-3.5 py-2 text-xs font-bold text-cyan-800 bg-cyan-100/80 hover:bg-cyan-200/80 border border-cyan-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh DB Health</span>
              </button>
            </div>

            {/* Live Database Record Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Clients</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.clients ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Purchases</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.purchases ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Quotations</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.quotations ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoices</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.invoices ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Receipts</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.payments ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Renewals</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.renewals ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Expenses</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.expenses ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assets</span>
                <span className="text-base font-black text-slate-900 font-mono">{dbStatus?.counts.assets ?? 0}</span>
              </div>
            </div>

            {/* Hostinger Deployment Guide callout */}
            <div className="p-3.5 rounded-xl bg-white/90 border border-cyan-200/80 text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-cyan-950">
                <Server className="w-4 h-4 text-cyan-700" />
                <span>Hostinger MySQL Environment Setup Guide</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When deploying to Hostinger Node.js hosting, create a MySQL database in <strong>Hostinger hPanel → Databases → MySQL Databases</strong>, then supply these environment variables in your Hostinger configuration:
              </p>
              <div className="font-mono text-[11px] bg-slate-900 text-cyan-300 p-2.5 rounded-lg overflow-x-auto space-y-0.5">
                <div>DB_HOST="localhost"</div>
                <div>DB_PORT="3306"</div>
                <div>DB_NAME="your_hostinger_db_name"</div>
                <div>DB_USER="your_hostinger_db_user"</div>
                <div>DB_PASSWORD="your_hostinger_db_password"</div>
                <div>PORT="3000"</div>
                <div>NODE_ENV="production"</div>
              </div>
              <p className="text-[10px] text-slate-500">
                Database schema file is generated at <code className="font-mono font-bold text-slate-700">server/schema.sql</code> and automatically runs on first connection.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Data Backup & Disaster Recovery
            </h3>
            <p className="text-xs text-slate-500">
              Export complete business database to JSON, or restore from a previous JSON backup
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Export Full JSON Backup</span>
                <p className="text-xs text-slate-500 mt-1">
                  Downloads an encrypted/structured JSON file containing all clients, quotations, tax invoices, payments, renewals, recurring expenses, and activity logs.
                </p>
              </div>
              <button
                onClick={exportAllDataJSON}
                className="mt-4 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Database</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Restore Database from JSON</span>
                <p className="text-xs text-slate-500 mt-1">
                  Upload an existing Klyia JSON backup file to overwrite current data with the backed-up records.
                </p>
                {importError && (
                  <p className="text-xs text-rose-500 font-semibold mt-2">{importError}</p>
                )}
              </div>
              <label className="mt-4 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-cyan-600" />
                <span>Choose Backup JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset & Clean Options */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/20 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Database Reset Operations
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Restore original realistic Klyia Technology sample data or clear all transactions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleResetSample}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                <span>Reset to Original Sample Data</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Transaction Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
