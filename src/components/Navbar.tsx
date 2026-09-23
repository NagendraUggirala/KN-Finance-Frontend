import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, User, LayoutDashboard, LogOut, Crown, Shield } from 'lucide-react';
import type { UserRole } from '../Pages/Landingpages/Login';

interface NavbarProps {
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  userName: string;
  userRole?: UserRole;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn,
  onOpenLogin,
  onLogout,
  userName,
  userRole = 'user',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/features', label: 'Features' },
    { path: '/contact', label: 'Contact Us' },
    { path: '/dashboard', label: 'Live Dashboard' },
  ];

  const getDashboardPath = () => {
    if (userRole === 'super_admin') return '/super-admin';
    if (userRole === 'admin') return '/admin';
    return '/dashboard';
  };

  const getRoleBadge = () => {
    if (userRole === 'super_admin') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900 text-[#D4A017] border border-amber-500/30">
          <Crown className="w-3 h-3 text-[#D4A017]" />
          Super Admin
        </span>
      );
    }
    if (userRole === 'admin') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#166534]/10 text-[#166534] border border-[#166534]/20">
          <Shield className="w-3 h-3 text-[#166534]" />
          Admin
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Investor
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#166534] shadow-md shadow-green-950/20 group-hover:scale-105 transition-transform duration-300">
              <span className="font-display font-extrabold text-xl text-[#D4A017]">
                KN
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl font-extrabold text-[#0F172A] tracking-tight">
                  KN Finance
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#166534]/10 text-[#166534] border border-[#166534]/20">
                  PRO
                </span>
              </div>
              <p className="text-xs text-[#64748B] hidden sm:block font-medium">Wealth Management & Advisory</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-[#166534] bg-[#166534]/10 border border-[#166534]/20 shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {getRoleBadge()}
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    userRole === 'super_admin'
                      ? 'bg-slate-900 text-amber-400 hover:bg-slate-800 border border-slate-800'
                      : 'bg-[#166534] text-white hover:bg-[#14532d]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#D4A017]" />
                  <span>
                    {userRole === 'super_admin'
                      ? 'Super Admin Portal'
                      : userRole === 'admin'
                      ? 'Admin Portal'
                      : userName || 'Dashboard'}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0F172A] hover:bg-slate-100 border border-slate-200 transition-all"
                >
                  <User className="w-4 h-4 text-[#166534]" />
                  Sign In
                </button>

                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-[#D4A017] hover:bg-[#b4850e] shadow-md shadow-amber-900/10 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span>Open Account</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-[#166534] bg-[#166534]/10 border border-[#166534]/20'
                      : 'text-[#64748B] hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  navigate(getDashboardPath());
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#166534] text-white"
              >
                <LayoutDashboard className="w-4 h-4 text-[#D4A017]" />
                Go to Portal ({userRole.replace('_', ' ').toUpperCase()})
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-[#0F172A] bg-slate-100 border border-slate-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-extrabold text-slate-950 bg-[#D4A017] shadow-sm"
                >
                  Open Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

