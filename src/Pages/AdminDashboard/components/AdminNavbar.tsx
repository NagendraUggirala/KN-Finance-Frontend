import React from 'react';
import {
  Search,
  Bell,
  ShieldCheck,
  LogOut,
  UserCheck,
  HelpCircle,
  Menu
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
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
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
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors hidden sm:block"
            title="Help & Support Docs"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => onShowToast(`You have ${unreadCount} pending approval notifications.`)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
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
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out of Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
