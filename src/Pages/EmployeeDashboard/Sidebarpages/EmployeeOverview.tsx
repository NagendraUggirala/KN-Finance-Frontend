import React, { useState } from 'react';
import {
  TrendingUp,
  Banknote,
  Receipt,
  Users,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  FileText,
  PlusCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import type { EmployeeProfile, AssignedBorrower, CollectionRecord, DailyExpense } from '../types';

interface EmployeeOverviewProps {
  employee: EmployeeProfile | null;
  borrowers: AssignedBorrower[];
  collections: CollectionRecord[];
  expenses: DailyExpense[];
  onNavigateTab: (tab: any) => void;
  onShowToast: (msg: string) => void;
}

export const EmployeeOverview: React.FC<EmployeeOverviewProps> = ({
  employee,
  borrowers,
  collections,
  expenses,
  onNavigateTab,
}) => {
  const [hideFigures, setHideFigures] = useState<boolean>(false);

  // Today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter collections for today
  const todayCollections = collections.filter((c) => c.date === todayStr);
  const todayCollectionsTotal = todayCollections.reduce((sum, c) => sum + c.amount, 0);

  // Filter expenses for today
  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Cash in Hand
  const netCashInHand = Math.max(0, todayCollectionsTotal - todayExpensesTotal);

  // Customers metrics
  const totalCustomers = borrowers.length;
  const activeCustomers = borrowers.filter((b) => !b.isClosed).length;
  const closedCustomers = borrowers.filter((b) => b.isClosed).length;

  // New customers added today (created today or marked today)
  const newCustomersToday = borrowers.filter((b) => b.createdAt === todayStr || b.startDate === todayStr).length;

  // Accounts closed today
  const closedToday = borrowers.filter((b) => b.closedDate === todayStr).length;

  // Total outstanding balance across all assigned borrowers
  const totalOutstandingRemaining = borrowers
    .filter((b) => !b.isClosed)
    .reduce((sum, b) => sum + (Number(b.remainingBalance) || 0), 0);

  // Daily target (assumed 25,000 for field collection)
  const dailyTarget = 25000;
  const targetPct = Math.min(100, Math.round((todayCollectionsTotal / dailyTarget) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Welcome Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#166534] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-[#D4A017]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FIELD OFFICER CONSOLE • శాఖ ఫీల్డ్ పోర్టల్</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              నమస్కారం, {employee?.name || 'Field Officer'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Track daily field collections, search borrower installments, record daily operating expenses, and reconcile day-end cash in hand.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Route: {employee?.assignedOperationalArea || 'Sector North'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Quick Net Cash Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col items-start md:items-end min-w-[200px]">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
              <span>Net Cash in Hand (మిగిలిన సొమ్ము)</span>
              <button
                onClick={() => setHideFigures(!hideFigures)}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                title="Toggle Visibility"
              >
                {hideFigures ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D4A017] font-mono mt-1">
              {hideFigures ? '••••••' : `₹${netCashInHand.toLocaleString('en-IN')}`}
            </div>
            <p className="text-[10px] text-emerald-300 mt-1">
              Total Collections (₹{todayCollectionsTotal.toLocaleString('en-IN')}) - Expenses (₹{todayExpensesTotal.toLocaleString('en-IN')})
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid (6 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Metric 1: Today's Collection */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#166534]">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#0F172A] font-mono">
            {hideFigures ? '••••' : `₹${todayCollectionsTotal.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-between">
            <span>{todayCollections.length} Installments</span>
            <span>{targetPct}% Target</span>
          </div>
        </div>

        {/* Metric 2: Today's Field Expenses */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Day Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-600 font-mono">
            {hideFigures ? '••••' : `₹${todayExpensesTotal.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            <span>{todayExpenses.length} Expense Slips</span>
          </div>
        </div>

        {/* Metric 3: Remaining Due Across Route */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Route Dues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-900 font-mono">
            {hideFigures ? '••••' : `₹${totalOutstandingRemaining.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            <span>{activeCustomers} Active Accounts</span>
          </div>
        </div>

        {/* Metric 4: Assigned Customers */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Borrowers</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#0F172A] font-mono">
            {totalCustomers}
          </div>
          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
            <span>Active: {activeCustomers}</span>
            <span>Closed: {closedCustomers}</span>
          </div>
        </div>

        {/* Metric 5: New Customers Added Today */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Added Today</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PlusCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-900 font-mono">
            +{newCustomersToday}
          </div>
          <div className="text-[10px] text-purple-700 font-bold">
            <span>కొత్త ఖాతాదారులు</span>
          </div>
        </div>

        {/* Metric 6: Accounts Closed Today */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cleared Today</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-teal-900 font-mono">
            {closedToday}
          </div>
          <div className="text-[10px] text-teal-700 font-bold">
            <span>బాకీ చెల్లించి ముగింపు</span>
          </div>
        </div>

      </div>

      {/* 3. Daily Target Progress & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Collection Goal Progress */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Daily Collection Target</h3>
              <p className="text-xs text-slate-500">Route target progress for today's collection run</p>
            </div>
            <span className="text-xs font-mono font-extrabold text-[#166534] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Target: ₹{dailyTarget.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Progress Achieved</span>
              <span className="font-mono text-[#166534]">{targetPct}% (₹{todayCollectionsTotal.toLocaleString('en-IN')})</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#166534] transition-all duration-500"
                style={{ width: `${targetPct}%` }}
              />
            </div>
          </div>

          {/* Quick Route Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('day_wise_collect')}
              className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all cursor-pointer group"
            >
              <Banknote className="w-5 h-5 text-[#166534] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-[#166534]">Day-wise Collect</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Search borrower by ID/Phone and collect</p>
            </button>

            <button
              onClick={() => onNavigateTab('expenses_summary')}
              className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-left transition-all cursor-pointer group"
            >
              <Receipt className="w-5 h-5 text-amber-700 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-amber-900">Expenses & Cash Settlement</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Record petrol, tea, and balance cash</p>
            </button>

            <button
              onClick={() => onNavigateTab('ledger_book')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer group"
            >
              <FileText className="w-5 h-5 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Field Ledger Book</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Dual-page accounts & installment view</p>
            </button>
          </div>
        </div>

        {/* Operational Info Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wide">
                Duty Verification
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Officer Name:</span>
                <span className="font-bold text-slate-900">{employee?.name || 'Field Officer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-[#166534]">{employee?.employeeId || 'EMP-104'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono font-semibold text-slate-700">{employee?.phone || '9876543210'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Village:</span>
                <span className="font-semibold text-slate-800">{employee?.village || 'Rampur'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Branch Gateway:</span>
                <span className="font-bold text-emerald-800">Branch #104 (NY Central)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('customers')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View All Assigned Borrowers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 4. Today's Collections Feed */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Today's Recorded Collections</h3>
            <p className="text-xs text-slate-500">Live stream of cash and UPI payments collected today</p>
          </div>
          <button
            onClick={() => onNavigateTab('day_wise_collect')}
            className="text-xs font-bold text-[#166534] hover:underline flex items-center gap-1"
          >
            <span>+ Record New Installment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayCollections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                  <th className="p-3">Receipt #</th>
                  <th className="p-3">Borrower Name (ఖాతాదారుడు)</th>
                  <th className="p-3">Village</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayCollections.slice(0, 5).map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-500">{col.receiptNo}</td>
                    <td className="p-3 font-semibold text-[#0F172A]">
                      <span>{col.borrowerNameTelugu}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 font-normal">({col.borrowerNameEnglish})</span>
                    </td>
                    <td className="p-3 text-slate-600">{col.village}</td>
                    <td className="p-3 text-slate-500 font-mono">{col.time}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        col.paymentType === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {col.paymentType}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-[#166534]">
                      ₹{col.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Banknote className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No collections logged yet for today.</p>
            <button
              onClick={() => onNavigateTab('day_wise_collect')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#166534] font-bold text-xs hover:bg-emerald-100 transition-colors"
            >
              Start Collecting
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
