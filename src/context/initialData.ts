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

export const initialCompanySettings: CompanySettings = {
  companyName: 'Klyia Technology',
  tagline: 'Web • Software • Digital • AI Solutions',
  phone: '8296887643',
  whatsapp: '8296887643',
  email: 'klyiatechnology@gmail.com',
  website: 'https://klyiatechnology.com/',
  gstin: '22AVSPP4822G1ZF',
  pan: 'AVSPP4822G',
  address: 'Klyia Technology HQ',
  area: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '',
  country: 'India',
  bankName: 'HDFC Bank',
  accountHolder: 'Klyia Technology',
  accountNumber: '',
  ifscCode: '',
  branch: '',
  upiId: '8296887643@upi',
  logoUrl: '',
  quotationPrefix: 'KLY-QTN-2026-',
  invoicePrefix: 'KLY-INV-2026-',
  receiptPrefix: 'KLY-RCP-2026-',
  clientPrefix: 'KLY-CLI-',
  quotationValidityDays: 15,
  watermarkEnabled: true,
  watermarkText: 'KLYIA TECHNOLOGY',
  watermarkOpacity: 0.05,
  defaultGstPercent: 18,
  quotationTerms: [
    'Quotation validity is 15 days from the date of issue unless specified otherwise.',
    'Project and service commencement is subject to advance payment terms.',
    'Domain, hosting, third-party APIs, and cloud subscriptions are subject to vendor pricing and renewal schedules.',
    'GST and applicable statutory taxes are extra as per government regulations.',
    'Scope changes and additional features outside this approved quotation will be estimated and billed separately.',
    'Annual Maintenance Contract (AMC) & digital asset renewals are billed annually in advance.',
    'Final deliverables and server ownership credentials will be handed over upon full payment clearance.',
  ],
  serviceCategories: [
    'Solar ERP',
    'Website',
    'SEO',
    'GEO / AI',
    'Web Application',
    'Digital Marketing',
    'Hosting',
    'Domain',
    'Business Email',
    'AI Chatbot',
    'AMC/Maintenance',
    'Custom Software',
    'Other',
  ],
  expenseCategories: [
    'Electricity Bill',
    'Office Rent',
    'Hosting',
    'Internet Bill',
    'Hostinger Bill',
    'GoDaddy Bill',
    'Phone Recharge',
    'Software Subscription',
    'Domain Purchase',
    'Email Purchase',
    'Advertising',
    'Other Expenses',
  ],
};

// Fresh business state: Empty transactional and client records
export const initialClients: Client[] = [];
export const initialPurchases: PurchaseRecord[] = [];
export const initialPayments: PaymentRecord[] = [];
export const initialRenewals: RenewalRecord[] = [];
export const initialQuotations: Quotation[] = [];
export const initialInvoices: Invoice[] = [];
export const initialExpenses: ExpenseRecord[] = [];
export const initialDigitalAssets: DigitalAsset[] = [];
export const initialActivityLogs: ActivityLog[] = [];
