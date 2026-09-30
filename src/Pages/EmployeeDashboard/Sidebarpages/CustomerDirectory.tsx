import React, { useState } from 'react';
import {
  Search,
  Plus,
  Phone,
  FileSpreadsheet,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { AssignedBorrower, EmployeeProfile } from '../types';

interface CustomerDirectoryProps {
  borrowers: AssignedBorrower[];
  setBorrowers: React.Dispatch<React.SetStateAction<AssignedBorrower[]>>;
  employee: EmployeeProfile | null;
  onShowToast: (msg: string) => void;
  onSelectForCollection?: (borrower: AssignedBorrower) => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  borrowers,
  setBorrowers,
  employee,
  onShowToast,
  onSelectForCollection,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');
  const [villageFilter, setVillageFilter] = useState<string>('All');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newNameTelugu, setNewNameTelugu] = useState('');
  const [newNameEnglish, setNewNameEnglish] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAltPhone, setNewAltPhone] = useState('');
  const [newVillage, setNewVillage] = useState(employee?.village || 'Rampur');
  const [newProductItem, setNewProductItem] = useState('Weekly Loan Terms');
  const [newPrincipal, setNewPrincipal] = useState('10000');
  const [newStartDate, setNewStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Unique villages
  const uniqueVillages = Array.from(new Set(borrowers.map((b) => b.village).filter(Boolean)));

  // Filtered list
  const filteredCustomers = borrowers.filter((b) => {
    if (statusFilter === 'Active' && b.isClosed) return false;
    if (statusFilter === 'Closed' && !b.isClosed) return false;
    if (villageFilter !== 'All' && b.village !== villageFilter) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      String(b.sNo).includes(term) ||
      b.id.toLowerCase().includes(term) ||
      (b.nameTelugu || '').toLowerCase().includes(term) ||
      (b.nameEnglish || '').toLowerCase().includes(term) ||
      (b.phone || '').includes(term) ||
      (b.village || '').toLowerCase().includes(term)
    );
  });

  // Handle Add Customer Submission
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    const principalAmt = parseFloat(newPrincipal.replace(/,/g, ''));
    if (isNaN(principalAmt) || principalAmt <= 0) {
      onShowToast('Please enter a valid loan principal amount.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nextSNo = borrowers.length + 1;
    const newId = `BOR-${Date.now().toString().slice(-4)}`;
    const interestTotal = Math.round(principalAmt * 1.25); // typical 25% weekly total

    const newBorrower: AssignedBorrower = {
      id: newId,
      sNo: nextSNo,
      borrowDate: newStartDate.slice(5),
      date: newStartDate.slice(5),
      nameTelugu: newNameTelugu.trim(),
      nameEnglish: newNameEnglish.trim() || newNameTelugu.trim(),
      phone: newPhone.trim(),
      altPhone: newAltPhone.trim() || undefined,
      village: newVillage.trim(),
      assignedOperationalArea: employee?.assignedOperationalArea || 'Sector North',
      productItem: newProductItem.trim() || 'Weekly Terms',
      item: newProductItem.trim() || 'Weekly Terms',
      principalAmount: principalAmt,
      initialRemaining: interestTotal,
      remainingBalance: interestTotal,
      totalPaid: 0,
      interestRate: 25,
      isClosed: false,
      startDate: newStartDate,
      createdAt: todayStr,
    };

    setBorrowers([newBorrower, ...borrowers]);
    setIsAddModalOpen(false);

    // Reset inputs
    setNewNameTelugu('');
    setNewNameEnglish('');
    setNewPhone('');
    setNewAltPhone('');
    setNewPrincipal('10000');

    onShowToast(`Added new customer ${newBorrower.nameTelugu} (${newBorrower.nameEnglish}) successfully! 🎉`);
  };

  // Export Customer Directory to Excel
  const handleExportCustomers = () => {
    try {
      const data = filteredCustomers.map((b) => ({
        'S.No': b.sNo,
        'Borrower ID': b.id,
        'Telugu Name': b.nameTelugu,
        'English Name': b.nameEnglish,
        'Phone Number': b.phone,
        'Alternate Phone': b.altPhone || '',
        'Village': b.village,
        'Product / Collateral': b.productItem,
        'Principal Loan (₹)': b.principalAmount,
        'Total Repayable (₹)': b.initialRemaining,
        'Total Paid (₹)': b.totalPaid,
        'Balance Due (₹)': b.remainingBalance,
        'Start Date': b.startDate || b.borrowDate,
        'Status': b.isClosed ? 'Closed' : 'Active',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `KN_Customers_List_${new Date().toISOString().split('T')[0]}.xlsx`);
      onShowToast('Exported customer registry to Excel! 📊');
    } catch (err) {
      onShowToast('Failed to export customers list.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header & Controls */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Assigned Route Directory
              </span>
              <span className="text-xs text-slate-500 font-semibold">• మీ రూట్‌లోని ఖాతాదారుల జాబితా</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
              Assigned Customers (ఖాతాదారుల వివరాలు)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse all borrower profiles in your assigned operational route, view balances, or register new loan borrowers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>+ Add New Customer (కొత్త ఖాతా)</span>
            </button>
            <button
              onClick={handleExportCustomers}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, Phone, ID, లేదా ఊరు..."
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-[13px] bg-slate-50 border border-slate-200 focus:border-[#166534] rounded-xl text-slate-900 placeholder-slate-400 outline-none font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['All', 'Active', 'Closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-[#166534] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {uniqueVillages.length > 0 && (
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="h-10 px-3 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none"
            >
              <option value="All">All Villages</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 2. Customer Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                <th className="p-3.5 w-12 text-center">S.No</th>
                <th className="p-3.5">Borrower Profile (ఖాతాదారుడు)</th>
                <th className="p-3.5">Contact Number</th>
                <th className="p-3.5">Village & Route</th>
                <th className="p-3.5 text-right">Principal ₹</th>
                <th className="p-3.5 text-right">Paid ₹</th>
                <th className="p-3.5 text-right">Balance Due ₹</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#0F172A]">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const remaining = Number(cust.remainingBalance) || 0;
                  const paid = Number(cust.totalPaid) || 0;
                  const principal = Number(cust.principalAmount) || 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                        {cust.sNo}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#166534] font-bold flex items-center justify-center text-xs">
                            {cust.nameTelugu ? cust.nameTelugu.charAt(0) : 'B'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{cust.nameTelugu}</div>
                            <div className="text-[11px] text-slate-500">{cust.nameEnglish} • {cust.productItem || 'Weekly Terms'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        {cust.phone ? (
                          <a
                            href={`tel:${cust.phone}`}
                            className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="font-semibold">{cust.village}</div>
                        <div className="text-[10px] text-slate-400">{cust.assignedOperationalArea || 'Sector North'}</div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        ₹{principal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        ₹{paid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-rose-700">
                        ₹{remaining.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            cust.isClosed
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-[#166534]'
                          }`}
                        >
                          {cust.isClosed ? 'Closed' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {!cust.isClosed && onSelectForCollection && (
                          <button
                            onClick={() => onSelectForCollection(cust)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#166534] border border-emerald-200 transition-colors"
                          >
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 italic font-semibold">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          ADD NEW CUSTOMER MODAL (కొత్త ఖాతాదారుని చేర్చండి)
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] text-[10px] font-bold border border-emerald-200 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>NEW BORROWER REGISTRATION</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#0F172A]">
                  Add New Customer (కొత్త ఖాతాదారుని నమోదు)
                </h3>
                <p className="text-xs text-slate-500">
                  Register a new borrower account under your assigned field collection route.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              
              {/* Telugu Name & English Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Telugu Name (ఆసామి పేరు) *</label>
                  <input
                    type="text"
                    required
                    value={newNameTelugu}
                    onChange={(e) => setNewNameTelugu(e.target.value)}
                    placeholder="e.g. రాముడు"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">English Name *</label>
                  <input
                    type="text"
                    required
                    value={newNameEnglish}
                    onChange={(e) => setNewNameEnglish(e.target.value)}
                    placeholder="e.g. Ramudu"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone & Alternate Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Alternate Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newAltPhone}
                    onChange={(e) => setNewAltPhone(e.target.value)}
                    placeholder="Optional phone"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
              </div>

              {/* Village & Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Village / Address *</label>
                  <input
                    type="text"
                    required
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    placeholder="e.g. Rampur"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Product / Terms *</label>
                  <input
                    type="text"
                    required
                    value={newProductItem}
                    onChange={(e) => setNewProductItem(e.target.value)}
                    placeholder="e.g. Gold Items / Weekly Terms"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
              </div>

              {/* Principal Amount & Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Principal Loan Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="500"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Start / Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Register Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
