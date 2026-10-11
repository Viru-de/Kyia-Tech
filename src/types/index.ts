export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface CompanySettings {
  companyName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  logoUrl?: string;
  quotationPrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  clientPrefix: string;
  quotationValidityDays: number;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  defaultGstPercent: number;
  quotationTerms: string[];
  serviceCategories: string[];
  expenseCategories: string[];
}

export type ClientType = 'NEW CLIENT' | 'OLD CLIENT' | 'RETURNING CLIENT';

export type ClientStatus =
  | 'New'
  | 'Active'
  | 'Pending'
  | 'Completed'
  | 'Renewal Due'
  | 'Overdue'
  | 'Inactive'
  | 'Upcoming Client'
  | 'Upcoming'
  | 'Archived';

export type PipelineStage =
  | 'New Lead'
  | 'Contacted'
  | 'Requirement Received'
  | 'Upcoming / Requirement / Project Discussion'
  | 'Upcoming'
  | 'Quotation Prepared'
  | 'Quotation Sent'
  | 'Follow-up'
  | 'Negotiation'
  | 'Confirmed'
  | 'Advance Received'
  | 'Work Started'
  | 'Work in Progress'
  | 'Work Completed'
  | 'Completed'
  | 'Payment Pending'
  | 'Renewal Due'
  | 'Renewed'
  | 'Lost';

export interface ClientServiceItem {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  status?: string;
}

export interface Client {
  id: string;
  clientId: string; // e.g., KLY-CLI-001
  name: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  gstin: string;
  pan: string;
  address: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  website: string;
  industry: string;
  clientType: ClientType;
  notes: string;
  dateAdded: string; // YYYY-MM-DD
  lastPurchaseDate?: string;
  nextRenewalDate?: string;
  status: ClientStatus;
  pipelineStage: PipelineStage;
  mapUrl?: string;
  assignedTo?: string;
  services?: ClientServiceItem[];
  projectTitle?: string;
  estimatedValue?: number;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export type ServiceType =
  | 'Website Development'
  | 'Web Application'
  | 'Domain'
  | 'Hosting'
  | 'Business Email'
  | 'SEO'
  | 'GEO/AEO'
  | 'Digital Marketing'
  | 'Social Media'
  | 'AI Chatbot'
  | 'AMC/Maintenance'
  | 'Custom Software'
  | 'Other';

export interface PurchaseRecord {
  id: string;
  purchaseId: string;
  clientId: string;
  clientName: string;
  purchaseDate: string;
  serviceType: ServiceType;
  customServiceTitle?: string;
  description: string;
  baseAmount: number;
  discount: number;
  gstApplicable: boolean;
  gstPercent: number;
  isInterstate: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  advancePaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  paymentMode: string;
  dueDate?: string;
  renewalDate?: string;
  notes?: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Card' | 'Other';

export interface PaymentRecord {
  id: string;
  receiptNo: string;
  clientId: string;
  clientName: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo: string;
  notes?: string;
  againstType: 'Quotation' | 'Invoice' | 'Purchase' | 'Direct Advance';
  againstId?: string;
  againstTitle?: string;
}

export type RenewalStatus =
  | 'Upcoming'
  | 'Due Soon'
  | 'Due Today'
  | 'Overdue'
  | 'Renewed'
  | 'Cancelled';

export interface RenewalRecord {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  domainOrAsset?: string;
  provider: string;
  purchaseDate: string;
  expiryDate: string;
  renewalDate: string;
  renewalAmount: number;
  reminderDays: number; // 7, 15, 30, 45, 60
  status: RenewalStatus;
  notes?: string;
  lastReminderSentDate?: string;
}

export interface QuotationItem {
  id: string;
  serviceName: string;
  description: string;
  qty: number;
  rate: number;
  discount: number;
  gstPercent: number;
  amount: number;
}

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Negotiation'
  | 'Accepted'
  | 'Rejected'
  | 'Converted to Invoice';

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  clientId: string;
  clientName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  gstPercent: number;
  isInterstate: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  notes: string;
  terms: string[];
  status: QuotationStatus;
}

export type InvoiceStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationNumber?: string;
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  clientName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  gstPercent: number;
  isInterstate: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentTerms: string;
  notes: string;
}

export type RecurringFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'Custom';

export interface ExpenseRecord {
  id: string;
  expenseId: string;
  date: string;
  category: string;
  customCategory?: string;
  description: string;
  vendor: string;
  amount: number;
  gstAmount: number;
  paymentMode: string;
  billInvoiceNumber?: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  nextDueDate?: string;
}

export type DigitalAssetProvider =
  | 'GoDaddy'
  | 'Hostinger'
  | 'Namecheap'
  | 'AWS'
  | 'Google Cloud'
  | 'Cloudflare'
  | 'DigitalOcean'
  | 'Other';

export interface DigitalAsset {
  id: string;
  clientId: string;
  clientName: string;
  provider: string;
  customProvider?: string;
  serviceType:
    | 'Domain'
    | 'Hosting'
    | 'Business Email'
    | 'SSL'
    | 'Server'
    | 'Software Subscription'
    | 'Other Digital Service';
  assetName: string; // e.g. example.com or VPS-Mumbai-01
  accountReference?: string;
  purchaseDate: string;
  expiryDate: string;
  renewalDate: string;
  costPrice: number;
  sellingPrice: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  entityType: 'Client' | 'Quotation' | 'Invoice' | 'Payment' | 'Renewal' | 'Expense' | 'Asset' | 'Settings';
  entityId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'renewal' | 'payment' | 'quotation' | 'expense' | 'general';
  priority: 'normal' | 'upcoming' | 'due_soon' | 'overdue';
  date: string;
  isRead: boolean;
  linkTab: string;
}

export interface ClientStatementEntry {
  date: string;
  description: string;
  reference: string;
  debit: number; // Invoiced / Billed
  credit: number; // Paid
  balance: number; // Running balance
}
