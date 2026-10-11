import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Shield,
  UserCheck,
  ChevronDown,
  CheckCheck,
  Phone,
  Globe,
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  RefreshCw,
  TrendingDown,
  Globe2,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenQuickAction: (actionType: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenQuickAction }) => {
  const {
    currentUser,
    setCurrentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setCurrentTab,
    companySettings,
    dbStatus,
    logout,
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser({
      ...currentUser,
      role,
    });
    setRoleMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between no-print">
        {/* Left: Mobile Toggle & Search Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 text-slate-500 hover:text-slate-800 text-xs transition-all w-48 sm:w-72 justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Search system...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Actions, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Action (+) Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Action</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </button>

            {quickActionOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setQuickActionOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Create New
                  </div>
                  <button
                    onClick={() => {
                      onOpenQuickAction('client');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-cyan-600" />
                    New Client
                  </button>
                  <button
                    onClick={() => {
                      onOpenQuickAction('quotation');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    New Quotation
                  </button>
                  <button
                    onClick={() => {
                      onOpenQuickAction('payment');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Record Payment
                  </button>
                  <button
                    onClick={() => {
                      onOpenQuickAction('purchase');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Add Purchase / Service
                  </button>
                  <button
                    onClick={() => {
                      onOpenQuickAction('renewal');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    Add Renewal
                  </button>
                  <button
                    onClick={() => {
                      onOpenQuickAction('expense');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    Add Expense
                  </button>
                  <button
                    onClick={() => {
                      onOpenQuickAction('asset');
                      setQuickActionOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Globe2 className="w-4 h-4 text-sky-600" />
                    Add Domain / Hosting
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Database Live Status Badge */}
          <button
            type="button"
            onClick={() => setCurrentTab('settings')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title={`Database Status: ${dbStatus?.type === 'mysql' ? 'Connected to Hostinger MySQL' : 'Connected to Server Persistent Database'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {dbStatus?.type === 'mysql' ? 'MySQL' : 'DB Online'}
            </span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                      <p className="text-[11px] text-slate-500">
                        {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No active alerts. All clear!
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                            notif.isRead ? 'opacity-60 bg-white' : 'bg-cyan-50/30'
                          }`}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            setCurrentTab(notif.linkTab);
                            setNotifOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-0.5">
                            <span className="truncate">{notif.title}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                                notif.priority === 'overdue'
                                  ? 'bg-rose-100 text-rose-800'
                                  : notif.priority === 'due_soon'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {notif.priority.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-cyan-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {roleMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Access Role
                  </div>
                  {(['Admin', 'Manager', 'Staff'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        currentUser.role === role ? 'font-bold text-cyan-700 bg-cyan-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {role}
                      </span>
                      {currentUser.role === role && (
                        <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.2 rounded-full">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setCurrentTab('settings');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer rounded-lg"
                    >
                      System Settings
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setRoleMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium cursor-pointer rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
