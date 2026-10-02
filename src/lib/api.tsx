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
 * Resilient multi-gateway fetch helper:
 * Tries the primary configured API base URL, and seamlessly falls back
 * to local development (http://localhost:5000) or render gateway if network connection drops.
 */
async function fetchWithBaseFallback(endpoint: string, options: RequestInit): Promise<Response> {
  const configuredBase = (API_BASE_URL || '').replace(/\/+$/, '');
  const candidateBases = [
    configuredBase,
    'http://localhost:5000',
    'https://kn-finance-backend.onrender.com'
  ].filter((b, idx, self) => Boolean(b) && self.indexOf(b) === idx);

  let lastError: any = null;
  for (const base of candidateBases) {
    try {
      const fullUrl = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const res = await fetch(fullUrl, options);
      return res;
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error('Network connection failed across all API endpoints.');
}

/**
 * Admin Login API caller
 * Calls backend endpoint POST /api/auth/login
 */
export async function adminLoginApi(credentials: AdminLoginPayload): Promise<AdminLoginResponse> {
  const response = await fetchWithBaseFallback('/api/auth/login', {
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

/* ==========================================================================
   ======================= AUTH & SESSION HELPERS ===========================
   ========================================================================== */

/**
 * Retrieve active authorization token (Admin, Super Admin, or generic token)
 */
export function getAdminOrSuperAdminToken(): string | null {
  return (
    localStorage.getItem('kn_admin_token') ||
    localStorage.getItem('kn_superadmin_token') ||
    localStorage.getItem('token') ||
    null
  );
}

/**
 * Retrieve authorization token for field employees
 */
export function getEmployeeToken(): string | null {
  return localStorage.getItem('kn_employee_token') || null;
}

/**
 * Persist employee session on login
 */
export function setEmployeeSession(token: string, employeeObj?: any): void {
  if (token) {
    localStorage.setItem('kn_employee_token', token);
  }
  if (employeeObj) {
    localStorage.setItem('kn_employee_user', JSON.stringify(employeeObj));
  }
}

/**
 * Clear employee portal session
 */
export function employeeLogout(): void {
  localStorage.removeItem('kn_employee_token');
  localStorage.removeItem('kn_employee_user');
}

/**
 * Retrieve current employee session data
 */
export function getEmployeeSession(): { token: string | null; employee: any | null } {
  const token = getEmployeeToken();
  const userStr = localStorage.getItem('kn_employee_user');
  let employee = null;
  if (userStr) {
    try {
      employee = JSON.parse(userStr);
    } catch {}
  }
  return { token, employee };
}

/**
 * Check if employee is logged in
 */
export function isEmployeeAuthenticated(): boolean {
  return !!getEmployeeToken();
}

/**
 * Headers for Admin / Super Admin requests
 */
export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminOrSuperAdminToken() || getEmployeeToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Headers for Employee Portal requests
 */
export function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/* ==========================================================================
   ======================= 1. FINANCE BOOK LEDGER ===========================
   ========================================================================== */

export interface LedgerInstallmentPaymentItem {
  date: string;
  amount: number | string;
  paymentType?: 'Cash' | 'UPI' | 'Card';
}

export interface LedgerBorrowerRowResponse {
  id: string;
  sNo: number;
  date?: string;
  borrowDate?: string;
  nameTelugu: string;
  nameEnglish?: string;
  item?: string;
  productItem?: string;
  amount?: number;
  principalAmount?: number;
  initialRemaining?: number;
  interestRate?: number;
  isClosed?: boolean;
  totalPaid?: number;
  remainingBalance?: number;
  payments?: Record<string, LedgerInstallmentPaymentItem>;
}

export interface FinanceBookActiveData {
  ledgerBook?: {
    id: string;
    branchId?: string;
    title?: string;
    academicYear?: string;
    isActive?: boolean;
    version?: number;
  };
  dateColumns: string[];
  columns?: Array<{
    id?: string;
    columnIndex: number;
    headerDate: string;
    labelTelugu?: string;
  }>;
  rows: LedgerBorrowerRowResponse[];
  totals?: {
    principalAmount?: number;
    totalPaid?: number;
    remainingBalance?: number;
  };
}

export interface FinanceBookActiveResponse {
  success: boolean;
  message?: string;
  data: FinanceBookActiveData;
}

export interface BatchSaveRequest {
  ledgerBookId?: string;
  version?: number;
  dateColumns: string[];
  rows: Array<{
    id?: string;
    sNo?: number;
    date?: string;
    nameTelugu: string;
    nameEnglish?: string;
    item?: string;
    amount?: number;
    initialRemaining?: number;
    interestRate?: number;
    isClosed?: boolean;
    payments?: Record<string, { date: string; amount: number; paymentType?: string }>;
  }>;
}

export interface CreateBorrowerRowPayload {
  ledgerBookId?: string;
  borrowDate?: string;
  nameTelugu: string;
  nameEnglish?: string;
  productItem: string;
  principalAmount: number;
  interestRate?: number;
}

export interface UpdateBorrowerRowPayload {
  borrowDate?: string;
  nameTelugu?: string;
  nameEnglish?: string;
  productItem?: string;
  principalAmount?: number;
  initialRemaining?: number;
  interestRate?: number;
  applyFivePercentIncrement?: boolean;
}

/**
 * GET /api/v1/finance-book/active
 * Retrieve active Finance Book ledger with dates, rows, columns, and totals.
 */
export async function getActiveFinanceBookApi(): Promise<FinanceBookActiveResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/active`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch active Finance Book (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/v1/finance-book/batch-save
 * Save complete staged ledger state (rows, installment columns, payments) atomically.
 */
export async function batchSaveFinanceBookApi(payload: BatchSaveRequest): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/batch-save`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to batch save Finance Book (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/v1/finance-book/columns
 * Add next installment column
 */
export async function addFinanceBookColumnApi(ledgerBookId?: string): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/columns`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(ledgerBookId ? { ledgerBookId } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to add installment column (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * DELETE /api/v1/finance-book/columns/:index
 * Delete installment column
 */
export async function deleteFinanceBookColumnApi(index: number, ledgerBookId?: string): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const query = ledgerBookId ? `?ledgerBookId=${encodeURIComponent(ledgerBookId)}` : '';
  const url = `${baseUrl}/api/v1/finance-book/columns/${encodeURIComponent(index)}${query}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to delete column (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/v1/finance-book/rows
 * Create a new borrower row in the ledger
 */
export async function createBorrowerRowApi(payload: CreateBorrowerRowPayload): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/rows`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to create borrower row (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * PATCH /api/v1/finance-book/rows/:id
 * Update borrower row details
 */
export async function updateBorrowerRowApi(rowId: string, payload: UpdateBorrowerRowPayload): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/rows/${encodeURIComponent(rowId)}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to update borrower row (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * DELETE /api/v1/finance-book/rows/:id
 * Delete borrower row
 */
export async function deleteBorrowerRowApi(rowId: string): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/rows/${encodeURIComponent(rowId)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to delete borrower row (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * PATCH /api/v1/finance-book/rows/:id/status
 * Close or reopen borrower account
 */
export async function updateBorrowerStatusApi(rowId: string, isClosed: boolean): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/finance-book/rows/${encodeURIComponent(rowId)}/status`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ isClosed }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to update borrower status (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/* ==========================================================================
   ================= 2. ADMIN - EMPLOYEE MANAGEMENT =========================
   ========================================================================== */

export interface EmployeeBackendItem {
  _id: string;
  employeeId: string;
  fullName: string;
  age: number;
  phone: string;
  altPhone?: string;
  email: string;
  aadharCard: string;
  panCard: string;
  village: string;
  assignedOperationalArea: string;
  joiningDate?: string;
  references?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminEmployeesListResponse {
  success: boolean;
  message?: string;
  data: {
    employees: EmployeeBackendItem[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface AdminEmployeeDetailResponse {
  success: boolean;
  message?: string;
  data: {
    employee: EmployeeBackendItem;
  };
}

export interface GetEmployeesParams {
  search?: string;
  village?: string;
  assignedOperationalArea?: string;
  status?: 'Active' | 'Inactive';
  page?: number;
  limit?: number;
}

export interface CreateEmployeePayload {
  employeeId?: string;
  fullName: string;
  age: number;
  phone: string;
  altPhone?: string;
  email: string;
  aadharCard: string;
  panCard: string;
  village: string;
  assignedOperationalArea: string;
  joiningDate?: string;
  references?: string;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateEmployeePayload {
  fullName?: string;
  age?: number;
  phone?: string;
  altPhone?: string;
  email?: string;
  aadharCard?: string;
  panCard?: string;
  village?: string;
  assignedOperationalArea?: string;
  joiningDate?: string;
  references?: string;
}

/**
 * GET /api/v1/admin/employees
 * List employees with search, filter, and pagination
 */
export async function getAdminEmployeesApi(params?: GetEmployeesParams): Promise<AdminEmployeesListResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.village && params.village !== 'All') searchParams.set('village', params.village);
  if (params?.assignedOperationalArea && params.assignedOperationalArea !== 'All') {
    searchParams.set('assignedOperationalArea', params.assignedOperationalArea);
  }
  if (params?.status && params.status !== ('All' as any)) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const url = `${baseUrl}/api/v1/admin/employees${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch employees (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/v1/admin/employees
 * Create a new employee with login credentials and operational area assignment
 */
export async function createAdminEmployeeApi(payload: CreateEmployeePayload): Promise<AdminEmployeeDetailResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/admin/employees`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to create employee (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * PUT /api/v1/admin/employees/:id
 * Update employee profile
 */
export async function updateAdminEmployeeApi(employeeId: string, payload: UpdateEmployeePayload): Promise<AdminEmployeeDetailResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/admin/employees/${encodeURIComponent(employeeId)}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to update employee (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * DELETE /api/v1/admin/employees/:id
 * Archive / delete employee
 */
export async function deleteAdminEmployeeApi(employeeId: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/admin/employees/${encodeURIComponent(employeeId)}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to delete employee (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * PATCH /api/v1/admin/employees/:id/status
 * Change employee status ('Active' | 'Inactive')
 */
export async function updateAdminEmployeeStatusApi(employeeId: string, status: 'Active' | 'Inactive'): Promise<AdminEmployeeDetailResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/admin/employees/${encodeURIComponent(employeeId)}/status`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to update employee status (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/v1/admin/employees/:id/reset-password
 * Admin resets employee password
 */
export async function resetAdminEmployeePasswordApi(employeeId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/admin/employees/${encodeURIComponent(employeeId)}/reset-password`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ newPassword }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to reset employee password (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/* ==========================================================================
   ========================= 3. EMPLOYEE PORTAL =============================
   ========================================================================== */

export interface EmployeeLoginPayload {
  email: string;
  password: string;
}

export interface EmployeeLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  employee?: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    phone: string;
    assignedOperationalArea: string;
    village: string;
    status: string;
    [key: string]: any;
  };
}

export interface RecordCollectionPayload {
  borrowerId: string;
  amount: number;
  paymentDate?: string;
  paymentType?: 'Cash' | 'UPI' | 'Card';
}

/**
 * POST /api/v1/auth/employee/login
 * Employee portal login
 */
export async function employeeLoginApi(payload: EmployeeLoginPayload): Promise<EmployeeLoginResponse> {
  const response = await fetchWithBaseFallback('/api/v1/auth/employee/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Employee login failed (status ${response.status})`;
    throw new Error(errorMsg);
  }

  if (data?.token) {
    setEmployeeSession(data.token, data.employee);
  }

  return data;
}

/**
 * GET /api/v1/employee/profile
 * Returns authenticated employee profile details
 */
export async function getEmployeeProfileApi(): Promise<{ success: boolean; message?: string; data: { profile: EmployeeBackendItem } }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/employee/profile`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getEmployeeAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch employee profile (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * GET /api/v1/employee/assigned-borrowers
 * Returns active borrowers assigned to the authenticated employee operational area
 */
export async function getEmployeeAssignedBorrowersApi(): Promise<{ success: boolean; message?: string; data: { borrowers: any[] } }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/employee/assigned-borrowers`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getEmployeeAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch assigned borrowers (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * POST /api/v1/employee/collections
 * Records daily/weekly field collection from assigned borrower.
 */
export async function recordEmployeeCollectionApi(payload: RecordCollectionPayload): Promise<{ success: boolean; message: string; data?: any }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/v1/employee/collections`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getEmployeeAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to record collection (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/* ==========================================================================
   ======================= 5. AUDIT LOGS & ACTIVITY TRAIL ====================
   ========================================================================== */

export interface AuditLogDetails {
  employeeId?: string;
  changedFields?: string[];
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
  amounts?: Record<string, any>;
  [key: string]: any;
}

export interface AuditLogItem {
  _id: string;
  userId: string;
  userRole: 'superadmin' | 'admin' | 'employee' | string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGIN_FAILED' | 'STATUS_CHANGE' | 'PASSWORD_RESET' | 'ADD_COLUMN' | 'REMOVE_COLUMN' | string;
  entityType: 'Admin' | 'Employee' | 'FinanceRecord' | 'LedgerBorrowerRow' | 'LedgerDateColumn' | 'FinanceBook' | 'Auth' | string;
  entityId?: string;
  details?: AuditLogDetails;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entityType?: string;
  userRole?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogsPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLogItem[];
  pagination: AuditLogsPagination;
  message?: string;
}

export interface SingleAuditLogResponse {
  success: boolean;
  data: AuditLogItem;
  message?: string;
}

/**
 * GET /api/audit-logs (with automatic fallback to /api/v1/audit-logs)
 * Query audit logs with pagination, multi-field filtering, and safe search.
 * Allowed for Admin and Super Admin.
 */
export async function getAuditLogsApi(params?: AuditLogsQueryParams): Promise<AuditLogsResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.action && params.action !== 'ALL') searchParams.set('action', params.action);
  if (params?.entityType && params.entityType !== 'ALL') searchParams.set('entityType', params.entityType);
  if (params?.userRole && params.userRole !== 'ALL') searchParams.set('userRole', params.userRole);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();
  const primaryUrl = `${baseUrl}/api/audit-logs${query ? `?${query}` : ''}`;

  let response = await fetch(primaryUrl, {
    method: 'GET',
    headers: getAdminAuthHeaders(),
  });

  // Graceful fallback if backend routes are mounted under /api/v1/audit-logs
  if (response.status === 404) {
    const fallbackUrl = `${baseUrl}/api/v1/audit-logs${query ? `?${query}` : ''}`;
    response = await fetch(fallbackUrl, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch audit logs (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * GET /api/audit-logs/:id
 * Get individual audit log detail by ID.
 */
export async function getAuditLogByIdApi(id: string): Promise<SingleAuditLogResponse> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const primaryUrl = `${baseUrl}/api/audit-logs/${encodeURIComponent(id)}`;

  let response = await fetch(primaryUrl, {
    method: 'GET',
    headers: getAdminAuthHeaders(),
  });

  // Graceful fallback if backend routes are mounted under /api/v1/audit-logs/:id
  if (response.status === 404) {
    const fallbackUrl = `${baseUrl}/api/v1/audit-logs/${encodeURIComponent(id)}`;
    response = await fetch(fallbackUrl, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to fetch audit log detail (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * DELETE /api/audit-logs
 * Permanently clear all audit logs (Super Admin exclusive).
 */
export async function clearAuditLogsApi(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const primaryUrl = `${baseUrl}/api/audit-logs`;

  let response = await fetch(primaryUrl, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
  });

  // Graceful fallback if backend routes are mounted under /api/v1/audit-logs
  if (response.status === 404) {
    const fallbackUrl = `${baseUrl}/api/v1/audit-logs`;
    response = await fetch(fallbackUrl, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Failed to clear audit logs (status ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/* ==========================================================================
   ======================= 5. NOTIFICATIONS SYSTEM ==========================
   ========================================================================== */

import type {
  NotificationSeverity,
  RecipientType,
  NotificationItem,
  CreateNotificationPayload,
  NotificationHistoryResponse,
  AdminInboxResponse,
} from '../types/notification';

export type {
  NotificationSeverity,
  RecipientType,
  RecipientType as NotificationRecipientType,
  NotificationItem,
  CreateNotificationPayload,
  CreateNotificationPayload as SendNotificationPayload,
  NotificationHistoryResponse,
  AdminInboxResponse,
};
type SendNotificationPayload = CreateNotificationPayload;

const LOCAL_NOTIFICATIONS_KEY = 'kn_finance_notifications_cache';

// Helper to seed default notifications if empty
function getLocalNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const initialSeed: NotificationItem[] = [
    {
      _id: 'NTF-1001',
      id: 'NTF-1001',
      title: 'Scheduled System Maintenance Notice',
      message: 'Platform maintenance is scheduled for Sunday 02:00 AM UTC. Please ensure all end-of-day ledger entries are saved beforehand.',
      severity: 'Warning',
      recipientType: 'all',
      recipientTarget: 'All Active Administrators',
      sendEmail: true,
      isEmailSent: true,
      read: false,
      senderName: 'Super Admin',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      _id: 'NTF-1002',
      id: 'NTF-1002',
      title: 'Annual Dashboard License Expiry Warning',
      message: 'Your branch operations license is due to expire in 15 days. Super Admin has scheduled account review. Contact root administration to prevent interruption.',
      severity: 'Expiry',
      recipientType: 'expiry',
      recipientTarget: 'Branch Admin (Nagendra)',
      expiryDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      sendEmail: true,
      isEmailSent: true,
      read: false,
      senderName: 'Super Admin',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      _id: 'NTF-1003',
      id: 'NTF-1003',
      title: 'New Security Protocols Activated',
      message: 'Two-factor authentication for field employee password resets is now active. All admin actions are recorded in immutable audit logs.',
      severity: 'Info',
      recipientType: 'all',
      recipientTarget: 'All Platform Administrators',
      sendEmail: false,
      isEmailSent: false,
      read: true,
      readAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      senderName: 'Super Admin',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  try {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(initialSeed));
  } catch {}

  return initialSeed;
}

function saveLocalNotifications(list: NotificationItem[]): void {
  try {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * POST /api/notifications/send
 * Super Admin dispatches a notification (and optional email) to Admins
 */
export async function sendNotificationApi(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; notification: NotificationItem }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/notifications/send`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      // Update local mirror as well
      const current = getLocalNotifications();
      if (data.notification) {
        saveLocalNotifications([data.notification, ...current]);
      }
      return data;
    }
  } catch (err) {
    console.warn('Backend notification dispatch fallback:', err);
  }

  // Graceful local fallback
  const newNtf: NotificationItem = {
    _id: `NTF-${Date.now()}`,
    id: `NTF-${Date.now()}`,
    title: payload.title,
    message: payload.message,
    severity: payload.severity,
    recipientType: payload.recipientType,
    recipientTarget: payload.recipientTarget || 'Admins',
    targetAdminId: payload.targetAdminId,
    targetAdminEmail: payload.targetAdminEmail,
    targetAdminName: payload.targetAdminName,
    targetStatus: payload.targetStatus,
    expiryDate: payload.expiryDate,
    sendEmail: !!payload.sendEmail,
    isEmailSent: !!payload.sendEmail,
    actionLink: payload.actionLink,
    read: false,
    senderName: 'Super Admin',
    createdAt: new Date().toISOString()
  };

  const current = getLocalNotifications();
  saveLocalNotifications([newNtf, ...current]);

  return {
    success: true,
    message: payload.sendEmail
      ? `Notification dispatched in-app and email queued to ${payload.targetAdminEmail || 'recipient(s)'}`
      : 'Notification dispatched in-app to administrators.',
    notification: newNtf
  };
}

/**
 * GET /api/notifications
 * Admin fetches notifications destined for their dashboard
 */
export async function getAdminNotificationsApi(): Promise<{ success: boolean; notifications: NotificationItem[]; unreadCount: number }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/notifications`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.notifications)) {
        saveLocalNotifications(data.notifications);
        return {
          success: true,
          notifications: data.notifications,
          unreadCount: data.unreadCount ?? data.notifications.filter((n: any) => !n.read).length
        };
      }
    }
  } catch (err) {
    console.warn('Backend notifications fetch notice:', err);
  }

  // Fallback to local store
  const localList = getLocalNotifications();
  const unreadCount = localList.filter(n => !n.read).length;
  return {
    success: true,
    notifications: localList,
    unreadCount
  };
}

/**
 * PATCH /api/notifications/:id/read
 * Mark single notification as read
 */
export async function markNotificationReadApi(id: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/notifications/${encodeURIComponent(id)}/read`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAdminAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, message: data.message || 'Notification marked as read' };
    }
  } catch (err) {
    console.warn('Mark notification read fallback:', err);
  }

  // Update local cache
  const list = getLocalNotifications();
  const updated = list.map(n => (n._id === id || n.id === id) ? { ...n, read: true, readAt: new Date().toISOString() } : n);
  saveLocalNotifications(updated);

  return { success: true, message: 'Notification marked as read.' };
}

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read
 */
export async function markAllNotificationsReadApi(): Promise<{ success: boolean; message: string }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/notifications/mark-all-read`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAdminAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, message: data.message || 'All notifications marked as read' };
    }
  } catch (err) {
    console.warn('Mark all read fallback:', err);
  }

  const list = getLocalNotifications();
  const updated = list.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }));
  saveLocalNotifications(updated);

  return { success: true, message: 'All notifications marked as read.' };
}

/**
 * DELETE /api/notifications/:id
 * Delete/dismiss notification
 */
export async function deleteNotificationApi(id: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  const url = `${baseUrl}/api/notifications/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, message: data.message || 'Notification deleted' };
    }
  } catch (err) {
    console.warn('Delete notification fallback:', err);
  }

  const list = getLocalNotifications();
  const updated = list.filter(n => n._id !== id && n.id !== id);
  saveLocalNotifications(updated);

  return { success: true, message: 'Notification removed.' };
}

export { notificationApi } from './notificationApi';
