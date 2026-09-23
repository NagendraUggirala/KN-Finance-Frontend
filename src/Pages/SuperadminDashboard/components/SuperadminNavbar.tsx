import React from 'react';
import {
  Crown,
  Bell,
  LogOut,
  Menu,
  Sparkles
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
  return (
    <header className="sticky top-0 z-40 bg-[#E8F5C8] text-[#0F172A] border-b border-[#C5E1A5] shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left Side: Mobile Menu Button & Executive Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-[#DCECB5] focus:outline-none"
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
            className="relative p-2 rounded-xl text-slate-700 hover:text-black hover:bg-[#DCECB5] transition-colors"
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
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Sign Out of Super Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
