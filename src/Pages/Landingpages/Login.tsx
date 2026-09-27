import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Check,
  Shield,
  Sparkles
} from 'lucide-react';
import {
  adminLoginApi,
  forgotPasswordApi,
  resendOtpApi,
  verifyOtpApi,
  resetPasswordApi
} from '../../lib/api';

export type UserRole = 'admin' | 'user' | 'super_admin';

type AuthView = 'signin' | 'request_otp' | 'verify_otp' | 'reset_password' | 'reset_success';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userName: string, role: UserRole) => void;
  onShowToast: (msg: string) => void;
}

export const Login: React.FC<LoginProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  // Current modal view
  const [view, setView] = useState<AuthView>('signin');

  // Sign in state
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Auto-detect role when typing email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const lower = val.toLowerCase();
    if (lower.includes('admin')) {
      setRole('admin');
    }
  };

  // Submit Sign In (POST /api/auth/login)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = email.trim();
    if (!identifier) {
      setLoginError('Please enter your work or account email.');
      return;
    }
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Admin or Authorized User login
      const response = await adminLoginApi({
        email: identifier,
        password: password,
      });
      const activeName = response.user?.name || response.user?.username || identifier.split('@')[0];
      const assignedRole: UserRole = response.user?.role === 'admin' ? 'admin' : (role === 'admin' ? 'admin' : 'user');
      onLoginSuccess(activeName, assignedRole);
      onShowToast(response.message || `Welcome back, ${activeName}! Login successful.`);
      onClose();
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
      setFlowError('Please provide a valid employee or administrator email address.');
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

  // Resend OTP (POST /api/auth/resend-otp)
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setFlowError(null);
    setIsSubmitting(true);

    try {
      const response = await resendOtpApi({ email: resetEmail.trim() });
      setResendTimer(60);
      setOtpValues(['', '', '', '', '', '']);
      setFlowSuccessMessage(response.message || 'A new verification code has been dispatched.');
      onShowToast(response.message || `New verification code sent to ${resetEmail}!`);
    } catch (err: any) {
      setFlowError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle individual 6-box OTP entry & auto-advance
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpValues];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtpValues(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const cleaned = value.replace(/\D/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = cleaned;
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

  // Quick fill demo helper
  const handleQuickFill = () => {
    if (role === 'admin') {
      setEmail('admin@knfinance.com');
      setPassword('password123');
    } else {
      setEmail('user@knfinance.com');
      setPassword('password123');
    }
    setLoginError(null);
  };

  // Checklist states
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
                Access KN Portal
              </h2>
              <p className="text-xs text-[#64748B]">
                Enter your credentials to manage wealth, assets, and operations.
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

        {/* ---------------- VIEW 1: SIGN IN ---------------- */}
        {view === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Portal Role Selector - 2 Roles: Admin/Ops, User */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                <span>Account Role</span>
                <span className="text-[10px] text-slate-400 font-normal">Select portal level</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setLoginError(null);
                  }}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${role === 'admin'
                      ? 'bg-[#166534] text-white border-[#166534] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
                  <span className="truncate">Admin / Ops</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('user');
                    setLoginError(null);
                  }}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${role === 'user'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <User className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
                  <span className="truncate">User / Client</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0F172A]">
                  Work Email Address
                </label>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] text-[#166534] hover:text-[#14532d] flex items-center gap-1 font-semibold cursor-pointer"
                  title="Quick fill test credentials"
                >
                  <Sparkles className="w-3 h-3 text-[#D4A017]" />
                  <span>Demo fill</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={
                    role === 'admin'
                      ? 'admin@knfinance.com'
                      : 'employee@knfinance.com'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field with Forgot Password trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0F172A]">Password</label>
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
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>
                    {role === 'admin'
                      ? 'Sign In to Admin Portal'
                      : 'Sign In to Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>

            {/* First time setup option */}
            <div className="pt-2 text-center text-xs text-slate-500">
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

        {/* ---------------- VIEW 2: REQUEST OTP VIA EMAIL (POST /api/auth/forgot-password) ---------------- */}
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
                  placeholder="qwerty@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                A 6-digit verification code (OTP) will be generated and dispatched to your email address.
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
                  <span>Requesting OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code (OTP)</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFlowError(null);
                setFlowSuccessMessage(null);
                setView('signin');
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* ---------------- VIEW 3: ENTER OTP CODE (POST /api/auth/verify-otp & /api/auth/resend-otp) ---------------- */}
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
                6-Digit Verification Code
              </label>

              {/* 6 Individual Digit Inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpValues.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 transition-all font-mono"
                  />
                ))}
              </div>

              {/* Resend Action & Timer */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-500">Didn't receive code?</span>
                {resendTimer > 0 ? (
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="text-[#166534] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP Code</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFlowError(null);
                setFlowSuccessMessage(null);
                setView('request_otp');
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Email</span>
            </button>
          </form>
        )}

        {/* ---------------- VIEW 4: RESET / SET PASSWORD (POST /api/auth/reset-password) ---------------- */}
        {view === 'reset_password' && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4">

            {flowError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{flowError}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation Requirements */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
                <span>Password Requirements:</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                  At least 8 characters
                </span>
                <span className={`flex items-center gap-1.5 ${hasNumberOrSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${hasNumberOrSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Contains number or symbol
                </span>
                <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Passwords match
                </span>
              </div>
            </div>

            {/* Submit New Password */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save & Set New Password</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ---------------- VIEW 5: SUCCESS CONFIRMATION ---------------- */}
        {view === 'reset_success' && (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                Credentials Updated!
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Your new password has been stored securely in KN Finance. You can now proceed to log in with your updated credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPassword(newPassword);
                if (resetEmail) setEmail(resetEmail);
                setView('signin');
              }}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-4 h-4 text-[#D4A017]" />
            </button>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
          <span>Protected by Enterprise TLS & 256-Bit Cryptography</span>
        </div>

      </div>
    </div>
  );
};

export default Login;
