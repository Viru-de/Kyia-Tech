import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  CompanySettings,
  Client,
  PurchaseRecord,
  PaymentRecord,
  RenewalRecord,
  Quotation,
  Invoice,
  ExpenseRecord,
  DigitalAsset,
  ActivityLog,
  AppNotification,
  UserRole,
  ClientType,
  ToastMessage,
} from '../types';
import {
  initialCompanySettings,
  initialClients,
  initialPurchases,
  initialPayments,
  initialRenewals,
  initialQuotations,
  initialInvoices,
  initialExpenses,
  initialDigitalAssets,
  initialActivityLogs,
} from './initialData';
import { getDaysDiff } from '../utils/formatters';
import { api, DatabaseStatus, setApiAuth, clearApiAuth } from '../utils/api';

interface CurrentUser {
  name: string;
  role: UserRole;
  email: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  currentTab: string;
  setCurrentTab: (tab: string, options?: { clientId?: string; quotationId?: string; invoiceId?: string }) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedQuotationId: string | null;
  setSelectedQuotationId: (id: string | null) => void;
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;

  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;

  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'clientId' | 'dateAdded'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  archiveClient: (id: string) => void;
  restoreClient: (id: string) => void;
  getClientRelatedRecordsCount: (clientId: string) => { label: string; count: number }[];

  purchases: PurchaseRecord[];
  addPurchase: (purchase: Omit<PurchaseRecord, 'id' | 'purchaseId'>) => PurchaseRecord;
  updatePurchase: (id: string, updates: Partial<PurchaseRecord>) => void;
  deletePurchase: (id: string) => void;

  payments: PaymentRecord[];
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'receiptNo'>) => PaymentRecord;
  deletePayment: (id: string) => void;

  renewals: RenewalRecord[];
  addRenewal: (renewal: Omit<RenewalRecord, 'id'>) => RenewalRecord;
  updateRenewal: (id: string, updates: Partial<RenewalRecord>) => void;
  deleteRenewal: (id: string) => void;
  renewNow: (id: string, newExpiryDate: string, amountPaid?: number) => void;
  markReminderSent: (id: string) => void;

  quotations: Quotation[];
  addQuotation: (qtn: Omit<Quotation, 'id' | 'quotationNumber'>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  convertQuotationToInvoice: (quotationId: string) => Invoice | null;

  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  recordInvoicePayment: (invoiceId: string, amount: number, mode: string, ref: string) => void;

  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'expenseId'>) => ExpenseRecord;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (category: string) => void;
  deleteExpenseCategory: (category: string) => void;

  digitalAssets: DigitalAsset[];
  addDigitalAsset: (asset: Omit<DigitalAsset, 'id'>) => DigitalAsset;
  updateDigitalAsset: (id: string, updates: Partial<DigitalAsset>) => void;
  deleteDigitalAsset: (id: string) => void;

  activityLogs: ActivityLog[];
  logActivity: (action: string, details: string, entityType: ActivityLog['entityType'], entityId?: string) => void;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  dismissToast: (id: string) => void;

  // Database Management
  dbStatus: DatabaseStatus | null;
  refreshDbStatus: () => Promise<void>;
  isLoadingFromDb: boolean;

  // Backup & reset
  exportAllDataJSON: () => void;
  importAllDataJSON: (jsonData: string) => boolean;
  resetToSampleData: () => void;
  clearAllData: () => void;

  // Computed metrics
  metrics: {
    totalClients: number;
    currentClientsCount: number;
    upcomingClientsCount: number;
    activeClients: number;
    archivedClientsCount: number;
    newClients: number;
    returningClients: number;
    oldClients: number;
    renewalDueCount: number;
    renewalOverdueCount: number;
    pendingPaymentsTotal: number;
    advanceBalanceTotal: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    totalExpenses: number;
    thisMonthExpenses: number;
    netProfit: number;
    activeProjectsCount: number;
    pendingQuotationsCount: number;
    acceptedQuotationsCount: number;
    upcomingProjectValue: number;
    rejoySolarOutstanding: number;
  };

  getClientFinancials: (clientId: string) => {
    totalBilled: number;
    totalPaid: number;
    totalAdvance: number;
    totalBalance: number;
    isOverdue: boolean;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [currentUser, setCurrentUserState] = useState<CurrentUser>({
    name: 'Klyia Administrator',
    role: 'Admin',
    email: 'klyiatechnology@gmail.com',
  });

  const [currentTab, setCurrentTabState] = useState<string>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Primary state backed by database
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(initialPurchases);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [renewals, setRenewals] = useState<RenewalRecord[]>(initialRenewals);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>(initialDigitalAssets);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [readNotifications, setReadNotifications] = useState<string[]>([]);

  // Database Connection State
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --------------------------------------------------------------------------
  // INITIAL DATABASE HYDRATION
  // --------------------------------------------------------------------------
  const loadAllDataFromDatabase = async () => {
    setIsLoadingFromDb(true);
    try {
      const [
        statusRes,
        settingsRes,
        clientsRes,
        purchasesRes,
        quotationsRes,
        invoicesRes,
        paymentsRes,
        renewalsRes,
        expensesRes,
        assetsRes,
        logsRes,
      ] = await Promise.all([
        api.getDatabaseStatus().catch(() => null),
        api.getSettings().catch(() => null),
        api.getClients(true).catch(() => null),
        api.getPurchases().catch(() => null),
        api.getQuotations().catch(() => null),
        api.getInvoices().catch(() => null),
        api.getPayments().catch(() => null),
        api.getRenewals().catch(() => null),
        api.getExpenses().catch(() => null),
        api.getDigitalAssets().catch(() => null),
        api.getLogs().catch(() => null),
      ]);

      if (statusRes?.status) setDbStatus(statusRes.status);
      if (settingsRes?.settings) {
        setCompanySettings({
          ...settingsRes.settings,
          gstin: settingsRes.settings.gstin || '22AVSPP4822G1ZF',
          pan: settingsRes.settings.pan || 'AVSPP4822G',
        });
      }
      if (clientsRes?.clients) {
        setClients(clientsRes.clients);
      }
      if (purchasesRes?.purchases) {
        setPurchases(purchasesRes.purchases);
      }
      if (quotationsRes?.quotations) {
        setQuotations(quotationsRes.quotations);
      }
      if (invoicesRes?.invoices) {
        setInvoices(invoicesRes.invoices);
      }
      if (paymentsRes?.payments) {
        setPayments(paymentsRes.payments);
      }
      if (renewalsRes?.renewals) {
        setRenewals(renewalsRes.renewals);
      }
      if (expensesRes?.expenses) {
        setExpenses(expensesRes.expenses);
      }
      if (assetsRes?.assets) {
        setDigitalAssets(assetsRes.assets);
      }
      if (logsRes?.logs) {
        setActivityLogs(logsRes.logs);
      }
    } catch (err) {
      console.error('[AppContext] Error loading database data:', err);
    } finally {
      setIsLoadingFromDb(false);
    }
  };

  // Initial Auth Verification on Mount
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      setIsCheckingAuth(true);
      try {
        const res = await api.getMe();
        if (isMounted && res?.success && res.user) {
          setIsAuthenticated(true);
          setCurrentUserState({
            name: res.user.name,
            role: res.user.role,
            email: res.user.email,
          });
          setApiAuth(res.user.role, res.user.email, undefined, res.user.name);
          await loadAllDataFromDatabase();
        } else {
          if (isMounted) {
            setIsAuthenticated(false);
            clearApiAuth();
          }
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          clearApiAuth();
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkExistingSession();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      clearApiAuth();
    };

    window.addEventListener('klyia:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('klyia:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (identifier: string, password: string, rememberMe = false) => {
    try {
      const res = await api.login(identifier, password, rememberMe);
      if (res?.success && res.user) {
        setApiAuth(res.user.role, res.user.email, res.token, res.user.name);
        setCurrentUserState({
          name: res.user.name,
          role: res.user.role,
          email: res.user.email,
        });
        setIsAuthenticated(true);
        showToast(`Welcome back, ${res.user.name}!`, 'success', 'Login Successful');
        await loadAllDataFromDatabase();
        return { success: true };
      }
      return { success: false, error: res?.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      clearApiAuth();
      setIsAuthenticated(false);
      setCurrentUserState({
        name: 'Klyia Administrator',
        role: 'Admin',
        email: 'klyiatechnology@gmail.com',
      });
      showToast('You have been logged out securely.', 'info', 'Logged Out');
    }
  };

  const refreshDbStatus = async () => {
    try {
      const res = await api.getDatabaseStatus();
      if (res?.status) setDbStatus(res.status);
    } catch (e) {
      console.error('Failed to refresh database status:', e);
    }
  };

  const setCurrentUser = (user: CurrentUser) => {
    setCurrentUserState(user);
    setApiAuth(user.role, user.email);
    logActivity('User Profile Updated', `User profile updated for ${user.name} (${user.role})`, 'Settings');
  };

  const setCurrentTab = (
    tab: string,
    options?: { clientId?: string; quotationId?: string; invoiceId?: string }
  ) => {
    setCurrentTabState(tab);
    if (options?.clientId) setSelectedClientId(options.clientId);
    if (options?.quotationId) setSelectedQuotationId(options.quotationId);
    if (options?.invoiceId) setSelectedInvoiceId(options.invoiceId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logActivity = (
    action: string,
    details: string,
    entityType: ActivityLog['entityType'] = 'Client',
    entityId?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userName: currentUser.name,
      userRole: currentUser.role,
      entityType,
      entityId,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    api.createLog(newLog).catch(() => {});
  };

  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    const updated = { ...companySettings, ...newSettings };
    setCompanySettings(updated);
    api.updateSettings(updated)
      .then(() => showToast('Company settings updated in database.', 'success'))
      .catch((err) => {
        console.error('Failed to update company settings in database:', err);
        showToast('Error updating company settings.', 'error');
      });
    logActivity('Settings Updated', 'Updated company profile or system settings', 'Settings');
  };

  // --------------------------------------------------------------------------
  // CLIENTS
  // --------------------------------------------------------------------------
  const addClient = (clientData: Omit<Client, 'id' | 'clientId' | 'dateAdded'>): Client => {
    const dateAdded = new Date().toISOString().split('T')[0];
    const nextNumber = clients.length + 1;
    const clientId = `${companySettings.clientPrefix || 'KLY-CLI-'}${String(nextNumber).padStart(3, '0')}`;
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      clientId,
      dateAdded,
      clientType: clientData.clientType || 'NEW CLIENT',
    };

    setClients((prev) => [newClient, ...prev]);

    api.createClient(newClient)
      .then((res) => {
        if (res.client) {
          setClients((prev) => prev.map((c) => (c.id === newClient.id ? res.client : c)));
        }
        showToast(`Client "${newClient.name}" saved to database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to save client to database:', err);
        showToast('Error saving client to database.', 'error');
      });

    logActivity('Client Created', `Created client ${newClient.name} (${newClient.clientId})`, 'Client', newClient.id);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    api.updateClient(id, updates)
      .then(() => {
        showToast('Client updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to update client in database:', err);
        showToast('Error updating client in database.', 'error');
      });

    const client = clients.find((c) => c.id === id);
    logActivity('Client Updated', `Updated details for ${client ? client.name : id}`, 'Client', id);
  };

  const archiveClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isArchived: true, status: 'Archived', archivedAt: new Date().toISOString() }
          : c
      )
    );
    api.archiveClient(id)
      .then(() => {
        showToast(`Client "${client?.name || id}" archived in database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to archive client in database:', err);
        showToast('Error archiving client in database.', 'error');
      });
  };

  const restoreClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isArchived: false, status: 'Active', archivedAt: undefined }
          : c
      )
    );
    api.restoreClient(id)
      .then(() => {
        showToast(`Client "${client?.name || id}" restored in database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to restore client in database:', err);
        showToast('Error restoring client in database.', 'error');
      });
  };

  const deleteClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    api.deleteClient(id)
      .then(() => {
        showToast(`Client "${client ? client.name : id}" deleted from database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to delete client from database:', err);
        showToast('Error deleting client from database.', 'error');
      });
    logActivity('Client Deleted', `Deleted client ${client ? client.name : id}`, 'Client', id);
  };

  const getClientRelatedRecordsCount = (clientId: string) => {
    const qCount = quotations.filter((q) => q.clientId === clientId).length;
    const invCount = invoices.filter((i) => i.clientId === clientId).length;
    const payCount = payments.filter((p) => p.clientId === clientId).length;
    const purCount = purchases.filter((p) => p.clientId === clientId).length;
    const renCount = renewals.filter((r) => r.clientId === clientId).length;
    const client = clients.find((c) => c.id === clientId);
    const svcCount = client?.services ? client.services.length : 0;

    return [
      { label: 'Quotations', count: qCount },
      { label: 'Invoices', count: invCount },
      { label: 'Payment Receipts', count: payCount },
      { label: 'Purchases / Contracts', count: purCount },
      { label: 'Renewals', count: renCount },
      { label: 'Services', count: svcCount },
    ];
  };

  // --------------------------------------------------------------------------
  // PURCHASES (PROJECTS / SERVICES)
  // --------------------------------------------------------------------------
  const addPurchase = (purchaseData: Omit<PurchaseRecord, 'id' | 'purchaseId'>): PurchaseRecord => {
    const nextNum = purchases.length + 1;
    const purchaseId = `KLY-PUR-${String(nextNum).padStart(3, '0')}`;
    const newPurchase: PurchaseRecord = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      purchaseId,
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // If advance paid > 0, automatically record payment receipt
    if (newPurchase.advancePaid > 0) {
      const nextReceiptNum = payments.length + 1;
      const receiptNo = `${companySettings.receiptPrefix || 'KLY-RCP-2026-'}${String(nextReceiptNum).padStart(4, '0')}`;
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNo,
        clientId: newPurchase.clientId,
        clientName: newPurchase.clientName,
        paymentDate: newPurchase.purchaseDate,
        amount: newPurchase.advancePaid,
        paymentMode: (newPurchase.paymentMode as any) || 'Bank Transfer',
        referenceNo: `ADV-${newPurchase.purchaseId}`,
        notes: `Advance payment for ${newPurchase.customServiceTitle || newPurchase.serviceType}`,
        againstType: 'Purchase',
        againstId: newPurchase.id,
        againstTitle: newPurchase.customServiceTitle || newPurchase.serviceType,
      };
      setPayments((prev) => [newPayment, ...prev]);
    }

    api.createPurchase(newPurchase)
      .then((res) => {
        if (res.purchase) {
          setPurchases((prev) => prev.map((p) => (p.id === newPurchase.id ? res.purchase : p)));
        }
        showToast('Project & contract saved to database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to save purchase to database:', err);
        showToast('Error saving project to database.', 'error');
      });

    logActivity(
      'Purchase Added',
      `Recorded purchase of ₹${newPurchase.grandTotal} for ${newPurchase.clientName}`,
      'Client',
      newPurchase.clientId
    );
    return newPurchase;
  };

  const updatePurchase = (id: string, updates: Partial<PurchaseRecord>) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    api.updatePurchase(id, updates)
      .then(() => {
        showToast('Project updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to update purchase in database:', err);
        showToast('Error updating project in database.', 'error');
      });
  };

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    api.deletePurchase(id)
      .then(() => {
        showToast('Project deleted from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to delete purchase from database:', err);
        showToast('Error deleting project from database.', 'error');
      });
  };

  // --------------------------------------------------------------------------
  // PAYMENTS
  // --------------------------------------------------------------------------
  const addPayment = (paymentData: Omit<PaymentRecord, 'id' | 'receiptNo'>): PaymentRecord => {
    const nextReceiptNum = payments.length + 1;
    const receiptNo = `${companySettings.receiptPrefix || 'KLY-RCP-2026-'}${String(nextReceiptNum).padStart(4, '0')}`;
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receiptNo,
    };

    setPayments((prev) => [newPayment, ...prev]);

    api.createPayment(newPayment)
      .then((res) => {
        if (res.payment) {
          setPayments((prev) => prev.map((p) => (p.id === newPayment.id ? res.payment : p)));
        }
        showToast(`Payment receipt ${newPayment.receiptNo} saved to database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to save payment to database:', err);
        showToast('Error recording payment in database.', 'error');
      });

    logActivity(
      'Payment Added',
      `Received ₹${newPayment.amount} from ${newPayment.clientName} via ${newPayment.paymentMode} (${newPayment.receiptNo})`,
      'Payment',
      newPayment.id
    );
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    api.deletePayment(id)
      .then(() => {
        showToast('Payment receipt removed from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to delete payment from database:', err);
        showToast('Error deleting payment from database.', 'error');
      });
  };

  // --------------------------------------------------------------------------
  // RENEWALS
  // --------------------------------------------------------------------------
  const addRenewal = (renewalData: Omit<RenewalRecord, 'id'>): RenewalRecord => {
    const newRenewal: RenewalRecord = {
      ...renewalData,
      id: `ren-${Date.now()}`,
    };
    setRenewals((prev) => [newRenewal, ...prev]);
    api.createRenewal(newRenewal)
      .then(() => {
        showToast('Renewal schedule saved to database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to save renewal:', err));
    return newRenewal;
  };

  const updateRenewal = (id: string, updates: Partial<RenewalRecord>) => {
    setRenewals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    api.updateRenewal(id, updates)
      .then(() => {
        showToast('Renewal updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to update renewal:', err));
  };

  const deleteRenewal = (id: string) => {
    setRenewals((prev) => prev.filter((r) => r.id !== id));
    api.deleteRenewal(id)
      .then(() => {
        showToast('Renewal deleted from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to delete renewal:', err));
  };

  const renewNow = (id: string, newExpiryDate: string, amountPaid?: number) => {
    const rec = renewals.find((r) => r.id === id);
    if (!rec) return;

    updateRenewal(id, {
      expiryDate: newExpiryDate,
      renewalDate: newExpiryDate,
      status: 'Renewed',
    });

    if (amountPaid && amountPaid > 0) {
      addPayment({
        clientId: rec.clientId,
        clientName: rec.clientName,
        paymentDate: new Date().toISOString().split('T')[0],
        amount: amountPaid,
        paymentMode: 'Bank Transfer',
        referenceNo: `REN-${Date.now().toString().slice(-6)}`,
        notes: `Renewal fee for ${rec.serviceName}`,
        againstType: 'Purchase',
        againstId: rec.id,
        againstTitle: `Renewal: ${rec.serviceName}`,
      });
    }
    showToast(`Service "${rec.serviceName}" renewed until ${newExpiryDate}.`, 'success');
  };

  const markReminderSent = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateRenewal(id, { lastReminderSentDate: today });
  };

  // --------------------------------------------------------------------------
  // QUOTATIONS
  // --------------------------------------------------------------------------
  const addQuotation = (qtnData: Omit<Quotation, 'id' | 'quotationNumber'>): Quotation => {
    const nextNum = quotations.length + 1;
    const quotationNumber = `${companySettings.quotationPrefix || 'KLY-QTN-2026-'}${String(nextNum).padStart(4, '0')}`;
    const newQuotation: Quotation = {
      ...qtnData,
      id: `qtn-${Date.now()}`,
      quotationNumber,
    };

    setQuotations((prev) => [newQuotation, ...prev]);

    api.createQuotation(newQuotation)
      .then((res) => {
        if (res.quotation) {
          setQuotations((prev) => prev.map((q) => (q.id === newQuotation.id ? res.quotation : q)));
        }
        showToast(`Quotation ${newQuotation.quotationNumber} saved to database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to save quotation:', err);
        showToast('Error saving quotation to database.', 'error');
      });

    logActivity(
      'Quotation Created',
      `Created quotation ${newQuotation.quotationNumber} for ${newQuotation.clientName} (₹${newQuotation.grandTotal})`,
      'Quotation',
      newQuotation.id
    );
    return newQuotation;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    api.updateQuotation(id, updates)
      .then(() => {
        showToast('Quotation updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to update quotation:', err));

    const q = quotations.find((x) => x.id === id);
    logActivity('Quotation Updated', `Updated quotation ${q?.quotationNumber || id}`, 'Quotation', id);
  };

  const deleteQuotation = (id: string) => {
    const q = quotations.find((x) => x.id === id);
    setQuotations((prev) => prev.filter((x) => x.id !== id));
    api.deleteQuotation(id)
      .then(() => {
        showToast('Quotation deleted from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to delete quotation:', err));
    logActivity('Quotation Deleted', `Deleted quotation ${q?.quotationNumber || id}`, 'Quotation', id);
  };

  const convertQuotationToInvoice = (quotationId: string): Invoice | null => {
    const qtn = quotations.find((q) => q.id === quotationId);
    if (!qtn) return null;

    const nextInvNum = invoices.length + 1;
    const invoiceNumber = `${companySettings.invoicePrefix || 'KLY-INV-2026-'}${String(nextInvNum).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      quotationNumber: qtn.quotationNumber,
      invoiceDate: today,
      dueDate,
      clientId: qtn.clientId,
      clientName: qtn.clientName,
      companyName: qtn.companyName,
      contactPerson: qtn.contactPerson,
      phone: qtn.phone,
      email: qtn.email,
      gstin: qtn.gstin,
      address: qtn.address,
      items: qtn.items,
      subtotal: qtn.subtotal,
      discountTotal: qtn.discountTotal,
      taxableAmount: qtn.taxableAmount,
      gstPercent: qtn.gstPercent,
      isInterstate: qtn.isInterstate,
      cgst: qtn.cgst,
      sgst: qtn.sgst,
      igst: qtn.igst,
      grandTotal: qtn.grandTotal,
      paidAmount: 0,
      balanceDue: qtn.grandTotal,
      status: 'Unpaid',
      paymentTerms: 'Payment due upon receipt of invoice.',
      notes: qtn.notes,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    updateQuotation(quotationId, { status: 'Converted to Invoice' });
    api.createInvoice(newInvoice).catch(() => {});

    showToast(`Converted to Tax Invoice #${newInvoice.invoiceNumber}.`, 'success');
    logActivity(
      'Invoice Created from Quote',
      `Converted quote ${qtn.quotationNumber} to tax invoice ${newInvoice.invoiceNumber}`,
      'Invoice',
      newInvoice.id
    );
    return newInvoice;
  };

  // --------------------------------------------------------------------------
  // INVOICES
  // --------------------------------------------------------------------------
  const addInvoice = (invData: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    const nextNum = invoices.length + 1;
    const invoiceNumber = `${companySettings.invoicePrefix || 'KLY-INV-2026-'}${String(nextNum).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    api.createInvoice(newInvoice)
      .then((res) => {
        if (res.invoice) {
          setInvoices((prev) => prev.map((i) => (i.id === newInvoice.id ? res.invoice : i)));
        }
        showToast(`Invoice ${newInvoice.invoiceNumber} saved to database.`, 'success');
        refreshDbStatus();
      })
      .catch((err) => {
        console.error('Failed to save invoice:', err);
        showToast('Error saving invoice to database.', 'error');
      });

    logActivity(
      'Invoice Created',
      `Created tax invoice ${newInvoice.invoiceNumber} for ${newInvoice.clientName} (₹${newInvoice.grandTotal})`,
      'Invoice',
      newInvoice.id
    );
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    api.updateInvoice(id, updates)
      .then(() => {
        showToast('Invoice updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to update invoice:', err));
  };

  const deleteInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    api.deleteInvoice(id)
      .then(() => {
        showToast('Invoice deleted from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to delete invoice:', err));
    logActivity('Invoice Deleted', `Deleted invoice ${inv?.invoiceNumber || id}`, 'Invoice', id);
  };

  const recordInvoicePayment = (
    invoiceId: string,
    amount: number,
    mode: string,
    ref: string
  ) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    addPayment({
      clientId: inv.clientId,
      clientName: inv.clientName,
      paymentDate: new Date().toISOString().split('T')[0],
      amount,
      paymentMode: (mode as any) || 'UPI',
      referenceNo: ref || `PAY-INV-${inv.invoiceNumber}`,
      notes: `Payment for Invoice ${inv.invoiceNumber}`,
      againstType: 'Invoice',
      againstId: inv.id,
      againstTitle: `Invoice ${inv.invoiceNumber}`,
    });

    const newPaid = (inv.paidAmount || 0) + amount;
    const newBal = Math.max(0, inv.grandTotal - newPaid);
    const newStatus = newBal <= 0 ? 'Paid' : 'Partially Paid';
    updateInvoice(invoiceId, { paidAmount: newPaid, balanceDue: newBal, status: newStatus });
  };

  // --------------------------------------------------------------------------
  // EXPENSES
  // --------------------------------------------------------------------------
  const addExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'expenseId'>): ExpenseRecord => {
    const nextNum = expenses.length + 1;
    const expenseId = `KLY-EXP-${String(nextNum).padStart(3, '0')}`;
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      expenseId,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    api.createExpense(newExpense)
      .then((res) => {
        if (res.expense) {
          setExpenses((prev) => prev.map((e) => (e.id === newExpense.id ? res.expense : e)));
        }
        showToast('Expense recorded in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to save expense:', err));

    logActivity(
      'Expense Added',
      `Logged ₹${newExpense.amount} under ${newExpense.category} (${newExpense.vendor})`,
      'Expense',
      newExpense.id
    );
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<ExpenseRecord>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    api.updateExpense(id, updates)
      .then(() => {
        showToast('Expense updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to update expense:', err));
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    api.deleteExpense(id)
      .then(() => {
        showToast('Expense removed from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to delete expense:', err));
    logActivity('Expense Deleted', `Deleted expense ${exp?.expenseId || id}`, 'Expense', id);
  };

  const addExpenseCategory = (category: string) => {
    if (!category.trim()) return;
    const currentCats = companySettings.expenseCategories || [];
    if (currentCats.includes(category.trim())) return;
    updateCompanySettings({ expenseCategories: [...currentCats, category.trim()] });
  };

  const deleteExpenseCategory = (category: string) => {
    const currentCats = companySettings.expenseCategories || [];
    updateCompanySettings({ expenseCategories: currentCats.filter((c) => c !== category) });
    showToast(`Category "${category}" removed.`, 'success');
  };

  // --------------------------------------------------------------------------
  // DIGITAL ASSETS
  // --------------------------------------------------------------------------
  const addDigitalAsset = (assetData: Omit<DigitalAsset, 'id'>): DigitalAsset => {
    const newAsset: DigitalAsset = {
      ...assetData,
      id: `asset-${Date.now()}`,
    };
    setDigitalAssets((prev) => [newAsset, ...prev]);

    api.createDigitalAsset(newAsset)
      .then((res) => {
        if (res.asset) {
          setDigitalAssets((prev) => prev.map((a) => (a.id === newAsset.id ? res.asset : a)));
        }
        showToast('Digital asset saved to database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to save asset:', err));

    logActivity(
      'Asset Added',
      `Registered digital asset ${newAsset.assetName} (${newAsset.serviceType}) for ${newAsset.clientName}`,
      'Asset',
      newAsset.id
    );
    return newAsset;
  };

  const updateDigitalAsset = (id: string, updates: Partial<DigitalAsset>) => {
    setDigitalAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    api.updateDigitalAsset(id, updates)
      .then(() => {
        showToast('Asset updated in database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to update asset:', err));
  };

  const deleteDigitalAsset = (id: string) => {
    setDigitalAssets((prev) => prev.filter((a) => a.id !== id));
    api.deleteDigitalAsset(id)
      .then(() => {
        showToast('Asset removed from database.', 'success');
        refreshDbStatus();
      })
      .catch((err) => console.error('Failed to delete asset:', err));
  };

  // --------------------------------------------------------------------------
  // FINANCIAL LEDGER HELPER
  // --------------------------------------------------------------------------
  const getClientFinancials = (clientId: string) => {
    const clientPurchases = purchases.filter((p) => p.clientId === clientId);
    const totalBilled = clientPurchases.reduce((acc, p) => acc + p.grandTotal, 0);
    const clientPayments = payments.filter((p) => p.clientId === clientId);
    const totalPaid = clientPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalAdvance = clientPurchases.reduce((acc, p) => acc + (p.advancePaid || 0), 0);
    const totalBalance = Math.max(0, totalBilled - totalPaid);
    const hasOverduePurchases = clientPurchases.some(
      (p) => p.paymentStatus === 'Overdue' || (p.balanceDue > 0 && p.dueDate && getDaysDiff(p.dueDate) < 0)
    );

    return {
      totalBilled,
      totalPaid,
      totalAdvance,
      totalBalance,
      isOverdue: hasOverduePurchases,
    };
  };

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];

    renewals.forEach((r) => {
      const days = getDaysDiff(r.renewalDate);
      if (days < 0) {
        list.push({
          id: `notif-ren-over-${r.id}`,
          title: `Renewal Overdue: ${r.serviceName}`,
          message: `${r.clientName}'s service expired on ${r.renewalDate} (₹${r.renewalAmount.toLocaleString('en-IN')}).`,
          type: 'renewal',
          priority: 'overdue',
          date: r.renewalDate,
          isRead: readNotifications.includes(`notif-ren-over-${r.id}`),
          linkTab: 'renewals',
        });
      } else if (days <= 15) {
        list.push({
          id: `notif-ren-${r.id}`,
          title: `Renewal Due Soon: ${r.serviceName}`,
          message: `${r.clientName}'s ${r.serviceName} expires in ${days} days (${r.renewalDate}).`,
          type: 'renewal',
          priority: 'due_soon',
          date: r.renewalDate,
          isRead: readNotifications.includes(`notif-ren-${r.id}`),
          linkTab: 'renewals',
        });
      }
    });

    invoices.forEach((inv) => {
      if (inv.status === 'Overdue' || (inv.balanceDue > 0 && getDaysDiff(inv.dueDate) < 0)) {
        list.push({
          id: `notif-inv-${inv.id}`,
          title: `Payment Overdue: ${inv.clientName}`,
          message: `Invoice #${inv.invoiceNumber} has outstanding balance of ₹${inv.balanceDue.toLocaleString('en-IN')}.`,
          type: 'payment',
          priority: 'overdue',
          date: inv.dueDate,
          isRead: readNotifications.includes(`notif-inv-${inv.id}`),
          linkTab: 'sales-invoices',
        });
      }
    });

    quotations.forEach((q) => {
      if (q.status === 'Sent') {
        const days = getDaysDiff(q.validUntil);
        if (days >= 0 && days <= 5) {
          list.push({
            id: `notif-qtn-${q.id}`,
            title: `Quotation Follow-up: ${q.clientName}`,
            message: `Quotation #${q.quotationNumber} (₹${q.grandTotal.toLocaleString('en-IN')}) expires in ${days} day(s).`,
            type: 'quotation',
            priority: 'upcoming',
            date: q.validUntil,
            isRead: readNotifications.includes(`notif-qtn-${q.id}`),
            linkTab: 'sales-quotations',
          });
        }
      }
    });

    expenses.forEach((exp) => {
      if (exp.isRecurring && exp.nextDueDate) {
        const days = getDaysDiff(exp.nextDueDate);
        if (days <= 5 && days >= 0) {
          list.push({
            id: `notif-exp-${exp.id}`,
            title: `Business Bill Due: ${exp.category}`,
            message: `${exp.description} (₹${exp.amount.toLocaleString('en-IN')}) due on ${exp.nextDueDate}.`,
            type: 'expense',
            priority: 'due_soon',
            date: exp.nextDueDate,
            isRead: readNotifications.includes(`notif-exp-${exp.id}`),
            linkTab: 'expenses',
          });
        }
      }
    });

    return list;
  }, [renewals, invoices, quotations, expenses, readNotifications]);

  const markNotificationAsRead = (id: string) => {
    setReadNotifications((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllNotificationsAsRead = () => {
    setReadNotifications(notifications.map((n) => n.id));
  };

  // --------------------------------------------------------------------------
  // METRICS
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const activeClientsList = clients.filter((c) => !c.isArchived);
    const totalClients = activeClientsList.length;
    const currentClients = activeClientsList.filter(
      (c) => c.status !== 'Upcoming Client' && c.status !== 'Upcoming'
    );
    const upcomingClients = activeClientsList.filter(
      (c) => c.status === 'Upcoming Client' || c.status === 'Upcoming'
    );

    const currentClientsCount = currentClients.length;
    const upcomingClientsCount = upcomingClients.length;

    const activeClients = activeClientsList.filter((c) => c.status === 'Active').length;
    const archivedClientsCount = clients.filter((c) => c.isArchived).length;
    const newClients = activeClientsList.filter((c) => c.clientType === 'NEW CLIENT').length;
    const returningClients = activeClientsList.filter((c) => c.clientType === 'RETURNING CLIENT').length;
    const oldClients = activeClientsList.filter((c) => c.clientType === 'OLD CLIENT').length;

    const renewalDueCount = renewals.filter(
      (r) => r.status === 'Due Soon' || r.status === 'Due Today'
    ).length;
    const renewalOverdueCount = renewals.filter((r) => r.status === 'Overdue').length;

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const thisMonthRevenue = payments
      .filter((p) => p.paymentDate && p.paymentDate.startsWith(currentYearMonth))
      .reduce((acc, p) => acc + p.amount, 0);

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const thisMonthExpenses = expenses
      .filter((e) => e.date && e.date.startsWith(currentYearMonth))
      .reduce((acc, e) => acc + e.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    const pendingPurchasesBal = purchases.reduce((acc, p) => acc + (p.balanceDue || 0), 0);
    const pendingInvoicesBal = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
    const pendingPaymentsTotal = Math.max(pendingPurchasesBal, pendingInvoicesBal);

    const advanceBalanceTotal = purchases.reduce((acc, p) => acc + (p.advancePaid || 0), 0);

    const activeProjectsCount = clients.filter(
      (c) =>
        c.pipelineStage === 'Work Started' ||
        c.pipelineStage === 'Work in Progress' ||
        c.pipelineStage === 'Advance Received'
    ).length;

    const pendingQuotationsCount = quotations.filter(
      (q) => q.status === 'Sent' || q.status === 'Draft' || q.status === 'Negotiation'
    ).length;

    const acceptedQuotationsCount = quotations.filter((q) => q.status === 'Accepted').length;

    const upcomingProjectValue = upcomingClients.reduce((acc, c) => acc + (c.estimatedValue || 0), 0);

    const rejoyClient = clients.find((c) => c.name.toLowerCase().includes('rejoy solar'));
    const rejoyPurchases = purchases.filter((p) => rejoyClient && p.clientId === rejoyClient.id);
    const rejoyBilled = rejoyPurchases.reduce((acc, p) => acc + p.grandTotal, 0);
    const rejoyPayments = payments.filter((p) => rejoyClient && p.clientId === rejoyClient.id);
    const rejoyPaid = rejoyPayments.reduce((acc, p) => acc + p.amount, 0);
    const rejoySolarOutstanding = Math.max(0, rejoyBilled - rejoyPaid);

    return {
      totalClients,
      currentClientsCount,
      upcomingClientsCount,
      activeClients,
      archivedClientsCount,
      newClients,
      returningClients,
      oldClients,
      renewalDueCount,
      renewalOverdueCount,
      pendingPaymentsTotal,
      advanceBalanceTotal,
      totalRevenue,
      thisMonthRevenue,
      totalExpenses,
      thisMonthExpenses,
      netProfit,
      activeProjectsCount,
      pendingQuotationsCount,
      acceptedQuotationsCount,
      upcomingProjectValue,
      rejoySolarOutstanding,
    };
  }, [clients, renewals, payments, expenses, purchases, invoices, quotations]);

  // --------------------------------------------------------------------------
  // BACKUP & RESTORE
  // --------------------------------------------------------------------------
  const exportAllDataJSON = async () => {
    try {
      const res = await api.exportDatabase();
      const payload = res.data || {
        version: '6.0',
        exportedAt: new Date().toISOString(),
        companySettings,
        clients,
        purchases,
        payments,
        renewals,
        quotations,
        invoices,
        expenses,
        digitalAssets,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `klyia_db_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Database exported successfully.', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export database.', 'error');
    }
  };

  const importAllDataJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      api.importDatabase(parsed)
        .then(() => {
          showToast('Database imported and synced successfully.', 'success');
          loadAllDataFromDatabase();
        })
        .catch((err) => {
          console.error('Import error:', err);
          showToast('Failed to import database.', 'error');
        });
      return true;
    } catch (e) {
      console.error('Failed to parse backup JSON:', e);
      return false;
    }
  };

  const resetToSampleData = () => {
    api.resetSampleData()
      .then(() => {
        showToast('All business data has been permanently cleared and reset to fresh state.', 'success');
        loadAllDataFromDatabase();
      })
      .catch((err) => {
        console.error('Failed to reset data:', err);
        showToast('Error resetting database.', 'error');
      });
  };

  const clearAllData = async () => {
    try {
      await api.purgeDatabase();
      setClients([]);
      setPurchases([]);
      setPayments([]);
      setRenewals([]);
      setQuotations([]);
      setInvoices([]);
      setExpenses([]);
      setDigitalAssets([]);
      setActivityLogs([]);
      setReadNotifications([]);
      await loadAllDataFromDatabase();
      showToast('All transactional records and business data permanently cleared from database.', 'success');
    } catch (err) {
      console.error('Failed to purge database:', err);
      showToast('Error clearing database records.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentTab,
        setCurrentTab,
        selectedClientId,
        setSelectedClientId,
        selectedQuotationId,
        setSelectedQuotationId,
        selectedInvoiceId,
        setSelectedInvoiceId,
        companySettings,
        updateCompanySettings,
        clients,
        addClient,
        updateClient,
        deleteClient,
        archiveClient,
        restoreClient,
        getClientRelatedRecordsCount,
        purchases,
        addPurchase,
        updatePurchase,
        deletePurchase,
        payments,
        addPayment,
        deletePayment,
        renewals,
        addRenewal,
        updateRenewal,
        deleteRenewal,
        renewNow,
        markReminderSent,
        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        convertQuotationToInvoice,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordInvoicePayment,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        addExpenseCategory,
        deleteExpenseCategory,
        digitalAssets,
        addDigitalAsset,
        updateDigitalAsset,
        deleteDigitalAsset,
        activityLogs,
        logActivity,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        searchQuery,
        setSearchQuery,
        toasts,
        showToast,
        dismissToast,
        dbStatus,
        refreshDbStatus,
        isLoadingFromDb,
        exportAllDataJSON,
        importAllDataJSON,
        resetToSampleData,
        clearAllData,
        metrics,
        getClientFinancials,
        isAuthenticated,
        isCheckingAuth,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
