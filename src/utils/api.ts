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
} from '../types';

export interface DatabaseStatus {
  connected: boolean;
  type: 'mysql' | 'server_persistent';
  host?: string;
  database?: string;
  message: string;
  counts: {
    clients: number;
    purchases: number;
    quotations: number;
    invoices: number;
    payments: number;
    renewals: number;
    expenses: number;
    assets: number;
    logs: number;
  };
}

interface AuthState {
  token: string | null;
  role: string;
  email: string;
  userName: string;
}

const authState: AuthState = {
  token: localStorage.getItem('klyia_auth_token'),
  role: localStorage.getItem('klyia_auth_role') || 'Admin',
  email: localStorage.getItem('klyia_auth_email') || '',
  userName: localStorage.getItem('klyia_auth_name') || '',
};

export function getStoredAuthToken(): string | null {
  return authState.token || localStorage.getItem('klyia_auth_token');
}

export function setApiAuth(role: string, email: string, token?: string, name?: string) {
  authState.role = role;
  authState.email = email;
  if (name) {
    authState.userName = name;
    localStorage.setItem('klyia_auth_name', name);
  }
  if (token) {
    authState.token = token;
    localStorage.setItem('klyia_auth_token', token);
  }
  localStorage.setItem('klyia_auth_role', role);
  localStorage.setItem('klyia_auth_email', email);
}

export function clearApiAuth() {
  authState.token = null;
  authState.email = '';
  authState.userName = '';
  authState.role = 'Admin';
  localStorage.removeItem('klyia_auth_token');
  localStorage.removeItem('klyia_auth_role');
  localStorage.removeItem('klyia_auth_email');
  localStorage.removeItem('klyia_auth_name');
}

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }
  if (authState.role) {
    headers['X-User-Role'] = authState.role;
  }
  if (authState.email) {
    headers['X-User-Email'] = authState.email;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Automatically send and receive HttpOnly session cookies
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    // Notify application of expired or invalid session
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('klyia:unauthorized'));
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Session expired or authentication required');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Authentication & Session
  login: (identifier: string, password: string, rememberMe = false) =>
    request<{
      success: boolean;
      token: string;
      expiresAt: number;
      user: { id: string; name: string; email: string; role: any };
      message?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, rememberMe }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{
      success: boolean;
      user: { id: string; name: string; email: string; role: any };
    }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{
      success: boolean;
      smtpConfigured: boolean;
      message?: string;
      error?: string;
      recoveryInstructions?: string;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetToken: (token: string) =>
    request<{
      success: boolean;
      valid: boolean;
      emailMasked?: string;
      error?: string;
    }>(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean; message: string; error?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  getAuthStatus: () =>
    request<{
      success: boolean;
      smtpConfigured: boolean;
      initialAdminConfigured: boolean;
      adminEmail: string;
    }>('/auth/status'),

  // Database status & backup
  getDatabaseStatus: () => request<{ success: boolean; status: DatabaseStatus }>('/database/status'),
  exportDatabase: () => request<{ success: boolean; data: any }>('/database/export'),
  importDatabase: (data: any) =>
    request<{ success: boolean; message: string }>('/database/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetSampleData: () =>
    request<{ success: boolean; message: string }>('/database/reset-sample', {
      method: 'POST',
    }),

  // Clients
  getClients: (includeArchived = false) =>
    request<{ success: boolean; clients: Client[] }>(`/clients?includeArchived=${includeArchived}`),
  createClient: (client: Partial<Client>) =>
    request<{ success: boolean; client: Client }>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    }),
  updateClient: (id: string, updates: Partial<Client>) =>
    request<{ success: boolean; client: Client }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  archiveClient: (id: string) =>
    request<{ success: boolean; message: string }>(`/clients/${id}/archive`, {
      method: 'POST',
    }),
  restoreClient: (id: string) =>
    request<{ success: boolean; message: string }>(`/clients/${id}/restore`, {
      method: 'POST',
    }),
  deleteClient: (id: string) =>
    request<{ success: boolean; message: string }>(`/clients/${id}`, {
      method: 'DELETE',
    }),

  // Purchases
  getPurchases: () => request<{ success: boolean; purchases: PurchaseRecord[] }>('/purchases'),
  createPurchase: (purchase: Partial<PurchaseRecord>) =>
    request<{ success: boolean; purchase: PurchaseRecord }>('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    }),
  updatePurchase: (id: string, updates: Partial<PurchaseRecord>) =>
    request<{ success: boolean; purchase: PurchaseRecord }>(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deletePurchase: (id: string) =>
    request<{ success: boolean; message: string }>(`/purchases/${id}`, {
      method: 'DELETE',
    }),

  // Quotations
  getQuotations: () => request<{ success: boolean; quotations: Quotation[] }>('/quotations'),
  createQuotation: (quotation: Partial<Quotation>) =>
    request<{ success: boolean; quotation: Quotation }>('/quotations', {
      method: 'POST',
      body: JSON.stringify(quotation),
    }),
  updateQuotation: (id: string, updates: Partial<Quotation>) =>
    request<{ success: boolean; quotation: Quotation }>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteQuotation: (id: string) =>
    request<{ success: boolean; message: string }>(`/quotations/${id}`, {
      method: 'DELETE',
    }),

  // Invoices
  getInvoices: () => request<{ success: boolean; invoices: Invoice[] }>('/invoices'),
  createInvoice: (invoice: Partial<Invoice>) =>
    request<{ success: boolean; invoice: Invoice }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    }),
  updateInvoice: (id: string, updates: Partial<Invoice>) =>
    request<{ success: boolean; invoice: Invoice }>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteInvoice: (id: string) =>
    request<{ success: boolean; message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    }),

  // Payments
  getPayments: () => request<{ success: boolean; payments: PaymentRecord[] }>('/payments'),
  createPayment: (payment: Partial<PaymentRecord>) =>
    request<{ success: boolean; payment: PaymentRecord }>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    }),
  deletePayment: (id: string) =>
    request<{ success: boolean; message: string }>(`/payments/${id}`, {
      method: 'DELETE',
    }),

  // Renewals
  getRenewals: () => request<{ success: boolean; renewals: RenewalRecord[] }>('/renewals'),
  createRenewal: (renewal: Partial<RenewalRecord>) =>
    request<{ success: boolean; renewal: RenewalRecord }>('/renewals', {
      method: 'POST',
      body: JSON.stringify(renewal),
    }),
  updateRenewal: (id: string, updates: Partial<RenewalRecord>) =>
    request<{ success: boolean; renewal: RenewalRecord }>(`/renewals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteRenewal: (id: string) =>
    request<{ success: boolean; message: string }>(`/renewals/${id}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: () => request<{ success: boolean; expenses: ExpenseRecord[] }>('/expenses'),
  createExpense: (expense: Partial<ExpenseRecord>) =>
    request<{ success: boolean; expense: ExpenseRecord }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) =>
    request<{ success: boolean; expense: ExpenseRecord }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteExpense: (id: string) =>
    request<{ success: boolean; message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Digital Assets
  getDigitalAssets: () => request<{ success: boolean; assets: DigitalAsset[] }>('/assets'),
  createDigitalAsset: (asset: Partial<DigitalAsset>) =>
    request<{ success: boolean; asset: DigitalAsset }>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    }),
  updateDigitalAsset: (id: string, updates: Partial<DigitalAsset>) =>
    request<{ success: boolean; asset: DigitalAsset }>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteDigitalAsset: (id: string) =>
    request<{ success: boolean; message: string }>(`/assets/${id}`, {
      method: 'DELETE',
    }),

  // Settings
  getSettings: () => request<{ success: boolean; settings: CompanySettings }>('/settings'),
  updateSettings: (settings: Partial<CompanySettings>) =>
    request<{ success: boolean; settings: CompanySettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Activity Logs
  getLogs: () => request<{ success: boolean; logs: ActivityLog[] }>('/activity-logs'),
  createLog: (log: Partial<ActivityLog>) =>
    request<{ success: boolean; log: ActivityLog }>('/activity-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),
};
