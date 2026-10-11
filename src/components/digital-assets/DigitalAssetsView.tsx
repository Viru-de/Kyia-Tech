import React, { useState } from 'react';
import {
  Globe2,
  Plus,
  Search,
  Download,
  Server,
  Mail,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DigitalAsset } from '../../types';
import { formatINR, formatDate, exportToCSV, getDaysDiff } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { DigitalAssetFormModal } from './DigitalAssetFormModal';

interface DigitalAssetsViewProps {
  onOpenQuickAction: (actionType: string) => void;
}

export const DigitalAssetsView: React.FC<DigitalAssetsViewProps> = ({ onOpenQuickAction }) => {
  const { digitalAssets, deleteDigitalAsset } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<DigitalAsset | null>(null);

  const totalCost = digitalAssets.reduce((acc, a) => acc + a.costPrice, 0);
  const totalSelling = digitalAssets.reduce((acc, a) => acc + a.sellingPrice, 0);
  const totalMargin = totalSelling - totalCost;
  const marginPercent = totalSelling > 0 ? ((totalMargin / totalSelling) * 100).toFixed(1) : 0;

  const filteredAssets = digitalAssets.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.assetName.toLowerCase().includes(q) ||
      a.clientName.toLowerCase().includes(q) ||
      a.provider.toLowerCase().includes(q) ||
      a.serviceType.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || a.serviceType === typeFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleEdit = (asset: DigitalAsset) => {
    setAssetToEdit(asset);
    setIsFormOpen(true);
  };

  const handleDelete = (asset: DigitalAsset) => {
    if (window.confirm(`Delete digital asset "${asset.assetName}"?`)) {
      deleteDigitalAsset(asset.id);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Asset Name', 'Service Type', 'Client', 'Provider', 'Renewal Date', 'Cost Price', 'Selling Price', 'Profit Margin', 'Status'],
      ...filteredAssets.map((a) => [
        a.assetName,
        a.serviceType,
        a.clientName,
        a.provider,
        a.renewalDate,
        a.costPrice,
        a.sellingPrice,
        a.sellingPrice - a.costPrice,
        a.status,
      ]),
    ];
    exportToCSV(`klyia_digital_assets_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Digital Assets & Infrastructure</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold font-mono">
              {digitalAssets.length} Assets
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Domains, Cloud VPS, Google Workspace / Zoho emails, SSL certificates & profit margin tracking
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
              setAssetToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl flex items-center gap-1.5 shadow-xs shadow-cyan-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Digital Asset
          </button>
        </div>
      </div>

      {/* KPI Cards: Cost vs Selling Price Margin Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Total Annual Cost</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{formatINR(totalCost)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Vendor purchase expenses</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Total Annual Billing</span>
          <p className="text-2xl font-black text-cyan-700 mt-2 font-mono">{formatINR(totalSelling)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Client contract value</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Gross Asset Profit</span>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            +{formatINR(totalMargin)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            Selling Price - Cost Price
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium block">Asset Profit Margin</span>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{marginPercent}%</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Portfolio markup margin</span>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domain, client, provider (Hostinger, GoDaddy)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Service Types</option>
            <option value="Domain">Domain</option>
            <option value="Hosting">Hosting</option>
            <option value="Business Email">Business Email</option>
            <option value="SSL">SSL</option>
            <option value="Server">Server</option>
            <option value="Software Subscription">Software Subscription</option>
          </select>
        </div>

        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Digital Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Globe2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No digital assets found</p>
            <p className="text-xs text-slate-500 mt-1">
              Add client domains and hosting setups to keep ownership records clear.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Asset / Domain Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Renewal Date</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => {
                  const profit = asset.sellingPrice - asset.costPrice;
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {asset.assetName}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">{asset.clientName}</td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {asset.serviceType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{asset.provider}</td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {formatDate(asset.renewalDate)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatINR(asset.costPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(asset.sellingPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                        +{formatINR(profit)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            asset.status === 'Active'
                              ? 'success'
                              : asset.status === 'Expired'
                              ? 'danger'
                              : 'warning'
                          }
                          dot
                        >
                          {asset.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Asset"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Asset Form Modal */}
      <DigitalAssetFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setAssetToEdit(null);
        }}
        assetToEdit={assetToEdit}
      />
    </div>
  );
};
