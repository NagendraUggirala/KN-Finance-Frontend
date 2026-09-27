import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Crown,
  Bell,
  LogOut,
  Menu,
  Sparkles,
  X,
  AlertTriangle
} from 'lucide-react';

interface SuperadminNavbarProps {
  userName: string;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
  toggleSidebar: () => void;
  criticalAlertCount?: number;
}

export const SuperadminNavbar: React.FC<SuperadminNavbarProps> = ({
  userName,
  onLogout,
  onShowToast,
  toggleSidebar,
  criticalAlertCount = 0,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#E8F5C8] text-[#0F172A] border-b border-[#C5E1A5] shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Left Side: Mobile Menu Button & Executive Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-[#DCECB5] focus:outline-none cursor-pointer"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#166534] text-[#D4A017] flex items-center justify-center shadow-sm">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display font-extrabold text-sm text-[#0F172A] tracking-wide flex items-center gap-1.5">
                  SUPER ADMIN COMMAND CENTER
                </span>
                <p className="text-[10px] text-[#166534] font-extrabold font-mono hidden sm:block">ROOT LEVEL PRIVILEGES ACTIVE</p>
              </div>
            </div>
          </div>

          {/* Right Side: Emergency Override, Security Logs & Profile */}
          <div className="flex items-center gap-3">

            {/* Notifications */}
            <button
              onClick={() => onShowToast('Master Security Audit: 0 unhandled intrusion alerts.')}
              className="relative p-2 rounded-xl text-slate-700 hover:text-black hover:bg-[#DCECB5] transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {criticalAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {criticalAlertCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-[#C5E1A5] hidden sm:block" />

            {/* Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#166534] text-[#D4A017] flex items-center justify-center font-extrabold text-xs shadow-sm">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-extrabold text-[#0F172A] leading-tight flex items-center gap-1">
                    {userName || 'Super Admin'}
                    <Sparkles className="w-3 h-3 text-[#B45309]" />
                  </p>
                  <p className="text-[10px] text-[#166534] font-extrabold font-mono">Master Officer</p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                title="Sign Out of Super Admin Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Logout Confirmation Modal Popup portaled directly to body */}
      {showLogoutModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 text-center">
            
            {/* Close button */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning / Logout Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>

            {/* Modal Heading & Text */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[#0F172A] font-display">
                Sign Out of Super Admin?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to log out of the superadmin dashboard? You will need to sign in again to access root-level controls.
              </p>
            </div>

            {/* Action Buttons: Cancel and Logout */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};
