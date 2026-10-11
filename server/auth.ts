import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../src/types';
import { db } from './db';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// -------------------------------------------------------------
// RATE LIMITING (In-Memory sliding window)
// -------------------------------------------------------------
interface AttemptRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const forgotAttempts = new Map<string, AttemptRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const MAX_FORGOT_ATTEMPTS = 5;
const FORGOT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitMinutes?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) return { allowed: true };

  if (now > record.resetAt) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingMs = record.resetAt - now;
    const waitMinutes = Math.ceil(remainingMs / 60000);
    return { allowed: false, waitMinutes };
  }

  return { allowed: true };
}

export function recordLoginFailure(identifier: string): void {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_LOCK_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

export function resetLoginFailure(identifier: string): void {
  loginAttempts.delete(identifier.toLowerCase().trim());
}

export function checkForgotRateLimit(ipOrEmail: string): boolean {
  const key = ipOrEmail.toLowerCase().trim();
  const now = Date.now();
  const record = forgotAttempts.get(key);

  if (!record || now > record.resetAt) {
    forgotAttempts.set(key, { count: 1, resetAt: now + FORGOT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_FORGOT_ATTEMPTS) {
    return false;
  }

  record.count += 1;
  return true;
}

// -------------------------------------------------------------
// HASHING & CRYPTO UTILITIES
// -------------------------------------------------------------
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// -------------------------------------------------------------
// SESSION MANAGEMENT (MySQL Backed for Persistence Across Restarts)
// -------------------------------------------------------------
export async function createSession(
  user: { id: string; name: string; email: string; role: UserRole },
  req?: Request,
  rememberMe: boolean = false
): Promise<{ token: string; expiresAt: number; cookieOptions: any }> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  const ttl = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 24 * 60 * 60 * 1000; // 24 hours

  const now = Date.now();
  const expiresAtMs = now + ttl;
  const expiresDate = new Date(expiresAtMs);

  const ipAddress = (req?.headers['x-forwarded-for'] as string) || req?.socket?.remoteAddress || '';
  const userAgent = (req?.headers['user-agent'] as string) || '';

  await db.createSessionRecord({
    id: `sess-${now}-${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    tokenHash,
    expiresAt: expiresDate,
    ipAddress,
    userAgent,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'lax' : 'lax') as 'lax',
    maxAge: ttl,
    path: '/',
  };

  return { token: rawToken, expiresAt: expiresAtMs, cookieOptions };
}

export async function getSession(rawToken: string): Promise<UserSession | null> {
  if (!rawToken || rawToken.length < 16) return null;
  const tokenHash = hashToken(rawToken);

  const sessionRow = await db.getSessionByTokenHash(tokenHash);
  if (!sessionRow) return null;

  return {
    userId: sessionRow.user_id,
    name: sessionRow.name,
    email: sessionRow.email,
    role: sessionRow.role as UserRole,
    token: rawToken,
    createdAt: 0,
    expiresAt: new Date(sessionRow.expires_at).getTime(),
  };
}

export async function revokeSession(rawToken: string): Promise<void> {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await db.deleteSessionByTokenHash(tokenHash);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  await db.deleteSessionsByUserId(userId);
}

// -------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// -------------------------------------------------------------
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check cookie first, then Bearer token
  const cookieToken = req.cookies?.['klyia_session'];
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to access Klyia Technology CRM.',
    });
  }

  try {
    const session = await getSession(token);
    if (!session) {
      // Clear invalid cookie
      res.clearCookie('klyia_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return res.status(401).json({
        success: false,
        error: 'Active session has expired or is invalid. Please log in again.',
      });
    }

    req.user = {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    };

    return next();
  } catch (err: any) {
    console.error('[Auth Middleware] Verification error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal authentication verification error occurred.',
    });
  }
}

// -------------------------------------------------------------
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// -------------------------------------------------------------
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No active user session.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to ${allowedRoles.join(' or ')}. Your active role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// SMTP & EMAIL PASSWORD RECOVERY
// -------------------------------------------------------------
export function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}

export function createMailTransporter() {
  if (!isSmtpConfigured()) return null;

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Compatibility for custom Hostinger SMTP setups
    },
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const transporter = createMailTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'SMTP service is not configured on the server.',
    };
  }

  const fromAddress = process.env.SMTP_FROM || `"Klyia Technology" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0e7490, #1e3a8a); padding: 32px 24px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 24px; font-size: 14px; line-height: 1.6; }
        .btn { display: inline-block; background-color: #0891b2; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .note { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 20px; }
        .footer { border-top: 1px solid #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Klyia Technology</h1>
          <p>Client & Business Management CRM</p>
        </div>
        <div class="content">
          <p>Hello <strong>${userName || 'User'}</strong>,</p>
          <p>We received a request to reset your password for your Klyia Technology CRM account.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </p>
          <p>If you prefer, you can also copy and paste the following recovery link into your browser:</p>
          <p style="word-break: break-all; font-family: monospace; font-size: 12px; color: #0284c7; background: #f8fafc; padding: 10px; border-radius: 6px;">${resetUrl}</p>
          <div class="note">
            ⚠️ <strong>Security Notice:</strong> This single-use reset link expires in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email or contact your CRM administrator immediately.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Klyia Technology. All rights reserved.<br>
          Automated security notification • Do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Klyia Technology CRM — Password Reset Request',
      text: `Hello ${userName},\n\nClick the following link to reset your Klyia Technology CRM password:\n${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[SMTP Mailer] Send error:', err);
    return { success: false, error: err.message };
  }
}
