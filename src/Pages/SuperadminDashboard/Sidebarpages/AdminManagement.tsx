import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  KeyRound,
  Copy,
  Check,
  Power,
  X
} from 'lucide-react';
import {
  getAllAdminsApi,
  getAdminByIdApi,
  createAdminApi,
  updateAdminApi,
  deleteAdminApi,
  updateAdminStatusApi,
  type AdminItem,
  type CreateAdminPayload,
  type UpdateAdminPayload,
  API_BASE_URL
} from '../../../lib/api';

interface AdminManagementProps {
  onShowToast: (msg: string) => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ onShowToast }) => {
  // Data State
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active / Selected Admin
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form Fields for Create / Edit
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Action loading indicators
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all Admins on mount
  const fetchAdmins = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setApiError(null);

    try {
      const data = await getAllAdminsApi();
      if (data && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      } else {
        setAdmins([]);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch admin accounts from backend server.';
      setApiError(msg);
      onShowToast(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || admin.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [admins, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = admins.length;
    const active = admins.filter(a => a.status === 'active').length;
    const inactive = admins.filter(a => a.status === 'inactive').length;
    const latest = admins.length > 0 ? admins[admins.length - 1] : null;
    return { total, active, inactive, latest };
  }, [admins]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onShowToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open Create Admin Modal
  const handleOpenAddModal = () => {
    setFormUsername('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setShowPassword(false);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Submit Create Admin (POST /api/superadmin/admins)
  const handleSubmitCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formName.trim() || !formEmail.trim() || !formPhone.trim() || !formPassword.trim()) {
      setFormError('All fields (Username, Name, Email, Phone, and Password) are required.');
      return;
    }

    if (formPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: CreateAdminPayload = {
        username: formUsername.trim(),
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        password: formPassword,
      };

      const res = await createAdminApi(payload);
      onShowToast(res.message || `Admin "${formName}" created successfully!`);
      setIsAddModalOpen(false);
      // Refresh list
      fetchAdmins(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create admin.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Admin Modal (PUT /api/superadmin/admins/{adminId})
  const handleOpenEditModal = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setFormUsername(admin.username || '');
    setFormName(admin.name || '');
    setFormEmail(admin.email || '');
    setFormPhone(admin.phone || '');
    setFormPassword(''); // optional for update
    setShowPassword(false);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Update Admin
  const handleSubmitUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFormError(null);

    if (!formName.trim() || !formUsername.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError('Username, Name, Email, and Phone cannot be empty.');
      return;
    }

    if (formPassword.trim() && formPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: UpdateAdminPayload = {
        username: formUsername.trim(),
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
      };
      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      const res = await updateAdminApi(selectedAdmin._id, payload);
      onShowToast(res.message || `Admin "${formName}" updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedAdmin(null);
      fetchAdmins(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update admin account.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open View Admin Details Modal (GET /api/superadmin/admins/{adminId})
  const handleOpenDetailModal = async (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setIsDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await getAdminByIdApi(admin._id);
      if (res && res.admin) {
        setSelectedAdmin(res.admin);
      }
    } catch (err: any) {
      onShowToast(`Failed to load fresh details: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle Status (PATCH /api/superadmin/admins/{adminId}/status)
  const handleToggleStatus = async (admin: AdminItem) => {
    const nextStatus = admin.status === 'active' ? 'inactive' : 'active';
    setStatusUpdatingId(admin._id);

    try {
      const res = await updateAdminStatusApi(admin._id, nextStatus);
      const updatedStatus = res.admin?.status || nextStatus;
      setAdmins(prev =>
        prev.map(a => (a._id === admin._id ? { ...a, status: updatedStatus } : a))
      );
      if (selectedAdmin && selectedAdmin._id === admin._id) {
        setSelectedAdmin({ ...selectedAdmin, status: updatedStatus });
      }
      onShowToast(res.message || `Admin status changed to ${updatedStatus}.`);
    } catch (err: any) {
      onShowToast(`Error updating status: ${err.message}`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  // Submit Delete Admin (DELETE /api/superadmin/admins/{adminId})
  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return;
    setIsDeleting(true);

    try {
      const res = await deleteAdminApi(selectedAdmin._id);
      onShowToast(res.message || `Admin "${selectedAdmin.name}" deleted.`);
      setAdmins(prev => prev.filter(a => a._id !== selectedAdmin._id));
      setIsDeleteModalOpen(false);
      setSelectedAdmin(null);
    } catch (err: any) {
      onShowToast(`Error deleting admin: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Admins to CSV / Audit Dump
  const handleExportCSV = () => {
    if (admins.length === 0) {
      onShowToast('No admin records available to export.');
      return;
    }

    const headers = ['ID', 'Username', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created By', 'Created At'];
    const rows = admins.map(a => [
      `"${a._id}"`,
      `"${a.username}"`,
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.role}"`,
      `"${a.status}"`,
      `"${a.createdBy || 'SuperAdmin'}"`,
      `"${a.createdAt ? new Date(a.createdAt).toISOString() : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kn_superadmin_admins_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported ${admins.length} Admin records to CSV.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-extrabold text-[#166534] uppercase tracking-wider bg-[#166534]/10 px-2.5 py-0.5 rounded-md border border-[#166534]/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
              SUPER ADMIN GOVERNANCE
            </span>
            <span className="text-xs text-[#64748B] font-mono">• MASTER ADMIN MANAGEMENT</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Backend API
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#0F172A] font-display flex items-center gap-2">
            Administrator Management Portal
          </h1>
          <p className="text-xs text-[#475569] font-medium mt-0.5">
            Provision, inspect, modify, activate/deactivate, and audit elevated Administrator accounts across all platform clusters.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchAdmins(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold transition-all border border-[#C5E1A5] disabled:opacity-50"
            title="Refresh Admins from Server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#166534] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold transition-all border border-[#C5E1A5]"
            title="Download CSV Audit Dump"
          >
            <Download className="w-3.5 h-3.5 text-[#166534]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4 text-[#D4A017]" />
            <span>Create New Admin</span>
          </button>
        </div>
      </div>

      {/* Backend API Error Banner if any */}
      {apiError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Backend Connection Notice</p>
              <p className="text-amber-700">{apiError}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAdmins(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-amber-900 transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Admins */}
        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#64748B]">Total Admins</span>
            <p className="text-3xl font-extrabold text-[#0F172A] mt-1 font-display">
              {isLoading ? '...' : stats.total}
            </p>
            <span className="text-[11px] text-[#166534] font-semibold mt-1 inline-flex items-center gap-1">
              Elevated Master Accounts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#166534]" />
          </div>
        </div>

        {/* Active Admins */}
        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#64748B]">Active Admins</span>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1 font-display">
              {isLoading ? '...' : stats.active}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Full Operation Access
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Inactive Admins */}
        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#64748B]">Inactive Admins</span>
            <p className="text-3xl font-extrabold text-slate-600 mt-1 font-display">
              {isLoading ? '...' : stats.inactive}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Suspended Access
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-slate-500" />
          </div>
        </div>

        {/* API Endpoint & Host */}
        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-bold text-[#64748B]">Server Gateway</span>
            <p className="text-xs font-mono font-bold text-[#0F172A] mt-1 truncate">
              {API_BASE_URL.replace(/^https?:\/\//, '')}
            </p>
            <span className="text-[11px] text-[#166534] font-semibold mt-1 inline-flex items-center gap-1">
              POST • GET • PUT • DEL • PATCH
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#D4A017]" />
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white border border-[#C5E1A5] shadow-xs overflow-hidden">
        
        {/* Controls Bar: Search & Status Filter */}
        <div className="p-4 sm:p-5 border-b border-[#E2F0C2] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FAFDF5]">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Admin Name, Username, Email, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-[#C5E1A5] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 self-start md:self-auto bg-white p-1 rounded-xl border border-[#C5E1A5]">
            <span className="text-[11px] font-bold text-[#64748B] px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#166534]" />
              Status:
            </span>
            {(['all', 'active', 'inactive'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === filter
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F2F8E1]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

        </div>

        {/* Admins Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F2F8E1] border-b border-[#C5E1A5] text-[#166534] font-mono font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2F0C2]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-[#166534] animate-spin" />
                      <span className="font-semibold text-xs">Loading administrators from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-[#94A3B8]" />
                      <p className="font-bold text-sm text-[#0F172A]">No Administrators Found</p>
                      <p className="text-xs text-[#64748B]">
                        {searchTerm || statusFilter !== 'all'
                          ? 'No admin accounts match your search/filter criteria.'
                          : 'No admin accounts currently exist in the database.'}
                      </p>
                      {searchTerm || statusFilter !== 'all' ? (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-[#E2F0C2] hover:bg-[#DCECB5] text-[#166534] text-xs font-bold"
                        >
                          Reset Filters
                        </button>
                      ) : (
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-2 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs"
                        >
                          Create First Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isActive = admin.status === 'active';
                  const isUpdatingStatus = statusUpdatingId === admin._id;

                  return (
                    <tr
                      key={admin._id}
                      className="hover:bg-[#FAFDF5] transition-colors group"
                    >
                      {/* Administrator Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center font-bold text-[#166534] shrink-0">
                            {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="font-bold text-[#0F172A] text-xs flex items-center gap-1.5">
                              <span>{admin.name}</span>
                            </div>
                            <div className="text-[11px] text-[#64748B] font-mono flex items-center gap-1">
                              <span>@{admin.username}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-[#0F172A]">
                            <Mail className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                            <span className="truncate max-w-[180px]">{admin.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                            <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                            <span>{admin.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-[#E2F0C2] text-[#166534] uppercase border border-[#C5E1A5]">
                          <Shield className="w-3 h-3 text-[#166534]" />
                          {admin.role || 'admin'}
                        </span>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            disabled={isUpdatingStatus}
                            title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                            } ${isUpdatingStatus ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            ></span>
                            <span className="capitalize">{isUpdatingStatus ? 'Saving...' : admin.status}</span>
                            <Power className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
                          </button>
                        </div>
                      </td>

                      {/* Created By */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-[#334155]">
                          {admin.createdBy || 'SuperAdmin'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[#64748B] font-mono">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Single Admin (GET) */}
                          <button
                            onClick={() => handleOpenDetailModal(admin)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#166534] hover:bg-[#E2F0C2] transition-colors"
                            title="View Full Admin Record (GET /api/superadmin/admins/:id)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Admin (PUT) */}
                          <button
                            onClick={() => handleOpenEditModal(admin)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#166534] hover:bg-[#E2F0C2] transition-colors"
                            title="Edit Admin (PUT /api/superadmin/admins/:id)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Admin (DELETE) */}
                          <button
                            onClick={() => handleOpenDeleteModal(admin)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Admin (DELETE /api/superadmin/admins/:id)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-[#FAFDF5] border-t border-[#E2F0C2] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B]">
          <span>
            Showing <strong className="text-[#0F172A]">{filteredAdmins.length}</strong> of{' '}
            <strong className="text-[#0F172A]">{admins.length}</strong> registered administrators
          </span>
          <span className="font-mono mt-1 sm:mt-0 text-[10px] text-[#166534]">
            KN Platform • Super Admin Role Authority
          </span>
        </div>

      </div>

      {/* ============================================================ */}
      {/* MODAL 1: Create New Admin (POST /api/superadmin/admins)       */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#C5E1A5] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2F0C2] bg-[#FAFDF5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Provision New Administrator</h3>
                  <p className="text-[11px] text-[#64748B] font-mono">POST /api/superadmin/admins</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCreateAdmin} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="admin01"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Admin One"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="9876543210"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                    />
                  </div>
                </div>

              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Immutable Role Notice */}
              <div className="p-3 rounded-xl bg-[#F2F8E1] border border-[#C5E1A5] text-[11px] text-[#166534] flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The account will automatically be created with the <strong className="font-bold">admin</strong> role and registered under your Super Admin identity.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2F0C2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#475569] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#D4A017]" />
                      <span>Confirm & Register</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: View Single Admin (GET /api/superadmin/admins/{id}) */}
      {/* ============================================================ */}
      {isDetailModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#C5E1A5] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-[#E2F0C2] bg-[#FAFDF5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center font-extrabold text-lg text-[#166534]">
                  {selectedAdmin.name ? selectedAdmin.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">{selectedAdmin.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-mono">
                    <span>@{selectedAdmin.username}</span>
                    <span>•</span>
                    <span className="text-[#166534]">GET /api/superadmin/admins/:id</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-4">
              {detailLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#166534]" />
                  <span className="text-xs">Fetching single admin record...</span>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          selectedAdmin.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      ></span>
                      <span className="text-xs font-bold capitalize text-[#0F172A]">
                        Status: {selectedAdmin.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(selectedAdmin)}
                      disabled={statusUpdatingId === selectedAdmin._id}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-white border border-[#C5E1A5] hover:bg-[#E2F0C2] text-[#166534] transition-colors"
                    >
                      {selectedAdmin.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  {/* ID Field with Copy */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1">
                      <span>MongoDB Object ID (adminId)</span>
                      <button
                        onClick={() => handleCopy(selectedAdmin._id, 'Admin ID')}
                        className="inline-flex items-center gap-1 text-[#166534] hover:underline font-bold"
                      >
                        {copiedField === 'Admin ID' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'Admin ID' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <code className="text-xs font-mono font-bold text-slate-900 select-all break-all">
                      {selectedAdmin._id}
                    </code>
                  </div>

                  {/* Two Column Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    
                    <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#E2F0C2]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block mb-1">
                        Email Address
                      </span>
                      <div className="font-semibold text-[#0F172A] truncate" title={selectedAdmin.email}>
                        {selectedAdmin.email}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#E2F0C2]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block mb-1">
                        Phone Number
                      </span>
                      <div className="font-semibold text-[#0F172A] font-mono">
                        {selectedAdmin.phone}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#E2F0C2]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block mb-1">
                        Role
                      </span>
                      <div className="font-bold text-[#166534] uppercase font-mono">
                        {selectedAdmin.role}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#E2F0C2]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block mb-1">
                        Created By
                      </span>
                      <div className="font-semibold text-[#0F172A]">
                        {selectedAdmin.createdBy || 'SuperAdmin'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#E2F0C2]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block mb-1">
                        Created At
                      </span>
                      <div className="font-mono text-[11px] text-[#0F172A]">
                        {selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAFDF5] border border-[#E2F0C2]">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block mb-1">
                        Last Updated
                      </span>
                      <div className="font-mono text-[11px] text-[#0F172A]">
                        {selectedAdmin.updatedAt ? new Date(selectedAdmin.updatedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>

                  </div>
                </>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E2F0C2]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(selectedAdmin);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E2F0C2] hover:bg-[#DCECB5] text-[#166534] text-xs font-bold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0F172A] transition-colors"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: Update Admin (PUT /api/superadmin/admins/{id})       */}
      {/* ============================================================ */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#C5E1A5] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E2F0C2] bg-[#FAFDF5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-5 h-5 text-[#D4A017]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Update Administrator</h3>
                  <p className="text-[11px] text-[#64748B] font-mono">PUT /api/superadmin/admins/{selectedAdmin._id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitUpdateAdmin} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                    />
                  </div>
                </div>

              </div>

              {/* Optional New Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#334155] uppercase font-mono">
                    New Password (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">Leave blank to keep current</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter at least 6 characters if changing"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-[#FAFDF5] border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Non-modifiable Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                <span>
                  According to system security rules, the <strong>Role</strong> and <strong>CreatedBy</strong> fields cannot be modified. Status can be updated via the quick toggle button.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2F0C2]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#475569] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#D4A017]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: Delete Admin (DELETE /api/superadmin/admins/{id})   */}
      {/* ============================================================ */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-rose-950">Permanently Delete Admin</h3>
                <p className="text-[11px] text-rose-600 font-mono">DELETE /api/superadmin/admins/:id</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[#334155] leading-relaxed">
                Are you sure you want to permanently remove administrator{' '}
                <strong className="text-[#0F172A] font-bold">"{selectedAdmin.name}"</strong> (
                <code className="text-rose-600 font-mono">@{selectedAdmin.username}</code>)?
              </p>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <strong>Warning:</strong> This action cannot be undone. All administrative sessions and access privileges linked to this account will be terminated immediately.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#475569] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Deletion</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
