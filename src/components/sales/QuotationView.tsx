import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Download,
  MessageCircle,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Quotation, QuotationStatus } from '../../types';
import { formatINR, formatDate, exportToCSV, openWhatsAppChat } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { QuotationFormModal } from './QuotationFormModal';
import { QuotationDocumentModal } from './QuotationDocumentModal';

interface QuotationViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const QuotationView: React.FC<QuotationViewProps> = ({ onOpenQuickAction }) => {
  const {
    quotations,
    deleteQuotation,
    selectedQuotationId,
    setSelectedQuotationId,
    convertQuotationToInvoice,
    companySettings,
    setCurrentTab,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    if (selectedQuotationId) {
      const q = quotations.find((item) => item.id === selectedQuotationId);
      if (q) {
        setActiveQuotation(q);
        setPreviewModalOpen(true);
      }
    }
  }, [selectedQuotationId, quotations]);

  const filteredQuotations = quotations.filter((q) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      q.quotationNumber.toLowerCase().includes(term) ||
      q.clientName.toLowerCase().includes(term) ||
      q.companyName.toLowerCase().includes(term) ||
      q.items.some((it) => it.serviceName.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPreview = (q: Quotation) => {
    setActiveQuotation(q);
    setSelectedQuotationId(q.id);
    setPreviewModalOpen(true);
  };

  const handleEdit = (q: Quotation) => {
    setQuotationToEdit(q);
    setIsFormOpen(true);
  };

  const handleDelete = (q: Quotation) => {
    if (window.confirm(`Delete quotation ${q.quotationNumber}?`)) {
      deleteQuotation(q.id);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Quotation No', 'Client', 'Company', 'Date', 'Valid Until', 'Items Count', 'Taxable Amount', 'GST Amount', 'Grand Total', 'Status'],
      ...filteredQuotations.map((q) => [
        q.quotationNumber,
        q.clientName,
        q.companyName,
        q.quotationDate,
        q.validUntil,
        q.items.length,
        q.taxableAmount,
        (q.cgst || 0) + (q.sgst || 0) + (q.igst || 0),
        q.grandTotal,
        q.status,
      ]),
    ];
    exportToCSV(`klyia_quotations_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quotations & Proposals</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
              {quotations.length} Estimates
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Generate itemized proposals with automatic GST breakdown, watermark branding and PDF print
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
            onClick={() => {
              setQuotationToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs shadow-cyan-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotation number, client name, services..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Accepted">Accepted</option>
            <option value="Converted to Invoice">Converted to Invoice</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-500 mt-1">
              Create a new quotation for your clients to start winning deals.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Quotation Number</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => handleOpenPreview(q)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-cyan-700">
                      {q.quotationNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="truncate max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">{q.clientName}</span>
                        {q.companyName && (
                          <span className="text-[11px] text-slate-500 truncate block">
                            {q.companyName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">{formatDate(q.quotationDate)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(q.validUntil)}</td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        {q.items.length} item{q.items.length === 1 ? '' : 's'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                      {formatINR(q.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          q.status === 'Accepted' || q.status === 'Converted to Invoice'
                            ? 'success'
                            : q.status === 'Sent'
                            ? 'primary'
                            : q.status === 'Negotiation'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {q.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                          title="Preview & Print A4 Document"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-slate-100 transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Quotation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <QuotationFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setQuotationToEdit(null);
        }}
        quotationToEdit={quotationToEdit}
      />

      {/* Document View / Print Modal */}
      <QuotationDocumentModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setActiveQuotation(null);
        }}
        quotation={activeQuotation}
        onEdit={(q) => {
          setPreviewModalOpen(false);
          handleEdit(q);
        }}
      />
    </div>
  );
};
