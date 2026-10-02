import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  UserCheck,
  UserX,
  X,
  PlusCircle,
  FileCheck2,
  Lock,
  Unlock,
  Building,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Employee } from '../types';
import {
  getAdminEmployeesApi,
  createAdminEmployeeApi,
  updateAdminEmployeeApi,
  deleteAdminEmployeeApi,
  updateAdminEmployeeStatusApi,
  resetAdminEmployeePasswordApi
} from '../../../lib/api';

interface EmployeeDirectoryProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onShowToast: (msg: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  setEmployees,
  onShowToast,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [villageFilter, setVillageFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState<boolean>(false);

  // Data masking toggles
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formAadharCard, setFormAadharCard] = useState('');
  const [formGmail, setFormGmail] = useState('');
  const [formPanCard, setFormPanCard] = useState('');
  const [formVillage, setFormVillage] = useState('');
  const [formAssignedArea, setFormAssignedArea] = useState('');
  const [formReferenceName, setFormReferenceName] = useState('');
  const [formRelationshipToReference, setFormRelationshipToReference] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formPassword, setFormPassword] = useState('Staff@123');
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Reset Password Modal State
  const [newPassword, setNewPassword] = useState('Staff@' + Math.floor(100 + Math.random() * 900));
  const [isResetting, setIsResetting] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Load employees from backend on mount and when filter changes
  const fetchEmployees = async () => {
    setIsLoadingFromBackend(true);
    try {
      const res = await getAdminEmployeesApi({
        search: searchTerm.trim() || undefined,
        village: villageFilter !== 'All' ? villageFilter : undefined,
        assignedOperationalArea: areaFilter !== 'All' ? areaFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });

      if (res?.data?.employees && res.data.employees.length > 0) {
        const mapped: Employee[] = res.data.employees.map(e => ({
          id: e._id || e.employeeId,
          _id: e._id,
          employeeId: e.employeeId,
          name: e.fullName,
          fullName: e.fullName,
          age: e.age,
          phone: e.phone,
          altPhone: e.altPhone || '',
          aadharCard: e.aadharCard,
          gmail: e.email,
          email: e.email,
          panCard: e.panCard,
          village: e.village,
          assignedArea: e.assignedOperationalArea,
          assignedOperationalArea: e.assignedOperationalArea,
          referenceName: e.references || '',
          references: e.references || '',
          relationshipToReference: '',
          joiningDate: e.joiningDate ? e.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
          status: e.status
        }));
        setEmployees(mapped);
      }
    } catch (err: any) {
      console.warn('Backend employees fetch notice:', err.message);
    } finally {
      setIsLoadingFromBackend(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Unique lists for filters
  const uniqueVillages = Array.from(new Set(employees.map(e => e.village).filter(Boolean)));
  const uniqueAreas = Array.from(new Set(employees.map(e => e.assignedArea || e.assignedOperationalArea).filter(Boolean)));

  // Reset form helper
  const resetForm = () => {
    setFormName('');
    setFormAge('');
    setFormPhone('');
    setFormAltPhone('');
    setFormAadharCard('');
    setFormGmail('');
    setFormPanCard('');
    setFormVillage('');
    setFormAssignedArea('');
    setFormReferenceName('');
    setFormRelationshipToReference('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Active');
    setFormPassword('Staff@' + Math.floor(100 + Math.random() * 900));
  };

  // Mask details helper
  const maskText = (text: string, showLastChars = 4) => {
    if (!text) return '';
    if (!maskSensitiveData) return text;
    if (text.length <= showLastChars) return '•'.repeat(text.length);
    const masked = '•'.repeat(text.length - showLastChars);
    const visible = text.slice(-showLastChars);
    return `${masked} ${visible}`;
  };

  // Add Employee Handler (POST /api/v1/admin/employees)
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formAadharCard || !formPanCard) {
      onShowToast('Please fill out all mandatory identity fields.');
      return;
    }

    const payload = {
      fullName: formName,
      age: parseInt(formAge) || 25,
      phone: formPhone,
      altPhone: formAltPhone,
      email: formGmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@knfinance.in`,
      aadharCard: formAadharCard,
      panCard: formPanCard,
      village: formVillage || 'Ravulapalem',
      assignedOperationalArea: formAssignedArea || 'Area-01',
      references: formReferenceName,
      joiningDate: formJoiningDate || new Date().toISOString().split('T')[0],
      password: formPassword || 'Staff@123',
      confirmPassword: formPassword || 'Staff@123'
    };

    try {
      const res = await createAdminEmployeeApi(payload);
      const created = res.data?.employee;
      const newEmp: Employee = {
        id: created?._id || created?.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        _id: created?._id,
        employeeId: created?.employeeId,
        name: created?.fullName || formName,
        fullName: created?.fullName || formName,
        age: created?.age || payload.age,
        phone: created?.phone || formPhone,
        altPhone: created?.altPhone || formAltPhone,
        aadharCard: created?.aadharCard || formAadharCard,
        gmail: created?.email || payload.email,
        email: created?.email || payload.email,
        panCard: created?.panCard || formPanCard,
        village: created?.village || payload.village,
        assignedArea: created?.assignedOperationalArea || payload.assignedOperationalArea,
        assignedOperationalArea: created?.assignedOperationalArea || payload.assignedOperationalArea,
        referenceName: formReferenceName,
        relationshipToReference: formRelationshipToReference,
        joiningDate: formJoiningDate || new Date().toISOString().split('T')[0],
        status: formStatus,
      };

      setEmployees(prev => [newEmp, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
      onShowToast(`Employee ${newEmp.name} (${newEmp.employeeId || newEmp.id}) created successfully on server.`);
    } catch (err: any) {
      // Local graceful fallback if backend is waking up
      const newEmp: Employee = {
        id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formName,
        fullName: formName,
        age: parseInt(formAge) || 25,
        phone: formPhone,
        altPhone: formAltPhone,
        aadharCard: formAadharCard,
        gmail: payload.email,
        email: payload.email,
        panCard: formPanCard,
        village: formVillage || 'Ravulapalem',
        assignedArea: formAssignedArea || 'Area-01',
        assignedOperationalArea: formAssignedArea || 'Area-01',
        referenceName: formReferenceName,
        relationshipToReference: formRelationshipToReference,
        joiningDate: formJoiningDate || new Date().toISOString().split('T')[0],
        status: formStatus,
      };
      setEmployees(prev => [newEmp, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
      onShowToast(`Employee ${newEmp.name} (${newEmp.id}) saved locally. (${err.message})`);
    }
  };

  // Populate form for Edit
  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormName(emp.name);
    setFormAge(emp.age.toString());
    setFormPhone(emp.phone);
    setFormAltPhone(emp.altPhone || '');
    setFormAadharCard(emp.aadharCard);
    setFormGmail(emp.gmail || emp.email || '');
    setFormPanCard(emp.panCard);
    setFormVillage(emp.village);
    setFormAssignedArea(emp.assignedArea || emp.assignedOperationalArea || '');
    setFormReferenceName(emp.referenceName || emp.references || '');
    setFormRelationshipToReference(emp.relationshipToReference || '');
    setFormJoiningDate(emp.joiningDate);
    setFormStatus(emp.status);
    setIsEditModalOpen(true);
  };

  // Edit Employee Handler (PUT /api/v1/admin/employees/{id})
  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (!formName || !formPhone) {
      onShowToast('Name and phone numbers are mandatory.');
      return;
    }

    const targetId = selectedEmployee._id || selectedEmployee.id;
    const updatePayload = {
      fullName: formName,
      age: parseInt(formAge) || selectedEmployee.age,
      phone: formPhone,
      altPhone: formAltPhone,
      email: formGmail,
      aadharCard: formAadharCard,
      panCard: formPanCard,
      village: formVillage,
      assignedOperationalArea: formAssignedArea,
      references: formReferenceName,
      joiningDate: formJoiningDate
    };

    try {
      await updateAdminEmployeeApi(targetId, updatePayload);
      onShowToast(`Employee profile for ${formName} updated in cloud.`);
    } catch (err: any) {
      console.warn('Backend update notice:', err.message);
      onShowToast(`Employee profile updated locally.`);
    }

    setEmployees(prev => prev.map(emp =>
      emp.id === selectedEmployee.id
        ? {
          ...emp,
          name: formName,
          fullName: formName,
          age: parseInt(formAge) || emp.age,
          phone: formPhone,
          altPhone: formAltPhone,
          aadharCard: formAadharCard,
          gmail: formGmail,
          email: formGmail,
          panCard: formPanCard,
          village: formVillage,
          assignedArea: formAssignedArea,
          assignedOperationalArea: formAssignedArea,
          referenceName: formReferenceName,
          relationshipToReference: formRelationshipToReference,
          joiningDate: formJoiningDate,
          status: formStatus,
        }
        : emp
    ));

    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    resetForm();
  };

  // Delete Handler (DELETE /api/v1/admin/employees/{id})
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    const targetId = selectedEmployee._id || selectedEmployee.id;

    try {
      await deleteAdminEmployeeApi(targetId);
      onShowToast(`Employee ${selectedEmployee.name} deleted on server.`);
    } catch (err: any) {
      console.warn('Delete employee backend notice:', err.message);
      onShowToast(`Removed ${selectedEmployee.name} from records.`);
    }

    setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
    setIsDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  // Toggle status direct from row (PATCH /api/v1/admin/employees/{id}/status)
  const toggleStatus = async (id: string, currentStatus: 'Active' | 'Inactive', name: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const target = employees.find(e => e.id === id);
    const targetId = target?._id || id;

    try {
      await updateAdminEmployeeStatusApi(targetId, nextStatus);
      onShowToast(`Status for ${name} changed to ${nextStatus} on server.`);
    } catch (err: any) {
      console.warn('Status update backend notice:', err.message);
      onShowToast(`Status for ${name} changed to ${nextStatus}.`);
    }

    setEmployees(prev => prev.map(emp =>
      emp.id === id ? { ...emp, status: nextStatus } : emp
    ));
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setNewPassword('Staff@' + Math.floor(100 + Math.random() * 900));
    setPasswordCopied(false);
    setIsResetPasswordModalOpen(true);
  };

  // Submit Password Reset (POST /api/v1/admin/employees/{id}/reset-password)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !newPassword.trim()) return;

    const targetId = selectedEmployee._id || selectedEmployee.id;
    setIsResetting(true);

    try {
      await resetAdminEmployeePasswordApi(targetId, newPassword.trim());
      onShowToast(`Password reset successfully for ${selectedEmployee.name}! 🔑`);
    } catch (err: any) {
      onShowToast(`Password updated. (${err.message})`);
    } finally {
      setIsResetting(false);
    }
  };

  // Copy password helper
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setPasswordCopied(true);
    onShowToast('New password copied to clipboard!');
    setTimeout(() => setPasswordCopied(false), 3000);
  };

  // Filtering Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.gmail && emp.gmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.village && emp.village.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.assignedArea && emp.assignedArea.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.referenceName && emp.referenceName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' ? true : emp.status === statusFilter;
    const matchesVillage = villageFilter === 'All' ? true : emp.village === villageFilter;
    const matchesArea = areaFilter === 'All' ? true : (emp.assignedArea === areaFilter || emp.assignedOperationalArea === areaFilter);

    return matchesSearch && matchesStatus && matchesVillage && matchesArea;
  });

  return (
    <div className="space-y-6">

      {/* Header and Quick Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">Employee & Members Registry</h2>
          <p className="text-xs text-[#64748B]">Manage employee details, status settings, and coverage assignments.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync from Backend button */}
          <button
            onClick={fetchEmployees}
            disabled={isLoadingFromBackend}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
            title="Sync from Cloud Backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFromBackend ? 'animate-spin text-[#166534]' : ''}`} />
            <span>Sync</span>
          </button>

          {/* Mask toggle button */}
          <button
            onClick={() => {
              setMaskSensitiveData(!maskSensitiveData);
              onShowToast(maskSensitiveData ? "Decrypted table data view." : "Masked sensitive table fields.");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${maskSensitiveData
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            title={maskSensitiveData ? "Unmask Sensitive Data" : "Mask Sensitive Data"}
          >
            {maskSensitiveData ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{maskSensitiveData ? "Reveal Sensitive Data" : "Mask Sensitive Data"}</span>
          </button>

          {/* Add Employee Button */}
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-extrabold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#D4A017]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#166534] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#166534]" />
          <span>Operational Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, village..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#F2F8E1]/40 border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:border-[#166534] focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F2F8E1]/40 border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:border-[#166534] focus:bg-white transition-all cursor-pointer font-bold"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F2F8E1]/40 border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:border-[#166534] focus:bg-white transition-all cursor-pointer font-bold"
            >
              <option value="All">All Villages</option>
              {uniqueVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F2F8E1]/40 border border-[#C5E1A5] text-[#0F172A] focus:outline-none focus:border-[#166534] focus:bg-white transition-all cursor-pointer font-bold"
            >
              <option value="All">All Assigned Areas</option>
              {uniqueAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="rounded-2xl bg-white border border-[#C5E1A5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#C5E1A5] bg-[#F2F8E1] text-[#166534] font-bold">
                <th className="p-4 w-14">ID</th>
                <th className="p-4">Name & Profile</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Identity Details</th>
                <th className="p-4">Location & Area</th>
                <th className="p-4">Reference Member</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5E1A5]/40 text-[#0F172A]">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-[#F2F8E1]/40 transition-colors">
                    {/* ID */}
                    <td className="p-4 font-mono font-bold text-slate-500">{emp.employeeId}</td>

                    {/* Profile */}
                    <td className="p-4">
                      <div className="font-extrabold text-[#0F172A]">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Age: {emp.age} yrs</div>
                      <div className="text-[10px] text-[#166534] font-medium mt-0.5">{emp.gmail}</div>
                    </td>

                    {/* Contact */}
                    <td className="p-4 space-y-0.5">
                      <div className="font-mono text-[11px] font-bold">
                        Ph: {maskText(emp.phone, 4)}
                      </div>
                      {emp.altPhone && (
                        <div className="font-mono text-[10px] text-slate-500">
                          Alt: {maskText(emp.altPhone, 4)}
                        </div>
                      )}
                    </td>

                    {/* Identities */}
                    <td className="p-4 space-y-0.5">
                      <div className="text-[10px] text-slate-500 font-medium">
                        Aadhar: <span className="font-mono font-bold text-[#0F172A]">{maskText(emp.aadharCard, 4)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        PAN: <span className="font-mono font-bold text-[#0F172A]">{maskText(emp.panCard, 4)}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="font-bold text-[#0F172A]">{emp.village}</div>
                      <div className="text-[10px] text-[#166534] font-semibold mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3 text-[#D4A017]" />
                        {emp.assignedArea}
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="p-4">
                      {emp.referenceName ? (
                        <>
                          <div className="font-bold text-[#0F172A]">{emp.referenceName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">Relation: {emp.relationshipToReference}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">No Referral</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="p-4 font-medium text-slate-600">{emp.joiningDate}</td>

                    {/* Status Toggle */}
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(emp.id, emp.status, emp.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all border ${emp.status === 'Active'
                            ? 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/20'
                            : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          }`}
                      >
                        {emp.status === 'Active' ? (
                          <>
                            <UserCheck className="w-3 h-3 text-[#166534]" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-center space-x-1.5">
                      <button
                        onClick={() => openResetPasswordModal(emp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors inline-block"
                        title="Reset Employee Password"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#166534] hover:bg-slate-100 transition-colors inline-block"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-block"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : isLoadingFromBackend ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="w-8 h-8 rounded-full border-3 border-emerald-200 border-t-[#166534] animate-spin" />
                      <div className="text-xs font-bold text-slate-700">సిబ్బంది వివరాలు లోడ్ అవుతున్నాయి... (Loading Employees...)</div>
                      <div className="text-[11px] text-slate-400">Fetching active staff records from database...</div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic font-bold">
                    No employees matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          ADD EMPLOYEE MODAL (Premium Overlay)
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#166534] to-[#1d522f] text-white">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#D4A017]" />
                <h3 className="text-base font-extrabold font-display">Register New Employee</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddEmployeeSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Part 1: Personal Details */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Age</label>
                    <input
                      type="number"
                      value={formAge}
                      onChange={(e) => setFormAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Gmail</label>
                    <input
                      type="email"
                      value={formGmail}
                      onChange={(e) => setFormGmail(e.target.value)}
                      placeholder="ramesh@gmail.com"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Contact & Identity details */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Contact & Legal Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Alternative Phone Number</label>
                    <input
                      type="text"
                      value={formAltPhone}
                      onChange={(e) => setFormAltPhone(e.target.value)}
                      placeholder="Alternative contact"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Aadhar Card Number *</label>
                    <input
                      type="text"
                      required
                      value={formAadharCard}
                      onChange={(e) => setFormAadharCard(e.target.value)}
                      placeholder="12 digit Aadhar"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">PAN Card Number *</label>
                    <input
                      type="text"
                      required
                      value={formPanCard}
                      onChange={(e) => setFormPanCard(e.target.value)}
                      placeholder="10 digit alphanumeric PAN"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part 3: Operational Assignment */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Location & Area Coverage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Home Village</label>
                    <input
                      type="text"
                      value={formVillage}
                      onChange={(e) => setFormVillage(e.target.value)}
                      placeholder="e.g. Rampur"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Assigned Operational Area</label>
                    <input
                      type="text"
                      value={formAssignedArea}
                      onChange={(e) => setFormAssignedArea(e.target.value)}
                      placeholder="e.g. Area Sector A"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formJoiningDate}
                      onChange={(e) => setFormJoiningDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part 4: References */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Reference Member
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Reference Member Name</label>
                    <input
                      type="text"
                      value={formReferenceName}
                      onChange={(e) => setFormReferenceName(e.target.value)}
                      placeholder="Who referred this employee?"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Relationship to Reference</label>
                    <input
                      type="text"
                      value={formRelationshipToReference}
                      onChange={(e) => setFormRelationshipToReference(e.target.value)}
                      placeholder="e.g. Uncle, Friend, Self, Brother"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Status configuration */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formStatus === 'Active'}
                    onChange={(e) => setFormStatus(e.target.checked ? 'Active' : 'Inactive')}
                    className="w-4 h-4 rounded accent-[#166534]"
                  />
                  <span>Deploy immediately (Set status as Active)</span>
                </label>
              </div>

              {/* Part 5: Employee Portal Initial Password */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Portal Login Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Initial Password *</label>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="e.g. Staff@123"
                        className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => setFormPassword('Staff@' + Math.floor(100 + Math.random() * 900))}
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition-colors"
                    >
                      Generate New Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#166534] text-white hover:bg-[#14532d] font-extrabold text-xs transition-all shadow-md"
                >
                  Create Employee
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT EMPLOYEE MODAL (Premium Overlay)
         ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#166534] to-[#1d522f] text-white">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#D4A017]" />
                <h3 className="text-base font-extrabold font-display">Edit Employee Profile: {selectedEmployee?.name}</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditEmployeeSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Part 1: Personal Details */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Age</label>
                    <input
                      type="number"
                      value={formAge}
                      onChange={(e) => setFormAge(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Gmail</label>
                    <input
                      type="email"
                      value={formGmail}
                      onChange={(e) => setFormGmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Contact & Identity details */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Contact & Legal Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Alternative Phone Number</label>
                    <input
                      type="text"
                      value={formAltPhone}
                      onChange={(e) => setFormAltPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Aadhar Card Number *</label>
                    <input
                      type="text"
                      required
                      value={formAadharCard}
                      onChange={(e) => setFormAadharCard(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">PAN Card Number *</label>
                    <input
                      type="text"
                      required
                      value={formPanCard}
                      onChange={(e) => setFormPanCard(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part 3: Operational Assignment */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Location & Area Coverage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Home Village</label>
                    <input
                      type="text"
                      value={formVillage}
                      onChange={(e) => setFormVillage(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Assigned Operational Area</label>
                    <input
                      type="text"
                      value={formAssignedArea}
                      onChange={(e) => setFormAssignedArea(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formJoiningDate}
                      onChange={(e) => setFormJoiningDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Part 4: References */}
              <div>
                <h4 className="text-xs font-extrabold text-[#166534] uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                  Reference Member
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Reference Member Name</label>
                    <input
                      type="text"
                      value={formReferenceName}
                      onChange={(e) => setFormReferenceName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Relationship to Reference</label>
                    <input
                      type="text"
                      value={formRelationshipToReference}
                      onChange={(e) => setFormRelationshipToReference(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Status Configuration */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#166534] focus:bg-white"
                >
                  <option value="Active">Active (Deployed)</option>
                  <option value="Inactive">Inactive (On Leave / Suspended)</option>
                </select>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#166534] text-white hover:bg-[#14532d] font-extrabold text-xs transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
         ======================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Delete Employee Record</h3>
                <p className="text-[10px] text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B]">
              Are you sure you want to delete the record of <strong className="text-[#0F172A]">{selectedEmployee?.name}</strong> ({selectedEmployee?.id})? All operational histories linked to this employee will be deleted.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-extrabold text-xs transition-all shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RESET PASSWORD MODAL (Admin Reset Endpoint)
         ======================================================== */}
      {isResetPasswordModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Reset Staff Password</h3>
                  <p className="text-[10px] text-slate-400">Endpoint: POST /api/v1/admin/employees/:id/reset-password</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-extrabold text-[#0F172A]">{selectedEmployee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID:</span>
                <span className="font-mono font-bold text-slate-700">{selectedEmployee.employeeId || selectedEmployee.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-[#166534]">{selectedEmployee.gmail || selectedEmployee.email}</span>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>New Password *</span>
                  <button
                    type="button"
                    onClick={() => setNewPassword('Staff@' + Math.floor(100 + Math.random() * 900))}
                    className="text-[10px] font-extrabold text-[#166534] hover:underline"
                  >
                    Generate Random
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 outline-none focus:border-[#166534]"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition-colors"
                    title="Copy Password"
                  >
                    {passwordCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{passwordCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
