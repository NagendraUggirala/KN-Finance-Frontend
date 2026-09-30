import React, { useState } from 'react';
import {
  Search,
  LogOut,
  UserCheck,
  Menu,
  AlertTriangle,
  IndianRupee,
  MapPin,
  Clock
} from 'lucide-react';
import type { EmployeeProfile } from '../types';

interface EmployeeNavbarProps {
  employee: EmployeeProfile | null;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
  toggleSidebar: () => void;
  todayCollected: number;
}

export const EmployeeNavbar: React.FC<EmployeeNavbarProps> = ({
  employee,
  onLogout,
  onShowToast,
  toggleSidebar,
  todayCollected,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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
                placeholder="Search borrower by Name, ID, or Phone (Ctrl + K)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onShowToast(`Searching records for "${(e.target as HTMLInputElement).value}"...`);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#166534] focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Right Side: Status Badge, Today Cash, Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Field Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-[#166534] text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Field Agent Active</span>
            </div>

            {/* Today Cash In Hand Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold shadow-2xs">
              <IndianRupee className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline text-amber-700">Today Cash:</span>
              <span className="font-extrabold font-mono text-emerald-800">
                ₹{todayCollected.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Operational Route Badge */}
            {employee?.assignedOperationalArea && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{employee.assignedOperationalArea}</span>
              </div>
            )}

            {/* Time Stamp */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded-lg">
              <Clock className="w-3 h-3" />
              <span>{currentTime}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Profile Avatar / Info */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#166534] text-[#D4A017] font-extrabold flex items-center justify-center text-xs shadow-xs border border-emerald-800">
                {employee?.name ? employee.name.charAt(0).toUpperCase() : 'E'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1">
                  <span>{employee?.name || 'Field Officer'}</span>
                  <UserCheck className="w-3.5 h-3.5 text-[#166534]" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono font-medium">
                  {employee?.employeeId || 'ID: Staff'}
                </div>
              </div>
            </div>

            {/* Logout Trigger Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100 ml-1"
              title="Sign Out of Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Sign Out of Field Portal?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Make sure all collected cash is accounted for in the daily summary before logging out.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
