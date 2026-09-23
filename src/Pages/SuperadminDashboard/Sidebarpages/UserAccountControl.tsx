import React, { useState } from 'react';
import {
  Users,
  Phone,
  Mail,
  Building2,
  Search,
  Trash2,
  Edit3,
  Filter,
  Plus,
  Download,
  Sparkles,
  KeyRound
} from 'lucide-react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  status: 'Active' | 'Inactive' | 'Renewal';
  joinedDate: string;
  renewalDate: string;
  plan: string;
  password: string;
}

interface UserAccountControlProps {
  onShowToast: (msg: string) => void;
  usersList: UserAccount[];
  setUsersList: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}

export const UserAccountControl: React.FC<UserAccountControlProps> = ({
  onShowToast,
  usersList,
  setUsersList,
}) => {

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive' | 'Renewal'>('Active');
  const [formPlan, setFormPlan] = useState('Enterprise Pro');
  const [formPassword, setFormPassword] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formRenewalDate, setFormRenewalDate] = useState('');

  // Search & Filter
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormStatus('Active');
    setFormPlan('Enterprise Pro');
    setFormPassword('');
    
    // Set default dates
    const todayStr = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    setFormStartDate(todayStr);
    setFormRenewalDate(nextYearStr);
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormCompany(user.companyName);
    setFormStatus(user.status);
    setFormPlan(user.plan);
    setFormPassword(user.password);
    setFormStartDate(user.joinedDate);
    setFormRenewalDate(user.renewalDate);
    setIsEditUserModalOpen(true);
  };

  const handleSaveAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      onShowToast('Please fill in Name, Email, and Password.');
      return;
    }
    const newId = `USR-${100 + usersList.length + 1}`;
    const newUser: UserAccount = {
      id: newId,
      name: formName,
      email: formEmail,
      phone: formPhone || 'N/A',
      companyName: formCompany || 'Independent Investor',
      status: formStatus,
      joinedDate: formStartDate || new Date().toISOString().split('T')[0],
      renewalDate: formRenewalDate || new Date().toISOString().split('T')[0],
      plan: formPlan,
      password: formPassword
    };
    setUsersList([...usersList, newUser]);
    setIsAddUserModalOpen(false);
    onShowToast(`Successfully added user ${formName} (${newId}).`);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      onShowToast('Please fill in Name, Email, and Password.');
      return;
    }
    if (!selectedUser) return;
    setUsersList(prev => prev.map(u => u.id === selectedUser.id ? {
      ...u,
      name: formName,
      email: formEmail,
      phone: formPhone,
      companyName: formCompany,
      status: formStatus,
      plan: formPlan,
      password: formPassword,
      joinedDate: formStartDate,
      renewalDate: formRenewalDate
    } : u));
    setIsEditUserModalOpen(false);
    setSelectedUser(null);
    onShowToast(`Successfully updated user ${formName}.`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove user ${name}?`)) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      onShowToast(`User ${name} has been removed.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-extrabold text-[#166534] uppercase tracking-wider bg-[#166534]/10 px-2 py-0.5 rounded border border-[#166534]/20">
              EXECUTIVE GOVERNANCE
            </span>
            <span className="text-xs text-[#64748B] font-mono">• MASTER PROFILES</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] font-display flex items-center gap-2">
            User Account Control Portal
          </h1>
          <p className="text-xs text-[#475569] font-medium">
            Full authority controls over global financial liquidity, admin roles, multi-branch policy, and platform security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4A017]" />
            <span>Register User</span>
          </button>

          <button
            onClick={() => onShowToast('Exported Master System Audit Snapshot.')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-all border border-[#C5E1A5]"
          >
            <Download className="w-3.5 h-3.5 text-[#166534]" />
            <span>Audit Dump</span>
          </button>
        </div>
      </div>

      {/* User Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Total Managed Users</span>
            <Users className="w-4 h-4 text-[#166534]" />
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A] font-display">{usersList.length}</p>
          <div className="text-[11px] text-[#64748B] font-mono">Platform Accounts</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Active Users</span>
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          </div>
          <p className="text-3xl font-extrabold text-[#16A34A] font-display">
            {usersList.filter(u => u.status === 'Active').length}
          </p>
          <div className="text-[11px] text-[#16A34A] font-bold">Active Sessions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Pending Renewal</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 font-display">
            {usersList.filter(u => u.status === 'Renewal').length}
          </p>
          <div className="text-[11px] text-amber-600 font-bold">Due Subscriptions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Inactive Accounts</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className="text-3xl font-extrabold text-red-600 font-display">
            {usersList.filter(u => u.status === 'Inactive').length}
          </p>
          <div className="text-[11px] text-red-600 font-bold">Revoked Access</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8FCEE] border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#166534] font-bold">
            <span>Active Ratio</span>
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
          </div>
          <p className="text-3xl font-extrabold text-[#166534] font-display">
            {usersList.length > 0
              ? `${Math.round((usersList.filter(u => u.status === 'Active').length / usersList.length) * 100)}%`
              : '0%'}
          </p>
          <div className="text-[11px] text-[#166534] font-mono">Platform Health</div>
        </div>
      </div>

      {/* Users List Table Container */}
      <div className="p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-6">
        
        {/* Search, Filter & Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search name, email, company..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#166534]"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Renewal">Renewal Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[#64748B] font-bold">
                <th className="pb-3">User ID</th>
                <th className="pb-3">Client Details</th>
                <th className="pb-3">Company</th>
                <th className="pb-3">Date Management</th>
                <th className="pb-3">Tier Plan</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0F172A]">
              {usersList
                .filter(u => {
                  const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.companyName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.id.toLowerCase().includes(userSearchTerm.toLowerCase());
                  const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FCEE] transition-colors">
                    <td className="py-3.5 font-mono text-[#166534] font-bold">{u.id}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-[#0F172A]">{u.name}</div>
                      <div className="text-[10px] text-[#64748B] flex flex-col gap-0.5 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#166534]" /> {u.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#166534]" /> {u.phone}</span>
                        <span className="flex items-center gap-1"><KeyRound className="w-3 h-3 text-slate-400" /> {u.password}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-[#334155] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {u.companyName}
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[#334155]">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Start:</span>
                          <span>{u.joinedDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#b45309]">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 font-extrabold">Renew:</span>
                          <span className="font-semibold">{u.renewalDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        u.status === 'Active' ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20' :
                        u.status === 'Renewal' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition-colors"
                          title="Edit User Info"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-[#0F172A]">Add New User</h3>
            
            <form onSubmit={handleSaveAddUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0F172A]">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Amara Okafor"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="amara@emeraldwealth.co"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Company Name</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Emerald Wealth"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Set Password</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Starting Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={formRenewalDate}
                    onChange={(e) => setFormRenewalDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
                  >
                    <option value="Active">Active</option>
                    <option value="Renewal">Renewal Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Subscription Plan</label>
                  <input
                    type="text"
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    placeholder="Enterprise Pro"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-xs shadow-sm transition-colors"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-[#0F172A]">Edit User Details ({selectedUser.id})</h3>
            
            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0F172A]">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Company Name</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Edit Password</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Starting Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={formRenewalDate}
                    onChange={(e) => setFormRenewalDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
                  >
                    <option value="Active">Active</option>
                    <option value="Renewal">Renewal Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0F172A]">Subscription Plan</label>
                  <input
                    type="text"
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-xs shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
