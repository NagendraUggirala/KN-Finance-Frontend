import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isSuperAdminAuthenticated } from '../lib/api';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
  onShowToast?: (msg: string) => void;
}

/**
 * Route protection wrapper for Super Admin areas.
 * Enforces valid Super Admin credentials & token.
 * Unauthenticated users are redirected to /superadmin with origin preservation.
 */
export const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({
  children,
  onShowToast,
}) => {
  const location = useLocation();
  const isAuthenticated = isSuperAdminAuthenticated();
  const toastFiredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && onShowToast && !toastFiredRef.current) {
      toastFiredRef.current = true;
      onShowToast('Access restricted: Super Admin authentication required.');
    }
  }, [isAuthenticated, onShowToast]);

  if (!isAuthenticated) {
    return <Navigate to="/superadmin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
