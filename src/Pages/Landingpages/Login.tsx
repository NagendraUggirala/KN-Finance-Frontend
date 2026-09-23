import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, X, Crown, Shield, ChevronDown } from 'lucide-react';

export type UserRole = 'super_admin' | 'admin' | 'user';

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
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name || email.split('@')[0] || (role === 'super_admin' ? 'Super Admin Officer' : role === 'admin' ? 'Operations Admin' : 'Investor');
    
    let roleLabel = 'Investor Account';
    if (role === 'super_admin') roleLabel = 'Super Admin';
    if (role === 'admin') roleLabel = 'Admin';

    onLoginSuccess(displayName, role);
    onShowToast(`Welcome back, ${displayName}! Logged in as ${roleLabel}.`);
    onClose();
  };

  const handleQuickRoleLogin = (targetRole: UserRole) => {
    if (targetRole === 'super_admin') {
      onLoginSuccess('Victoria Vance', 'super_admin');
      onShowToast('Logged in as Super Admin (Master Officer)!');
    } else if (targetRole === 'admin') {
      onLoginSuccess('Jonathan Vance', 'admin');
      onShowToast('Logged in as Branch Operations Admin!');
    } else {
      onLoginSuccess('Alex Sterling', 'user');
      onShowToast('Logged in with Demo Investor Account!');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#166534] shadow-md mb-1">
            <span className="font-display font-extrabold text-xl text-[#D4A017]">KN</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] font-display">
            {tab === 'signin' ? 'Access KN Finance' : 'Create Wealth Account'}
          </h2>
          <p className="text-xs text-[#64748B]">
            Select your account type to access the corresponding portal & tools.
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <span>Instant Demo Role Switcher:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickRoleLogin('super_admin')}
              className="py-2 px-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold flex flex-col items-center justify-center gap-0.5 border border-slate-800 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRoleLogin('admin')}
              className="py-2 px-1 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold flex flex-col items-center justify-center gap-0.5 shadow-2xs transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRoleLogin('user')}
              className="py-2 px-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex flex-col items-center justify-center gap-0.5 transition-all"
            >
              <User className="w-3.5 h-3.5 text-[#166534]" />
              <span>Investor</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'signin'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              tab === 'signup'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Account Role Dropdown Menu */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#0F172A] flex items-center justify-between">
              <span>Select Login Role / Portal</span>
              <span className="text-[10px] text-[#166534] font-semibold">Super Admin vs Admin</span>
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs font-bold focus:outline-none focus:border-[#166534] appearance-none cursor-pointer"
              >
                <option value="super_admin">👑 Super Admin (Executive Command Portal)</option>
                <option value="admin">🛡️ Admin (Branch Operations & Approvals)</option>
                <option value="user">👤 Investor User (Portfolio & Vaults)</option>
              </select>
              <div className="absolute left-3 top-3 pointer-events-none text-slate-500">
                {role === 'super_admin' ? (
                  <Crown className="w-4 h-4 text-[#D4A017]" />
                ) : role === 'admin' ? (
                  <Shield className="w-4 h-4 text-[#166534]" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {tab === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#0F172A]">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Sterling"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#0F172A]">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === 'super_admin'
                    ? 'superadmin@knfinance.com'
                    : role === 'admin'
                    ? 'admin.ny@knfinance.com'
                    : 'alex.sterling@example.com'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#0F172A]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>
              {role === 'super_admin'
                ? 'Launch Super Admin Portal'
                : role === 'admin'
                ? 'Launch Admin Portal'
                : 'Sign In to Investor Dashboard'}
            </span>
            <ArrowRight className="w-4 h-4 text-[#D4A017]" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-[#64748B] flex items-center justify-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
          <span>Protected by 256-Bit SSL Encryption</span>
        </div>

      </div>

    </div>
  );
};

