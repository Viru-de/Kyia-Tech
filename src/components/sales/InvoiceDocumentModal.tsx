import React from 'react';
import { Invoice } from '../../types';
import { Modal } from '../common/Modal';
import { Watermark } from '../common/Watermark';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, openWhatsAppChat } from '../../utils/formatters';
import { Printer, MessageCircle } from 'lucide-react';

interface InvoiceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoiceDocumentModal: React.FC<InvoiceDocumentModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { companySettings } = useApp();

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `Dear ${invoice.contactPerson || invoice.clientName},

Greetings from *${companySettings.companyName}*!

Please find your Tax Invoice *#${invoice.invoiceNumber}* for *${formatINR(invoice.grandTotal)}*.
• *Paid Amount:* ${formatINR(invoice.paidAmount)}
• *Balance Due:* ${formatINR(invoice.balanceDue)}
• *Due Date:* ${formatDate(invoice.dueDate)}

Bank Details:
• Bank: ${companySettings.bankName}
• A/C No: ${companySettings.accountNumber}
• IFSC: ${companySettings.ifscCode}
• UPI ID: ${companySettings.upiId}

Thank you for your business!

Best regards,
*${companySettings.companyName}*
📞 ${companySettings.phone}`;

    openWhatsAppChat(invoice.phone, text);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={`Tax Invoice — ${invoice.invoiceNumber}`}
      subtitle="Standard GST Tax Invoice formatted for A4 printing and PDF export"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendWhatsApp}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Share via WhatsApp"
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
        </div>
      }
    >
      <div className="print-document-container bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden text-slate-800 text-xs font-sans">
        <Watermark />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-xs">
                  KT
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {companySettings.companyName}
                </h1>
              </div>
              <p className="text-xs font-bold text-cyan-700 tracking-wide mt-1">
                {companySettings.tagline}
              </p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                <p>{companySettings.address}, {companySettings.area}</p>
                <p>{companySettings.city}, {companySettings.state} - {companySettings.pincode}</p>
                <p>Phone: <strong>{companySettings.phone}</strong> • Email: <strong>{companySettings.email}</strong></p>
                <p>Website: <a href={companySettings.website} className="text-cyan-700 underline">{companySettings.website}</a></p>
                {companySettings.gstin && (
                  <p className="font-mono font-bold text-slate-900">GSTIN: {companySettings.gstin}</p>
                )}
                {companySettings.pan && (
                  <p className="font-mono text-slate-700">PAN: {companySettings.pan}</p>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                ORIGINAL TAX INVOICE
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                TAX INVOICE
              </h2>
              <div className="text-[11px] text-slate-700 mt-2 space-y-0.5">
                <p>
                  Invoice No: <strong className="font-mono text-slate-900 text-xs">{invoice.invoiceNumber}</strong>
                </p>
                {invoice.quotationNumber && (
                  <p>Ref Quotation: <strong className="font-mono">{invoice.quotationNumber}</strong></p>
                )}
                <p>Invoice Date: <strong>{formatDate(invoice.invoiceDate)}</strong></p>
                <p>Payment Due Date: <strong>{formatDate(invoice.dueDate)}</strong></p>
                <p>
                  Payment Status:{' '}
                  <span
                    className={`font-bold uppercase px-2 py-0.5 rounded ${
                      invoice.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : invoice.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To (Client / Customer):
              </span>
              <p className="text-sm font-black text-slate-900">{invoice.clientName}</p>
              {invoice.companyName && invoice.companyName !== invoice.clientName && (
                <p className="font-bold text-slate-700">{invoice.companyName}</p>
              )}
              <p className="text-slate-600 mt-1">Attn: {invoice.contactPerson || invoice.clientName}</p>
              <p className="text-slate-600">{invoice.address}</p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Tax & Communication:
              </span>
              <p className="text-slate-700">Phone: <strong>{invoice.phone}</strong></p>
              {invoice.email && <p className="text-slate-700">Email: {invoice.email}</p>}
              {invoice.gstin && (
                <p className="text-slate-700 font-mono">
                  Client GSTIN: <strong>{invoice.gstin}</strong>
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
                  <th className="py-2.5 px-4">Service Description</th>
                  <th className="py-2.5 px-3 text-center w-14">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-20">Disc.</th>
                  <th className="py-2.5 px-3 text-center w-16">GST %</th>
                  <th className="py-2.5 px-4 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-[12px]">{item.serviceName}</p>
                      {item.description && (
                        <p className="text-slate-600 text-[11px] mt-0.5">{item.description}</p>
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

          {/* Totals & Banking Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="w-full sm:w-1/2 p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Direct Bank Transfer & UPI Payment:
              </span>
              <div className="text-[11px] text-slate-700 space-y-1">
                <p>Bank: <strong className="text-slate-900">{companySettings.bankName}</strong></p>
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

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">-{formatINR(invoice.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-800 font-semibold border-t border-slate-200 pt-1">
                <span>Taxable Value:</span>
                <span className="font-mono">{formatINR(invoice.taxableAmount)}</span>
              </div>

              {invoice.isInterstate ? (
                <div className="flex justify-between text-slate-600">
                  <span>IGST ({invoice.gstPercent}%):</span>
                  <span className="font-mono">{formatINR(invoice.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST ({invoice.gstPercent / 2}%):</span>
                    <span className="font-mono">{formatINR(invoice.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST ({invoice.gstPercent / 2}%):</span>
                    <span className="font-mono">{formatINR(invoice.sgst)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-900 font-black text-base border-t-2 border-slate-900 pt-2 bg-slate-100/80 p-2 rounded-lg">
                <span>Grand Total:</span>
                <span className="text-cyan-800 font-mono">{formatINR(invoice.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold pt-1">
                <span>Total Paid:</span>
                <span className="font-mono">{formatINR(invoice.paidAmount)}</span>
              </div>

              <div className="flex justify-between text-rose-600 font-black text-sm border-t border-slate-200 pt-1">
                <span>Balance Due:</span>
                <span className="font-mono">{formatINR(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-[11px] text-slate-600">
              <strong>Payment Terms:</strong> {invoice.paymentTerms || 'Payment due within 15 days of invoice issue.'}
            </p>
            {invoice.notes && (
              <p className="text-[11px] text-slate-500 mt-1">
                <strong>Notes:</strong> {invoice.notes}
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between items-end">
            <div className="text-[11px] text-slate-500">
              <p>Received By:</p>
              <div className="h-10 border-b border-slate-300 w-48 mt-2" />
              <p className="mt-1">Customer Signature & Seal</p>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <p className="font-bold text-slate-800">For {companySettings.companyName}</p>
              <div className="h-10 border-b border-slate-300 w-48 ml-auto mt-2" />
              <p className="mt-1 font-semibold text-slate-700">Authorized Signatory</p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-600">
              Designed & Powered by Klyia Technology • {companySettings.website}
            </p>
            <p>
              This is a computer-generated tax invoice. Registered with Klyia Technology Finance.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
