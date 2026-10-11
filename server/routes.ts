import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db';
import {
  authenticateUser,
  requireRoles,
  createSession,
  revokeSession,
  revokeAllUserSessions,
  comparePassword,
  hashPassword,
  hashToken,
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginFailure,
  checkForgotRateLimit,
  isSmtpConfigured,
  sendPasswordResetEmail,
  AuthenticatedRequest,
} from './auth';

export const apiRouter = Router();

// ==========================================
// AUTHENTICATION & SESSION MANAGEMENT
// ==========================================

// Helper to mask email for security
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

// 1. User Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, email, username, password, rememberMe } = req.body;
    const loginUser = (identifier || email || username || '').trim();

    if (!loginUser || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your email address/username and password.',
      });
    }

    // Rate limiting check
    const rateCheck = checkLoginRateLimit(loginUser);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Please wait ${rateCheck.waitMinutes || 15} minutes before trying again.`,
      });
    }

    // Query user in MySQL
    const user = await db.getUserByIdentifier(loginUser);
    if (!user) {
      recordLoginFailure(loginUser);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email/username and password.',
      });
    }

    if (user.status === 'Inactive' || user.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently inactive or suspended. Please contact the administrator.',
      });
    }

    // Verify bcrypt hash
    const passwordValid = comparePassword(password, user.password_hash);
    if (!passwordValid) {
      recordLoginFailure(loginUser);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email/username and password.',
      });
    }

    // Successful login -> clear rate limit
    resetLoginFailure(loginUser);

    // Create session backed by MySQL
    const { token, expiresAt, cookieOptions } = await createSession(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      req,
      !!rememberMe
    );

    // Set secure HTTP-only cookie
    res.cookie('klyia_session', token, cookieOptions);

    // Log login activity
    try {
      await db.createLog({
        action: 'User Logged In',
        details: `Successful login for ${user.email} (${user.role})`,
        userName: user.name,
        userRole: user.role,
        entityType: 'Settings',
      });
    } catch {
      // Non-fatal
    }

    return res.json({
      success: true,
      token,
      expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Logged in successfully',
    });
  } catch (err: any) {
    console.error('[Auth Route] Login error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error during login' });
  }
});

// 2. User Logout
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const cookieToken = req.cookies?.['klyia_session'];
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = cookieToken || bearerToken;

    if (token) {
      await revokeSession(token);
    }

    res.clearCookie('klyia_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Current Authenticated User Check (/auth/me)
apiRouter.get('/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// 4. Forgot Password — Request Single-Use Reset Token
apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || '').trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (!checkForgotRateLimit(clientIp) || !checkForgotRateLimit(targetEmail)) {
      return res.status(429).json({
        success: false,
        error: 'Too many password reset requests. Please wait 15 minutes before requesting another reset.',
      });
    }

    const smtpReady = isSmtpConfigured();

    if (!smtpReady) {
      // Clearly report incomplete setup as required
      return res.json({
        success: false,
        smtpConfigured: false,
        error:
          'Automated email delivery is not configured on this server. SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM) are required for automated email delivery.',
        recoveryInstructions:
          'Administrator-Assisted Recovery: If you are the system administrator, set the SMTP configuration or configure ADMIN_PASSWORD in your Hostinger environment / hPanel.',
      });
    }

    // Look up user
    const user = await db.getUserByIdentifier(targetEmail);
    if (user && user.status === 'Active') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await db.createPasswordResetRecord(user.email, tokenHash, expiresAt);

      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const baseUrl = process.env.APP_URL || `${proto}://${host}`;
      const resetUrl = `${baseUrl}/#reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(user.email, resetUrl, user.name);

      try {
        await db.createLog({
          action: 'Password Reset Dispatched',
          details: `Password recovery link dispatched to ${user.email}`,
          userName: user.name,
          userRole: user.role,
          entityType: 'Settings',
        });
      } catch {
        // Non-fatal
      }
    }

    // Always return generic response to avoid email enumeration
    res.json({
      success: true,
      smtpConfigured: true,
      message:
        'If that email address is registered with Klyia CRM, password recovery instructions with a single-use link have been dispatched to your inbox. The recovery link expires in 15 minutes.',
    });
  } catch (err: any) {
    console.error('[Forgot Password Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Verify Password Reset Token
apiRouter.get('/auth/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string || '').trim();
    if (!token || token.length < 16) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Invalid or missing password reset token.',
      });
    }

    const tokenHash = hashToken(token);
    const resetRecord = await db.getPasswordResetByTokenHash(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'This password reset link is invalid, has already been used, or has expired (validity is 15 minutes). Please request a new link.',
      });
    }

    res.json({
      success: true,
      valid: true,
      emailMasked: maskEmail(resetRecord.email),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Reset Password with Single-Use Token
apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const cleanToken = (token || '').trim();
    const cleanPassword = (newPassword || '').trim();

    if (!cleanToken) {
      return res.status(400).json({
        success: false,
        error: 'Password reset token is missing.',
      });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      });
    }

    const tokenHash = hashToken(cleanToken);
    const resetRecord = await db.getPasswordResetByTokenHash(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'This password reset link is invalid, has already been used, or has expired. Please request a new link.',
      });
    }

    // Hash new password using bcrypt
    const passwordHash = hashPassword(cleanPassword);

    // Save to MySQL
    await db.updateUserPassword(resetRecord.email, passwordHash);

    // Invalidate reset token
    await db.markPasswordResetUsed(resetRecord.id);

    // Invalidate active sessions for this user
    const user = await db.getUserByIdentifier(resetRecord.email);
    if (user) {
      await revokeAllUserSessions(user.id);
    }

    // Log activity
    try {
      await db.createLog({
        action: 'Password Changed',
        details: `Password was successfully updated for ${resetRecord.email}`,
        userName: user?.name || 'User',
        userRole: user?.role || 'Admin',
        entityType: 'Settings',
      });
    } catch {
      // Non-fatal
    }

    res.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('[Reset Password Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Auth & SMTP Status
apiRouter.get('/auth/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    smtpConfigured: isSmtpConfigured(),
    initialAdminConfigured: true,
    adminEmail: 'klyiatechnology@gmail.com',
  });
});

// ==========================================
// DATABASE STATUS & UTILITIES (RESTRICTED TO ADMIN)
// ==========================================
apiRouter.get('/database/status', async (req: Request, res: Response) => {
  try {
    const status = await db.getStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get(
  '/database/export',
  authenticateUser,
  requireRoles(['Admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await db.exportAll();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

apiRouter.post(
  '/database/import',
  authenticateUser,
  requireRoles(['Admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await db.importAll(req.body);
      if (!success) {
        return res.status(400).json({ success: false, error: 'Invalid backup format' });
      }
      res.json({ success: true, message: 'Database restored successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

apiRouter.post(
  '/database/reset-sample',
  authenticateUser,
  requireRoles(['Admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.resetSample();
      res.json({ success: true, message: 'Database reset to Klyia Technology sample data' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// CLIENTS
// ==========================================
apiRouter.get('/clients', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const clients = await db.getClients(includeArchived);
    res.json({ success: true, clients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/clients/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await db.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/clients', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await db.createClient(req.body);
    await db.createLog({
      action: 'Client Created',
      details: `Created client ${client.name} (${client.clientId})`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Client',
      entityId: client.id,
    });
    res.status(201).json({ success: true, client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/clients/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await db.updateClient(req.params.id, req.body);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    await db.createLog({
      action: 'Client Updated',
      details: `Updated details for ${client.name} (${client.clientId})`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Client',
      entityId: client.id,
    });
    res.json({ success: true, client });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/clients/:id/archive', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await db.archiveClient(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, message: 'Client archived' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/clients/:id/restore', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await db.restoreClient(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, message: 'Client restored' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/clients/:id',
  authenticateUser,
  requireRoles(['Admin', 'Manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await db.deleteClient(req.params.id);
      res.json({ success, message: 'Client and associated records deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// PURCHASES (PROJECTS / SERVICES)
// ==========================================
apiRouter.get('/purchases', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const purchases = await db.getPurchases();
    res.json({ success: true, purchases });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/purchases', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const purchase = await db.createPurchase(req.body);

    // If advance paid > 0, automatically record payment receipt
    if (purchase.advancePaid > 0) {
      await db.createPayment({
        clientId: purchase.clientId,
        clientName: purchase.clientName,
        paymentDate: purchase.purchaseDate,
        amount: purchase.advancePaid,
        paymentMode: (purchase.paymentMode as any) || 'Bank Transfer',
        referenceNo: `ADV-${purchase.purchaseId}`,
        notes: `Advance payment for ${purchase.customServiceTitle || purchase.serviceType}`,
        againstType: 'Purchase',
        againstId: purchase.id,
        againstTitle: purchase.customServiceTitle || purchase.serviceType,
      });
    }

    // If renewal date given, automatically add to renewals
    if (purchase.renewalDate) {
      await db.createRenewal({
        clientId: purchase.clientId,
        clientName: purchase.clientName,
        serviceName: purchase.customServiceTitle || purchase.serviceType,
        domainOrAsset: '',
        provider: 'Klyia Technology',
        purchaseDate: purchase.purchaseDate,
        expiryDate: purchase.renewalDate,
        renewalDate: purchase.renewalDate,
        renewalAmount: purchase.grandTotal,
        reminderDays: 30,
        status: 'Upcoming',
        notes: `Auto-generated from purchase ${purchase.purchaseId}`,
      });
    }

    // Update client last purchase date & renewal date
    await db.updateClient(purchase.clientId, {
      lastPurchaseDate: purchase.purchaseDate,
      nextRenewalDate: purchase.renewalDate,
      status: 'Active',
    });

    await db.createLog({
      action: 'Purchase Added',
      details: `Recorded purchase of ₹${purchase.grandTotal} for ${purchase.clientName}`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Client',
      entityId: purchase.clientId,
    });

    res.status(201).json({ success: true, purchase });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/purchases/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const purchase = await db.updatePurchase(req.params.id, req.body);
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    res.json({ success: true, purchase });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/purchases/:id',
  authenticateUser,
  requireRoles(['Admin', 'Manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deletePurchase(req.params.id);
      res.json({ success: true, message: 'Purchase deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// QUOTATIONS
// ==========================================
apiRouter.get('/quotations', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotations = await db.getQuotations();
    res.json({ success: true, quotations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/quotations', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await db.createQuotation(req.body);
    await db.createLog({
      action: 'Quotation Created',
      details: `Created quotation ${quotation.quotationNumber} for ${quotation.clientName} (₹${quotation.grandTotal})`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Quotation',
      entityId: quotation.id,
    });
    res.status(201).json({ success: true, quotation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/quotations/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await db.updateQuotation(req.params.id, req.body);
    if (!quotation) return res.status(404).json({ success: false, error: 'Quotation not found' });
    res.json({ success: true, quotation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/quotations/:id',
  authenticateUser,
  requireRoles(['Admin', 'Manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deleteQuotation(req.params.id);
      res.json({ success: true, message: 'Quotation deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// INVOICES
// ==========================================
apiRouter.get('/invoices', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = await db.getInvoices();
    res.json({ success: true, invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/invoices', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await db.createInvoice(req.body);
    await db.createLog({
      action: 'Invoice Created',
      details: `Created tax invoice ${invoice.invoiceNumber} for ${invoice.clientName} (₹${invoice.grandTotal})`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Invoice',
      entityId: invoice.id,
    });
    res.status(201).json({ success: true, invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/invoices/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await db.updateInvoice(req.params.id, req.body);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/invoices/:id',
  authenticateUser,
  requireRoles(['Admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deleteInvoice(req.params.id);
      res.json({ success: true, message: 'Invoice deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// PAYMENTS & RECEIPTS
// ==========================================
apiRouter.get('/payments', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await db.getPayments();
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payments', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = await db.createPayment(req.body);
    await db.createLog({
      action: 'Payment Added',
      details: `Received ₹${payment.amount} from ${payment.clientName} via ${payment.paymentMode} (${payment.receiptNo})`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Payment',
      entityId: payment.id,
    });
    res.status(201).json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/payments/:id',
  authenticateUser,
  requireRoles(['Admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deletePayment(req.params.id);
      res.json({ success: true, message: 'Payment deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// RENEWALS
// ==========================================
apiRouter.get('/renewals', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const renewals = await db.getRenewals();
    res.json({ success: true, renewals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/renewals', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const renewal = await db.createRenewal(req.body);
    res.status(201).json({ success: true, renewal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/renewals/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const renewal = await db.updateRenewal(req.params.id, req.body);
    if (!renewal) return res.status(404).json({ success: false, error: 'Renewal not found' });
    res.json({ success: true, renewal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/renewals/:id',
  authenticateUser,
  requireRoles(['Admin', 'Manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deleteRenewal(req.params.id);
      res.json({ success: true, message: 'Renewal deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// EXPENSES
// ==========================================
apiRouter.get('/expenses', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const expenses = await db.getExpenses();
    res.json({ success: true, expenses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/expenses', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const expense = await db.createExpense(req.body);
    await db.createLog({
      action: 'Expense Added',
      details: `Logged ₹${expense.amount} under ${expense.category} (${expense.vendor})`,
      userName: req.user?.name,
      userRole: req.user?.role,
      entityType: 'Expense',
      entityId: expense.id,
    });
    res.status(201).json({ success: true, expense });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/expenses/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const expense = await db.updateExpense(req.params.id, req.body);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/expenses/:id',
  authenticateUser,
  requireRoles(['Admin', 'Manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deleteExpense(req.params.id);
      res.json({ success: true, message: 'Expense deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// DIGITAL ASSETS
// ==========================================
apiRouter.get('/assets', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assets = await db.getDigitalAssets();
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/assets', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const asset = await db.createDigitalAsset(req.body);
    res.status(201).json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/assets/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const asset = await db.updateDigitalAsset(req.params.id, req.body);
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
    res.json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete(
  '/assets/:id',
  authenticateUser,
  requireRoles(['Admin', 'Manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await db.deleteDigitalAsset(req.params.id);
      res.json({ success: true, message: 'Asset deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// SETTINGS (RESTRICTED TO ADMIN)
// ==========================================
apiRouter.get('/settings', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put(
  '/settings',
  authenticateUser,
  requireRoles(['Admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await db.updateSettings(req.body);
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ==========================================
// ACTIVITY LOGS
// ==========================================
apiRouter.get('/activity-logs', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await db.getLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/activity-logs', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const log = await db.createLog(req.body);
    res.status(201).json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
