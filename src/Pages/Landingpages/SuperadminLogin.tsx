import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import superadminBanner from '../../assets/superadmin-banner.jpg';
import type { UserRole } from './Login';
import { superAdminLoginApi } from '../../lib/api';

interface SuperadminLoginProps {
  onLoginSuccess: (userName: string, role: UserRole) => void;
  onShowToast: (msg: string) => void;
}

export const SuperadminLogin: React.FC<SuperadminLoginProps> = ({
  onLoginSuccess,
  onShowToast,
}) => {
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore remembered username if available
  useEffect(() => {
    const saved = localStorage.getItem('kn_superadmin_saved_user');
    if (saved) {
      setUsernameOrEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const identifier = usernameOrEmail.trim();
    if (!identifier) {
      setErrorMsg('Please enter your Super Admin username or email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Call deployed backend API endpoint POST /api/auth/superadmin/login
      const response = await superAdminLoginApi({
        username: identifier,
        password: password,
      });

      if (rememberMe) {
        localStorage.setItem('kn_superadmin_saved_user', identifier);
      } else {
        localStorage.removeItem('kn_superadmin_saved_user');
      }

      const activeName = response.user?.username || identifier;
      onLoginSuccess(activeName, 'super_admin');
      onShowToast(response.message || 'Super Admin login successful! Access granted.');
      navigate('/super-admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid Super Admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    onShowToast('Super Admin access is managed by master infrastructure environment keys.');
  };

  const fillLiveCredentials = () => {
    setUsernameOrEmail('Nagendra');
    setPassword('qwerty@123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAFBF9] sm:bg-white text-[#111827] font-sans">
      
      {/* Left Column: Direct Superadmin Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 min-h-screen">
        
        {/* Top bar with back navigation & brand mark */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to website</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#354e22] animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#354e22]">
              Super Admin Gateway
            </span>
          </div>
        </div>

        {/* Form Container (Strictly styled after reference image) */}
        <div className="w-full max-w-[420px] mx-auto py-10">
          
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
              Welcome back!
            </h1>
            <p className="mt-2 text-sm sm:text-[15px] text-[#6B7280] font-normal">
              Enter your Credentials to access your account
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Email Address */}
            <div className="space-y-1.5">
              <label 
                htmlFor="username"
                className="block text-xs sm:text-sm font-semibold text-[#1F2937]"
              >
                Username or Email address
              </label>
              <input
                id="username"
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter username or email"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-sm text-[#111827] placeholder:text-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#354e22]/20 focus:border-[#354e22] transition-all"
              />
            </div>

            {/* Password with Forgot Password link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-semibold text-[#1F2937]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors cursor-pointer"
                >
                  forgot password
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-neutral-300 text-sm text-[#111827] placeholder:text-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#354e22]/20 focus:border-[#354e22] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember for 30 days checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-[#354e22] accent-[#354e22] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-[#4B5563] font-normal">
                  Remember for 30 days
                </span>
              </label>
            </div>

            {/* Direct Login Button (Olive green style matching user reference) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#354e22] hover:bg-[#2b3f1c] active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating via API...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Helper */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Live server credentials?</span>
            <button
              type="button"
              onClick={fillLiveCredentials}
              className="font-semibold text-[#354e22] hover:underline cursor-pointer"
            >
              Fill Live Backend Credentials
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center sm:text-left text-xs text-neutral-400">
          KN Finance Security &copy; {new Date().getFullYear()} &bull; Restricted Officer Portal
        </div>
      </div>

      {/* Right Column: High-Res Botanical Monstera Leaf Visual Card */}
      <div className="hidden lg:block lg:w-1/2 p-4 xl:p-6">
        <div className="w-full h-full min-h-[640px] rounded-[36px] xl:rounded-[48px] overflow-hidden relative shadow-md bg-[#F4F5F1]">
          <img
            src={superadminBanner}
            alt="Monstera Botanical Leaves"
            className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-700 ease-out select-none"
            loading="eager"
          />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/10 pointer-events-none" />
        </div>
      </div>

    </div>
  );
};

export default SuperadminLogin;
