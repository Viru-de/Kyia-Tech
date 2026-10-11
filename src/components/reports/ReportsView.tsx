import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const { clients, purchases, payments, invoices, expenses, renewals, quotations } = useApp();

  const [activeReport, setActiveReport] = useState<string>('gst_summary');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  // Compute GST Summary
  const taxableSales = purchases.reduce((acc, p) => acc + (p.gstApplicable ? p.baseAmount - (p.discount || 0) : 0), 0);
  const salesCGST = purchases.reduce((acc, p) => acc + (p.cgst || 0), 0);
  const salesSGST = purchases.reduce((acc, p) => acc + (p.sgst || 0), 0);
  const salesIGST = purchases.reduce((acc, p) => acc + (p.igst || 0), 0);
  const totalSalesGST = salesCGST + salesSGST + salesIGST;

  const totalExpenseGST = expenses.reduce((acc, e) => acc + (e.gstAmount || 0), 0);
  const netGstPayable = Math.max(0, totalSalesGST - totalExpenseGST);

  // Compute service-wise revenue
  const serviceWiseRevenue: Record<string, number> = {};
  purchases.forEach((p) => {
    const sType = p.customServiceTitle || p.serviceType;
    serviceWiseRevenue[sType] = (serviceWiseRevenue[sType] || 0) + p.grandTotal;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let rows: (string | number)[][] = [];

    if (activeReport === 'gst_summary') {
      rows = [
        ['GST Classification', 'Amount (INR)'],
        ['Total Taxable Sales', taxableSales],
        ['Output CGST Collected', salesCGST],
        ['Output SGST Collected', salesSGST],
        ['Output IGST Collected', salesIGST],
        ['Total Output GST', totalSalesGST],
        ['Input GST Credit (Purchases/Expenses)', totalExpenseGST],
        ['Estimated Net GST Liability', netGstPayable],
      ];
    } else if (activeReport === 'revenue_report') {
      rows = [
        ['Payment Date', 'Receipt No', 'Client', 'Mode', 'Amount'],
        ...payments.map((p) => [p.paymentDate, p.receiptNo, p.clientName, p.paymentMode, p.amount]),
      ];
    } else if (activeReport === 'outstanding_report') {
      rows = [
        ['Client Name', 'Total Billed', 'Total Paid', 'Balance Due'],
        ...clients.map((c) => {
          const clientPurchases = purchases.filter((p) => p.clientId === c.id);
          const clientPayments = payments.filter((p) => p.clientId === c.id);
          const billed = clientPurchases.reduce((acc, p) => acc + p.grandTotal, 0);
          const paid = clientPayments.reduce((acc, p) => acc + p.amount, 0);
          return [c.name, billed, paid, Math.max(0, billed - paid)];
        }),
      ];
    } else {
      rows = [
        ['Item', 'Details'],
        ['Report Type', activeReport],
        ['Generated On', new Date().toISOString()],
      ];
    }

    exportToCSV(`klyia_report_${activeReport}_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Executive Business Reports & GST Summary</span>
          </h2>
          <p className="text-xs text-slate-500">
            Audit-ready GST tax summaries, client revenue breakdowns, and outstanding receivable reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Selection Pills (no-print) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar no-print">
        {[
          { id: 'gst_summary', label: 'GST Summary' },
          { id: 'revenue_report', label: 'Revenue Report' },
          { id: 'outstanding_report', label: 'Outstanding Receivables' },
          { id: 'servicewise_report', label: 'Service-wise Revenue' },
          { id: 'renewals_report', label: 'Renewals Audit' },
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => setActiveReport(rep.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeReport === rep.id
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* REPORT CONTENT: GST Summary */}
      {activeReport === 'gst_summary' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest block">
                STATUTORY TAX COMPLIANCE
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                GST Tax Calculation & Summary Report
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Output CGST, SGST, IGST collected on client billing vs. Input tax credit paid on vendor expenses
              </p>
            </div>
            <div className="sm:text-right text-xs text-slate-500">
              <p>Generated: <strong>{formatDate(new Date().toISOString().split('T')[0])}</strong></p>
              <p>Entity: <strong>Klyia Technology</strong></p>
            </div>
          </div>

          {/* Core GST KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">Taxable Sales Value</span>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatINR(taxableSales)}</p>
              <span className="text-[11px] text-slate-400">Total base service amount</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">Total Output GST</span>
              <p className="text-xl font-black text-cyan-700 mt-1 font-mono">{formatINR(totalSalesGST)}</p>
              <span className="text-[11px] text-slate-400">CGST + SGST + IGST collected</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">Input Tax Credit (ITC)</span>
              <p className="text-xl font-black text-emerald-600 mt-1 font-mono">{formatINR(totalExpenseGST)}</p>
              <span className="text-[11px] text-slate-400">From eligible vendor expenses</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-900 bg-slate-900 text-white">
              <span className="text-xs text-slate-300 font-medium">Net Estimated Tax Liability</span>
              <p className="text-xl font-black text-emerald-400 mt-1 font-mono">{formatINR(netGstPayable)}</p>
              <span className="text-[11px] text-slate-400">Output GST - Input Credit</span>
            </div>
          </div>

          {/* GST Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tax Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Applicable Base</th>
                  <th className="py-3 px-4 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Intra-State CGST</td>
                  <td className="py-3 px-4 text-slate-600">Central Goods and Services Tax (Local Client Sales)</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(taxableSales)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(salesCGST)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Intra-State SGST</td>
                  <td className="py-3 px-4 text-slate-600">State Goods and Services Tax (Local Client Sales)</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(taxableSales)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(salesSGST)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Interstate IGST</td>
                  <td className="py-3 px-4 text-slate-600">Integrated Goods and Services Tax (Out-of-state Client Sales)</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">—</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(salesIGST)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={3} className="py-3 px-4 text-slate-900 uppercase">
                    Total Output GST Collected
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-800 text-sm">
                    {formatINR(totalSalesGST)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-700">Less: Input GST Credit (ITC)</td>
                  <td className="py-3 px-4 text-slate-600">GST paid on registered business operating bills & hardware</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">—</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">-{formatINR(totalExpenseGST)}</td>
                </tr>
                <tr className="bg-slate-100 font-black text-sm">
                  <td colSpan={3} className="py-3 px-4 text-slate-900 uppercase">
                    Net Estimated GST Payable
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatINR(netGstPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Disclaimer required in Section 23 */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Important Statutory Disclaimer:</p>
              <p className="text-[11px] leading-relaxed mt-0.5">
                This GST summary is an internal business management and calculation tool provided for estimating tax collections and input tax credits. Final tax liability, GSTR-1, GSTR-3B filings, and reconciliations must be verified and certified by your qualified chartered accountant or authorized tax professional before statutory return filing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Revenue Report */}
      {activeReport === 'revenue_report' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900">Client Revenue Receipts Audit</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.receiptNo}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">{p.paymentMode}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNo || '—'}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono">
                      +{formatINR(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Outstanding Receivables */}
      {activeReport === 'outstanding_report' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900">Outstanding Receivables Ledger</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-right">Total Received</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => {
                  const clientPurchases = purchases.filter((p) => p.clientId === c.id);
                  const clientPayments = payments.filter((p) => p.clientId === c.id);
                  const billed = clientPurchases.reduce((acc, p) => acc + p.grandTotal, 0);
                  const paid = clientPayments.reduce((acc, p) => acc + p.amount, 0);
                  const bal = Math.max(0, billed - paid);

                  return (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{formatINR(billed)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatINR(paid)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                        {formatINR(bal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Service-wise Revenue */}
      {activeReport === 'servicewise_report' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900">Service Category Revenue Distribution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(serviceWiseRevenue).map(([svc, rev]) => (
              <div key={svc} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800 block truncate">{svc}</span>
                <p className="text-xl font-black text-slate-900 mt-2 font-mono">{formatINR(rev)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Renewals Audit */}
      {activeReport === 'renewals_report' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900">Service Expiry & Renewals Audit</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Renewal Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {renewals.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.serviceName}</td>
                    <td className="py-3 px-4 text-slate-700">{r.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.provider}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{formatDate(r.renewalDate)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(r.renewalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
