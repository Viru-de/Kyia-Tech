import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Building2,
  Calendar,
  CreditCard,
  Receipt,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientStatementEntry } from '../../types';
import { formatINR, formatDate, openWhatsAppChat } from '../../utils/formatters';
import { Watermark } from '../common/Watermark';

export const ClientStatementView: React.FC = () => {
  const { clients, purchases, payments, invoices, selectedClientId, setSelectedClientId, companySettings } = useApp();

  const [activeClientId, setActiveClientId] = useState<string>(
    selectedClientId || clients[0]?.id || ''
  );
  const [copied, setCopied] = useState(false);

  const selectedClient = clients.find((c) => c.id === activeClientId);

  // Compute statement entries
  const entries: ClientStatementEntry[] = [];

  if (selectedClient) {
    const clientPurchases = purchases.filter((p) => p.clientId === selectedClient.id);
    const clientPayments = payments.filter((p) => p.clientId === selectedClient.id);

    // Merge transactions into chronological order
    const rawEvents: {
      date: string;
      description: string;
      reference: string;
      debit: number;
      credit: number;
    }[] = [];

    clientPurchases.forEach((pur) => {
      rawEvents.push({
        date: pur.purchaseDate,
        description: `Service Billed: ${pur.customServiceTitle || pur.serviceType}`,
        reference: pur.purchaseId,
        debit: pur.grandTotal,
        credit: 0,
      });
    });

    clientPayments.forEach((pay) => {
      rawEvents.push({
        date: pay.paymentDate,
        description: `Payment Received (${pay.paymentMode}): ${pay.againstTitle || pay.notes || 'Service Installment'}`,
        reference: pay.receiptNo,
        debit: 0,
        credit: pay.amount,
      });
    });

    // Sort ascending by date
    rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    rawEvents.forEach((ev) => {
      runningBalance = runningBalance + ev.debit - ev.credit;
      entries.push({
        date: ev.date,
        description: ev.description,
        reference: ev.reference,
        debit: ev.debit,
        credit: ev.credit,
        balance: runningBalance,
      });
    });
  }

  const totalDebits = entries.reduce((acc, e) => acc + e.debit, 0);
  const totalCredits = entries.reduce((acc, e) => acc + e.credit, 0);
  const currentBalance = totalDebits - totalCredits;

  const handlePrint = () => {
    window.print();
  };

  const generateStatementSummaryText = () => {
    if (!selectedClient) return '';
    return `*CLIENT ACCOUNT STATEMENT*
Client: *${selectedClient.name}*
Issued by: *${companySettings.companyName}*
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}

• Total Invoiced/Billed: ${formatINR(totalDebits)}
• Total Payments Received: ${formatINR(totalCredits)}
• Current Outstanding Balance: *${formatINR(currentBalance)}*

Banking Details for Clearance:
• Bank: ${companySettings.bankName}
• Account: ${companySettings.accountNumber}
• IFSC: ${companySettings.ifscCode}
• UPI ID: ${companySettings.upiId}

For statement disputes or billing inquiries, please contact ${companySettings.phone}.`;
  };

  const handleCopyWhatsApp = () => {
    const text = generateStatementSummaryText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsAppDirect = () => {
    if (!selectedClient) return;
    const text = generateStatementSummaryText();
    openWhatsAppChat(selectedClient.whatsapp || selectedClient.phone, text);
  };

  const handleSendEmail = () => {
    if (!selectedClient || !selectedClient.email) return;
    const subject = encodeURIComponent(`Client Account Statement - ${companySettings.companyName}`);
    const body = encodeURIComponent(generateStatementSummaryText());
    window.open(`mailto:${selectedClient.email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (hidden during printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Client Statement & Ledger</span>
          </h2>
          <p className="text-xs text-slate-500">
            Comprehensive financial statement, debit/credit audit trail and running balance
          </p>
        </div>

        {/* Client Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-[220px]">
            <select
              value={activeClientId}
              onChange={(e) => {
                setActiveClientId(e.target.value);
                setSelectedClientId(e.target.value);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopyWhatsApp}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Copy Text Summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleSendWhatsAppDirect}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleSendEmail}
            className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Client Statement Container */}
      <div className="print-document-container bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden text-slate-800 text-xs font-sans">
        <Watermark />

        <div className="relative z-10 space-y-6">
          {/* Company & Statement Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {companySettings.companyName}
              </h1>
              <p className="text-xs font-bold text-cyan-700 tracking-wide mt-0.5">
                {companySettings.tagline}
              </p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                <p>{companySettings.address}, {companySettings.area}, {companySettings.city}</p>
                <p>Phone: <strong>{companySettings.phone}</strong> • Email: <strong>{companySettings.email}</strong></p>
                <p>Website: {companySettings.website}</p>
                {companySettings.gstin && (
                  <p className="font-mono font-bold text-slate-800">GSTIN: {companySettings.gstin}</p>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                LEDGER ACCOUNT
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                CLIENT STATEMENT
              </h2>
              <div className="text-[11px] text-slate-700 mt-2 space-y-0.5">
                <p>Statement Date: <strong>{formatDate(new Date().toISOString().split('T')[0])}</strong></p>
                <p>Account Status: <strong>{selectedClient?.status || 'Active'}</strong></p>
                <p>Classification: <strong>{selectedClient?.clientType || 'NEW CLIENT'}</strong></p>
              </div>
            </div>
          </div>

          {/* Client Account Info */}
          {selectedClient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Statement For Account:
                </span>
                <p className="text-base font-black text-slate-900">{selectedClient.name}</p>
                {selectedClient.companyName && (
                  <p className="text-xs font-bold text-slate-700">{selectedClient.companyName}</p>
                )}
                <p className="text-slate-600 mt-0.5">Attn: {selectedClient.contactPerson || selectedClient.name}</p>
                <p className="text-slate-600">{selectedClient.address}</p>
              </div>

              <div className="sm:text-right space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Client ID & GST Details:
                </span>
                <p className="text-slate-900 font-mono font-bold">Client ID: {selectedClient.clientId}</p>
                <p className="text-slate-700 font-mono">
                  GSTIN: {selectedClient.gstin ? selectedClient.gstin : 'Unregistered'}
                </p>
                <p className="text-slate-700">Phone: {selectedClient.phone}</p>
                {selectedClient.email && <p className="text-slate-700">Email: {selectedClient.email}</p>}
              </div>
            </div>
          )}

          {/* Account Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Total Billed (Debit)
              </span>
              <p className="text-base font-black text-slate-900 mt-1 font-mono">
                {formatINR(totalDebits)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Total Received (Credit)
              </span>
              <p className="text-base font-black text-emerald-600 mt-1 font-mono">
                {formatINR(totalCredits)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Opening Balance
              </span>
              <p className="text-base font-black text-slate-600 mt-1 font-mono">₹0.00</p>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                currentBalance > 0
                  ? 'border-rose-300 bg-rose-50/30'
                  : 'border-emerald-300 bg-emerald-50/30'
              }`}
            >
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                  currentBalance > 0 ? 'text-rose-900' : 'text-emerald-900'
                }`}
              >
                Current Balance Due
              </span>
              <p
                className={`text-base font-black mt-1 font-mono ${
                  currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatINR(currentBalance)}
              </p>
            </div>
          </div>

          {/* Statement Transaction Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference / ID</th>
                  <th className="py-2.5 px-4">Transaction Particulars</th>
                  <th className="py-2.5 px-3 text-right">Debit (Billed)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                  <th className="py-2.5 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No transactional activity on this client ledger yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}
                    >
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {entry.reference}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">
                        {entry.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {entry.credit > 0 ? `+${formatINR(entry.credit)}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                        {formatINR(entry.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Banking Details Footer */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 uppercase tracking-wider block">
              Remittance Account Details:
            </span>
            <p>
              Please clear outstanding balance to <strong>{companySettings.companyName}</strong> via Bank Transfer or UPI:
            </p>
            <p>
              Bank: <strong>{companySettings.bankName}</strong> • A/C No: <strong className="font-mono">{companySettings.accountNumber}</strong> • IFSC: <strong className="font-mono">{companySettings.ifscCode}</strong> • UPI ID: <strong className="font-mono text-cyan-800">{companySettings.upiId}</strong>
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-600">
              Designed & Powered by Klyia Technology • {companySettings.website}
            </p>
            <p>
              Official Computer Generated Client Account Statement. Direct inquiries to {companySettings.phone}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
