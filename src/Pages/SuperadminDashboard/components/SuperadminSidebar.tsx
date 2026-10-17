import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Bell,
  ShieldCheck,
  History,
  X,
  ArrowLeft
} from 'lucide-react';

export type SuperadminTab = 'users' | 'admins' | 'notifications' | 'audit_logs';

interface SuperadminSidebarProps {
  activeTab: SuperadminTab;
  setActiveTab: (tab: SuperadminTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const SuperadminSidebar: React.FC<SuperadminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'admins' as SuperadminTab, label: 'Admin Management', icon: ShieldCheck, badge: 'Live API' },
    { id: 'users' as SuperadminTab, label: 'User Account Control', icon: Users, badge: 'Active' },
    { id: 'notifications' as SuperadminTab, label: 'System Notifications', icon: Bell, badge: 'Dispatch' },
    { id: 'audit_logs' as SuperadminTab, label: 'Audit Logs', icon: History, badge: 'Audit Trail' },
  ];

  return (
    <>
      {/* Mobile Overlay (Backdrop behind the sidebar drawer) */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Drawer: z-50 on mobile so it is above the backdrop overlay and navbar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto w-64 bg-[#F2F8E1] text-[#0F172A] border-r border-[#C5E1A5] flex flex-col justify-between transition-transform duration-300 transform shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand Banner */}
        <div className="p-4 border-b border-[#C5E1A5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-[#166534] flex items-center justify-center shadow-md">
              <span className="font-display font-extrabold text-lg text-[#D4A017]">KN</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base text-[#0F172A] whitespace-nowrap">KN Finance</span>
              </div>
              <p className="text-[11px] text-[#166534] font-bold tracking-wide uppercase whitespace-nowrap">Super Admin</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-[#DCECB5] transition-colors duration-150 lg:hidden cursor-pointer"
            title="Close Sidebar"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-mono font-extrabold text-[#166534] uppercase tracking-wider mb-3">
            Executive Controls
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#166534] text-white shadow-md shadow-green-950/20'
                    : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#E2F0C2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4A017]' : 'text-[#166534]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-[#DCECB5] text-[#166534] font-bold'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Card: Return to Main Portal */}
        <div className="p-4 border-t border-[#C5E1A5]">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#166534] hover:bg-[#E2F0C2] transition-all border border-[#C5E1A5] cursor-pointer"
            title="Return to Public Site"
          >
            <ArrowLeft className="w-3.5 h-3.5 min-w-3.5" />
            <span>Return to Public Site</span>
          </button>
        </div>
      </aside>
    </>
  );
};
