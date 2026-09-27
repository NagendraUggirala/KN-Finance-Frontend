export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://kn-finance-backend.onrender.com';

export interface SuperAdminLoginPayload {
  username?: string;
  email?: string;
  password?: string;
}

export interface SuperAdminUser {
  id?: string | number;
  username?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface SuperAdminLoginResponse {
  message?: string;
  token?: string;
  user?: SuperAdminUser;
  [key: string]: any;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id?: string;
    username?: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface AdminItem {
  _id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateAdminPayload {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
}

export interface UpdateAdminPayload {
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface UpdateAdminStatusPayload {
  status: 'active' | 'inactive';
}

export interface AdminResponse {
  success: boolean;
  message?: string;
  admin: AdminItem;
}

export interface AdminListResponse {
  success: boolean;
  admins: AdminItem[];
}

export interface DeleteAdminResponse {
  success: boolean;
  message: string;
}

/**
 * Retrieve authorization headers for Super Admin requests
 */
export function getSuperAdminToken(): string | null {
  return (
    localStorage.getItem('kn_superadmin_token') ||
    localStorage.getItem('token') ||
    null
  );
}

/**
 * Retrieve authorization headers for Admin requests
 */
export function getAdminToken(): string | null {
  return (
    localStorage.getItem('kn_admin_token') ||
    localStorage.getItem('token') ||
    null
  );
}

/**
 * Check if the Super Admin is currently authenticated with a valid token
 */
export function isSuperAdminAuthenticated(): boolean {
  const token = getSuperAdminToken();
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && typeof payload.exp === 'number') {
        const isExpired = Date.now() >= payload.exp * 1000;
        if (isExpired) {
          superAdminLogout();
          return false;
        }
      }
      if (payload.role && !['superadmin', 'super_admin'].includes(String(payload.role).toLowerCase())) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Check if the Admin is currently authenticated
 */
export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && typeof payload.exp === 'number') {
        const isExpired = Date.now() >= payload.exp * 1000;
        if (isExpired) {
          adminLogout();
          return false;
        }
      }
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Super Admin Logout utility - clears all credentials and session items
 */
export function superAdminLogout(): void {
  localStorage.removeItem('kn_superadmin_token');
  localStorage.removeItem('kn_superadmin_user');
  localStorage.removeItem('kn_superadmin_username');
  localStorage.removeItem('token');
}

/**
 * Admin Logout utility
 */
export function adminLogout(): void {
  localStorage.removeItem('kn_admin_token');
  localStorage.removeItem('kn_admin_user');
  localStorage.removeItem('kn_admin_name');
  localStorage.removeItem('token');
}

/**
 * Save Super Admin session info
 */
export function setSuperAdminSession(token: string, username?: string, userObj?: any): void {
  if (token) {
    localStorage.setItem('kn_superadmin_token', token);
    localStorage.setItem('token', token);
  }
  if (username) {
    localStorage.setItem('kn_superadmin_username', username);
  }
  if (userObj) {
    localStorage.setItem('kn_superadmin_user', JSON.stringify(userObj));
  }
}

/**
 * Save Admin session info
 */
export function setAdminSession(token: string, userObj?: any): void {
  if (token) {
    localStorage.setItem('kn_admin_token', token);
    localStorage.setItem('token', token);
  }
  if (userObj) {
    localStorage.setItem('kn_admin_user', JSON.stringify(userObj));
    if (userObj.name || userObj.username) {
      localStorage.setItem('kn_admin_name', userObj.name || userObj.username);
    }
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getSuperAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Super Admin Login API caller
 * Calls backend endpoint POST /api/auth/superadmin/login
 */
export async function superAdminLoginApi(credentials: SuperAdminLoginPayload): Promise<SuperAdminLoginResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/auth/superadmin/login`;

  const payload = {
    username: credentials.username || credentials.email,
    password: credentials.password,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Super Admin login failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (data?.token) {
    setSuperAdminSession(data.token, data.user?.username, data.user);
  }

  return data;
}

/**
 * Admin Login API caller
 * Calls backend endpoint POST /api/auth/login
 */
export async function adminLoginApi(credentials: AdminLoginPayload): Promise<AdminLoginResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/auth/login`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Admin login failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (data?.token) {
    setAdminSession(data.token, data.user);
  }

  return data;
}

/**
 * Forgot Password - Request OTP
 * Calls backend endpoint POST /api/auth/forgot-password
 */
export async function forgotPasswordApi(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/auth/forgot-password`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to request OTP (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Resend Password Reset OTP
 * Calls backend endpoint POST /api/auth/resend-otp
 */
export async function resendOtpApi(payload: ResendOtpPayload): Promise<ResendOtpResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/auth/resend-otp`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to resend OTP (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Verify 6-Digit OTP
 * Calls backend endpoint POST /api/auth/verify-otp
 */
export async function verifyOtpApi(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/auth/verify-otp`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to verify OTP (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Set New Password
 * Calls backend endpoint POST /api/auth/reset-password
 */
export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/auth/reset-password`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to reset password (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * GET /api/superadmin/admins
 * Retrieve a list of all Admin accounts (passwords excluded).
 */
export async function getAllAdminsApi(): Promise<AdminListResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/superadmin/admins`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch admins (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * GET /api/superadmin/admins/{adminId}
 * Retrieve details of a specific Admin by MongoDB ID.
 */
export async function getAdminByIdApi(adminId: string): Promise<AdminResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/superadmin/admins/${encodeURIComponent(adminId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch admin (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/superadmin/admins
 * Create a new Admin account.
 */
export async function createAdminApi(payload: CreateAdminPayload): Promise<AdminResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/superadmin/admins`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to create admin (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * PUT /api/superadmin/admins/{adminId}
 * Update fields for an Admin (username, name, email, phone, password).
 */
export async function updateAdminApi(adminId: string, payload: UpdateAdminPayload): Promise<AdminResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/superadmin/admins/${encodeURIComponent(adminId)}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to update admin (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * DELETE /api/superadmin/admins/{adminId}
 * Permanently delete an Admin account.
 */
export async function deleteAdminApi(adminId: string): Promise<DeleteAdminResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/superadmin/admins/${encodeURIComponent(adminId)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to delete admin (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * PATCH /api/superadmin/admins/{adminId}/status
 * Change the status of an Admin to either "active" or "inactive".
 */
export async function updateAdminStatusApi(adminId: string, status: 'active' | 'inactive'): Promise<AdminResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/superadmin/admins/${encodeURIComponent(adminId)}/status`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to update admin status (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}
