import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientManagementView } from './components/crm/ClientManagementView';
import { ClientPipelineView } from './components/crm/ClientPipelineView';
import { QuotationView } from './components/sales/QuotationView';
import { InvoiceAndReceiptView } from './components/sales/InvoiceAndReceiptView';
import { ClientStatementView } from './components/sales/ClientStatementView';
import { RenewalView } from './components/renewals/RenewalView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { DigitalAssetsView } from './components/digital-assets/DigitalAssetsView';
import { FinanceDashboardView } from './components/finance/FinanceDashboardView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AboutKlyiaView } from './components/about/AboutKlyiaView';

// Quick action modals
import { ClientFormModal } from './components/crm/ClientFormModal';
import { QuotationFormModal } from './components/sales/QuotationFormModal';
import { PaymentFormModal } from './components/sales/PaymentFormModal';
import { PurchaseFormModal } from './components/sales/PurchaseFormModal';
import { RenewalFormModal } from './components/renewals/RenewalFormModal';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal';
import { DigitalAssetFormModal } from './components/digital-assets/DigitalAssetFormModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { RotateCcw } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { currentTab, companySettings, toasts, dismissToast, isAuthenticated, isCheckingAuth } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Action Modal states
  const [quickActionModal, setQuickActionModal] = useState<string | null>(null);

  const handleOpenQuickAction = (actionType: string) => {
    setQuickActionModal(actionType);
  };

  const handleCloseQuickAction = () => {
    setQuickActionModal(null);
  };

  // 1. Initial Authentication Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-xl shadow-cyan-950/50 mb-4 animate-pulse">
          KT
        </div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
          <RotateCcw className="w-4 h-4 animate-spin" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate — Render Login Page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenQuickAction={handleOpenQuickAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {currentTab === 'dashboard' && (
            <DashboardView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'crm-clients' && (
            <ClientManagementView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'crm-pipeline' && (
            <ClientPipelineView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'sales-quotations' && (
            <QuotationView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'sales-invoices' && (
            <InvoiceAndReceiptView
              defaultTab="invoices"
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {currentTab === 'sales-payments' && (
            <InvoiceAndReceiptView
              defaultTab="payments"
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {currentTab === 'client-statement' && <ClientStatementView />}

          {currentTab === 'renewals' && (
            <RenewalView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'digital-assets' && (
            <DigitalAssetsView onOpenQuickAction={handleOpenQuickAction} />
          )}

          {currentTab === 'finance' && <FinanceDashboardView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}

          {currentTab === 'about' && <AboutKlyiaView />}
        </main>

        {/* Global Footer (no-print) */}
        <footer className="h-12 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs flex items-center justify-between px-6 text-[11px] text-slate-500 no-print">
          <div>
            © {new Date().getFullYear()} <strong>{companySettings.companyName}</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              Support:{' '}
              <a href={`tel:${companySettings.phone}`} className="font-semibold text-cyan-700 hover:underline">
                {companySettings.phone}
              </a>
            </span>
            <a
              href={companySettings.website}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-slate-900 font-semibold"
            >
              klyiatechnology.com
            </a>
          </div>
        </footer>
      </div>

      {/* Global Quick Action Modals */}
      <ClientFormModal
        isOpen={quickActionModal === 'client'}
        onClose={handleCloseQuickAction}
      />

      <QuotationFormModal
        isOpen={quickActionModal === 'quotation'}
        onClose={handleCloseQuickAction}
      />

      <PaymentFormModal
        isOpen={quickActionModal === 'payment'}
        onClose={handleCloseQuickAction}
      />

      <PurchaseFormModal
        isOpen={quickActionModal === 'purchase'}
        onClose={handleCloseQuickAction}
      />

      <RenewalFormModal
        isOpen={quickActionModal === 'renewal'}
        onClose={handleCloseQuickAction}
      />

      <ExpenseFormModal
        isOpen={quickActionModal === 'expense'}
        onClose={handleCloseQuickAction}
      />

      <DigitalAssetFormModal
        isOpen={quickActionModal === 'asset'}
        onClose={handleCloseQuickAction}
      />

      {/* Global Action Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
