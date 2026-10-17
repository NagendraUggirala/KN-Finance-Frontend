import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmployeeNavbar } from './components/EmployeeNavbar';
import { EmployeeSidebar } from './components/EmployeeSidebar';
import { EmployeeOverview } from './Sidebarpages/EmployeeOverview';
import { DayWiseCollect } from './Sidebarpages/DayWiseCollect';
import { DailyExpensesAndSummary } from './Sidebarpages/DailyExpensesAndSummary';
import { CustomerDirectory } from './Sidebarpages/CustomerDirectory';
import type {
  EmployeeTab,
  EmployeeProfile,
  AssignedBorrower,
  CollectionRecord,
  DailyExpense
} from './types';
import {

  getEmployeeAssignedBorrowersApi,
  getEmployeeToken,

  employeeLogout,
  getEmployeeSession
} from '../../lib/api';


interface EmployeeDashboardProps {
  userName?: string;
  onShowToast: (msg: string) => void;
  onLogout?: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  userName = 'Rajesh Sharma',
  onShowToast,
  onLogout,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as EmployeeTab) || 'overview';
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const setActiveTab = (tab: EmployeeTab) => {
    setSearchParams({ tab });
  };

  // 1. Employee Session State
  const [authToken, setAuthToken] = useState<string | null>(() => getEmployeeToken());
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile | null>(() => {
    const sess = getEmployeeSession();
    if (sess?.employee) {
      return {
        id: sess.employee.id || sess.employee._id || 'EMP-4819',
        employeeId: sess.employee.employeeId || 'EMP-4819',
        name: sess.employee.fullName || sess.employee.name || userName,
        phone: sess.employee.phone || '9876543210',
        email: sess.employee.email || 'rajesh.sharma@knfinance.in',
        village: sess.employee.village || 'Rampur',
        assignedOperationalArea: sess.employee.assignedOperationalArea || 'Sector North',
        status: sess.employee.status || 'Active',
      };
    }
    // Default fallback profile for seamless experience
    return {
      id: 'EMP-4819',
      employeeId: 'EMP-4819',
      name: userName || 'Rajesh Sharma',
      phone: '9876543210',
      email: 'rajesh.sharma@knfinance.in',
      village: 'Rampur',
      assignedOperationalArea: 'Sector North',
      status: 'Active',
    };
  });




  // 2. Assigned Borrowers State
  const [borrowers, setBorrowers] = useState<AssignedBorrower[]>([
    {
      id: 'BOR-1001',
      sNo: 1,
      borrowDate: '03-08',
      date: '03-08',
      nameTelugu: 'కె. రాజేష్ గౌడ్',
      nameEnglish: 'K. Rajesh Goud',
      phone: '9848012345',
      altPhone: '9848098765',
      village: 'Rampur',
      assignedOperationalArea: 'Sector North',
      productItem: 'బంగారు నెక్లెస్ (Gold Items)',
      item: 'బంగారు నెక్లెస్',
      principalAmount: 25000,
      initialRemaining: 31250,
      remainingBalance: 18250,
      totalPaid: 13000,
      interestRate: 25,
      isClosed: false,
      startDate: '2026-08-01',
      createdAt: '2026-08-01',
    },
    {
      id: 'BOR-1002',
      sNo: 2,
      borrowDate: '05-08',
      date: '05-08',
      nameTelugu: 'వై. సురేష్ కుమార్',
      nameEnglish: 'Y. Suresh Kumar',
      phone: '9123456780',
      village: 'Rampur',
      assignedOperationalArea: 'Sector North',
      productItem: 'Weekly Business Loan',
      item: 'Weekly Business Loan',
      principalAmount: 10000,
      initialRemaining: 12500,
      remainingBalance: 5500,
      totalPaid: 7000,
      interestRate: 25,
      isClosed: false,
      startDate: '2026-08-05',
      createdAt: '2026-08-05',
    },
    {
      id: 'BOR-1003',
      sNo: 3,
      borrowDate: '08-08',
      date: '08-08',
      nameTelugu: 'ఎం. లక్ష్మి ప్రసన్న',
      nameEnglish: 'M. Lakshmi Prasanna',
      phone: '9876509876',
      village: 'Gopalpur',
      assignedOperationalArea: 'Sector North',
      productItem: 'వెండి ఆభరణాలు (Silver)',
      item: 'వెండి ఆభరణాలు',
      principalAmount: 15000,
      initialRemaining: 18750,
      remainingBalance: 8750,
      totalPaid: 10000,
      interestRate: 25,
      isClosed: false,
      startDate: '2026-08-08',
      createdAt: '2026-08-08',
    },
    {
      id: 'BOR-1004',
      sNo: 4,
      borrowDate: '10-08',
      date: '10-08',
      nameTelugu: 'పి. వెంకటేశ్వర్లు',
      nameEnglish: 'P. Venkateshwarlu',
      phone: '9988776655',
      village: 'Kalyanpur',
      assignedOperationalArea: 'Sector North',
      productItem: 'Weekly Dairy Loan',
      item: 'Weekly Dairy Loan',
      principalAmount: 20000,
      initialRemaining: 25000,
      remainingBalance: 0,
      totalPaid: 25000,
      interestRate: 25,
      isClosed: true,
      startDate: '2026-08-10',
      closedDate: new Date().toISOString().split('T')[0],
      createdAt: '2026-08-10',
    },
  ]);

  // 3. Collections Log State
  const [collections, setCollections] = useState<CollectionRecord[]>([
    {
      id: 'col-init-1',
      receiptNo: 'REC-202608-4102',
      borrowerId: 'BOR-1001',
      borrowerNameTelugu: 'కె. రాజేష్ గౌడ్',
      borrowerNameEnglish: 'K. Rajesh Goud',
      borrowerPhone: '9848012345',
      village: 'Rampur',
      amount: 1000,
      paymentType: 'Cash',
      date: new Date().toISOString().split('T')[0],
      time: '09:45 AM',
      collectedBy: 'Rajesh Sharma',
      notes: 'Weekly installment collected at residence',
    },
    {
      id: 'col-init-2',
      receiptNo: 'REC-202608-4103',
      borrowerId: 'BOR-1002',
      borrowerNameTelugu: 'వై. సురేష్ కుమార్',
      borrowerNameEnglish: 'Y. Suresh Kumar',
      borrowerPhone: '9123456780',
      village: 'Rampur',
      amount: 500,
      paymentType: 'UPI',
      date: new Date().toISOString().split('T')[0],
      time: '11:15 AM',
      collectedBy: 'Rajesh Sharma',
      notes: 'PhonePe QR collection',
    },
  ]);

  // 4. Daily Operating Expenses State
  const [expenses, setExpenses] = useState<DailyExpense[]>([
    {
      id: 'exp-init-1',
      date: new Date().toISOString().split('T')[0],
      category: 'Fuel/Petrol',
      amount: 250,
      description: 'Bike petrol for Rampur and Sector North route',
      paidBy: 'Rajesh Sharma',
      receiptNumber: 'HP-998',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-init-2',
      date: new Date().toISOString().split('T')[0],
      category: 'Food & Tea',
      amount: 80,
      description: 'Morning tea and snacks during route collection',
      paidBy: 'Rajesh Sharma',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Fetch live assigned borrowers from backend
  useEffect(() => {
    const loadBackendBorrowers = async () => {
      try {
        const res = await getEmployeeAssignedBorrowersApi();
        if (res?.data?.borrowers && res.data.borrowers.length > 0) {
          const mapped: AssignedBorrower[] = res.data.borrowers.map((b: any, idx: number) => ({
            id: b._id || b.id || `bor-${idx}`,
            sNo: b.sNo || idx + 1,
            borrowDate: b.date || b.borrowDate || '03-08',
            date: b.date || b.borrowDate || '03-08',
            nameTelugu: b.nameTelugu,
            nameEnglish: b.nameEnglish || '',
            phone: b.phone || '',
            altPhone: b.altPhone || '',
            village: b.village || 'Rampur',
            assignedOperationalArea: b.assignedOperationalArea || 'Sector North',
            productItem: b.productItem || b.item || 'Weekly Terms',
            principalAmount: Number(b.principalAmount || b.amount || 0),
            initialRemaining: Number(b.initialRemaining || b.amount || 0),
            remainingBalance: Number(b.remainingBalance || 0),
            totalPaid: Number(b.totalPaid || 0),
            interestRate: Number(b.interestRate || 5),
            isClosed: !!b.isClosed,
            startDate: b.date || '2026-08-01',
          }));
          setBorrowers(mapped);
        }
      } catch (err) {
        console.warn('Backend borrower fetch notice:', err);
      }
    };

    if (authToken) {
      loadBackendBorrowers();
    }
  }, [authToken]);


  // Quick One-Click Switch for testing
  const handleQuickDemoLogin = (empName: string, empId: string, email: string, village: string) => {
    const demoProfile: EmployeeProfile = {
      id: empId,
      employeeId: empId,
      name: empName,
      phone: '9876543210',
      email: email,
      village: village,
      assignedOperationalArea: 'Sector North',
      status: 'Active',
    };
    setCurrentEmployee(demoProfile);
    setAuthToken('demo-token');
    onShowToast(`Switched profile to ${empName} (${empId})!`);
  };

  // Handle Logout
  const handlePortalLogout = () => {
    employeeLogout();
    setAuthToken(null);
    if (onLogout) {
      onLogout();
    } else {
      onShowToast('Signed out of employee portal.');
    }
  };

  // Calculate Today Cash Collected
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotalCollected = collections
    .filter((c) => c.date === todayStr)
    .reduce((sum, c) => sum + c.amount, 0);

  // Derived counts for sidebar
  const totalBorrowersCount = borrowers.length;
  const pendingBorrowersCount = borrowers.filter((b) => !b.isClosed && Number(b.remainingBalance) > 0).length;



  // If NOT authenticated, show the modern Employee Sign In screen
  if (!authToken) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">




          {/* Quick Demo Login Chips */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick Test Switch (డెమో లాగిన్)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin('Rajesh Sharma', 'EMP-4819', 'rajesh.sharma@knfinance.in', 'Rampur')
                }
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 truncate">Rajesh Sharma</div>
                <div className="text-[10px] text-slate-500 font-mono">EMP-4819 • Rampur</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin('Sunita Patel', 'EMP-7721', 'sunita.patel@knfinance.in', 'Gopalpur')
                }
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 truncate">Sunita Patel</div>
                <div className="text-[10px] text-slate-500 font-mono">EMP-7721 • Gopalpur</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Authenticated Workspace Layout
  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">

      {/* Top Employee Navbar */}
      <EmployeeNavbar
        employee={currentEmployee}
        onLogout={handlePortalLogout}
        onShowToast={onShowToast}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        todayCollected={todayTotalCollected}
      />

      <div className="flex-1 flex overflow-hidden">

        {/* Employee Sidebar */}
        <EmployeeSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          borrowerCount={totalBorrowersCount}
          pendingCount={pendingBorrowersCount}
          employee={currentEmployee}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Header Banner (Hidden during print) */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Field Officer Operations
                </span>
                <span className="text-xs text-slate-500 font-semibold">• Branch #104 (NY Central)</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] font-display">
                {activeTab === 'overview' && 'Field Officer Dashboard Overview'}
                {activeTab === 'day_wise_collect' && 'Day-wise Collection'}
                {activeTab === 'ledger_book' && 'Field Ledger Book'}
                {activeTab === 'expenses_summary' && 'Expenses & Day Settlement'}
                {activeTab === 'customers' && 'Assigned Customers & Registration'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'overview' && 'Monitor daily collection goals, route statistics, and day reconciliation summary.'}
                {activeTab === 'day_wise_collect' && 'Fast borrower lookup by ID, Phone, or Name to record daily payments and generate instant receipts.'}
                {activeTab === 'ledger_book' && 'Official dual-page ledger format displaying weekly installments, payments, and balances.'}
                {activeTab === 'expenses_summary' && 'Note daily operating costs (petrol, tea), reconcile cash in hand, and track customer additions/closures.'}
                {activeTab === 'customers' && 'View customer directories, contact profiles, and register new loan borrowers.'}
              </p>
            </div>


          </div>

          {/* Dynamic Tab Renderers */}
          {activeTab === 'overview' && (
            <EmployeeOverview
              employee={currentEmployee}
              borrowers={borrowers}
              collections={collections}
              expenses={expenses}
              onNavigateTab={setActiveTab}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'day_wise_collect' && (
            <DayWiseCollect
              borrowers={borrowers}
              setBorrowers={setBorrowers}
              collections={collections}
              setCollections={setCollections}
              employee={currentEmployee}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'ledger_book' && (
            <DailyExpensesAndSummary
              expenses={expenses}
              setExpenses={setExpenses}
              collections={collections}
              setCollections={setCollections}
              borrowers={borrowers}
              setBorrowers={setBorrowers}
              employee={currentEmployee}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'expenses_summary' && (
            <DailyExpensesAndSummary
              expenses={expenses}
              setExpenses={setExpenses}
              collections={collections}
              setCollections={setCollections}
              borrowers={borrowers}
              setBorrowers={setBorrowers}
              employee={currentEmployee}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerDirectory
              borrowers={borrowers}
              setBorrowers={setBorrowers}
              employee={currentEmployee}
              onShowToast={onShowToast}
              onSelectForCollection={(_cust) => {
                setActiveTab('day_wise_collect');
              }}
            />
          )}

        </main>
      </div>

    </div>
  );
};

export default EmployeeDashboard;
