import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Sparkles,
  Server,
  Info,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';

export const LoginPage: React.FC = () => {
  const { login, companySettings } = useApp();

  // Mode: 'login' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');

  // Login Form State
  const [identifier, setIdentifier] = useState('klyiatechnology@gmail.com');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{
    success: boolean;
    smtpConfigured?: boolean;
    message?: string;
    error?: string;
    recoveryInstructions?: string;
  } | null>(null);

  // Reset Password State
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(false);
  const [tokenVerified, setTokenVerified] = useState<boolean | null>(null);
  const [tokenMaskedEmail, setTokenMaskedEmail] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Detect Reset Token in URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const tokenFromUrl = searchParams.get('token') || hashParams.get('token');

    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setAuthMode('reset');
      verifyToken(tokenFromUrl);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify || tokenToVerify.trim().length < 16) {
      setTokenVerified(false);
      return;
    }
    setTokenVerifying(true);
    setResetError(null);
    try {
      const res = await api.verifyResetToken(tokenToVerify.trim());
      if (res?.success && res.valid) {
        setTokenVerified(true);
        setTokenMaskedEmail(res.emailMasked || null);
      } else {
        setTokenVerified(false);
        setResetError(res?.error || 'Password reset link is invalid or expired.');
      }
    } catch (err: any) {
      setTokenVerified(false);
      setResetError(err.message || 'Invalid or expired password reset link.');
    } finally {
      setTokenVerifying(false);
    }
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!identifier.trim()) {
      setLoginError('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginLoading(true);
    try {
      const result = await login(identifier.trim(), password, rememberMe);
      if (!result.success) {
        setLoginError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Network error while attempting to log in.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 2. Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotResult(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotResult({
        success: false,
        error: 'Please enter a valid email address.',
      });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotResult(res);
    } catch (err: any) {
      setForgotResult({
        success: false,
        error: err.message || 'Failed to submit recovery request.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // 3. Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetToken.trim()) {
      setResetError('Please enter the reset token.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.resetPassword(resetToken.trim(), newPassword);
      if (res.success) {
        setResetSuccess(res.message || 'Password successfully updated! You can now log in.');
        // Set identifier for convenience
        if (forgotEmail) setIdentifier(forgotEmail);
      } else {
        setResetError(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Background Decorative Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Company Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-xl shadow-cyan-900/40 mb-4 border border-cyan-400/30">
            <span className="font-extrabold text-2xl tracking-wider">KT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Klyia Technology
          </h1>
          <p className="text-sm font-medium text-cyan-300/80 mt-1">
            Client & Business Management CRM
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/20 p-6 sm:p-8 transition-all">
          {/* ========================================================= */}
          {/* VIEW 1: LOGIN FORM                                       */}
          {/* ========================================================= */}
          {authMode === 'login' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Sign In to CRM</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your administrator or staff credentials to proceed.
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block mb-0.5">Authentication Error</span>
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email / Username Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoComplete="username email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. klyiatechnology@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Field with Show/Hide toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setForgotEmail(identifier.includes('@') ? identifier : '');
                        setForgotResult(null);
                      }}
                      className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Remember Me</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    30 days active session
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loginLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to CRM</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Initial Admin Note */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-slate-500 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700">Administrator Notice:</strong> Use initial email{' '}
                  <code className="text-cyan-800 font-bold bg-slate-100 px-1 py-0.5 rounded">
                    klyiatechnology@gmail.com
                  </code>{' '}
                  and the initial setup password.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: FORGOT PASSWORD                                   */}
          {/* ========================================================= */}
          {authMode === 'forgot' && (
            <div>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setForgotResult(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 mb-2 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
                <h2 className="text-lg font-bold text-slate-900">Reset Your Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered CRM email address to receive password recovery instructions.
                </p>
              </div>

              {/* Result Notifications */}
              {forgotResult && (
                <div
                  className={`mb-5 p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                    forgotResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : forgotResult.smtpConfigured === false
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {forgotResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : forgotResult.smtpConfigured === false ? (
                      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1.5">
                      <div className="font-bold">
                        {forgotResult.success
                          ? 'Recovery Request Dispatched'
                          : forgotResult.smtpConfigured === false
                          ? 'Email Delivery Service Incomplete'
                          : 'Recovery Error'}
                      </div>
                      <p>{forgotResult.message || forgotResult.error}</p>
                      {forgotResult.recoveryInstructions && (
                        <div className="mt-2 pt-2 border-t border-amber-200/80 text-[11px] font-medium text-amber-800 bg-amber-100/40 p-2.5 rounded-lg">
                          <strong>Administrator-Assisted Recovery Method:</strong>
                          <p className="mt-1">{forgotResult.recoveryInstructions}</p>
                          <p className="mt-1 font-mono text-[10px] text-slate-700">
                            Required environment variables on Hostinger: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="klyiatechnology@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {forgotLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Sending Recovery Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Instructions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Already have a token link */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Already have a recovery token?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset');
                    setResetError(null);
                  }}
                  className="font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                >
                  Enter Token
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: RESET PASSWORD FORM                               */}
          {/* ========================================================= */}
          {authMode === 'reset' && (
            <div>
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setResetError(null);
                    setResetSuccess(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 mb-2 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
                <h2 className="text-lg font-bold text-slate-900">Enter New Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create a new secure password for your Klyia Technology CRM account.
                </p>
              </div>

              {resetError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{resetError}</div>
                </div>
              )}

              {resetSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Password Changed Successfully!
                  </div>
                  <p>{resetSuccess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setPassword('');
                      setResetSuccess(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  {/* Token Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Password Reset Token
                      </label>
                      {tokenVerifying && (
                        <span className="text-[10px] text-cyan-600 animate-pulse">
                          Verifying token...
                        </span>
                      )}
                      {tokenVerified === true && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Valid Token {tokenMaskedEmail ? `(${tokenMaskedEmail})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => {
                          setResetToken(e.target.value);
                          if (e.target.value.length >= 32) {
                            verifyToken(e.target.value);
                          }
                        }}
                        onBlur={() => {
                          if (resetToken.length >= 16) verifyToken(resetToken);
                        }}
                        placeholder="Paste single-use recovery token"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-xl shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {resetLoading ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Save New Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 text-center text-slate-400 text-[11px] flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            MySQL Persistent Auth
          </span>
        </div>
      </div>
    </div>
  );
};
