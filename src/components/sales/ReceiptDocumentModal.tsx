import React from 'react';
import { PaymentRecord } from '../../types';
import { Modal } from '../common/Modal';
import { Watermark } from '../common/Watermark';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, openWhatsAppChat } from '../../utils/formatters';
import { Printer, MessageCircle, CheckCircle2 } from 'lucide-react';

interface ReceiptDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}

export const ReceiptDocumentModal: React.FC<ReceiptDocumentModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const { companySettings, clients, getClientFinancials } = useApp();

  if (!isOpen || !payment) return null;

  const client = clients.find((c) => c.id === payment.clientId);
  const fin = client ? getClientFinancials(client.id) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `Dear ${payment.clientName},

Greetings from *${companySettings.companyName}*!

We have successfully received your payment of *${formatINR(payment.amount)}*.
• *Receipt No:* ${payment.receiptNo}
• *Payment Date:* ${formatDate(payment.paymentDate)}
• *Payment Mode:* ${payment.paymentMode}
• *Reference No:* ${payment.referenceNo || 'N/A'}
• *Purpose:* ${payment.againstTitle || payment.notes || 'Project Advance/Payment'}
${fin ? `• *Current Remaining Balance:* ${formatINR(fin.totalBalance)}` : ''}

Thank you for your payment and trust in Klyia Technology!

Best regards,
*${companySettings.companyName}*
📞 ${companySettings.phone}`;

    const phone = client?.whatsapp || client?.phone || companySettings.phone;
    openWhatsAppChat(phone, text);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={`Payment Receipt — ${payment.receiptNo}`}
      subtitle="Official acknowledgement of funds received"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendWhatsApp}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Share Receipt on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      }
    >
      <div className="print-document-container bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden text-slate-800 text-xs font-sans">
        <Watermark />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {companySettings.companyName}
              </h1>
              <p className="text-xs font-bold text-cyan-700 tracking-wide mt-0.5">
                {companySettings.tagline}
              </p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                <p>{companySettings.address}, {companySettings.area}, {companySettings.city}</p>
                <p>Phone: {companySettings.phone} • Email: {companySettings.email}</p>
                {companySettings.gstin && (
                  <p className="font-mono font-bold text-slate-800">GSTIN: {companySettings.gstin}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                OFFICIAL VOUCHER
              </span>
              <h2 className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5">
                RECEIPT
              </h2>
              <p className="text-[11px] text-slate-700 mt-1">
                Receipt No: <strong className="font-mono text-slate-900">{payment.receiptNo}</strong>
              </p>
              <p className="text-[11px] text-slate-700">
                Receipt Date: <strong>{formatDate(payment.paymentDate)}</strong>
              </p>
            </div>
          </div>

          {/* Amount Paid Callout */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Amount Received:
                </span>
                <p className="text-2xl font-black text-emerald-700 font-mono">
                  {formatINR(payment.amount, true)}
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-800 font-medium">
              Mode: <strong className="uppercase">{payment.paymentMode}</strong>
              {payment.referenceNo && (
                <div className="font-mono mt-0.5">Ref: {payment.referenceNo}</div>
              )}
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Received With Thanks From:
              </span>
              <p className="text-sm font-black text-slate-900">{payment.clientName}</p>
              {client && (
                <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                  <p>Contact: {client.contactPerson || client.name}</p>
                  <p>Phone: {client.phone}</p>
                  {client.gstin && <p className="font-mono">GSTIN: {client.gstin}</p>}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Payment Particulars:
              </span>
              <div className="text-[11px] text-slate-700 space-y-1">
                <p>Payment For: <strong>{payment.againstTitle || payment.againstType || 'Service Delivery'}</strong></p>
                {payment.notes && <p>Remarks: {payment.notes}</p>}
                {fin && (
                  <div className="pt-2 border-t border-slate-200 space-y-0.5">
                    <p>Total Client Billed: <strong>{formatINR(fin.totalBilled)}</strong></p>
                    <p>Cumulative Paid: <strong className="text-emerald-700">{formatINR(fin.totalPaid)}</strong></p>
                    <p>Remaining Client Balance: <strong className="text-rose-600">{formatINR(fin.totalBalance)}</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between items-end">
            <div className="text-[11px] text-slate-500">
              <p>Payer Acknowledgement</p>
              <div className="h-8 border-b border-slate-300 w-44 mt-2" />
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <p className="font-bold text-slate-800">For {companySettings.companyName}</p>
              <div className="h-8 border-b border-slate-300 w-44 ml-auto mt-2" />
              <p className="mt-1 font-semibold text-slate-700">Cashier / Authorized Signatory</p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-600">
              Designed & Powered by Klyia Technology • {companySettings.website}
            </p>
            <p>Subject to realization of Cheque / Online Transfer clearance.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
