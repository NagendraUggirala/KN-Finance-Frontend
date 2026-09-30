import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Banknote,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { EmployeeTab, EmployeeProfile } from '../types';

interface EmployeeSidebarProps {
  activeTab: EmployeeTab;
  setActiveTab: (tab: EmployeeTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  borrowerCount: number;
  pendingCount: number;
  employee: EmployeeProfile | null;
}

interface NavItem {
  id: EmployeeTab;
  label: string;
  teluguLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile,
  borrowerCount: _borrowerCount,
  pendingCount,
  employee,
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: LayoutDashboard
    },
    {
      id: 'day_wise_collect',
      label: 'Day-wise Collect',
      icon: Banknote,
      badgeColor: pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'ledger_book',
      label: 'Field Ledger Book',
      icon: BookOpen,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'expenses_summary',
      label: 'Expenses & Day Summary',
      icon: Receipt,
      badgeColor: 'bg-emerald-50 text-emerald-800'
    },
    {
      id: 'customers',
      label: 'Assigned Customers',
      icon: Users,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-30 lg:z-auto bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${isCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Top Brand Banner */}
        <div
          className={`p-4 border-b border-slate-100 flex items-center justify-between transition-all duration-300 ${isCollapsed ? 'flex-col gap-3 px-2' : 'px-4'
            }`}
        >
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className="w-10 h-10 min-w-10 rounded-xl bg-[#166534] flex items-center justify-center shadow-md">
              <span className="font-display font-extrabold text-lg text-[#D4A017]">KN</span>
            </div>
            {!isCollapsed && (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-base text-[#0F172A] whitespace-nowrap">
                    KN Finance
                  </span>
                </div>
                <p className="text-[11px] text-[#166534] font-bold tracking-wide uppercase whitespace-nowrap">
                  Field Officer Portal
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150 hidden lg:block"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 py-6 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3.5'}`}>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Field Operations Menu
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
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-left relative ${isCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${isActive
                    ? 'bg-[#166534] text-white shadow-md shadow-green-950/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#D4A017]' : 'text-slate-500'
                    }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <div className="truncate">
                      <div className="leading-tight truncate">{item.label}</div>
                      {item.teluguLabel && (
                        <div className={`text-[10px] font-medium truncate ${isActive ? 'text-emerald-100/90' : 'text-slate-400'}`}>
                          {item.teluguLabel}
                        </div>
                      )}
                    </div>
                    {item.badge && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap shrink-0 ${isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Assigned Route Card / Footer */}
        <div className={`p-3.5 border-t border-slate-100 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {!isCollapsed ? (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-[#166534]" />
                <span className="truncate">{employee?.assignedOperationalArea || 'Field Route North'}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Village: {employee?.village || 'Rampur'}</span>
                <span className="font-semibold text-emerald-700">Online</span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#166534] transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Home</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
