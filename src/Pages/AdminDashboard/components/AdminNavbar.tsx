import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Bell,
  ShieldCheck,
  LogOut,
  UserCheck,
  HelpCircle,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';

interface AdminNavbarProps {
  userName: string;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
  toggleSidebar: () => void;
  unreadCount?: number;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  userName,
  onLogout,
  onShowToast,
  toggleSidebar,
  unreadCount = 5,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left Side: Mobile Menu Button & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search clients, loan accounts, transactions, or policy IDs (Ctrl + K)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onShowToast(`Searching records for "${(e.target as HTMLInputElement).value}"...`);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#166534] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Side: Status Badge, Quick Actions, Profile & Logout */}
          <div className="flex items-center gap-3">
            
            {/* Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold border border-[#166534]/20">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Admin Gateway Active</span>
            </div>

            {/* Quick Help Button */}
            <button
              onClick={() => onShowToast('Admin Knowledgebase: Contact Compliance Desk at ext. 404')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors hidden sm:block cursor-pointer"
              title="Help & Support Docs"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => onShowToast(`You have ${unreadCount} pending approval notifications.`)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Admin User Profile Dropdown / Card */}
            <div className="flex items-center gap-3 pl-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#166534]/30">
                  <UserCheck className="w-4 h-4 text-[#D4A017]" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#0F172A] leading-tight flex items-center gap-1">
                    {userName || 'Admin Manager'}
                    <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
                  </p>
                  <p className="text-[10px] text-[#64748B] font-medium">Operations Admin</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Sign Out of Admin Portal"
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
                Sign Out of Admin Portal?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to log out of the admin dashboard? You will need to sign in again to access administrative operations.
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
