import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Building2,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, ClientType, ClientStatus } from '../../types';
import { formatINR, formatDate, exportToCSV, openWhatsAppChat } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailModal } from './ClientDetailModal';

interface ClientManagementViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const ClientManagementView: React.FC<ClientManagementViewProps> = ({ onOpenQuickAction }) => {
  const {
    clients,
    metrics,
    deleteClient,
    setCurrentTab,
    selectedClientId,
    setSelectedClientId,
    getClientFinancials,
  } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeDetailClientId, setActiveDetailClientId] = useState<string | null>(selectedClientId);

  // Sync if selectedClientId changed from outside
  React.useEffect(() => {
    if (selectedClientId) {
      setActiveDetailClientId(selectedClientId);
      setDetailModalOpen(true);
    }
  }, [selectedClientId]);

  // Unique industries for filter
  const industries = Array.from(new Set(clients.map((c) => c.industry).filter(Boolean)));

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.gstin.toLowerCase().includes(q) ||
      c.clientId.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || c.clientType === typeFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;

    return matchesSearch && matchesType && matchesStatus && matchesIndustry;
  });

  const handleExportCSV = () => {
    const rows = [
      [
        'Client ID',
        'Client Name',
        'Company Name',
        'Contact Person',
        'Phone',
        'Email',
        'GSTIN',
        'Client Type',
        'Status',
        'City',
        'State',
        'Date Added',
        'Total Billed',
        'Total Paid',
        'Balance Due',
      ],
      ...filteredClients.map((c) => {
        const fin = getClientFinancials(c.id);
        return [
          c.clientId,
          c.name,
          c.companyName,
          c.contactPerson,
          c.phone,
          c.email,
          c.gstin,
          c.clientType,
          c.status,
          c.city,
          c.state,
          c.dateAdded,
          fin.totalBilled,
          fin.totalPaid,
          fin.totalBalance,
        ];
      }),
    ];
    exportToCSV(`klyia_clients_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setIsFormOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (window.confirm(`Delete client "${client.name}"? This action cannot be reversed.`)) {
      deleteClient(client.id);
    }
  };

  const handleOpenDetail = (client: Client) => {
    setActiveDetailClientId(client.id);
    setSelectedClientId(client.id);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Client Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
              {clients.length} Clients
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage company clients, contact directories, tax profiles, and transaction records
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
              setClientToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs shadow-cyan-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>
      </div>

      {/* Client Type Statistics (Section 4 Requirement) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setTypeFilter('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-cyan-50/50 border-cyan-400 ring-1 ring-cyan-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Clients</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{metrics.totalClients}</p>
          <span className="text-[10px] text-slate-400">All registered profiles</span>
        </div>

        <div
          onClick={() => setTypeFilter('NEW CLIENT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'NEW CLIENT'
              ? 'bg-cyan-50/50 border-cyan-400 ring-1 ring-cyan-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-700">New Clients</span>
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-extrabold text-cyan-600 mt-1">{metrics.newClients}</p>
          <span className="text-[10px] text-slate-400">First-time project contracts</span>
        </div>

        <div
          onClick={() => setTypeFilter('RETURNING CLIENT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'RETURNING CLIENT'
              ? 'bg-purple-50/50 border-purple-400 ring-1 ring-purple-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Returning Clients</span>
            <ArrowUpDown className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-purple-600 mt-1">{metrics.returningClients}</p>
          <span className="text-[10px] text-slate-400">Repeat buyers & multi-projects</span>
        </div>

        <div
          onClick={() => setTypeFilter('OLD CLIENT')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            typeFilter === 'OLD CLIENT'
              ? 'bg-slate-100 border-slate-400 ring-1 ring-slate-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Existing Clients</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-700 mt-1">{metrics.oldClients}</p>
          <span className="text-[10px] text-slate-400">Established client accounts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name, company, phone, email, GSTIN, ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming Client">Upcoming Client</option>
              <option value="Renewal Due">Renewal Due</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="New">New</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No matching clients found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or add a new client.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Client ID / Brand</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total Billed</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const fin = getClientFinancials(client.id);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(client)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 font-black flex items-center justify-center text-xs shrink-0 border border-cyan-200/60">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 group-hover:text-cyan-700 block truncate">
                              {client.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {client.clientId} {client.city ? `• ${client.city}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="truncate">
                          <p className="text-slate-700 font-medium truncate">
                            {client.contactPerson || client.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <a
                              href={`tel:${client.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-cyan-600"
                            >
                              {client.phone}
                            </a>
                            {client.whatsapp && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsAppChat(client.whatsapp, `Hi ${client.name}, greetings from Klyia Technology!`);
                                }}
                                className="text-emerald-600 hover:text-emerald-700"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            client.clientType === 'RETURNING CLIENT'
                              ? 'purple'
                              : client.clientType === 'NEW CLIENT'
                              ? 'primary'
                              : 'neutral'
                          }
                        >
                          {client.clientType}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            client.status === 'Active'
                              ? 'success'
                              : client.status === 'Overdue'
                              ? 'danger'
                              : client.status === 'Renewal Due'
                              ? 'warning'
                              : 'neutral'
                          }
                          dot
                        >
                          {client.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatINR(fin.totalBilled)}
                      </td>

                      <td className="py-3 px-4 text-right font-black">
                        <span
                          className={fin.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}
                        >
                          {formatINR(fin.totalBalance)}
                        </span>
                      </td>

                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                            title="View Profile & History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setCurrentTab('client-statement', { clientId: client.id })
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Client Ledger Statement"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
                            title="Edit Client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      <ClientFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setActiveDetailClientId(null);
        }}
        clientId={activeDetailClientId}
        onEdit={(cl) => {
          setDetailModalOpen(false);
          handleEdit(cl);
        }}
        onAddPurchase={(cid) => {
          setDetailModalOpen(false);
          onOpenQuickAction('purchase');
        }}
        onAddPayment={(cid) => {
          setDetailModalOpen(false);
          onOpenQuickAction('payment');
        }}
        onCreateQuotation={(cid) => {
          setDetailModalOpen(false);
          onOpenQuickAction('quotation');
        }}
        onAddRenewal={(cid) => {
          setDetailModalOpen(false);
          onOpenQuickAction('renewal');
        }}
      />
    </div>
  );
};
