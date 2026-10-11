/**
 * Currency & Number Formatting using Indian Numbering System (Lakhs, Crores)
 */
export function formatINR(amount: number | null | undefined, showDecimals = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const rounded = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = rounded.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : (showDecimals ? '.00' : '');

  // Handle negative numbers
  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.slice(1);
  }

  // Indian currency formatting: last 3 digits, then groups of 2 digits
  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${formattedOthers},${lastThree}`;
  } else {
    result = integerPart;
  }

  return `${isNegative ? '-' : ''}₹${result}${decimalPart}`;
}

/**
 * Format Date to readable format (e.g., 15 Oct 2026)
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get difference in days from today (positive = in future, negative = overdue)
 */
export function getDaysDiff(targetDateStr: string | undefined): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Human readable days difference label
 */
export function getDaysDiffLabel(days: number): {
  label: string;
  variant: 'danger' | 'warning' | 'info' | 'success';
} {
  if (days < 0) {
    return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, variant: 'danger' };
  } else if (days === 0) {
    return { label: 'Due Today', variant: 'danger' };
  } else if (days === 1) {
    return { label: 'Due Tomorrow', variant: 'warning' };
  } else if (days <= 7) {
    return { label: `Due in ${days} days`, variant: 'warning' };
  } else if (days <= 30) {
    return { label: `Due in ${days} days`, variant: 'info' };
  } else {
    return { label: `Due in ${days} days`, variant: 'success' };
  }
}

/**
 * GST Calculation helper
 */
export function calculateGST(
  taxableAmount: number,
  gstPercent: number,
  isInterstate: boolean
): {
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
} {
  if (gstPercent <= 0 || taxableAmount <= 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalGst: 0, grandTotal: taxableAmount };
  }

  const totalGst = Number(((taxableAmount * gstPercent) / 100).toFixed(2));

  if (isInterstate) {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      totalGst,
      grandTotal: taxableAmount + totalGst,
    };
  } else {
    const halfGst = Number((totalGst / 2).toFixed(2));
    return {
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      totalGst,
      grandTotal: taxableAmount + totalGst,
    };
  }
}

/**
 * Pre-composed WhatsApp reminder message generator
 */
export function generateWhatsAppReminder(params: {
  clientName: string;
  serviceName: string;
  domainOrAsset?: string;
  renewalDate: string;
  amount: number;
  daysRemaining: number;
  companyName: string;
  companyPhone: string;
  upiId?: string;
}): string {
  const {
    clientName,
    serviceName,
    domainOrAsset,
    renewalDate,
    amount,
    daysRemaining,
    companyName,
    companyPhone,
    upiId,
  } = params;

  let urgency = '';
  if (daysRemaining < 0) {
    urgency = `⚠️ *URGENT: Service renewal is overdue by ${Math.abs(daysRemaining)} days.*`;
  } else if (daysRemaining === 0) {
    urgency = `⚠️ *REMINDER: Service renewal is due TODAY.*`;
  } else {
    urgency = `📅 *Renewal due in ${daysRemaining} days (${formatDate(renewalDate)}).*`;
  }

  const assetInfo = domainOrAsset ? `\n• *Domain / Asset:* ${domainOrAsset}` : '';
  const upiInfo = upiId ? `\n• *UPI ID for Instant Payment:* ${upiId}` : '';

  return `Dear ${clientName},

Greetings from *${companyName}*!

This is a gentle reminder regarding your upcoming service renewal:
• *Service:* ${serviceName}${assetInfo}
• *Due Date:* ${formatDate(renewalDate)}
• *Renewal Amount:* ${formatINR(amount)}
${urgency}

To ensure uninterrupted service and avoid downtime or domain expiry, kindly process the renewal at your earliest convenience.${upiInfo}

For any assistance or queries, feel free to call or WhatsApp us at *${companyPhone}*.

Best Regards,
*${companyName}*
Web • Software • Digital • AI Solutions
🌐 https://klyiatechnology.com/`;
}

/**
 * Generate WhatsApp payment reminder message
 */
export function generatePaymentReminder(params: {
  clientName: string;
  invoiceNo?: string;
  serviceTitle: string;
  balanceAmount: number;
  dueDate?: string;
  companyName: string;
  companyPhone: string;
  upiId?: string;
}): string {
  const { clientName, invoiceNo, serviceTitle, balanceAmount, dueDate, companyName, companyPhone, upiId } = params;
  const invText = invoiceNo ? ` against Invoice *#${invoiceNo}*` : '';
  const dueText = dueDate ? `\n• *Due Date:* ${formatDate(dueDate)}` : '';
  const upiText = upiId ? `\n• *UPI ID for payment:* ${upiId}` : '';

  return `Dear ${clientName},

Greetings from *${companyName}*!

We hope you are having a productive week. This is a friendly reminder regarding the pending balance payment${invText}:
• *Project / Service:* ${serviceTitle}
• *Outstanding Amount:* ${formatINR(balanceAmount)}${dueText}${upiText}

Kindly clear the balance to help us maintain smooth project deliveries and support. If the payment has already been initiated, please share the transaction reference with us.

Thank you for your business!

Warm Regards,
*${companyName}*
📞 ${companyPhone}
🌐 https://klyiatechnology.com/`;
}

/**
 * Open WhatsApp URL with clean phone formatting
 */
export function openWhatsAppChat(phone: string, text: string): void {
  // Strip non-digits
  let cleanPhone = phone.replace(/\D/g, '');
  // Default to India (+91) if 10 digits
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}

/**
 * Export table data to CSV file
 */
export function exportToCSV(filename: string, rows: (string | number)[][]): void {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        const str = String(val ?? '');
        if (str.search(/("|,|\n)/g) >= 0) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
