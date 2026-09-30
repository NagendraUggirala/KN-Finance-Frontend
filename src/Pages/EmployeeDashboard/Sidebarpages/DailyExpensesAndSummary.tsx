import React, { useState } from 'react';
import {
  Calendar,
  Receipt,
  IndianRupee,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { DailyExpense, CollectionRecord, AssignedBorrower, EmployeeProfile } from '../types';

interface DailyExpensesAndSummaryProps {
  expenses: DailyExpense[];
  setExpenses: React.Dispatch<React.SetStateAction<DailyExpense[]>>;
  collections: CollectionRecord[];
  borrowers: AssignedBorrower[];
  employee: EmployeeProfile | null;
  onShowToast: (msg: string) => void;
}

export const DailyExpensesAndSummary: React.FC<DailyExpensesAndSummaryProps> = ({
  expenses,
  setExpenses,
  collections,
  borrowers,
  employee,
  onShowToast,
}) => {
  // Selected Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // New Expense Form State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<DailyExpense['category']>('Fuel/Petrol');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [expenseBillNo, setExpenseBillNo] = useState<string>('');

  // Shift selected date back/forward by 1 day
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filter collections for selected date
  const dateCollections = collections.filter((c) => c.date === selectedDate);
  const totalCollections = dateCollections.reduce((sum, c) => sum + c.amount, 0);
  const cashCollections = dateCollections.filter((c) => c.paymentType === 'Cash').reduce((sum, c) => sum + c.amount, 0);
  const upiCollections = dateCollections.filter((c) => c.paymentType === 'UPI').reduce((sum, c) => sum + c.amount, 0);

  // Filter expenses for selected date
  const dateExpenses = expenses.filter((e) => e.date === selectedDate);
  const totalExpenses = dateExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Remaining Net Cash in Hand
  const remainingCashInHand = Math.max(0, totalCollections - totalExpenses);

  // New customers added on this date
  const newCustomersOnDate = borrowers.filter(
    (b) => b.createdAt === selectedDate || b.startDate === selectedDate
  );

  // Accounts closed on this date
  const closedAccountsOnDate = borrowers.filter(
    (b) => b.closedDate === selectedDate || (b.isClosed && b.startDate === selectedDate)
  );

  // Add Expense Submission
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      onShowToast('Please enter a valid expense amount.');
      return;
    }

    const newExpense: DailyExpense = {
      id: `exp-${Date.now()}`,
      date: selectedDate,
      category: expenseCategory,
      amount: amt,
      description: expenseDescription.trim() || `${expenseCategory} expense`,
      paidBy: employee?.name || 'Field Officer',
      receiptNumber: expenseBillNo.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setExpenses([newExpense, ...expenses]);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseBillNo('');
    setIsAddExpenseOpen(false);

    onShowToast(`Added expense of ₹${amt.toLocaleString('en-IN')} for ${expenseCategory}! 🧾`);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    onShowToast('Expense item removed.');
  };

  // Export Daily Settlement Sheet to Excel
  const handleExportDailySettlement = () => {
    try {
      const summaryAoa = [
        ['KN FINANCE - DAILY OPERATIONS SETTLEMENT REPORT (రోజువారీ లెక్కల నివేదిక)'],
        [`Date of Audit: ${selectedDate}`, `Officer: ${employee?.name || 'Field Officer'}`],
        [`Route: ${employee?.assignedOperationalArea || 'Sector North'}`],
        [],
        ['RECONCILIATION SUMMARY', 'AMOUNT (₹)'],
        ['Total Collections Recorded', totalCollections],
        ['Cash Collected', cashCollections],
        ['UPI Collected', upiCollections],
        ['Total Daily Expenses Deducted', totalExpenses],
        ['NET CASH IN HAND / REMAINING MONEY', remainingCashInHand],
        [],
        ['CUSTOMER LIFECYCLE ON DATE', 'COUNT'],
        ['New Customers Added', newCustomersOnDate.length],
        ['Borrower Accounts Cleared & Closed', closedAccountsOnDate.length],
        [],
        ['EXPENSES BREAKDOWN'],
        ['ID', 'Category', 'Description', 'Bill/Receipt #', 'Amount (₹)']
      ];

      dateExpenses.forEach((exp) => {
        summaryAoa.push([
          exp.id,
          exp.category,
          exp.description,
          exp.receiptNumber || '—',
          exp.amount.toString()
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(summaryAoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Settlement');
      XLSX.writeFile(wb, `KN_Daily_Settlement_${selectedDate}.xlsx`);
      onShowToast(`Exported Daily Settlement for ${selectedDate} to Excel! 📊`);
    } catch (err) {
      onShowToast('Failed to export daily settlement sheet.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Date Selector */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Daily Ledger Settlement
              </span>
              <span className="text-xs text-slate-500 font-semibold">• ఖర్చులు & రోజువారీ నికర సొమ్ము</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
              Daily Expenses & Cash Settlement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any date to log field operating expenses, verify total collections, view remaining cash, and monitor new vs closed customers.
            </p>
          </div>

          {/* Date Picker & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
            
            {/* Previous Day */}
            <button
              onClick={() => handleDateShift(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Date Input */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-[#166534]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Next Day */}
            <button
              onClick={() => handleDateShift(1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Today Button */}
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 rounded-xl bg-emerald-50 text-[#166534] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
            >
              Today
            </button>

            {/* Export */}
            <button
              onClick={handleExportDailySettlement}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
              title="Export Day Settlement to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Daily Reconciliation Cards (The exact metrics requested by user) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Collections on Date */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Collection</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#166534]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#166534] font-mono">
            ₹{totalCollections.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between font-medium">
            <span>Cash: ₹{cashCollections.toLocaleString('en-IN')}</span>
            <span>UPI: ₹{upiCollections.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2: Total Expenses on Date */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Field Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            <span>{dateExpenses.length} Expense Items Recorded</span>
          </div>
        </div>

        {/* Card 3: REMAINING MONEY / NET CASH IN HAND (Highlighted) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between text-amber-100">
            <span className="text-[11px] font-bold uppercase tracking-wider">Remaining Money (మిగిలిన సొమ్ము)</span>
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            ₹{remainingCashInHand.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-100 font-bold">
            <span>Collections - Day Expenses</span>
          </div>
        </div>

        {/* Card 4: New Customers Added on Date */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">New Customers</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-900 font-mono">
            +{newCustomersOnDate.length}
          </div>
          <div className="text-[10px] text-purple-700 font-bold">
            <span>కొత్తగా చేరిన ఖాతాదారులు</span>
          </div>
        </div>

        {/* Card 5: Accounts Closed / Cleared on Date */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Accounts Closed</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-900 font-mono">
            {closedAccountsOnDate.length}
          </div>
          <div className="text-[10px] text-teal-700 font-bold">
            <span>బాకీ చెల్లించి ముగింపు</span>
          </div>
        </div>

      </div>

      {/* 3. Main Two-Column Layout: Expenses Tracker & Day Settlement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Daily Expenses List & Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">
                Field Operating Expenses (ఫీల్డ్ ఖర్చులు)
              </h3>
              <p className="text-xs text-slate-500">
                Log petrol, food, tea, and other travel costs incurred on {selectedDate}
              </p>
            </div>

            <button
              onClick={() => setIsAddExpenseOpen(!isAddExpenseOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>{isAddExpenseOpen ? 'Close Form' : '+ Add Expense (ఖర్చు నమోదు)'}</span>
            </button>
          </div>

          {/* Add Expense Form Card (Toggled) */}
          {isAddExpenseOpen && (
            <form onSubmit={handleAddExpense} className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                  New Expense Voucher for {selectedDate}
                </span>
                <span className="text-[11px] text-amber-800 font-mono font-bold">Cash Deductible</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 text-slate-900 outline-none focus:ring-2 focus:ring-[#166534]/20"
                  >
                    <option value="Fuel/Petrol">⛽ Fuel / Petrol (పెట్రోల్)</option>
                    <option value="Food & Tea">☕ Food & Tea (టీ/భోజనం)</option>
                    <option value="Travel/Vehicle">🛵 Vehicle / Transport (ప్రయాణం)</option>
                    <option value="Mobile Recharge">📱 Mobile Recharge (రీచార్జ్)</option>
                    <option value="Stationery">📄 Stationery & Print (స్టేషనరీ)</option>
                    <option value="Miscellaneous">📦 Other Misc (ఇతర ఖర్చులు)</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-amber-300 text-slate-900 outline-none focus:ring-2 focus:ring-[#166534]/20"
                    />
                  </div>
                </div>

                {/* Bill/Receipt Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Bill/Receipt # (Optional)</label>
                  <input
                    type="text"
                    value={expenseBillNo}
                    onChange={(e) => setExpenseBillNo(e.target.value)}
                    placeholder="e.g. BILL-889"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 text-slate-900 outline-none focus:ring-2 focus:ring-[#166534]/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Description / Reason (ఖర్చు వివరాలు)</label>
                <input
                  type="text"
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="e.g. Bike petrol for Rampur and Sector North route collection"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 text-slate-900 outline-none focus:ring-2 focus:ring-[#166534]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs"
                >
                  Save Expense Item
                </button>
              </div>
            </form>
          )}

          {/* Expenses Table */}
          {dateExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Bill Ref</th>
                    <th className="p-3">Paid By</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dateExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{exp.description}</td>
                      <td className="p-3 font-mono text-slate-500">{exp.receiptNumber || '—'}</td>
                      <td className="p-3 text-slate-600">{exp.paidBy}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-rose-700">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-rose-50/40 font-bold text-rose-900 border-t-2 border-slate-200">
                    <td colSpan={4} className="p-3 text-right uppercase text-[11px]">
                      Total Field Expenses ({selectedDate}):
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-sm">
                      ₹{totalExpenses.toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-1.5">
              <Receipt className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No field expenses recorded for {selectedDate}.</p>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-3 py-1 text-xs font-bold text-[#166534] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                + Add First Expense
              </button>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Day End Settlement Statement */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#0F172A]">Day Cash Settlement</h3>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {selectedDate}
              </span>
            </div>

            {/* Reconciliation Statement Items */}
            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Total Money Collected:</span>
                <span className="font-mono font-bold text-[#166534]">
                  + ₹{totalCollections.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 pl-3 text-[11px] text-slate-500">
                <span>↳ Cash in Bag:</span>
                <span className="font-mono font-semibold">₹{cashCollections.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 pl-3 text-[11px] text-slate-500">
                <span>↳ Direct UPI / QR:</span>
                <span className="font-mono font-semibold">₹{upiCollections.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-rose-700">
                <span>Less: Day Operating Expenses:</span>
                <span className="font-mono font-bold">
                  - ₹{totalExpenses.toLocaleString('en-IN')}
                </span>
              </div>

              {/* NET CASH IN HAND HIGHLIGHT */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 flex items-center justify-between font-bold">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-amber-800">
                    Net Cash to Submit
                  </div>
                  <div className="text-[10px] font-normal text-amber-700">
                    మిగిలిన సొమ్ము (Cash in Hand)
                  </div>
                </div>
                <div className="text-xl font-extrabold font-mono text-[#166534]">
                  ₹{remainingCashInHand.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Customers Added & Closed Stats */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Customer Status On {selectedDate}
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200">
                  <span className="font-bold">New Customers Added:</span>
                  <span className="font-mono font-extrabold text-sm">+{newCustomersOnDate.length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50 text-teal-900 border border-teal-200">
                  <span className="font-bold">Accounts Cleared & Closed:</span>
                  <span className="font-mono font-extrabold text-sm">{closedAccountsOnDate.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settle Action Button */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                onShowToast(`Day settlement for ${selectedDate} confirmed. Total Net Cash: ₹${remainingCashInHand.toLocaleString('en-IN')} ✅`);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />
              <span>Confirm & Lock Day Settlement</span>
            </button>

            <button
              onClick={() => window.print()}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Day Reconciliation Sheet</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
