import React from 'react';
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  RefreshCw,
  TrendingDown,
  Globe2,
  BarChart3,
  Settings,
  Info,
  ChevronRight,
  Sparkles,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | number | null;
  badgeVariant?: 'danger' | 'warning' | 'info';
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { currentTab, setCurrentTab, metrics, companySettings } = useApp();

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      group: 'CRM & CLIENTS',
      items: [
        {
          id: 'crm-clients',
          label: 'All Clients',
          icon: Users,
          badge: metrics.totalClients,
        },
        {
          id: 'crm-pipeline',
          label: 'Client Pipeline',
          icon: Kanban,
          badge: metrics.activeProjectsCount,
        },
      ],
    },
    {
      group: 'SALES & BILLING',
      items: [
        {
          id: 'sales-quotations',
          label: 'Quotations',
          icon: FileSpreadsheet,
          badge: metrics.pendingQuotationsCount > 0 ? `${metrics.pendingQuotationsCount}` : null,
          badgeVariant: 'warning',
        },
        {
          id: 'sales-invoices',
          label: 'Invoices',
          icon: Receipt,
          badge: null,
        },
        {
          id: 'sales-payments',
          label: 'Payments & Receipts',
          icon: CreditCard,
          badge: null,
        },
        {
          id: 'client-statement',
          label: 'Client Statement',
          icon: FileText,
          badge: null,
        },
      ],
    },
    {
      group: 'RENEWALS & ASSETS',
      items: [
        {
          id: 'renewals',
          label: 'Renewals Tracker',
          icon: RefreshCw,
          badge: metrics.renewalDueCount + metrics.renewalOverdueCount > 0 ? `${metrics.renewalDueCount + metrics.renewalOverdueCount}` : null,
          badgeVariant: metrics.renewalOverdueCount > 0 ? 'danger' : 'warning',
        },
        {
          id: 'digital-assets',
          label: 'Digital Assets',
          icon: Globe2,
          badge: null,
        },
      ],
    },
    {
      group: 'EXPENSES & FINANCE',
      items: [
        {
          id: 'expenses',
          label: 'Expenses & Bills',
          icon: TrendingDown,
          badge: null,
        },
        {
          id: 'finance',
          label: 'Business Finance',
          icon: DollarSign,
          badge: null,
        },
        {
          id: 'reports',
          label: 'Reports & GST',
          icon: BarChart3,
          badge: null,
        },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          badge: null,
        },
        {
          id: 'about',
          label: 'About Klyia',
          icon: Info,
          badge: null,
        },
      ],
    },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-base font-extrabold text-white tracking-tight truncate leading-tight">
              {companySettings.companyName || 'KLYIA TECHNOLOGY'}
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase truncate">
              Business Suite
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar space-y-5">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold shadow-md shadow-cyan-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-500 text-white'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-500 text-slate-950 font-extrabold'
                              : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom User & Contact Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/60 flex items-center justify-center text-xs shrink-0">
                KT
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Klyia Helpline</p>
                <a
                  href="tel:8296887643"
                  className="text-[11px] text-cyan-400 hover:underline font-medium block truncate"
                >
                  8296887643
                </a>
              </div>
            </div>
            <a
              href="https://klyiatechnology.com/"
              target="_blank"
              rel="noreferrer"
              title="Visit Klyia Website"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60"
            >
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
