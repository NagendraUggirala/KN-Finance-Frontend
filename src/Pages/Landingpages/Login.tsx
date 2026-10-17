import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Shield,
  Smartphone,
  Check,
  User,
  Crown
} from 'lucide-react';
import {
  forgotPasswordApi,
  resendOtpApi,
  verifyOtpApi,
  resetPasswordApi,
  setSuperAdminSession,
  setAdminSession,
  setEmployeeSession
} from '../../lib/api';

export type UserRole = 'admin' | 'employee' | 'user' | 'super_admin' | 'superadmin';

type AuthView = 'signin' | 'request_otp' | 'verify_otp' | 'reset_password' | 'reset_success';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userName: string, role: UserRole) => void;
  onShowToast: (msg: string) => void;
  initialRole?: 'admin' | 'employee' | 'superadmin' | 'super_admin';
}

export const Login: React.FC<LoginProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const navigate = useNavigate();

  // Current modal view
  const [view, setView] = useState<AuthView>('signin');

  // Sign in state (Unified Login - no role selection required)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password & OTP verification state
  const [resetEmail, setResetEmail] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowSuccessMessage, setFlowSuccessMessage] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60s Resend OTP countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset to initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('signin');
      setLoginError(null);
      setFlowError(null);
      setFlowSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Quick fill helper for development/testing
  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setLoginError(null);
  };

  /**
   * Unified Login Handler:
   * Sends { email, password } to POST /api/auth/login.
   * Dynamically handles role-based redirection ('superadmin', 'admin', 'employee').
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = email.trim();
    if (!identifier) {
      setLoginError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Connect to unified login endpoint: POST http://localhost:5000/api/auth/login
      // Send both 'email' and 'username' keys with the identifier so the backend accepts both
      const requestPayload = { email: identifier, username: identifier, password };
      const requestHeaders = { 'Content-Type': 'application/json' };

      let response: Response;
      try {
        response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload),
        });
      } catch {
        // Fallback to configured base URL
        const fallbackBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
        response = await fetch(`${fallbackBase}/api/auth/login`, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload),
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Login failed. Please check credentials.');
      }

      // 1. Store JWT token and user info as requested
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role) {
          localStorage.setItem('role', data.user.role);
        }
      }

      // 2. Persist role-specific keys so existing route guards and API clients work seamlessly
      const roleRaw = (data.user?.role || '').toLowerCase();
      const roleNormalized = roleRaw.replace('-', '_');

      if (roleNormalized === 'superadmin' || roleNormalized === 'super_admin') {
        setSuperAdminSession(data.token, data.user?.name || data.user?.username || identifier.split('@')[0], data.user);
      } else if (roleNormalized === 'admin') {
        setAdminSession(data.token, data.user);
      } else if (roleNormalized === 'employee') {
        setEmployeeSession(data.token, data.user);
      }

      // 3. Notify parent app state
      const activeName = data.user?.name || data.user?.fullName || data.user?.username || identifier.split('@')[0];
      onLoginSuccess(activeName, roleNormalized as UserRole);
      onShowToast(data.message || `Welcome back, ${activeName}!`);
      onClose();

      // 4. Role-based dynamic redirect
      switch (roleNormalized) {
        case 'superadmin':
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'employee':
          navigate('/employee');
          break;
        default:
          navigate('/');
          break;
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Send OTP to Email (POST /api/auth/forgot-password)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    setFlowSuccessMessage(null);

    const targetEmail = resetEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setFlowError('Please provide a valid registered email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await forgotPasswordApi({ email: targetEmail });
      setOtpValues(['', '', '', '', '', '']);
      setResendTimer(60);
      setFlowSuccessMessage(response.message || `Verification OTP dispatched to ${targetEmail}`);
      setView('verify_otp');
      onShowToast(response.message || `Verification code dispatched to ${targetEmail}`);
    } catch (err: any) {
      setFlowError(err.message || 'Failed to dispatch verification OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;

    setFlowError(null);
    setFlowSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await resendOtpApi({ email: resetEmail.trim() });
      setResendTimer(60);
      setFlowSuccessMessage(response.message || 'A new 6-digit verification code has been dispatched.');
      onShowToast('Verification code resent successfully.');
    } catch (err: any) {
      setFlowError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = cleaned ? cleaned[cleaned.length - 1] : '';
    setOtpValues(newOtp);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP (POST /api/auth/verify-otp)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    const enteredCode = otpValues.join('');

    if (enteredCode.length < 6) {
      setFlowError('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyOtpApi({
        email: resetEmail.trim(),
        otp: enteredCode,
      });

      if (!response.resetToken) {
        throw new Error('Verification completed but no reset session token was received.');
      }

      setResetToken(response.resetToken);
      setFlowError(null);
      setView('reset_password');
      onShowToast(response.message || 'Identity verified! Please set your new password.');
    } catch (err: any) {
      setFlowError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Save New Password (POST /api/auth/reset-password)
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);

    if (newPassword.length < 8) {
      setFlowError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFlowError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!resetToken) {
      setFlowError('Reset session has expired. Please verify OTP again.');
      setView('request_otp');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPasswordApi({
        resetToken: resetToken,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });

      setView('reset_success');
      onShowToast(response.message || 'Password updated successfully!');
    } catch (err: any) {
      setFlowError(err.message || 'Failed to update password. The reset session may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicators
  const hasMinLength = newPassword.length >= 8;
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-2xl space-y-6">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#166534] shadow-md shadow-emerald-950/10">
            <span className="font-display font-extrabold text-xl text-[#D4A017]">KN</span>
          </div>

          {view === 'signin' && (
            <>
              <h2 className="text-2xl font-extrabold text-[#0F172A] font-display">
                Sign In to KN Finance
              </h2>
              <p className="text-xs text-[#64748B]">
                Unified access for Super Admin, Branch Admin, and Field Officers.
              </p>
            </>
          )}

          {view === 'request_otp' && (
            <>
              <h2 className="text-2xl font-extrabold text-[#0F172A] font-display">
                Reset / Set Password
              </h2>
              <p className="text-xs text-[#64748B]">
                We will dispatch a 6-digit OTP code to your registered email.
              </p>
            </>
          )}

          {view === 'verify_otp' && (
            <>
              <h2 className="text-2xl font-extrabold text-[#0F172A] font-display">
                Enter Verification OTP
              </h2>
              <p className="text-xs text-[#64748B]">
                Check your inbox at <span className="font-semibold text-slate-800">{resetEmail}</span>
              </p>
            </>
          )}

          {view === 'reset_password' && (
            <>
              <h2 className="text-2xl font-extrabold text-[#0F172A] font-display">
                Set New Password
              </h2>
              <p className="text-xs text-[#64748B]">
                Create a strong, secure password for your account.
              </p>
            </>
          )}

          {view === 'reset_success' && (
            <>
              <h2 className="text-2xl font-extrabold text-[#0F172A] font-display">
                Password Updated!
              </h2>
              <p className="text-xs text-[#64748B]">
                Your password has been changed successfully.
              </p>
            </>
          )}
        </div>

        {/* ---------------- VIEW 1: UNIFIED SIGN IN ---------------- */}
        {view === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-medium">{loginError}</span>
              </div>
            )}



            {/* Username or Email Field (type="text" to allow superadmin / admin / email) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">
                Username or Email *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. superadmin, admin, or email"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0F172A]">Password *</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.includes('@') ? email : '');
                    setFlowError(null);
                    setFlowSuccessMessage(null);
                    setView('request_otp');
                  }}
                  className="text-xs font-semibold text-[#166534] hover:text-[#14532d] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Authenticating credentials...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>

            {/* First time setup option */}
            <div className="pt-1 text-center text-xs text-slate-500">
              <span>First time login or invited? </span>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email.includes('@') ? email : '');
                  setFlowError(null);
                  setFlowSuccessMessage(null);
                  setView('request_otp');
                }}
                className="font-bold text-[#166534] hover:underline cursor-pointer"
              >
                Set up your password
              </button>
            </div>
          </form>
        )}

        {/* ---------------- VIEW 2: REQUEST OTP VIA EMAIL ---------------- */}
        {view === 'request_otp' && (
          <form onSubmit={handleSendOtp} className="space-y-4">

            {flowError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{flowError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">
                Enter Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                A 6-digit verification code (OTP) will be dispatched to your registered address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFlowError(null);
                setView('signin');
              }}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* ---------------- VIEW 3: VERIFY OTP ---------------- */}
        {view === 'verify_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">

            {flowSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{flowSuccessMessage}</span>
              </div>
            )}

            {flowError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{flowError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A] block text-center">
                Enter 6-Digit OTP Code
              </label>
              <div className="flex justify-center gap-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-10 h-12 text-center text-lg font-bold font-mono rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-xs text-slate-500">
              {resendTimer > 0 ? (
                <span>Resend available in <strong className="text-slate-800">{resendTimer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="font-bold text-[#166534] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend OTP Code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFlowError(null);
                setView('request_otp');
              }}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Email</span>
            </button>
          </form>
        )}

        {/* ---------------- VIEW 4: RESET PASSWORD ---------------- */}
        {view === 'reset_password' && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4">

            {flowError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{flowError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Confirm New Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password checklist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumberOrSpecial ? 'text-emerald-700' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${hasNumberOrSpecial ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Includes a number or special symbol</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !hasMinLength || !passwordsMatch}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ---------------- VIEW 5: RESET SUCCESS ---------------- */}
        {view === 'reset_success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your password has been successfully updated. You can now sign in to your KN Finance portal with your new credentials.
            </p>
            <button
              type="button"
              onClick={() => {
                setView('signin');
                setPassword('');
              }}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-4 h-4 text-[#D4A017]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
