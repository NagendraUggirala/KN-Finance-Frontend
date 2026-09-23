import React, { useState } from 'react';
import { 
  Users, 
  Settings, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  Activity,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import type { Employee } from '../types';

interface DashboardOverviewProps {
  employees: Employee[];
  onShowToast: (msg: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  employees,
  onShowToast,
}) => {
  // Visibility states for the 4 KPI cards
  const [hideRevenue, setHideRevenue] = useState(false);
  const [hideEmployees, setHideEmployees] = useState(false);
  const [hideTodayAmount, setHideTodayAmount] = useState(false);
  const [hideMaintenance, setHideMaintenance] = useState(false);

  // Stats calculation
  const totalEmployeesCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const inactiveCount = employees.filter(e => e.status === 'Inactive').length;

  // Static/calculated financial metrics
  const totalRevenueVal = 1245800;
  const todayAmountVal = 48200;
  const monthlyMaintenanceVal = 95000;

  // Format helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper to mask values
  const maskValue = (val: string | number, hide: boolean, maskChar = '•') => {
    if (hide) {
      return maskChar.repeat(6);
    }
    return val;
  };

  // Village/Area breakdown
  const areaBreakdown = employees.reduce((acc, curr) => {
    const area = curr.assignedArea || 'Unassigned';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#166534] to-[#1e3a1e] p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pointer-events-none">
          <Activity className="w-64 h-64 text-white -mr-16 -mb-16" />
        </div>
        <div className="z-10">
          <h2 className="text-xl md:text-2xl font-extrabold font-display">Welcome Back, Operational Admin</h2>
          <p className="text-xs text-green-200 mt-1">
            KN Finance Branch operations dashboard. Real-time metrics and personnel tracking are fully active.
          </p>
        </div>
        <div className="z-10 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017] animate-pulse" />
          <span>System Synced</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Total Revenue</span>
            <button 
              onClick={() => {
                setHideRevenue(!hideRevenue);
                onShowToast(hideRevenue ? "Revealed Total Revenue." : "Masked Total Revenue.");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-[#166534] hover:bg-slate-50 transition-colors"
              title={hideRevenue ? "Reveal Value" : "Hide Value"}
            >
              {hideRevenue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#0F172A] font-mono tracking-tight mt-1">
              {maskValue(formatCurrency(totalRevenueVal), hideRevenue, '★')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-bold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        {/* KPI 2: Total Members / Employees */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Total Members / Employees</span>
            <button 
              onClick={() => {
                setHideEmployees(!hideEmployees);
                onShowToast(hideEmployees ? "Revealed Total Members." : "Masked Total Members.");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-[#166534] hover:bg-slate-50 transition-colors"
              title={hideEmployees ? "Reveal Value" : "Hide Value"}
            >
              {hideEmployees ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#0F172A] font-mono tracking-tight mt-1">
              {maskValue(totalEmployeesCount, hideEmployees, '★')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#166534] font-bold mt-2">
            <Users className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>{activeCount} Active | {inactiveCount} Inactive</span>
          </div>
        </div>

        {/* KPI 3: Today's Generated Amount */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Today's Generated Amount</span>
            <button 
              onClick={() => {
                setHideTodayAmount(!hideTodayAmount);
                onShowToast(hideTodayAmount ? "Revealed Today's Generated Amount." : "Masked Today's Generated Amount.");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-[#166534] hover:bg-slate-50 transition-colors"
              title={hideTodayAmount ? "Reveal Value" : "Hide Value"}
            >
              {hideTodayAmount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#0F172A] font-mono tracking-tight mt-1">
              {maskValue(formatCurrency(todayAmountVal), hideTodayAmount, '★')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-bold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+4.2% daily target progress</span>
          </div>
        </div>

        {/* KPI 4: Monthly Maintenance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Monthly Maintenance</span>
            <button 
              onClick={() => {
                setHideMaintenance(!hideMaintenance);
                onShowToast(hideMaintenance ? "Revealed Monthly Maintenance." : "Masked Monthly Maintenance.");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-[#166534] hover:bg-slate-50 transition-colors"
              title={hideMaintenance ? "Reveal Value" : "Hide Value"}
            >
              {hideMaintenance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#0f172a] font-mono tracking-tight mt-1">
              {maskValue(formatCurrency(monthlyMaintenanceVal), hideMaintenance, '★')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-2">
            <Settings className="w-3.5 h-3.5 text-[#D4A017] animate-spin" style={{ animationDuration: '6s' }} />
            <span>Scheduled for 28th Aug</span>
          </div>
        </div>

      </div>

      {/* Middle Grid: Telemetry, Active/Inactive Ratio and Assigned Area Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Personnel Telemetry Ratio Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Personnel Telemetry</h3>
            <p className="text-xs text-[#64748B]">Active vs Inactive status distributions.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#0F172A]">
                <span>Active Personnel Rate</span>
                <span className="text-[#166534]">{totalEmployeesCount ? Math.round((activeCount / totalEmployeesCount) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-[#166534] rounded-full transition-all duration-500" 
                  style={{ width: `${totalEmployeesCount ? (activeCount / totalEmployeesCount) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[10px] text-[#64748B]">{activeCount} employees online / assigned to fields</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#0F172A]">
                <span>Inactive Personnel Rate</span>
                <span className="text-amber-700">{totalEmployeesCount ? Math.round((inactiveCount / totalEmployeesCount) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${totalEmployeesCount ? (inactiveCount / totalEmployeesCount) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[10px] text-[#64748B]">{inactiveCount} employees on leave or pending activation</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center justify-between text-[#166534] text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
              <span className="font-bold">Operation Integrity Check</span>
            </div>
            <span className="font-extrabold text-[10px] bg-[#166534] text-white px-2 py-0.5 rounded uppercase">Passed</span>
          </div>
        </div>

        {/* Assigned Areas List */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Field Deployment Map</h3>
            <p className="text-xs text-[#64748B]">Assigned operational coverage per territory.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-56 pr-1">
            {Object.keys(areaBreakdown).length > 0 ? (
              Object.entries(areaBreakdown).map(([area, count]) => (
                <div key={area} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-[#166534]/10 text-[#166534] flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4 text-[#D4A017]" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#0F172A]">{area}</h5>
                    <p className="text-[10px] text-[#64748B] font-medium">{count} {count === 1 ? 'staff deployed' : 'staff deployed'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-xs text-slate-400 font-bold">
                No active employee assignments.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-[#64748B] flex justify-between items-center">
            <span>Total Operational Coverage Areas: <strong>{Object.keys(areaBreakdown).length}</strong></span>
            <span className="font-bold text-[#166534] hover:underline cursor-pointer">View Coverage Table →</span>
          </div>
        </div>

      </div>

    </div>
  );
};
