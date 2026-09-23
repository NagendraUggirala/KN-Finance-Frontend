import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';

// Components & Layout
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages & Modals
import { Landing } from './Pages/Landingpages/Landing';
import { About } from './Pages/Landingpages/About';
import { Contact } from './Pages/Landingpages/Contact';
import { Login, type UserRole } from './Pages/Landingpages/Login';
import { DashboardPreview } from './Pages/Landingpages/DashboardPreview';
import { AdminDashboard } from './Pages/AdminDashboard/AdminDashboard';
import { SuperadminDashboard } from './Pages/SuperadminDashboard/SuperadminDashboard';

// Styles
import './App.css';

export function App() {
  // Application State
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userName, setUserName] = useState<string>('Alex Sterling');
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
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    showToast('Signed out of KN Finance.');
    navigate('/');
  }, [navigate, showToast]);

  const handleOpenLogin = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const handleCloseLogin = useCallback(() => {
    setLoginModalOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#166534] selection:text-white">

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-300 text-[#0F172A] shadow-xl animate-in slide-in-from-bottom-5 duration-300"
        >
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Dismiss Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar (Hidden on Super Admin dark dashboard or rendered with context) */}
      {!location.pathname.startsWith('/super-admin') && !location.pathname.startsWith('/admin') && (
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
            path="/super-admin"
            element={
              <SuperadminDashboard
                userName={userName}
                onShowToast={showToast}
                onLogout={handleLogout}
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

      {/* Footer (Hidden on Admin / Super Admin Portals for full workspace feel) */}
      {!location.pathname.startsWith('/super-admin') && !location.pathname.startsWith('/admin') && (
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

