import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// Components & Layout
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SuperAdminProtectedRoute } from './components/SuperAdminProtectedRoute';

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
import { isSuperAdminAuthenticated, superAdminLogout } from './lib/api';

// Styles
import './App.css';

export function App() {
  // Application State hydrated from stored session
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => isSuperAdminAuthenticated());
  const [userRole, setUserRole] = useState<UserRole>(() => (isSuperAdminAuthenticated() ? 'super_admin' : 'user'));
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('kn_superadmin_username') || 'Alex Sterling');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

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

    if (role === 'super_admin') {
      navigate('/super-admin');
    } else if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'employee') {
      navigate('/employee');
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    superAdminLogout();
    setIsLoggedIn(false);
    setUserRole('user');
    setUserName('Alex Sterling');
    showToast('Signed out of KN Finance.');
    navigate('/');
  }, [navigate, showToast]);

  const handleSuperadminLogout = useCallback(() => {
    superAdminLogout();
    setIsLoggedIn(false);
    setUserRole('user');
    setUserName('Alex Sterling');
    showToast('Super Admin signed out successfully. Access locked.');
    navigate('/superadmin');
  }, [navigate, showToast]);

  const handleOpenLogin = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const handleCloseLogin = useCallback(() => {
    setLoginModalOpen(false);
  }, []);

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
            path="/admin"
            element={
              <AdminDashboard
                userName={userName}
                onShowToast={showToast}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminDashboard
                userName={userName}
                onShowToast={showToast}
                onLogout={handleLogout}
              />
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
      />

    </div>
  );
}

export default App;

