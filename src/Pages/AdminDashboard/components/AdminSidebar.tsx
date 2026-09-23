import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type AdminTab = 'overview' | 'employees' | 'finance_book';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  employeeCount: number;
  financeCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile,
  employeeCount,
  financeCount,
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const navItems = [
    { id: 'overview' as AdminTab, label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'employees' as AdminTab, label: 'Employee Registry', icon: Users, badge: employeeCount.toString() },
    { id: 'finance_book' as AdminTab, label: 'Finance Book', icon: BookOpen, badge: financeCount.toString() },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Top Brand Banner */}
        <div className={`p-4 border-b border-slate-100 flex items-center justify-between transition-all duration-300 ${isCollapsed ? 'flex-col gap-3 px-2' : 'px-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className="w-10 h-10 min-w-10 rounded-xl bg-[#166534] flex items-center justify-center shadow-md">
              <span className="font-display font-extrabold text-lg text-[#D4A017]">KN</span>
            </div>
            {!isCollapsed && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-base text-[#0F172A] whitespace-nowrap">KN Finance</span>
                </div>
                <p className="text-[11px] text-[#166534] font-bold tracking-wide uppercase whitespace-nowrap">Admin Operations</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150 hidden lg:block"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 py-6 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Operational Menu
            </p>
          )}

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
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all duration-200 ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#166534] text-white shadow-md shadow-green-950/20'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 min-w-4 ${isActive ? 'text-[#D4A017]' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Card: Return to Main Portal & Health Indicator */}
        <div className={`p-4 border-t border-slate-100 space-y-3 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-[#0F172A]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-[#166534]" />
                  Branch: NY-Central-01
                </span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <p className="text-[10px] text-[#64748B]">Node Sync: 12ms latency</p>
            </div>
          ) : (
            <div className="flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400" title="Branch Status: NY-Central-01 (Online)">
              <Shield className="w-4 h-4 text-[#166534]" />
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center justify-center rounded-xl text-xs font-bold text-slate-600 hover:text-[#166534] hover:bg-slate-100 transition-all border border-slate-200 ${
              isCollapsed ? 'p-2.5' : 'gap-2 px-3 py-2'
            }`}
            title={isCollapsed ? "Return to Public Site" : undefined}
          >
            <ArrowLeft className="w-3.5 h-3.5 min-w-3.5" />
            {!isCollapsed && <span>Return to Public Site</span>}
          </button>
        </div>

      </aside>
    </>
  );
};
