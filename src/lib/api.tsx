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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Super Admin login failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (data?.token) {
    localStorage.setItem('kn_superadmin_token', data.token);
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
