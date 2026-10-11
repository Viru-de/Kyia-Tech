import React from 'react';
import { Quotation } from '../../types';
import { Modal } from '../common/Modal';
import { Watermark } from '../common/Watermark';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, openWhatsAppChat } from '../../utils/formatters';
import { Printer, Download, MessageCircle, FileText, CheckCircle, Edit2, Share2, Sparkles } from 'lucide-react';

interface QuotationDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onEdit?: (qtn: Quotation) => void;
}

export const QuotationDocumentModal: React.FC<QuotationDocumentModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onEdit,
}) => {
  const { companySettings, convertQuotationToInvoice, setCurrentTab } = useApp();

  if (!isOpen || !quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `Dear ${quotation.contactPerson || quotation.clientName},

Greetings from *${companySettings.companyName}*!

We have prepared your quotation *#${quotation.quotationNumber}* for *${formatINR(quotation.grandTotal)}*.
Valid until: ${formatDate(quotation.validUntil)}

Items included:
${quotation.items.map((it, i) => `${i + 1}. *${it.serviceName}* - ${formatINR(it.amount)}`).join('\n')}

For full specifications or any customization, please feel free to reach out.

Best regards,
*${companySettings.companyName}*
📞 ${companySettings.phone}
🌐 ${companySettings.website}`;

    openWhatsAppChat(quotation.phone, text);
  };

  const handleConvertToInvoice = () => {
    const inv = convertQuotationToInvoice(quotation.id);
    if (inv) {
      alert(`Quotation ${quotation.quotationNumber} has been successfully converted to Tax Invoice #${inv.invoiceNumber}!`);
      onClose();
      setCurrentTab('sales-invoices', { invoiceId: inv.id });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={`Quotation Preview — ${quotation.quotationNumber}`}
      subtitle="Executive A4 document format ready for client approval, print and PDF export"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendWhatsApp}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Send WhatsApp Quote"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
          {quotation.status !== 'Converted to Invoice' && (
            <button
              onClick={handleConvertToInvoice}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Convert to Invoice</span>
            </button>
          )}
        </div>
      }
    >
      {/* Printable Document Sheet Container */}
      <div className="print-document-container bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden text-slate-800 text-xs font-sans">
        {/* Watermark in background */}
        <Watermark />

        {/* Relative content on top of watermark */}
        <div className="relative z-10 space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-xs">
                  KT
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {companySettings.companyName || 'KLYIA TECHNOLOGY'}
                </h1>
              </div>
              <p className="text-xs font-bold text-cyan-700 tracking-wide mt-1">
                {companySettings.tagline || 'Web • Software • Digital • AI Solutions'}
              </p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                <p>{companySettings.address}, {companySettings.area}</p>
                <p>{companySettings.city}, {companySettings.state} - {companySettings.pincode}</p>
                <p>Phone: <strong>{companySettings.phone}</strong> • Email: <strong>{companySettings.email}</strong></p>
                <p>Website: <a href={companySettings.website} className="text-cyan-700 underline">{companySettings.website}</a></p>
                {companySettings.gstin && (
                  <p className="font-mono font-bold text-slate-800">GSTIN: {companySettings.gstin}</p>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                PROPOSAL & ESTIMATE
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                QUOTATION
              </h2>
              <div className="text-[11px] text-slate-700 mt-2 space-y-0.5">
                <p>
                  Quotation No: <strong className="font-mono text-slate-900 text-xs">{quotation.quotationNumber}</strong>
                </p>
                <p>Date of Issue: <strong>{formatDate(quotation.quotationDate)}</strong></p>
                <p>Valid Until: <strong>{formatDate(quotation.validUntil)}</strong></p>
                <p>
                  Status:{' '}
                  <span className="font-bold uppercase text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">
                    {quotation.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Quotation Issued To:
              </span>
              <p className="text-sm font-black text-slate-900">{quotation.clientName}</p>
              {quotation.companyName && quotation.companyName !== quotation.clientName && (
                <p className="font-bold text-slate-700">{quotation.companyName}</p>
              )}
              <p className="text-slate-600 mt-1">Attn: {quotation.contactPerson || quotation.clientName}</p>
              <p className="text-slate-600">{quotation.address}</p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Client Contact Details:
              </span>
              <p className="text-slate-700">Phone: <strong>{quotation.phone}</strong></p>
              {quotation.email && <p className="text-slate-700">Email: {quotation.email}</p>}
              {quotation.gstin && (
                <p className="text-slate-700 font-mono">
                  GSTIN: <strong>{quotation.gstin}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-4">Service & Scope Description</th>
                  <th className="py-2.5 px-3 text-center w-14">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-20">Disc.</th>
                  <th className="py-2.5 px-3 text-center w-16">GST %</th>
                  <th className="py-2.5 px-4 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotation.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-[12px]">{item.serviceName}</p>
                      {item.description && (
                        <p className="text-slate-600 text-[11px] mt-0.5 whitespace-pre-line leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{item.qty}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium">{formatINR(item.rate)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      {item.discount ? `-${formatINR(item.discount)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{item.gstPercent}%</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & GST Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            {/* Bank details & UPI */}
            <div className="w-full sm:w-1/2 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Official Banking & Payment Details:
              </span>
              <div className="text-[11px] text-slate-700 space-y-1">
                <p>Bank Name: <strong className="text-slate-900">{companySettings.bankName}</strong></p>
                <p>Account Holder: <strong className="text-slate-900">{companySettings.accountHolder}</strong></p>
                <p>Account Number: <strong className="font-mono text-slate-900">{companySettings.accountNumber}</strong></p>
                <p>IFSC Code: <strong className="font-mono text-slate-900">{companySettings.ifscCode}</strong> ({companySettings.branch})</p>
                {companySettings.upiId && (
                  <p className="pt-1 text-cyan-800">
                    UPI ID: <strong className="font-mono font-bold">{companySettings.upiId}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatINR(quotation.subtotal)}</span>
              </div>
              {quotation.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono font-semibold">-{formatINR(quotation.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-800 font-semibold border-t border-slate-200 pt-1">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatINR(quotation.taxableAmount)}</span>
              </div>

              {quotation.isInterstate ? (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST {quotation.gstPercent}%):</span>
                  <span className="font-mono">{formatINR(quotation.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST {quotation.gstPercent / 2}%):</span>
                    <span className="font-mono">{formatINR(quotation.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST {quotation.gstPercent / 2}%):</span>
                    <span className="font-mono">{formatINR(quotation.sgst)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-900 font-black text-base border-t-2 border-slate-900 pt-2 bg-slate-100/80 p-2 rounded-lg">
                <span>Grand Total:</span>
                <span className="text-cyan-800 font-mono">{formatINR(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
              Terms & Conditions:
            </span>
            <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
              {quotation.terms?.map((term, index) => (
                <li key={index} className="leading-relaxed">
                  {term}
                </li>
              ))}
            </ol>
          </div>

          {/* Document Signatures & Authorized Seal */}
          <div className="pt-8 flex justify-between items-end">
            <div className="text-[11px] text-slate-500">
              <p>Client Acceptance:</p>
              <div className="h-10 border-b border-slate-300 w-48 mt-2" />
              <p className="mt-1">Authorized Signature & Date</p>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <p className="font-bold text-slate-800">For {companySettings.companyName}</p>
              <div className="h-10 border-b border-slate-300 w-48 ml-auto mt-2" />
              <p className="mt-1 font-semibold text-slate-700">Authorized Signatory</p>
            </div>
          </div>

          {/* Document Footer with Watermark Branding */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-600">
              Designed & Powered by Klyia Technology • {companySettings.website}
            </p>
            <p>
              This is a computer-generated quotation document. For queries, contact {companySettings.phone} or {companySettings.email}.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
