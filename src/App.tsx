import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// Components & Layout
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SuperAdminProtectedRoute } from './components/SuperAdminProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';

// Pages & Modals
import { Landing } from './Pages/Landingpages/Landing';
import { About } from './Pages/Landingpages/About';
import { Contact } from './Pages/Landingpages/Contact';
import { Login, type UserRole } from './Pages/Landingpages/Login';
import { DashboardPreview } from './Pages/Landingpages/DashboardPreview';
import { AdminDashboard } from './Pages/AdminDashboard/AdminDashboard';
import { SuperadminDashboard } from './Pages/SuperadminDashboard/SuperadminDashboard';
import { SuperadminLogin } from './Pages/Landingpages/SuperadminLogin';
import { EmployeeDashboard } from './Pages/EmployeeDashboard/EmployeeDashboard';
import {
  isSuperAdminAuthenticated,
  superAdminLogout,
  isAdminAuthenticated,
  adminLogout,
  isEmployeeAuthenticated,
  employeeLogout,
} from './lib/api';

// Styles
import './App.css';

export function App() {
  // Application State hydrated from stored session
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<'admin' | 'employee'>('admin');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => isSuperAdminAuthenticated() || isAdminAuthenticated() || isEmployeeAuthenticated()
  );
  const [userRole, setUserRole] = useState<UserRole>(() => {
    if (isSuperAdminAuthenticated()) return 'super_admin';
    if (isAdminAuthenticated()) return 'admin';
    if (isEmployeeAuthenticated()) return 'employee';
    return 'user';
  });
  const [userName, setUserName] = useState<string>(() => {
    if (isSuperAdminAuthenticated()) return localStorage.getItem('kn_superadmin_username') || 'Alex Sterling';
    if (isAdminAuthenticated()) return localStorage.getItem('kn_admin_name') || 'Administrator';
    const empUser = localStorage.getItem('kn_employee_user');
    if (empUser) {
      try {
        const parsed = JSON.parse(empUser);
        return parsed?.fullName || parsed?.name || 'Field Officer';
      } catch {}
    }
    return 'Alex Sterling';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Trigger login modal if navigating to /login or with ?login param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const loginParam = searchParams.get('login');
    if (location.pathname === '/login' || loginParam) {
      if (loginParam === 'admin' && (isAdminAuthenticated() || isSuperAdminAuthenticated())) {
        setLoginModalOpen(false);
        navigate('/admin', { replace: true });
        return;
      }
      setLoginModalOpen(true);
      if (loginParam === 'employee') {
        setLoginInitialRole('employee');
      } else {
        setLoginInitialRole('admin');
      }
    }
  }, [location.pathname, location.search, navigate]);

  // Automatically scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Toast Notification Manager
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Auth Handlers
  const handleLoginSuccess = useCallback((name: string, role: UserRole) => {
    setIsLoggedIn(true);
    setUserName(name);
    setUserRole(role);
    setLoginModalOpen(false);

    if (role === 'super_admin' || (role as string) === 'superadmin') {
      navigate('/super-admin', { replace: true });
    } else if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'employee') {
      navigate('/employee', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    superAdminLogout();
    adminLogout();
    employeeLogout();
    setIsLoggedIn(false);
    setUserRole('user');
    setUserName('Alex Sterling');
    showToast('Signed out of KN Finance.');
    navigate('/');
  }, [navigate, showToast]);

  const handleSuperadminLogout = useCallback(() => {
    superAdminLogout();
    adminLogout();
    employeeLogout();
    setIsLoggedIn(false);
    setUserRole('user');
    setUserName('Alex Sterling');
    showToast('Super Admin signed out successfully. Access locked.');
    navigate('/superadmin');
  }, [navigate, showToast]);

  const handleOpenLogin = useCallback(() => {
    setLoginInitialRole('admin');
    setLoginModalOpen(true);
  }, []);

  const handleCloseLogin = useCallback(() => {
    setLoginModalOpen(false);
    if (location.pathname === '/login') {
      navigate('/', { replace: true });
    } else if (location.search.includes('login=')) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('login');
      const newSearch = searchParams.toString();
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#166534] selection:text-white">

      {/* Toast Notification Banner - Centered at top, high z-index, visible on mobile & desktop */}
      {toastMessage && (() => {
        const isError = Boolean(
          toastMessage.toLowerCase().includes('fail') ||
          toastMessage.toLowerCase().includes('error') ||
          toastMessage.toLowerCase().includes('status 5') ||
          toastMessage.toLowerCase().includes('status 4')
        );

        return (
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl max-w-md w-[92%] sm:w-auto min-w-[280px] animate-in slide-in-from-top-4 duration-300 border ${
              isError
                ? 'bg-rose-950/95 text-rose-100 border-rose-700/80 backdrop-blur-md'
                : 'bg-slate-900/95 text-white border-slate-700/80 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isError ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span className="text-xs font-bold leading-snug">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Dismiss Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* Top Navigation Bar (Hidden on Super Admin / Admin / Employee portals & Superadmin login) */}
      {!location.pathname.startsWith('/super-admin') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/employee') && !location.pathname.startsWith('/superadmin') && (
        <Navbar
          isLoggedIn={isLoggedIn}
          userName={userName}
          userRole={userRole}
          onOpenLogin={handleOpenLogin}
          onLogout={handleLogout}
        />
      )}

      {/* Main Page Routing */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Landing
                onOpenLogin={handleOpenLogin}
                onShowToast={showToast}
              />
            }
          />
          <Route
            path="/features"
            element={
              <Landing
                onOpenLogin={handleOpenLogin}
                onShowToast={showToast}
              />
            }
          />
          <Route
            path="/about"
            element={
              <About
                onOpenLogin={handleOpenLogin}
              />
            }
          />
          <Route
            path="/contact"
            element={<Contact onShowToast={showToast} />}
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPreview
                userName={userName}
                onShowToast={showToast}
              />
            }
          />
          <Route
            path="/employee"
            element={
              <EmployeeDashboard
                userName={userName}
                onShowToast={showToast}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/login"
            element={
              <Landing
                onOpenLogin={handleOpenLogin}
                onShowToast={showToast}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute onShowToast={showToast}>
                <AdminDashboard
                  userName={userName}
                  onShowToast={showToast}
                  onLogout={handleLogout}
                />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <AdminProtectedRoute onShowToast={showToast}>
                <AdminDashboard
                  userName={userName}
                  onShowToast={showToast}
                  onLogout={handleLogout}
                />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/employee-dashboard"
            element={
              <EmployeeDashboard
                userName={userName}
                onShowToast={showToast}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/superadmin-dashboard"
            element={
              <SuperAdminProtectedRoute onShowToast={showToast}>
                <SuperadminDashboard
                  userName={userName}
                  onShowToast={showToast}
                  onLogout={handleSuperadminLogout}
                />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminProtectedRoute onShowToast={showToast}>
                <AdminDashboard
                  userName={userName}
                  onShowToast={showToast}
                  onLogout={handleLogout}
                />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <SuperAdminProtectedRoute onShowToast={showToast}>
                <SuperadminDashboard
                  userName={userName}
                  onShowToast={showToast}
                  onLogout={handleSuperadminLogout}
                />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/audit-logs"
            element={
              <SuperAdminProtectedRoute onShowToast={showToast}>
                <SuperadminDashboard
                  userName={userName}
                  onShowToast={showToast}
                  onLogout={handleSuperadminLogout}
                />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <SuperadminLogin
                onLoginSuccess={handleLoginSuccess}
                onShowToast={showToast}
              />
            }
          />
          {/* Fallback Route */}
          <Route
            path="*"
            element={
              <Landing
                onOpenLogin={handleOpenLogin}
                onShowToast={showToast}
              />
            }
          />
        </Routes>
      </main>

      {/* Footer (Hidden on Admin / Super Admin / Employee Portals & Login for full workspace feel) */}
      {!location.pathname.startsWith('/super-admin') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/employee') && !location.pathname.startsWith('/superadmin') && (
        <Footer onShowToast={showToast} />
      )}

      {/* Authentication Modal */}
      <Login
        isOpen={loginModalOpen}
        onClose={handleCloseLogin}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
        initialRole={loginInitialRole}
      />

    </div>
  );
}

export default App;

