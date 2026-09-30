import React, { useState } from 'react';
import {
  Search,
  IndianRupee,
  Calendar,
  CheckCircle2,
  X,
  Phone,
  Printer,
  Sparkles,
  FileSpreadsheet,
  Check,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { AssignedBorrower, CollectionRecord, EmployeeProfile } from '../types';

interface DayWiseCollectProps {
  borrowers: AssignedBorrower[];
  setBorrowers: React.Dispatch<React.SetStateAction<AssignedBorrower[]>>;
  collections: CollectionRecord[];
  setCollections: React.Dispatch<React.SetStateAction<CollectionRecord[]>>;
  employee: EmployeeProfile | null;
  onShowToast: (msg: string) => void;
}

export const DayWiseCollect: React.FC<DayWiseCollectProps> = ({
  borrowers,
  setBorrowers,
  collections,
  setCollections,
  employee,
  onShowToast,
}) => {
  // Search Term
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('Active');
  const [villageFilter, setVillageFilter] = useState<string>('All');

  // Active Collect Modal state
  const [selectedBorrower, setSelectedBorrower] = useState<AssignedBorrower | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [collectDate, setCollectDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [collectAmount, setCollectAmount] = useState<string>('500');
  const [collectPaymentType, setCollectPaymentType] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Digital Receipt modal state
  const [receiptData, setReceiptData] = useState<CollectionRecord | null>(null);
  const [receiptBorrowerRemaining, setReceiptBorrowerRemaining] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Extract unique villages for quick filter
  const uniqueVillages = Array.from(new Set(borrowers.map((b) => b.village).filter(Boolean)));

  // Filtered borrowers
  const filteredBorrowers = borrowers.filter((b) => {
    // Status filter
    if (statusFilter === 'Active' && b.isClosed) return false;
    if (statusFilter === 'Closed' && !b.isClosed) return false;

    // Village filter
    if (villageFilter !== 'All' && b.village !== villageFilter) return false;

    // Search query matching ID, Phone, Telugu Name, English Name, or Village
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      b.id.toLowerCase().includes(term) ||
      String(b.sNo).toLowerCase().includes(term) ||
      (b.nameTelugu || '').toLowerCase().includes(term) ||
      (b.nameEnglish || '').toLowerCase().includes(term) ||
      (b.phone || '').includes(term) ||
      (b.altPhone || '').includes(term) ||
      (b.village || '').toLowerCase().includes(term) ||
      (b.productItem || '').toLowerCase().includes(term)
    );
  });

  // Open Collect Modal for a borrower
  const handleOpenCollect = (b: AssignedBorrower) => {
    setSelectedBorrower(b);
    setCollectDate(new Date().toISOString().split('T')[0]);
    // Default to either weekly installment 500 or minimum remaining
    const remaining = Number(b.remainingBalance) || 0;
    const defaultAmt = remaining > 0 ? Math.min(500, remaining) : 0;
    setCollectAmount(defaultAmt > 0 ? defaultAmt.toString() : '');
    setCollectPaymentType('Cash');
    setCollectNotes('');
    setIsCollectModalOpen(true);
  };

  // Submit Collection Record
  const handleRecordCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrower) return;

    const amt = parseFloat(collectAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      onShowToast('Please enter a valid positive collection amount.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const receiptNum = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentRemaining = Number(selectedBorrower.remainingBalance) || 0;
    const currentPaid = Number(selectedBorrower.totalPaid) || 0;
    const newRemaining = Math.max(0, currentRemaining - amt);
    const newPaid = currentPaid + amt;
    const shouldClose = newRemaining <= 0;

    // 1. Create collection record
    const newRecord: CollectionRecord = {
      id: `col-${Date.now()}`,
      receiptNo: receiptNum,
      borrowerId: selectedBorrower.id,
      borrowerNameTelugu: selectedBorrower.nameTelugu,
      borrowerNameEnglish: selectedBorrower.nameEnglish,
      borrowerPhone: selectedBorrower.phone,
      village: selectedBorrower.village,
      amount: amt,
      paymentType: collectPaymentType,
      date: collectDate,
      time: timeStr,
      collectedBy: employee?.name || 'Field Officer',
      notes: collectNotes.trim() || undefined,
    };

    // 2. Update borrower balance and status
    const updatedBorrowers = borrowers.map((b) => {
      if (b.id === selectedBorrower.id) {
        return {
          ...b,
          remainingBalance: newRemaining,
          totalPaid: newPaid,
          isClosed: shouldClose,
          closedDate: shouldClose ? collectDate : b.closedDate,
        };
      }
      return b;
    });

    setBorrowers(updatedBorrowers);
    setCollections([newRecord, ...collections]);

    setIsSubmitting(false);
    setIsCollectModalOpen(false);

    // Open receipt modal
    setReceiptData(newRecord);
    setReceiptBorrowerRemaining(newRemaining);
    setIsReceiptModalOpen(true);

    onShowToast(`Successfully collected ₹${amt.toLocaleString('en-IN')} from ${selectedBorrower.nameTelugu}! 💰`);
  };

  // Quick Amount Selector
  const applyQuickAmount = (val: number) => {
    setCollectAmount(val.toString());
  };

  // Export Today's Collections
  const handleExportCollections = () => {
    try {
      const exportData = collections.map((c) => ({
        'Receipt No': c.receiptNo,
        'Borrower ID': c.borrowerId,
        'Telugu Name': c.borrowerNameTelugu,
        'English Name': c.borrowerNameEnglish,
        'Phone': c.borrowerPhone,
        'Village': c.village,
        'Amount Collected (₹)': c.amount,
        'Payment Mode': c.paymentType,
        'Date': c.date,
        'Time': c.time,
        'Collected By': c.collectedBy,
        'Remarks': c.notes || '',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Collections');
      XLSX.writeFile(wb, `KN_Collections_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
      onShowToast('Exported collections ledger to Excel! 📊');
    } catch (err) {
      onShowToast('Failed to export collections.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Filter Bar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Daily Route Collections
              </span>
              <span className="text-xs text-slate-500 font-semibold">• ఖాతాదారుని వెతికి సొమ్ము జమ చేయండి</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
              Day-wise Collection (రోజువారీ వసూళ్లు)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search by Account ID, Name (Telugu/English), Phone number, or Village to record collections immediately.
            </p>
          </div>

          <button
            onClick={handleExportCollections}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 self-start sm:self-center cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Collections</span>
          </button>
        </div>

        {/* 2. Interactive Search Box & Filter Chips */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
          
          {/* Main Fast Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, Phone, Name (తెలుగు / English) లేదా ఊరు..."
              className="w-full h-11 pl-10 pr-9 text-xs sm:text-[13px] bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 rounded-2xl text-slate-900 placeholder-slate-400 transition-all outline-none font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {(['Active', 'All', 'Closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'Active' ? 'Active Loans' : st === 'Closed' ? 'Closed' : 'All'}
              </button>
            ))}
          </div>

          {/* Village Dropdown Filter */}
          {uniqueVillages.length > 0 && (
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="h-11 px-3 text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:border-[#166534]"
            >
              <option value="All">All Villages (అన్ని ఊర్లు)</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}

        </div>
      </div>

      {/* 3. Borrowers Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
          <span>Found {filteredBorrowers.length} borrower accounts</span>
          {searchTerm && <span className="text-[#166534]">Filter: "{searchTerm}"</span>}
        </div>

        {filteredBorrowers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBorrowers.map((borrower) => {
              const principal = Number(borrower.principalAmount) || 0;
              const remaining = Number(borrower.remainingBalance) || 0;
              const paid = Number(borrower.totalPaid) || 0;
              const target = Number(borrower.initialRemaining) || principal;
              const pctPaid = target > 0 ? Math.min(100, Math.round((paid / target) * 100)) : 100;

              return (
                <div
                  key={borrower.id}
                  className={`p-5 rounded-3xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between ${
                    borrower.isClosed
                      ? 'border-slate-200 bg-slate-50/50 opacity-80'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {/* Top Details */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-[#166534] font-extrabold flex items-center justify-center text-sm shadow-inner">
                          {borrower.nameTelugu ? borrower.nameTelugu.charAt(0) : 'B'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-[#0F172A]">
                              {borrower.nameTelugu}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              #{borrower.sNo}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500">
                            {borrower.nameEnglish} • {borrower.village || 'Field Village'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          borrower.isClosed
                            ? 'bg-slate-200 text-slate-700'
                            : remaining > 0
                            ? 'bg-emerald-100 text-[#166534]'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {borrower.isClosed ? 'Closed' : 'Active'}
                      </span>
                    </div>

                    {/* Contact & Item Description */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {borrower.phone ? (
                          <a
                            href={`tel:${borrower.phone}`}
                            className="font-mono text-emerald-800 font-bold hover:underline"
                          >
                            {borrower.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </div>
                      <span className="font-medium text-slate-500 truncate max-w-[130px]" title={borrower.productItem}>
                        {borrower.productItem || 'Weekly Terms'}
                      </span>
                    </div>

                    {/* Financial Numbers Box */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold">Principal</div>
                        <div className="text-xs font-extrabold text-slate-800 font-mono mt-0.5">
                          ₹{principal.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-700 font-bold">Paid So Far</div>
                        <div className="text-xs font-extrabold text-emerald-700 font-mono mt-0.5">
                          ₹{paid.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-700 font-bold">Remaining Due</div>
                        <div className="text-xs font-extrabold text-rose-700 font-mono mt-0.5">
                          ₹{remaining.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Repayment Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Repayment Progress</span>
                        <span className="font-mono text-emerald-700">{pctPaid}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#166534] transition-all"
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collect Action Button */}
                  <div className="pt-2">
                    {!borrower.isClosed ? (
                      <button
                        onClick={() => handleOpenCollect(borrower)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-[#166534] hover:from-emerald-700 hover:to-[#14532d] text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <IndianRupee className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>Collect Installment (సొమ్ము జమ చేయండి)</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                        Account Cleared & Closed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No matching borrower accounts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching with another name, phone number, or select "All" in the status filter above.
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          COLLECTION PAYMENT MODAL (Add Date & Amount for Person)
         ======================================================== */}
      {isCollectModalOpen && selectedBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] text-[10px] font-bold border border-emerald-200 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>RECORD INSTALLMENT PAYMENT</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#0F172A]">
                  {selectedBorrower.nameTelugu} ({selectedBorrower.nameEnglish})
                </h3>
                <p className="text-xs text-slate-500">
                  Account #{selectedBorrower.sNo} • Village: {selectedBorrower.village || 'Rampur'}
                </p>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Snapshot Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-800">Remaining Balance (బాకీ సొమ్ము)</div>
                <div className="text-xl font-extrabold text-amber-950 font-mono mt-0.5">
                  ₹{(Number(selectedBorrower.remainingBalance) || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-500 font-medium">Total Paid: </span>
                <span className="font-bold text-emerald-800 font-mono">
                  ₹{(Number(selectedBorrower.totalPaid) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordCollection} className="space-y-4">
              
              {/* 1. Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Collection Date (వసూలు తేదీ)</span>
                </label>
                <input
                  type="date"
                  required
                  value={collectDate}
                  onChange={(e) => setCollectDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#166534] focus:bg-white transition-all font-mono"
                />
              </div>

              {/* 2. Amount Input + Quick Amount Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Collected Amount (సొమ్ము ₹)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Rupees</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={Number(selectedBorrower.remainingBalance) || 999999}
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 500)"
                    className="w-full pl-8 pr-4 py-2.5 text-base font-extrabold font-mono rounded-xl bg-slate-50 border border-slate-200 text-[#0F172A] focus:outline-none focus:border-[#166534] focus:bg-white transition-all"
                  />
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[200, 500, 1000, 1500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => applyQuickAmount(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        collectAmount === val.toString()
                          ? 'bg-[#166534] text-white border-[#166534]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      +₹{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => applyQuickAmount(Number(selectedBorrower.remainingBalance) || 0)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 ml-auto"
                  >
                    Full Balance (మొత్తం క్లియర్)
                  </button>
                </div>
              </div>

              {/* 3. Payment Mode Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Process / Mode (చెల్లింపు విధానం)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'UPI', 'Card'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCollectPaymentType(mode)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                        collectPaymentType === mode
                          ? 'bg-emerald-50 text-[#166534] border-emerald-400 ring-2 ring-emerald-500/20 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'Cash' ? '💵 నగదు (Cash)' : mode === 'UPI' ? '📱 PhonePe / UPI' : '💳 Card / Bank'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Notes & Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Remarks / Receipt Note (గమనికలు)</label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="Optional notes e.g. weekly installment payment"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#166534] focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Issue Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          INSTANT DIGITAL RECEIPT MODAL (రసీదు)
         ======================================================== */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            
            {/* Success Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#166534] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Payment Success
              </span>
              <h3 className="text-lg font-extrabold text-[#0F172A] mt-1.5">
                రసీదు (Collection Receipt)
              </h3>
              <p className="text-xs font-mono text-slate-400 font-bold">{receiptData.receiptNo}</p>
            </div>

            {/* Receipt Summary Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Borrower (ఖాతాదారుడు):</span>
                <span className="font-bold text-slate-900">{receiptData.borrowerNameTelugu}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Amount Collected:</span>
                <span className="font-mono font-extrabold text-[#166534] text-sm">₹{receiptData.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Payment Process:</span>
                <span className="font-bold text-slate-800">{receiptData.paymentType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-mono text-slate-700">{receiptData.date} • {receiptData.time}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Remaining Due:</span>
                <span className="font-mono font-bold text-rose-700">₹{receiptBorrowerRemaining.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-0.5 text-[11px]">
                <span className="text-slate-500">Officer:</span>
                <span className="font-semibold text-slate-800">{receiptData.collectedBy}</span>
              </div>
            </div>

            {/* Print / Done Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-sm transition-all"
              >
                Done (పూర్తయింది)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
