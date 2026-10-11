import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, FileSpreadsheet, Receipt, RefreshCw, DollarSign, Globe2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { clients, quotations, invoices, payments, renewals, digitalAssets, setCurrentTab } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredClients = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.gstin.toLowerCase().includes(q) ||
          c.clientId.toLowerCase().includes(q)
      )
    : [];

  const filteredQuotations = q
    ? quotations.filter(
        (quot) =>
          quot.quotationNumber.toLowerCase().includes(q) ||
          quot.clientName.toLowerCase().includes(q) ||
          quot.items.some((it) => it.serviceName.toLowerCase().includes(q))
      )
    : [];

  const filteredInvoices = q
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q)
      )
    : [];

  const filteredRenewals = q
    ? renewals.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.serviceName.toLowerCase().includes(q) ||
          (r.domainOrAsset && r.domainOrAsset.toLowerCase().includes(q))
      )
    : [];

  const filteredAssets = q
    ? digitalAssets.filter(
        (a) =>
          a.assetName.toLowerCase().includes(q) ||
          a.clientName.toLowerCase().includes(q) ||
          a.provider.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    filteredClients.length +
    filteredQuotations.length +
    filteredInvoices.length +
    filteredRenewals.length +
    filteredAssets.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, phones, GSTIN, quotations, invoices, domains..."
            className="w-full text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!query && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Type keywords above to search across all clients, quotations, tax invoices, renewals, and domains.
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          )}

          {/* Clients */}
          {filteredClients.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                Clients ({filteredClients.length})
              </div>
              <div className="space-y-1">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCurrentTab('crm-clients', { clientId: c.id });
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {c.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {c.clientId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.contactPerson} • {c.phone} • {c.city || 'India'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quotations */}
          {filteredQuotations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Quotations ({filteredQuotations.length})
              </div>
              <div className="space-y-1">
                {filteredQuotations.map((qtn) => (
                  <button
                    key={qtn.id}
                    onClick={() => {
                      setCurrentTab('sales-quotations', { quotationId: qtn.id });
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {qtn.quotationNumber} — {qtn.clientName}
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-cyan-50 text-cyan-700">
                          {qtn.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Total: {formatINR(qtn.grandTotal)} • Valid until {qtn.validUntil}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5" />
                Invoices ({filteredInvoices.length})
              </div>
              <div className="space-y-1">
                {filteredInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setCurrentTab('sales-invoices', { invoiceId: inv.id });
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {inv.invoiceNumber} — {inv.clientName}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Amount: {formatINR(inv.grandTotal)} • Balance: {formatINR(inv.balanceDue)}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Renewals */}
          {filteredRenewals.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Renewals ({filteredRenewals.length})
              </div>
              <div className="space-y-1">
                {filteredRenewals.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCurrentTab('renewals');
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {r.serviceName} — {r.clientName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Amount: {formatINR(r.renewalAmount)} • Expiry: {r.expiryDate}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Digital Assets */}
          {filteredAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Globe2 className="w-3.5 h-3.5" />
                Digital Assets ({filteredAssets.length})
              </div>
              <div className="space-y-1">
                {filteredAssets.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setCurrentTab('digital-assets');
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {a.assetName} ({a.serviceType}) — {a.clientName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Provider: {a.provider} • Renews: {a.renewalDate}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
