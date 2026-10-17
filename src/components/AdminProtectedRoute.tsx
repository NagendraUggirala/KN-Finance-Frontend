import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated, isSuperAdminAuthenticated, adminLogout } from '../lib/api';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  onShowToast?: (msg: string) => void;
}

/**
 * Route protection wrapper for Admin pages (/admin, /admin/audit-logs).
 * Enforces valid Admin or Super Admin authentication and active JWT token.
 * If token is expired or missing, clears admin session and redirects to login.
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  onShowToast,
}) => {
  const location = useLocation();
  const isAuthenticated = isAdminAuthenticated() || isSuperAdminAuthenticated();
  const toastFiredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      adminLogout();
      if (onShowToast && !toastFiredRef.current) {
        toastFiredRef.current = true;
        onShowToast('Session expired or login required. Please sign in as Administrator.');
      }
    }
  }, [isAuthenticated, onShowToast]);

  if (!isAuthenticated) {
    return <Navigate to="/?login=admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
