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
  Shield
} from 'lucide-react';

export type UserRole = 'super_admin' | 'admin' | 'user';

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
  const [role, setRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot password & OTP verification state
  const [resetEmail, setResetEmail] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoBannerCode, setDemoBannerCode] = useState<string | null>(null);

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
      setDemoBannerCode(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-detect role when typing email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const lower = val.toLowerCase();
    if (lower.includes('superadmin')) {
      setRole('super_admin');
    } else if (lower.includes('admin')) {
      setRole('admin');
    }
  };

  // Submit Sign In
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email.trim()) {
      setLoginError('Please enter your work or account email.');
      return;
    }
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    const displayName = email.split('@')[0] || (role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Operations Admin' : 'Employee');
    const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Operations Admin' : 'Authorized User';

    onLoginSuccess(displayName, role);
    onShowToast(`Welcome back! Logged in as ${roleLabel}.`);
    onClose();
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setFlowError('Please provide a valid employee or administrator email.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomCode);
      setDemoBannerCode(randomCode);
      setOtpValues(['', '', '', '', '', '']);
      setResendTimer(60);
      setIsSubmitting(false);
      setView('verify_otp');
      onShowToast(`Verification OTP dispatched to ${resetEmail}`);
    }, 600);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setDemoBannerCode(randomCode);
    setResendTimer(60);
    setOtpValues(['', '', '', '', '', '']);
    setFlowError(null);
    onShowToast(`New verification code sent to ${resetEmail}!`);
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

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    const enteredCode = otpValues.join('');

    if (enteredCode.length < 6) {
      setFlowError('Please enter the full 6-digit OTP code.');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setFlowError('Invalid verification code. Please check your email or resend.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFlowError(null);
      setDemoBannerCode(null);
      setView('reset_password');
      onShowToast('Identity verified! Please set your new password.');
    }, 500);
  };

  // Step 3: Save New Password
  const handleSaveNewPassword = (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setView('reset_success');
      onShowToast('Password updated successfully!');
    }, 600);
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
                We will send a 6-digit OTP verification code to your email.
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

        {/* Demo OTP Banner for instant testing */}
        {demoBannerCode && (view === 'verify_otp') && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
            <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Email Dispatched!</span>
              <p className="mt-0.5 text-[11px] text-amber-800">
                OTP sent to <span className="underline font-semibold">{resetEmail}</span>.
                Verification Code: <span className="font-mono font-extrabold text-amber-950 text-sm tracking-wider bg-amber-200/70 px-1.5 py-0.5 rounded">{demoBannerCode}</span>
              </p>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 1: SIGN IN ---------------- */}
        {view === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Portal Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A] flex items-center justify-between">
                <span>Account Role</span>
                <span className="text-[10px] text-slate-400 font-normal">Select portal level</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-[#166534] text-white border-[#166534] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>Admin / Ops</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'user'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>Employee / User</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0F172A]">Work Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={
                    role === 'admin'
                      ? 'admin.ny@knfinance.com'
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
                    setResetEmail(email);
                    setFlowError(null);
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
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Sign In to {role === 'admin' ? 'Admin Portal' : 'Workspace'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4A017]" />
            </button>

            {/* First time setup option */}
            <div className="pt-2 text-center text-xs text-slate-500">
              <span>First time login or invited? </span>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setFlowError(null);
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
                  placeholder="employee@knfinance.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534] transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                A 6-digit verification OTP code will be sent to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                setView('signin');
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* ---------------- VIEW 3: ENTER OTP CODE ---------------- */}
        {view === 'verify_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            
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
                    className="text-[#166534] font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                setView('request_otp');
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Email</span>
            </button>
          </form>
        )}

        {/* ---------------- VIEW 4: RESET / SET PASSWORD ---------------- */}
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
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                Your new password has been stored securely. You can now proceed to log in with your updated credentials.
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
