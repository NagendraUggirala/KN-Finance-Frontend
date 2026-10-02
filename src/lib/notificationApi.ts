import type {
  CreateNotificationPayload,
  NotificationItem,
  NotificationHistoryResponse,
  AdminInboxResponse,
} from '../types/notification';

// Prioritize configured API base (which issued the current session token), then local backend, then cloud Render
const configuredBase = (import.meta.env.VITE_API_BASE_URL || 'https://kn-finance-backend.onrender.com').replace(/\/+$/, '');
const CANDIDATE_API_BASES = [
  `${configuredBase}/api/v1/notifications`,
  'http://localhost:5000/api/v1/notifications',
  'https://kn-finance-backend.onrender.com/api/v1/notifications',
].filter((b, idx, self) => Boolean(b) && self.indexOf(b) === idx);

/**
 * Safely parse role from JWT payload to avoid sending admin token to superadmin endpoints
 */
function parseJwtRole(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role ? String(payload.role).toLowerCase() : null;
    }
  } catch {}
  return null;
}

/**
 * Select the appropriate token for the request based on required role
 */
export const getAuthHeadersForRole = (requiredRole?: 'superadmin' | 'admin'): Record<string, string> => {
  let token = '';

  if (requiredRole === 'superadmin') {
    // Look specifically for superadmin credentials
    const sa = localStorage.getItem('kn_superadmin_token');
    const generic = localStorage.getItem('token');

    if (sa && parseJwtRole(sa) === 'superadmin') {
      token = sa;
    } else if (generic && parseJwtRole(generic) === 'superadmin') {
      token = generic;
    } else {
      token = sa || generic || '';
    }
  } else if (requiredRole === 'admin') {
    // Look for branch admin credentials
    const adm = localStorage.getItem('kn_admin_token');
    const generic = localStorage.getItem('token');

    if (adm && parseJwtRole(adm) === 'admin') {
      token = adm;
    } else if (generic && parseJwtRole(generic) === 'admin') {
      token = generic;
    } else {
      token = adm || generic || '';
    }
  } else {
    token =
      localStorage.getItem('token') ||
      localStorage.getItem('kn_superadmin_token') ||
      localStorage.getItem('kn_admin_token') ||
      '';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Resilient request helper that tries candidate gateways:
 * 1. Configured backend (e.g. Render / VITE_API_BASE_URL)
 * 2. Local development server (http://localhost:5000)
 *
 * Automatically chooses the right token for the role ('superadmin' vs 'admin').
 * Falls through on 401 token mismatch or connection failure.
 */
async function requestWithFallback<T>(
  path: string,
  options: RequestInit = {},
  requiredRole?: 'superadmin' | 'admin'
): Promise<T> {
  const headers = {
    ...getAuthHeadersForRole(requiredRole),
    ...(options.headers as Record<string, string> || {}),
  };

  let lastError: any = null;

  for (const base of CANDIDATE_API_BASES) {
    try {
      const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
      const url = `${base}${cleanPath}`;

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 401 Unauthorized, token might belong to the other candidate gateway
        if (response.status === 401 && CANDIDATE_API_BASES.length > 1) {
          lastError = new Error(data?.message || 'Unauthorized');
          continue;
        }

        const message =
          data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      // If it was a network failure (server not running on localhost), try next base URL
      if (
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('ECONNREFUSED')
      ) {
        continue;
      }
      // For operational API errors (e.g. 400 Bad Request, 403 Forbidden), rethrow immediately
      throw err;
    }
  }

  throw lastError || new Error('Failed to connect to notification service.');
}

export const notificationApi = {
  // --- Super Admin Operations ---

  /**
   * POST /api/v1/notifications
   * Dispatch notification + optional email via SMTP
   */
  dispatchNotification: async (
    payload: CreateNotificationPayload
  ): Promise<{ success: boolean; message: string; data?: NotificationItem; notification?: NotificationItem }> => {
    return requestWithFallback<{
      success: boolean;
      message: string;
      data?: NotificationItem;
      notification?: NotificationItem;
    }>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 'superadmin');
  },

  /**
   * GET /api/v1/notifications/history
   * Dispatched history with targeting, counts, email status (Super Admin only)
   */
  getDispatchedHistory: async (params?: {
    page?: number;
    limit?: number;
    severity?: string;
    recipientType?: string;
    search?: string;
  }): Promise<NotificationHistoryResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.severity && params.severity !== 'all') searchParams.set('severity', params.severity);
    if (params?.recipientType && params.recipientType !== 'all') searchParams.set('recipientType', params.recipientType);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const path = `/history${query ? `?${query}` : ''}`;
    return requestWithFallback<NotificationHistoryResponse>(path, {
      method: 'GET',
    }, 'superadmin');
  },

  /**
   * DELETE /api/v1/notifications/:id
   * Permanently delete a dispatched notification
   */
  deleteNotification: async (id: string): Promise<{ success: boolean; message: string }> => {
    return requestWithFallback<{ success: boolean; message: string }>(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }, 'superadmin');
  },

  /**
   * POST /api/v1/notifications/:id/resend
   * Resend notification email to target recipients via SMTP
   */
  resendEmail: async (id: string): Promise<{ success: boolean; message: string; data?: any }> => {
    return requestWithFallback<{ success: boolean; message: string; data?: any }>(
      `/${encodeURIComponent(id)}/resend`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      'superadmin'
    );
  },

  // --- Branch Admin Operations ---

  /**
   * GET /api/v1/notifications/inbox
   * Branch admin personal notifications inbox
   */
  getAdminInbox: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    severity?: string;
    search?: string;
  }): Promise<AdminInboxResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly));
    if (params?.severity && params.severity !== 'all') searchParams.set('severity', params.severity);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const path = `/inbox${query ? `?${query}` : ''}`;
    return requestWithFallback<AdminInboxResponse>(path, {
      method: 'GET',
    }, 'admin');
  },

  /**
   * GET /api/v1/notifications/unread-count
   * Returns current unread count for the authenticated admin
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await requestWithFallback<{ success: boolean; unreadCount: number }>('/unread-count', {
        method: 'GET',
      }, 'admin');
      return typeof res?.unreadCount === 'number' ? res.unreadCount : 0;
    } catch (err) {
      console.warn('Unable to fetch unread notification count:', err);
      return 0;
    }
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return requestWithFallback<{ success: boolean; message?: string }>(`/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }, 'admin');
  },

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read for current admin
   */
  markAllAsRead: async (): Promise<{ success: boolean; message?: string; modifiedCount?: number }> => {
    return requestWithFallback<{ success: boolean; message?: string; modifiedCount?: number }>('/read-all', {
      method: 'PATCH',
      body: JSON.stringify({}),
    }, 'admin');
  },
};
