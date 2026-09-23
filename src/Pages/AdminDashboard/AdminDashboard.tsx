import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminSidebar, type AdminTab } from './components/AdminSidebar';
import { 
  RefreshCw, 
  Download 
} from 'lucide-react';

import type { Employee, FinanceRecord } from './types';
import { DashboardOverview } from './Sidebarpages/DashboardOverview';
import { EmployeeDirectory } from './Sidebarpages/EmployeeDirectory';
import { FinanceBook } from './Sidebarpages/FinanceBook';

interface AdminDashboardProps {
  userName: string;
  onShowToast: (msg: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userName,
  onShowToast,
  onLogout,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setActiveTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  // Shared Employee State
  const [employeesList, setEmployeesList] = useState<Employee[]>([
    {
      id: 'EMP-4819',
      name: 'Rajesh Sharma',
      age: 32,
      phone: '9876543210',
      altPhone: '9123456789',
      aadharCard: '123456789012',
      gmail: 'rajesh.sharma@knfinance.in',
      panCard: 'ABCDE1234F',
      village: 'Rampur',
      assignedArea: 'Sector North',
      referenceName: 'Vijay Kumar',
      relationshipToReference: 'Brother',
      joiningDate: '2025-05-12',
      status: 'Active',
    },
    {
      id: 'EMP-7721',
      name: 'Sunita Patel',
      age: 28,
      phone: '9888877776',
      altPhone: '',
      aadharCard: '987654321098',
      gmail: 'sunita.patel@knfinance.in',
      panCard: 'XYZWP5678Q',
      village: 'Gopalpur',
      assignedArea: 'Sector West',
      referenceName: 'Ramesh Patel',
      relationshipToReference: 'Uncle',
      joiningDate: '2026-02-20',
      status: 'Active',
    },
    {
      id: 'EMP-3042',
      name: 'Anil Verma',
      age: 41,
      phone: '9000011112',
      altPhone: '9000022223',
      aadharCard: '456789012345',
      gmail: 'anil.verma@knfinance.in',
      panCard: 'JKLMN9012Z',
      village: 'Bishnupur',
      assignedArea: 'Sector East',
      referenceName: '',
      relationshipToReference: '',
      joiningDate: '2024-11-05',
      status: 'Inactive',
    },
    {
      id: 'EMP-8920',
      name: 'Pooja Reddy',
      age: 26,
      phone: '8765432109',
      altPhone: '8765400000',
      aadharCard: '234567890123',
      gmail: 'pooja.reddy@knfinance.in',
      panCard: 'DEFGH3456R',
      village: 'Kalyanpur',
      assignedArea: 'Sector South',
      referenceName: 'Vijay Kumar',
      relationshipToReference: 'Colleague',
      joiningDate: '2026-07-15',
      status: 'Active',
    },
    {
      id: 'EMP-1109',
      name: 'Vikram Singh',
      age: 35,
      phone: '7654321098',
      altPhone: '',
      aadharCard: '890123456789',
      gmail: 'vikram.singh@knfinance.in',
      panCard: 'PQRST7890X',
      village: 'Rampur',
      assignedArea: 'Sector North',
      referenceName: 'Sanjay Singh',
      relationshipToReference: 'Father',
      joiningDate: '2025-09-01',
      status: 'Inactive',
    }
  ]);

  // Shared Finance Records state
  const [financeRecordsList, setFinanceRecordsList] = useState<FinanceRecord[]>([
    {
      sNo: 1,
      id: 'FIN-5501',
      name: 'Karan Johar',
      referenceName: 'Vijay Kumar',
      phone: '9876501234',
      startDate: '2026-08-01',
      endDate: '2026-11-01',
      principalAmount: 5000,
      interestRate: 26,
      totalWithInterest: 6300,
      paymentProcess: 'Weekly',
      expectedDate: '2026-11-01',
      payments: [
        { id: 'PAY-1001', date: '2026-08-08', amount: 1500, paymentType: 'Cash', collectedBy: 'Rajesh Sharma' },
        { id: 'PAY-1002', date: '2026-08-15', amount: 1500, paymentType: 'UPI', collectedBy: 'Sunita Patel' }
      ]
    },
    {
      sNo: 2,
      id: 'FIN-9902',
      name: 'Meena Kumari',
      referenceName: 'Ramesh Patel',
      phone: '9123405678',
      startDate: '2026-08-10',
      endDate: '2026-11-10',
      principalAmount: 10000,
      interestRate: 20,
      totalWithInterest: 12000,
      paymentProcess: 'Monthly',
      expectedDate: '2026-11-10',
      payments: [
        { id: 'PAY-2001', date: '2026-08-12', amount: 3000, paymentType: 'Card', collectedBy: 'Pooja Reddy' }
      ]
    }
  ]);

  // Derived counts for sidebar badges
  const totalCount = employeesList.length;
  const inactiveCount = employeesList.filter(e => e.status === 'Inactive').length;
  const financeCount = financeRecordsList.length;

  const handleExportData = () => {
    onShowToast(`Exported ${activeTab} data to Excel/CSV successfully.`);
  };

  const handleSyncData = () => {
    onShowToast('Synced local branch dataset with central cloud repository.');
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      
      {/* Top Admin Navbar */}
      <AdminNavbar
        userName={userName}
        onLogout={onLogout}
        onShowToast={onShowToast}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        unreadCount={inactiveCount}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          employeeCount={totalCount}
          financeCount={financeCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-[#166534] uppercase tracking-wider bg-[#166534]/10 px-2 py-0.5 rounded border border-[#166534]/20">
                  Operations Portal
                </span>
                <span className="text-xs text-[#64748B] font-medium">• Branch #104 (NY Central)</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] font-display">
                {activeTab === 'overview' && 'Admin Control Overview'}
                {activeTab === 'employees' && 'Employee Registry'}
                {activeTab === 'finance_book' && 'Finance Ledger Book'}
              </h1>
              <p className="text-xs text-[#64748B]">
                {activeTab === 'overview' && 'Monitor branch liquidity, revenues, and general deployment telemetry.'}
                {activeTab === 'employees' && 'View, add, edit, or delete staff records and contact cards.'}
                {activeTab === 'finance_book' && 'Record loans, track collected payments, and audit staff collections history.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncData}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-all border border-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#166534]" />
                <span>Sync Data</span>
              </button>
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Export Page Data</span>
              </button>
            </div>
          </div>

          {/* Dynamic Tab Renderers */}
          {activeTab === 'overview' && (
            <DashboardOverview
              employees={employeesList}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeDirectory
              employees={employeesList}
              setEmployees={setEmployeesList}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'finance_book' && (
            <FinanceBook
              records={financeRecordsList}
              setRecords={setFinanceRecordsList}
              employees={employeesList}
              userName={userName}
              onShowToast={onShowToast}
            />
          )}

        </main>
      </div>

    </div>
  );
};
