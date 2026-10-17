import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminSidebar, type AdminTab } from './components/AdminSidebar';
import { RefreshCw, Clock, AlertCircle, Users, Plus, WifiOff, Sparkles } from 'lucide-react';


import type { Employee, FinanceRecord } from './types';
import { DashboardOverview } from './Sidebarpages/DashboardOverview';
import { EmployeeDirectory } from './Sidebarpages/EmployeeDirectory';
import { FinanceBook } from './Sidebarpages/FinanceBook';

import { AuditLogs } from './Sidebarpages/AuditLogs';
import { AdminNotifications } from './Sidebarpages/AdminNotifications';
import {
  getAdminEmployeesApi,
  notificationApi,
  isAdminAuthenticated,
  isSuperAdminAuthenticated,
  adminLogout
} from '../../lib/api';

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
  const location = useLocation();
  const navigate = useNavigate();

  const isAuditPath = location.pathname === '/admin/audit-logs';
  const activeTab: AdminTab = isAuditPath ? 'audit_logs' : ((searchParams.get('tab') as AdminTab) || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setActiveTab = (tab: AdminTab) => {
    if (tab === 'audit_logs') {
      navigate('/admin/audit-logs');
    } else {
      if (isAuditPath) {
        navigate(`/admin?tab=${tab}`);
      } else {
        setSearchParams({ tab });
      }
    }
  };

  // Session expiry and redirect handler
  const isRedirectingRef = useRef(false);
  const handleSessionExpired = useCallback((message = 'Session expired. Please sign in again to continue.') => {
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;
    adminLogout();
    if (onLogout) {
      onLogout();
    }
    onShowToast(message);
    navigate('/?login=admin', { replace: true });
  }, [navigate, onLogout, onShowToast]);

  // Verify authentication immediately on mount
  useEffect(() => {
    const isAuth = isAdminAuthenticated() || isSuperAdminAuthenticated();
    if (!isAuth) {
      handleSessionExpired('Session expired or login required. Please sign in as Administrator.');
    }
  }, [handleSessionExpired]);

  // Global listener for auth expired events dispatched by API callers or tabs
  useEffect(() => {
    const onAuthExpired = (e: any) => {
      const msg = e?.detail?.message || 'Your session has expired. Please sign in again.';
      handleSessionExpired(msg);
    };
    window.addEventListener('kn_auth_expired', onAuthExpired);
    return () => window.removeEventListener('kn_auth_expired', onAuthExpired);
  }, [handleSessionExpired]);

  // Periodic session token expiration check
  useEffect(() => {
    const timer = setInterval(() => {
      const isAuth = isAdminAuthenticated() || isSuperAdminAuthenticated();
      if (!isAuth) {
        handleSessionExpired('Your session has expired. Please sign in again.');
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [handleSessionExpired]);

  // Shared Employee State from Cloud Backend
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [employeeLoadSeconds, setEmployeeLoadSeconds] = useState<number>(0);
  const [employeeLoadError, setEmployeeLoadError] = useState<string | null>(null);
  const [isEmployeeOfflineBypassed, setIsEmployeeOfflineBypassed] = useState<boolean>(false);

  // Unread System Notifications count from backend API
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const fetchUnreadNotifications = async () => {
    const isAuth = isAdminAuthenticated() || isSuperAdminAuthenticated();
    if (!isAuth) {
      handleSessionExpired('Session expired. Please sign in again.');
      return;
    }
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadNotificationsCount(count);
    } catch (err: any) {
      console.warn('Failed to fetch unread notification count:', err);
      if (
        err?.message?.includes('401') ||
        err?.message?.toLowerCase().includes('expired token') ||
        err?.message?.toLowerCase().includes('unauthorized')
      ) {
        handleSessionExpired('Your admin session has expired. Please sign in again.');
      }
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    // Poll unread count every 30s to keep header notification bell synchronized
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Live timer for tracking cloud response latency
  useEffect(() => {
    let timer: any = null;
    if (isLoadingEmployees) {
      timer = setInterval(() => {
        setEmployeeLoadSeconds((s) => s + 1);
      }, 1000);
    } else {
      setEmployeeLoadSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoadingEmployees]);

  // Fetch staff registry from cloud backend (GET /api/v1/admin/employees)
  const fetchDashboardEmployees = async () => {
    const isAuth = isAdminAuthenticated() || isSuperAdminAuthenticated();
    if (!isAuth) {
      handleSessionExpired('Session expired. Please sign in again.');
      return;
    }
    setIsLoadingEmployees(true);
    setEmployeeLoadError(null);
    setEmployeeLoadSeconds(0);
    try {
      const res = await getAdminEmployeesApi();
      if (res?.data?.employees) {
        const mapped: Employee[] = res.data.employees.map((e: any) => ({
          id: e._id || e.employeeId,
          _id: e._id,
          employeeId: e.employeeId,
          name: e.fullName || e.name || '',
          age: e.age || 30,
          phone: e.phone || '',
          altPhone: e.altPhone || e.alternativePhone || '',
          aadharCard: e.aadharCard || e.aadharNumber || '',
          gmail: e.email || '',
          panCard: e.panCard || e.panNumber || '',
          village: e.village || '',
          assignedArea: e.assignedOperationalArea || '',
          referenceName: e.references || e.referenceContact?.referenceName || '',
          relationshipToReference: e.relationshipToReference || e.referenceContact?.relationship || '',
          joiningDate: e.joiningDate ? e.joiningDate.split('T')[0] : '2026-01-01',
          status: e.status || 'Active',
        }));
        setEmployeesList(mapped);
      }
    } catch (err: any) {
      console.warn('Dashboard employee fetch notice:', err.message);
      if (
        err?.message?.includes('401') ||
        err?.message?.toLowerCase().includes('expired token') ||
        err?.message?.toLowerCase().includes('unauthorized')
      ) {
        handleSessionExpired('Your admin session has expired. Please sign in again.');
        return;
      }
      setEmployeeLoadError(err.message || 'Failed to fetch employee registry from server.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchDashboardEmployees();
  }, []);

  // Shared Finance Records state
  const [financeRecordsList, setFinanceRecordsList] = useState<FinanceRecord[]>([]);

  // Derived counts for sidebar badges
  const totalCount = employeesList.length;
  const financeCount = financeRecordsList.length;



  return (
    <div className="h-screen bg-[#F5F9E8] text-[#0F172A] flex flex-col font-sans overflow-hidden">

      {/* Top Admin Navbar */}
      <AdminNavbar
        userName={userName}
        onLogout={onLogout}
        onShowToast={onShowToast}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setActiveTab('notifications')}
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
          unreadCount={unreadNotificationsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Header Banner (Hidden during print) */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold text-[#166534] uppercase tracking-wider bg-[#166534]/10 px-2 py-0.5 rounded border border-[#166534]/20">
                  Operations Portal
                </span>
                <span className="text-xs text-[#64748B] font-medium">• Branch #104 (NY Central)</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] font-display">
                {activeTab === 'overview' && 'Admin Control Overview'}
                {activeTab === 'employees' && 'Employee Registry & Lifecycle'}
                {activeTab === 'finance_book' && 'Finance Ledger Book '}

                {activeTab === 'audit_logs' && 'Centralized Audit Logs'}
                {activeTab === 'notifications' && 'System Notifications & Advisories'}
              </h1>
              <p className="text-xs text-[#64748B]">
                {activeTab === 'overview' && 'Monitor branch liquidity, revenues, and general deployment telemetry.'}
                {activeTab === 'employees' && 'View, add, edit, or delete staff records, manage credentials, and assign operational areas.'}
                {activeTab === 'finance_book' && 'Manage installment columns, borrower ledger rows, and batch-sync ledger state.'}

                {activeTab === 'audit_logs' && 'Immutable audit trail of administrator and system activities.'}
                {activeTab === 'notifications' && 'Review broadcast advisories, account status updates, and license expiry alerts from Super Admin.'}
              </p>
            </div>


          </div>

          {/* Staff Registry Sync Banner when records already exist */}
          {isLoadingEmployees && employeesList.length > 0 && (
            <div className="no-print flex items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-700 flex-shrink-0" />
                <div>
                  <span className="font-bold">Syncing Staff Registry with Cloud Database...</span>
                  {employeeLoadSeconds >= 3 && (
                    <span className="text-amber-800 ml-1.5 font-medium">
                      (Taking {employeeLoadSeconds}s - Server is waking up)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {employeeLoadSeconds >= 3 && (
                  <button
                    onClick={fetchDashboardEmployees}
                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                )}
                <button
                  onClick={() => setIsLoadingEmployees(false)}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors"
                >
                  Keep Local Data
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Tab Renderers */}
          {activeTab === 'overview' && (
            isLoadingEmployees && employeesList.length === 0 && !isEmployeeOfflineBypassed ? (
              <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center my-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#166534] text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-[#166534]" />
                  <span>శ్రీ లక్ష్మీ గణపతి ఫైనాన్స్ • KN FINANCE</span>
                </div>

                <div className="relative my-4 flex flex-col items-center">
                  <div className="relative flex items-center justify-center w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-[#166534] animate-spin" />
                    <Users className="w-8 h-8 text-[#166534]" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mt-5">
                    సిబ్బంది & కార్యకలాపాల వివరాలు లోడ్ అవుతున్నాయి...
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5">
                    Loading Branch Telemetry & Staff Registry from Cloud Database
                  </p>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold mt-4">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Elapsed Time: {employeeLoadSeconds}s</span>
                  </div>
                </div>

                {/* Skeleton KPI Cards Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 max-w-lg mx-auto">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1.5">
                    <div className="h-2.5 bg-slate-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-slate-300 rounded w-12 animate-pulse" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1.5">
                    <div className="h-2.5 bg-slate-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-slate-300 rounded w-12 animate-pulse" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1.5">
                    <div className="h-2.5 bg-slate-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-slate-300 rounded w-12 animate-pulse" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1.5">
                    <div className="h-2.5 bg-slate-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-slate-300 rounded w-12 animate-pulse" />
                  </div>
                </div>

                {/* LATE DATA NOTIFICATION & OPTIONS (Appears after 3 seconds or on error) */}
                {(employeeLoadSeconds >= 3 || employeeLoadError) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 text-left shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-200/80 rounded-xl text-amber-800 flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-amber-950">
                              {employeeLoadError
                                ? 'క్లౌడ్ కనెక్షన్ విఫలమైంది (Cloud Connection Delayed)'
                                : 'డేటా లోడ్ అవ్వడం ఆలస్యం అవుతోంది (Data is taking longer than usual)'}
                            </h4>
                            <span className="text-[10px] font-mono font-bold bg-amber-200 px-2 py-0.5 rounded-full text-amber-900">
                              Slow Response ({employeeLoadSeconds}s)
                            </span>
                          </div>
                          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                            {employeeLoadError
                              ? `${employeeLoadError} - The cloud server on Render enters idle sleep mode when inactive. Waking it up may take 15–30 seconds.`
                              : 'The backend database server is waking up from idle sleep mode (Render cold start). You can choose to wait, retry, or continue to overview.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                            <button
                              type="button"
                              onClick={fetchDashboardEmployees}
                              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry Connection (మళ్లీ ప్రయత్నించండి)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsEmployeeOfflineBypassed(true)}
                              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Continue to Overview (కొనసాగించండి)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsEmployeeOfflineBypassed(true);
                                setIsLoadingEmployees(false);
                                onShowToast('Working with offline cache.');
                              }}
                              className="px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-amber-100/70 text-amber-800 border border-amber-300 shadow-2xs transition-all flex items-center gap-1.5"
                            >
                              <WifiOff className="w-3.5 h-3.5" />
                              <span>Dismiss / Work Offline</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <DashboardOverview
                employees={employeesList}
                onShowToast={onShowToast}
              />
            )
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



          {activeTab === 'audit_logs' && (
            <AuditLogs
              userName={userName}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'notifications' && (
            <AdminNotifications
              userName={userName}
              onShowToast={onShowToast}
              onNotificationReadChange={fetchUnreadNotifications}
            />
          )}

        </main>
      </div>

    </div>
  );
};
