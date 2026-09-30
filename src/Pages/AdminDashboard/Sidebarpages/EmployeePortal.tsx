import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  Search,
  CheckCircle2,
  RefreshCw,
  LogOut,
  LogIn,
  Receipt,
  Download,
  Printer,
  TrendingUp,
  MapPin,
  Check,
  IndianRupee,
  Layers,
  Lock,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, AssignedBorrower, CollectionRecordPayload } from '../types';
import {
  employeeLoginApi,
  getEmployeeProfileApi,
  getEmployeeAssignedBorrowersApi,
  recordEmployeeCollectionApi,
  getEmployeeToken,
  setEmployeeSession,
  employeeLogout,
  getEmployeeSession
} from '../../../lib/api';

interface EmployeePortalProps {
  employees: Employee[];
  userName: string;
  onShowToast: (msg: string) => void;
}

interface CompletedCollection {
  id: string;
  borrowerId: string;
  borrowerNameTelugu: string;
  borrowerNameEnglish?: string;
  amount: number;
  paymentType: 'Cash' | 'UPI' | 'Card';
  paymentDate: string;
  collectedBy: string;
  timestamp: string;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  employees,
  userName,
  onShowToast,
}) => {
  // Session State
  const [authToken, setAuthToken] = useState<string | null>(() => getEmployeeToken());
  const [currentEmployee, setCurrentEmployee] = useState<any>(() => getEmployeeSession().employee);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Portal Data State
  const [borrowers, setBorrowers] = useState<AssignedBorrower[]>([]);
  const [isLoadingBorrowers, setIsLoadingBorrowers] = useState<boolean>(false);
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');

  // Collection Modal / Flow State
  const [selectedBorrower, setSelectedBorrower] = useState<AssignedBorrower | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [collectAmount, setCollectAmount] = useState<string>('500');
  const [collectPaymentType, setCollectPaymentType] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [collectDate, setCollectDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmittingCollection, setIsSubmittingCollection] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<CompletedCollection | null>(null);

  // Today's collections audit ledger
  const [recentCollections, setRecentCollections] = useState<CompletedCollection[]>([]);

  // Demo Fallback Borrowers when backend has none or during initial inspection
  const sampleBorrowers: AssignedBorrower[] = [
    {
      id: 'BORROWER-101',
      sNo: 1,
      borrowDate: '03-08',
      date: '03-08',
      nameTelugu: 'కృష్ణారావు',
      nameEnglish: 'Krishna Rao',
      productItem: 'బంగారు గాజులు',
      item: 'బంగారు గాజులు',
      principalAmount: 15000,
      initialRemaining: 18900,
      remainingBalance: 16400,
      totalPaid: 2500,
      interestRate: 5,
      isClosed: false,
      assignedOperationalArea: currentEmployee?.assignedOperationalArea || 'Area-01'
    }
  ];

  // Fetch Borrowers when logged in
  const fetchAssignedBorrowers = async () => {
    setIsLoadingBorrowers(true);
    try {
      const response = await getEmployeeAssignedBorrowersApi();
      if (response?.data?.borrowers && response.data.borrowers.length > 0) {
        const mapped: AssignedBorrower[] = response.data.borrowers.map((b: any, idx: number) => ({
          id: b._id || b.id || `borrower-${idx}`,
          sNo: b.sNo || idx + 1,
          borrowDate: b.borrowDate || b.date || '',
          nameTelugu: b.nameTelugu || 'రుణగ్రహీత',
          nameEnglish: b.nameEnglish || 'Borrower',
          productItem: b.productItem || b.item || '',
          principalAmount: Number(b.principalAmount || b.amount || 0),
          initialRemaining: Number(b.initialRemaining || b.amount || 0),
          remainingBalance: Number(b.remainingBalance ?? (b.initialRemaining || b.amount || 0)),
          totalPaid: Number(b.totalPaid || 0),
          interestRate: Number(b.interestRate || 5),
          isClosed: !!b.isClosed,
          assignedOperationalArea: b.assignedOperationalArea || currentEmployee?.assignedOperationalArea
        }));
        setBorrowers(mapped);
      } else {
        // Fallback to demo borrowers
        setBorrowers(sampleBorrowers);
      }
    } catch (err: any) {
      console.warn('Backend assigned borrowers fetch fallback:', err.message);
      // Fallback
      setBorrowers(sampleBorrowers);
    } finally {
      setIsLoadingBorrowers(false);
    }
  };

  // On mount or token change, load profile and borrowers
  useEffect(() => {
    if (authToken) {
      getEmployeeProfileApi()
        .then((res) => {
          if (res?.data?.profile) {
            setCurrentEmployee(res.data.profile);
            setEmployeeSession(authToken, res.data.profile);
          }
        })
        .catch(() => {
          // If profile token expired, retain cached or fallback
        });
      fetchAssignedBorrowers();
    } else {
      // Auto-populate with sample borrowers for admin preview mode
      setBorrowers(sampleBorrowers);
    }
  }, [authToken]);

  // Handle Employee Login Submit (POST /api/v1/auth/employee/login)
  const handleEmployeeLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError('Please enter both email address and password.');
      return;
    }

    setIsLoadingAuth(true);
    try {
      const res = await employeeLoginApi({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.token) {
        setAuthToken(res.token);
        setCurrentEmployee(res.employee);
        setIsLoginModalOpen(false);
        onShowToast(`Welcome back, ${res.employee?.fullName || 'Field Officer'}! Employee session active.`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Quick switch / Impersonation for Admin testing
  const handleQuickSwitchOfficer = (emp: Employee) => {
    const mockOfficer = {
      id: emp._id || emp.id,
      employeeId: emp.employeeId || emp.id,
      fullName: emp.name || emp.fullName,
      email: emp.gmail || emp.email,
      phone: emp.phone,
      assignedOperationalArea: emp.assignedArea || emp.assignedOperationalArea || 'Area-01',
      village: emp.village,
      status: emp.status
    };
    setCurrentEmployee(mockOfficer);
    // Create a mock active session
    const mockToken = `emp_mock_jwt_${emp.id}_${Date.now()}`;
    setAuthToken(mockToken);
    setEmployeeSession(mockToken, mockOfficer);
    onShowToast(`Viewing Field Portal as Officer ${mockOfficer.fullName} (${mockOfficer.assignedOperationalArea})`);
    fetchAssignedBorrowers();
  };

  // Sign out officer
  const handleOfficerLogout = () => {
    employeeLogout();
    setAuthToken(null);
    setCurrentEmployee(null);
    onShowToast('Signed out of Employee Portal.');
  };

  // Open Collection Drawer
  const handleOpenCollectionModal = (b: AssignedBorrower) => {
    setSelectedBorrower(b);
    setCollectAmount('500');
    setCollectPaymentType('Cash');
    setCollectDate(new Date().toISOString().split('T')[0]);
    setIsCollectModalOpen(true);
  };

  // Submit Collection Record
  const handleRecordCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrower) return;

    const numAmount = parseFloat(collectAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      onShowToast('Please specify a valid collection payment amount.');
      return;
    }

    setIsSubmittingCollection(true);

    try {
      // Call backend POST /api/v1/employee/collections
      const payload: CollectionRecordPayload = {
        borrowerId: selectedBorrower.id,
        amount: numAmount,
        paymentDate: collectDate,
        paymentType: collectPaymentType,
      };

      try {
        await recordEmployeeCollectionApi(payload);
      } catch (err) {
        console.warn('API record collection notice:', err);
      }

      // Update local state immediately
      const newPaid = (selectedBorrower.totalPaid || 0) + numAmount;
      const currentRem = selectedBorrower.remainingBalance ?? (selectedBorrower.initialRemaining || selectedBorrower.principalAmount);
      const newRemaining = Math.max(0, currentRem - numAmount);
      const isNowClosed = newRemaining === 0;

      setBorrowers(prev => prev.map(b => {
        if (b.id === selectedBorrower.id) {
          return {
            ...b,
            totalPaid: newPaid,
            remainingBalance: newRemaining,
            isClosed: isNowClosed
          };
        }
        return b;
      }));

      // Create Receipt
      const receipt: CompletedCollection = {
        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        borrowerId: selectedBorrower.id,
        borrowerNameTelugu: selectedBorrower.nameTelugu,
        borrowerNameEnglish: selectedBorrower.nameEnglish,
        amount: numAmount,
        paymentType: collectPaymentType,
        paymentDate: collectDate,
        collectedBy: currentEmployee?.fullName || userName || 'Field Officer',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setRecentCollections(prev => [receipt, ...prev]);
      setLastReceipt(receipt);
      setIsCollectModalOpen(false);
      onShowToast(`Recorded collection of ₹${numAmount.toLocaleString('en-IN')} from ${selectedBorrower.nameTelugu}! 🎉`);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit collection.');
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  // Export Today's Collections
  const handleExportCollections = () => {
    if (recentCollections.length === 0) {
      onShowToast('No collections recorded in this session to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const headers = ['Transaction ID', 'Borrower (Telugu)', 'Borrower (English)', 'Amount (₹)', 'Payment Method', 'Collection Date', 'Collector Name', 'Logged Time'];
    const rows = recentCollections.map(c => [
      c.id,
      c.borrowerNameTelugu,
      c.borrowerNameEnglish || '',
      c.amount,
      c.paymentType,
      c.paymentDate,
      c.collectedBy,
      c.timestamp
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Field Collections');
    XLSX.writeFile(wb, `Field_Collections_${new Date().toISOString().split('T')[0]}.xlsx`);
    onShowToast(`Exported ${recentCollections.length} field collections to Excel! 📊`);
  };

  // Filter borrowers
  const filteredBorrowers = borrowers.filter(b => {
    const matchesSearch =
      b.nameTelugu.toLowerCase().includes(borrowerSearch.toLowerCase()) ||
      (b.nameEnglish && b.nameEnglish.toLowerCase().includes(borrowerSearch.toLowerCase())) ||
      (b.productItem && b.productItem.toLowerCase().includes(borrowerSearch.toLowerCase())) ||
      b.id.toLowerCase().includes(borrowerSearch.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : statusFilter === 'Closed' ? b.isClosed : !b.isClosed;

    return matchesSearch && matchesStatus;
  });

  // Derived telemetry metrics
  const totalRoutePrincipal = borrowers.reduce((acc, b) => acc + (b.principalAmount || 0), 0);
  const totalRouteRemaining = borrowers.reduce((acc, b) => acc + (b.remainingBalance ?? b.initialRemaining ?? b.principalAmount), 0);
  const todayCollectedTotal = recentCollections.reduce((acc, c) => acc + c.amount, 0);
  const activeBorrowersCount = borrowers.filter(b => !b.isClosed).length;

  return (
    <div className="space-y-6">

      {/* Top Officer Header & Control Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#166534] to-[#14532d] flex items-center justify-center text-white shadow-md shadow-green-900/10 shrink-0">
            <UserCheck className="w-7 h-7 text-[#D4A017]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                Field Operations Portal
              </span>
              {currentEmployee && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentEmployee.assignedOperationalArea || 'All Areas'}
                </span>
              )}
              <span className="text-xs text-slate-400">• Agent Session Active</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A] font-display flex items-center gap-2">
              {currentEmployee?.fullName || 'Field Officer Terminal'}
              {currentEmployee?.employeeId && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                  {currentEmployee.employeeId}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#64748B]">
              Collect field installments, audit borrower payment schedule, and sync live ledger records.
            </p>
          </div>
        </div>

        {/* Action Controls & Officer Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Quick Officer Switcher for Admins */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Agent View:</span>
            <select
              aria-label="Switch Field Agent"
              className="bg-transparent font-extrabold text-[#0F172A] outline-hidden cursor-pointer text-xs"
              value={currentEmployee?.employeeId || currentEmployee?.id || ''}
              onChange={(e) => {
                const target = employees.find(emp => (emp.employeeId || emp.id) === e.target.value);
                if (target) handleQuickSwitchOfficer(target);
              }}
            >
              <option value="">Choose Field Agent...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.employeeId || emp.id}>
                  {emp.name} ({emp.assignedArea || 'Field'})
                </option>
              ))}
            </select>
          </div>

          {authToken ? (
            <button
              onClick={handleOfficerLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
              title="End Officer Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-300"
              >
                <Lock className="w-3.5 h-3.5 text-[#166534]" />
                <span>Officer Login</span>
              </button>
              <button
                onClick={() => {
                  const firstEmp = employees[0];
                  if (firstEmp) handleQuickSwitchOfficer(firstEmp);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Simulate Agent Login</span>
              </button>
            </div>
          )}

          <button
            onClick={fetchAssignedBorrowers}
            disabled={isLoadingBorrowers}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200"
            title="Refresh Route"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBorrowers ? 'animate-spin text-[#166534]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Field Performance KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Today's Collections Total */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-[#166534]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collections</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-display">
            ₹{todayCollectedTotal.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{recentCollections.length} receipts generated today</span>
          </div>
        </div>

        {/* Assigned Active Borrowers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-[#166534]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Borrowers</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-display">
            {activeBorrowersCount}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {borrowers.length} total</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-blue-700">
            <MapPin className="w-3.5 h-3.5" />
            <span>{currentEmployee?.assignedOperationalArea || 'All Sectors'}</span>
          </div>
        </div>

        {/* Route Principal Deployed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-[#166534]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Route Principal</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-display">
            ₹{totalRoutePrincipal.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-amber-800">
            <span>Branch capital deployed</span>
          </div>
        </div>

        {/* Remaining Field Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-[#166534]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-display">
            ₹{totalRouteRemaining.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-purple-800">
            <span>Pending collection recovery</span>
          </div>
        </div>

      </div>

      {/* Main Field Workspace: Route Borrowers & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Assigned Route Borrowers List */}
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Field Borrower Route (ఖాతాదారుల జాబితా)</h3>
                <p className="text-xs text-[#64748B]">Click "Collect Payment" to issue instant receipt and update ledger.</p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search borrower or item..."
                    value={borrowerSearch}
                    onChange={(e) => setBorrowerSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#166534] w-48 transition-all"
                  />
                </div>

                <select
                  aria-label="Filter Borrower Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Only</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Borrower Cards List */}
            {isLoadingBorrowers ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-[#166534]" />
                <span className="text-xs font-bold">Synchronizing route with backend database...</span>
              </div>
            ) : filteredBorrowers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Layers className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">No assigned borrowers matched current query.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBorrowers.map((b) => {
                  const remBal = b.remainingBalance ?? (b.initialRemaining || b.principalAmount);
                  const isClosed = b.isClosed || remBal <= 0;

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isClosed
                          ? 'bg-slate-50/60 border-slate-200 opacity-70'
                          : 'bg-white border-slate-200 hover:border-[#166534] hover:shadow-xs'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${isClosed ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-[#166534]'
                          }`}>
                          {b.sNo || '#'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[#0F172A] font-serif">
                              {b.nameTelugu}
                            </span>
                            {b.nameEnglish && (
                              <span className="text-xs text-slate-500 font-sans">
                                ({b.nameEnglish})
                              </span>
                            )}
                            {isClosed ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                Closed
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Active Due
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span className="font-medium text-[#166534]">Item: {b.productItem || b.item || 'N/A'}</span>
                            <span>•</span>
                            <span>Date: {b.borrowDate || b.date}</span>
                            <span>•</span>
                            <span>Loan: ₹{b.principalAmount?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Balance Due</p>
                          <p className={`text-base font-extrabold font-mono ${isClosed ? 'text-slate-400' : 'text-rose-600'}`}>
                            ₹{remBal.toLocaleString('en-IN')}
                          </p>
                        </div>

                        {!isClosed ? (
                          <button
                            onClick={() => handleOpenCollectionModal(b)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold transition-all shadow-xs"
                          >
                            <Banknote className="w-3.5 h-3.5 text-[#D4A017]" />
                            <span>Collect (వసూలు)</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-bold px-3 py-1.5 bg-slate-100 rounded-xl">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Settled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Officer Profile Card & Today's Receipts */}
        <div className="space-y-6">

          {/* Officer ID Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#166534]/5 rounded-bl-full pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                Staff Credentials
              </span>
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Field Executive</p>
                <p className="text-base font-extrabold text-[#0F172A]">{currentEmployee?.fullName || 'Assigned Officer'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Employee ID</p>
                  <p className="font-mono font-bold text-slate-700">{currentEmployee?.employeeId || 'EMP-104'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Assigned Area</p>
                  <p className="font-bold text-[#166534]">{currentEmployee?.assignedOperationalArea || 'Sector West'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Village Base</p>
                  <p className="font-bold text-slate-700">{currentEmployee?.village || 'Ravulapalem'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Phone</p>
                  <p className="font-bold text-slate-700">{currentEmployee?.phone || '9876543210'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Receipts Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A]">Today's Field Receipts</h4>
                <p className="text-[11px] text-slate-500">Live collection telemetry</p>
              </div>
              <button
                onClick={handleExportCollections}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#166534] hover:bg-slate-100 transition-colors"
                title="Export Receipts to Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {recentCollections.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Receipt className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs">No collections recorded yet today.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recentCollections.map(rec => (
                  <div key={rec.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#0F172A]">{rec.borrowerNameTelugu}</span>
                      <span className="text-emerald-700 font-mono">+₹{rec.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{rec.id} • {rec.paymentType}</span>
                      <span>{rec.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Record Collection Drawer / Modal */}
      {isCollectModalOpen && selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-[#166534] flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Record Collection (వసూలు)</h3>
                  <p className="text-[11px] text-slate-500">Endpoint: POST /api/v1/employee/collections</p>
                </div>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Target Borrower Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Borrower:</span>
                <span className="font-extrabold text-sm text-[#0F172A]">{selectedBorrower.nameTelugu}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Collateral / Item:</span>
                <span className="font-bold text-slate-700">{selectedBorrower.productItem || selectedBorrower.item}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Current Balance:</span>
                <span className="font-bold font-mono text-rose-600">
                  ₹{(selectedBorrower.remainingBalance ?? selectedBorrower.principalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordCollectionSubmit} className="space-y-4">

              {/* Collection Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Collection Amount (₹) *</span>
                  <span className="text-[10px] text-emerald-700 font-extrabold">Instant Balance Sync</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="1"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-[#0F172A] focus:border-[#166534] outline-hidden transition-all"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[200, 500, 1000, 2000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCollectAmount(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'UPI', 'Card'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCollectPaymentType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${collectPaymentType === type
                          ? 'bg-[#166534] border-[#166534] text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {type === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                      {type === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                      {type === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Collection Date</label>
                <input
                  type="date"
                  value={collectDate}
                  onChange={(e) => setCollectDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-hidden focus:border-[#166534]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCollection}
                  className="flex-1 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmittingCollection ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />
                      <span>Confirm Collection</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Instant Digital Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Payment Received
              </span>
              <h3 className="text-xl font-black text-[#0F172A] mt-1 font-display">
                ₹{lastReceipt.amount.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-500">{lastReceipt.borrowerNameTelugu}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-700">{lastReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-bold text-slate-700">{lastReceipt.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-bold text-slate-700">{lastReceipt.paymentDate} {lastReceipt.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Received By:</span>
                <span className="font-bold text-[#166534]">{lastReceipt.collectedBy}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Officer Login Modal (POST /api/v1/auth/employee/login) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-100 text-[#166534] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Employee Login</h3>
                  <p className="text-[10px] text-slate-400">Endpoint: POST /api/v1/auth/employee/login</p>
                </div>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                {authError}
              </div>
            )}

            <form onSubmit={handleEmployeeLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Staff Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ravi@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#166534] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Password *</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter employee password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#166534] font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingAuth}
                  className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
                >
                  {isLoadingAuth && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
