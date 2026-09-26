import React from 'react';
import {
  Users,
  Bell,
  ShieldCheck
} from 'lucide-react';

export type SuperadminTab = 'users' | 'admins' | 'notifications';

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

  const navItems = [
    { id: 'admins' as SuperadminTab, label: 'Admin Management', icon: ShieldCheck, badge: 'Live API' },
    { id: 'users' as SuperadminTab, label: 'User Account Control', icon: Users, badge: 'Active' },
    { id: 'notifications' as SuperadminTab, label: 'System Notifications', icon: Bell, badge: 'Dispatch' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#F2F8E1] text-[#0F172A] border-r border-[#C5E1A5] flex flex-col justify-between transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto position-relative  ">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                  ? 'bg-[#166534] text-white shadow-md shadow-green-950/20'
                  : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#E2F0C2]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4A017]' : 'text-[#166534]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white font-bold' : 'bg-[#DCECB5] text-[#166534] font-bold'
                    }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>


      </aside>
    </>
  );
};
