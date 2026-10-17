import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Printer,
  Smartphone,
  Search,
  FileSpreadsheet,
  Building2,
  HelpCircle,
  Copy,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
  Receipt,
  Coins,
  Shield
} from 'lucide-react';
import {
  transliterateEnglishToTelugu
} from '../AdminDashboard/Sidebarpages/transliterate';

interface LandingProps {
  onOpenLogin: () => void;
  onShowToast: (msg: string) => void;
}

// Sample sample rows for the interactive Finance Book preview
interface SampleLedgerRow {
  sNo: number;
  teluguName: string;
  englishName: string;
  principal: number;
  remaining: number;
  rate: number;
  weeks: { [key: string]: number | null };
  status: 'active' | 'closed';
}

const INITIAL_LEDGER_DATA: SampleLedgerRow[] = [
  {
    sNo: 1,
    teluguName: 'వెంకటేశ్వర్లు',
    englishName: 'Venkateswarlu',
    principal: 20000,
    remaining: 12000,
    rate: 2,
    weeks: { '08-08': 1000, '15-08': 1000, '22-08': 1000, '29-08': 1000 },
    status: 'active',
  },
  {
    sNo: 2,
    teluguName: 'రామయ్య నాయుడు',
    englishName: 'Ramayya Naidu',
    principal: 15000,
    remaining: 4500,
    rate: 2,
    weeks: { '08-08': 750, '15-08': 750, '22-08': 750, '29-08': 750 },
    status: 'active',
  },
  {
    sNo: 3,
    teluguName: 'లక్ష్మి దేవి',
    englishName: 'Lakshmi Devi',
    principal: 10000,
    remaining: 0,
    rate: 2,
    weeks: { '08-08': 1000, '15-08': 1000, '22-08': 1000, '29-08': 1000 },
    status: 'closed',
  },
  {
    sNo: 4,
    teluguName: 'శ్రీనివాస రావు',
    englishName: 'Srinivasa Rao',
    principal: 30000,
    remaining: 21000,
    rate: 2,
    weeks: { '08-08': 1500, '15-08': 1500, '22-08': 1500, '29-08': null },
    status: 'active',
  },
  {
    sNo: 5,
    teluguName: 'సుబ్బారావు',
    englishName: 'Subba Rao',
    principal: 25000,
    remaining: 15000,
    rate: 2,
    weeks: { '08-08': 1250, '15-08': 1250, '22-08': 1250, '29-08': 1250 },
    status: 'active',
  },
];

export const Landing: React.FC<LandingProps> = ({ onOpenLogin, onShowToast }) => {
  const navigate = useNavigate();

  // Active Role showcase tab
  const [activeRoleTab, setActiveRoleTab] = useState<'super_admin' | 'branch_admin' | 'field_officer'>('branch_admin');

  // Interactive Live Ledger state
  const [ledgerRows, setLedgerRows] = useState<SampleLedgerRow[]>(INITIAL_LEDGER_DATA);
  const [selectedLedgerRow, setSelectedLedgerRow] = useState<number>(1);
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  // Interactive Transliteration Demo state
  const [translitInput, setTranslitInput] = useState<string>('Nagaraju Sharma');
  const [copiedTelugu, setCopiedTelugu] = useState<boolean>(false);

  // Microfinance Loan & EMI Calculator state
  const [calcMode, setCalcMode] = useState<'weekly' | 'daily' | 'monthly'>('weekly');
  const [principalAmount, setPrincipalAmount] = useState<number>(25000);
  const [weeklyTenure, setWeeklyTenure] = useState<number>(16); // Weeks
  const [dailyTenure, setDailyTenure] = useState<number>(100); // Days
  const [monthlyTenure, setMonthlyTenure] = useState<number>(12); // Months
  const [interestRatePercent, setInterestRatePercent] = useState<number>(2.0); // 2% per month or equivalent
  const [processingFeePercent, setProcessingFeePercent] = useState<number>(1.5);

  // Interactive FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Computed Telugu transliteration live output
  const translitOutput = useMemo(() => {
    if (!translitInput.trim()) return '';
    return transliterateEnglishToTelugu(translitInput);
  }, [translitInput]);

  const handleCopyTelugu = () => {
    if (translitOutput) {
      navigator.clipboard.writeText(translitOutput);
      setCopiedTelugu(true);
      onShowToast(`Copied "${translitOutput}" to clipboard.`);
      setTimeout(() => setCopiedTelugu(false), 2000);
    }
  };

  // Financial calculations
  const calcResults = useMemo(() => {
    if (calcMode === 'weekly') {
      // Microfinance weekly loan calculation: Flat interest over tenure
      // 16 weeks ~ 3.7 months
      const months = weeklyTenure / 4.33;
      const totalInterest = Math.round(principalAmount * (interestRatePercent / 100) * months);
      const totalRepayable = principalAmount + totalInterest;
      const weeklyInstallment = Math.round(totalRepayable / weeklyTenure);
      const processingFee = Math.round(principalAmount * (processingFeePercent / 100));
      const netDisbursal = principalAmount - processingFee;
      return {
        installment: weeklyInstallment,
        installmentLabel: 'Weekly Installment',
        installmentPeriod: '/ week',
        totalInterest,
        totalRepayable,
        netDisbursal,
        processingFee,
        tenureDisplay: `${weeklyTenure} Weeks`,
      };
    } else if (calcMode === 'daily') {
      // Daily field collection calculation (common 100 days micro loan)
      const months = dailyTenure / 30;
      const totalInterest = Math.round(principalAmount * (interestRatePercent / 100) * months);
      const totalRepayable = principalAmount + totalInterest;
      const dailyInstallment = Math.round(totalRepayable / dailyTenure);
      const processingFee = Math.round(principalAmount * (processingFeePercent / 100));
      const netDisbursal = principalAmount - processingFee;
      return {
        installment: dailyInstallment,
        installmentLabel: 'Daily Collection Target',
        installmentPeriod: '/ day',
        totalInterest,
        totalRepayable,
        netDisbursal,
        processingFee,
        tenureDisplay: `${dailyTenure} Days`,
      };
    } else {
      // Standard monthly reducing balance EMI
      const r = (interestRatePercent * 12) / 12 / 100; // monthly rate
      const n = monthlyTenure;
      const emi = r > 0 ? (principalAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : principalAmount / n;
      const monthlyEmi = Math.round(emi);
      const totalRepayable = monthlyEmi * n;
      const totalInterest = totalRepayable - principalAmount;
      const processingFee = Math.round(principalAmount * (processingFeePercent / 100));
      const netDisbursal = principalAmount - processingFee;
      return {
        installment: monthlyEmi,
        installmentLabel: 'Monthly EMI',
        installmentPeriod: '/ month',
        totalInterest,
        totalRepayable,
        netDisbursal,
        processingFee,
        tenureDisplay: `${monthlyTenure} Months`,
      };
    }
  }, [calcMode, principalAmount, weeklyTenure, dailyTenure, monthlyTenure, interestRatePercent, processingFeePercent]);

  // Filtered rows for the interactive ledger preview
  const filteredLedgerRows = useMemo(() => {
    if (!ledgerSearch.trim()) return ledgerRows;
    const q = ledgerSearch.toLowerCase();
    return ledgerRows.filter(
      (r) =>
        r.englishName.toLowerCase().includes(q) ||
        r.teluguName.includes(q) ||
        r.sNo.toString() === q
    );
  }, [ledgerRows, ledgerSearch]);

  const activeRow = ledgerRows.find((r) => r.sNo === selectedLedgerRow) || ledgerRows[0];

  const toggleRowStatus = (sNo: number) => {
    setLedgerRows((prev) =>
      prev.map((r) => {
        if (r.sNo === sNo) {
          const nextStatus = r.status === 'active' ? 'closed' : 'active';
          onShowToast(`Account S.No ${sNo} marked as ${nextStatus.toUpperCase()}`);
          return {
            ...r,
            status: nextStatus,
            remaining: nextStatus === 'closed' ? 0 : r.principal / 2,
          };
        }
        return r;
      })
    );
  };

  const handleOpenAdminLogin = () => {
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      navigate('/login?login=admin');
    }
  };

  const handleOpenEmployeeLogin = () => {
    navigate('/login?login=employee');
  };

  return (
    <div className="space-y-24 pb-20 bg-[#F8FAFC]">

      {/* ================= TOP ANNOUNCEMENT BANNER ================= */}
      <div className="bg-[#0F172A] border-b border-slate-800 text-white text-xs py-2.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#166534] text-[#D4A017] text-[11px] font-bold tracking-wide">
              <Sparkles className="w-3 h-3 text-[#D4A017]" />
              Bilingual v3.2
            </span>
            <span className="text-slate-300">
              నమోదు & ఫీల్డ్ కలెక్షన్ వ్యవస్థ • Digitizing Daily & Weekly Microfinance Ledgers across AP & Telangana
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <button
              onClick={() => navigate('/superadmin')}
              className="text-[#D4A017] hover:underline font-bold flex items-center gap-1"
            >
              <Shield className="w-3 h-3" /> Super Admin Portal
            </button>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline text-emerald-400 font-mono">100% Offline Batch Sync</span>
          </div>
        </div>
      </div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-8 lg:pt-14 pb-8 overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#166534]/8 via-transparent to-transparent pointer-events-none -z-10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/10 border border-[#166534]/30 text-[#166534] text-xs font-bold shadow-xs">
                <BookOpen className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Next-Gen Microfinance Operating System</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15] font-display">
                Digitizing Physical <br className="hidden sm:inline" />
                <span className="text-[#166534]">Finance Books</span> into <br />
                Real-Time Cloud Ledgers
              </h1>

              {/* Subtitle with Telugu transliteration highlight */}
              <p className="text-[#64748B] text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Built specifically for micro-lenders, credit societies, and daily/weekly finance operators.
                Replace physical notebooks with <strong>bilingual (English & తెలుగు)</strong> automated ledgers,
                route-wise mobile collections, instant digital receipts, and end-of-day cash reconciliation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleOpenAdminLogin}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-lg shadow-green-950/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-[#D4A017]" />
                  <span>Branch Admin Login</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </button>

                <button
                  onClick={handleOpenEmployeeLogin}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-bold text-[#0F172A] bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-[#166534]" />
                  <span>Field Officer Portal</span>
                </button>
              </div>

              {/* Trust & Digitization Stats */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 max-w-2xl mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-bold text-[#0F172A] font-display">100%</p>
                  <p className="text-xs text-[#64748B] font-medium">Paper Notebook Digitized</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#166534] font-display">English & తెలుగు</p>
                  <p className="text-xs text-[#64748B] font-medium">Phonetic Transliteration</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0F172A] font-display">UPI & Cash</p>
                  <p className="text-xs text-[#64748B] font-medium">Instant Digital Receipts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#D4A017] font-display">Zero Error</p>
                  <p className="text-xs text-[#64748B] font-medium">Daily Net Cash Tally</p>
                </div>
              </div>

            </div>

            {/* Right Interactive Ledger Visual Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="kn-card p-5 border-slate-300/80 bg-white shadow-2xl space-y-4">
                
                {/* Header of Simulated Ledger */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center text-[#166534]">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] font-display flex items-center gap-2">
                        Weekly Finance Book (లెడ్జర్)
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          Live Sync
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#64748B]">Batch Save: 5 Rows Synced to Cloud</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-mono font-medium">Branch 01</span>
                  </div>
                </div>

                {/* Search in Simulated Ledger */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search borrower by name or S.No..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#166534] transition-all"
                  />
                  {ledgerSearch && (
                    <button
                      onClick={() => setLedgerSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Simulated Ledger Rows */}
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-12 gap-1 text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100 px-1">
                    <span className="col-span-2">S.No</span>
                    <span className="col-span-4">Borrower Name (తెలుగు)</span>
                    <span className="col-span-3 text-right">Loan (₹)</span>
                    <span className="col-span-3 text-right">Balance (₹)</span>
                  </div>

                  {filteredLedgerRows.slice(0, 4).map((row) => (
                    <div
                      key={row.sNo}
                      onClick={() => setSelectedLedgerRow(row.sNo)}
                      className={`grid grid-cols-12 gap-1 items-center p-2 rounded-lg cursor-pointer transition-all ${
                        selectedLedgerRow === row.sNo
                          ? 'bg-[#166534]/10 border border-[#166534]/30 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <span className="col-span-2 font-mono font-bold text-[#0F172A]">
                        #{row.sNo}
                      </span>
                      <div className="col-span-4 leading-tight">
                        <p className="font-bold text-[#0F172A]">{row.teluguName}</p>
                        <p className="text-[10px] text-slate-500">{row.englishName}</p>
                      </div>
                      <span className="col-span-3 text-right font-mono font-bold text-[#0F172A]">
                        ₹{row.principal.toLocaleString('en-IN')}
                      </span>
                      <div className="col-span-3 text-right">
                        <span
                          className={`font-mono font-bold ${
                            row.remaining === 0 ? 'text-slate-400 line-through' : 'text-[#166534]'
                          }`}
                        >
                          ₹{row.remaining.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`block text-[9px] font-bold uppercase ${
                            row.status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Borrower Quick Action Pill */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#166534]" />
                      <span className="font-bold text-[#0F172A]">
                        Active Account: {activeRow.englishName} ({activeRow.teluguName})
                      </span>
                    </div>
                    <button
                      onClick={() => toggleRowStatus(activeRow.sNo)}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-colors"
                    >
                      Toggle {activeRow.status === 'active' ? 'Closed' : 'Active'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px] text-center pt-1 border-t border-slate-200/60 font-mono">
                    <div className="bg-white p-1 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block">08-08</span>
                      <span className="font-bold text-[#166534]">₹1,000</span>
                    </div>
                    <div className="bg-white p-1 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block">15-08</span>
                      <span className="font-bold text-[#166534]">₹1,000</span>
                    </div>
                    <div className="bg-white p-1 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block">22-08</span>
                      <span className="font-bold text-[#166534]">₹1,000</span>
                    </div>
                    <div className="bg-white p-1 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block">29-08</span>
                      <span className="font-bold text-[#D4A017]">Due ₹1k</span>
                    </div>
                  </div>
                </div>

                {/* Floating summary badge */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Today's Collection: <strong className="text-[#166534]">₹42,500</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                    <Coins className="w-3 h-3 text-[#D4A017]" /> Net Cash Reconciled
                  </span>
                </div>

              </div>

              {/* Floating field officer receipt pill */}
              <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-[#0F172A] p-4 rounded-2xl text-white shadow-2xl w-72 border border-slate-800 items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#D4A017]">Receipt #KN-9421</span>
                    <span className="text-[10px] text-emerald-400">PAID UPI</span>
                  </div>
                  <p className="text-slate-300">₹1,000 collected by Officer Ravi</p>
                  <p className="text-[10px] text-slate-400">Balance: ₹11,000 • Print Ready</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= REAL-TIME OPERATIONAL TICKER ================= */}
      <section className="border-y border-slate-200 bg-white py-3.5 shadow-xs overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6 overflow-x-auto text-xs">
          <span className="font-bold text-[#166534] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
            Live Operations Stream:
          </span>
          <div className="flex items-center gap-8 text-[#0F172A] font-medium min-w-[750px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Vijayawada Rural</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700 font-bold">రామయ్య Repaid ₹1,000 (UPI)</span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">2 min ago</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Guntur Market Route</span>
              <span className="text-slate-400">•</span>
              <span className="text-[#166534] font-bold">Batch Save: 18 Ledger Cells Updated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Ongole Branch</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-800 font-bold">Fuel Exp: ₹150 Logged • Net Cash: ₹34,200</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Excel Export</span>
              <span className="text-slate-400">•</span>
              <span className="text-blue-700 font-bold">Week-4 Ledger .xlsx Downloaded</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SYSTEM ARCHITECTURE & 3-TIER RBAC ================= */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold">
            <Layers className="w-3.5 h-3.5 text-[#D4A017]" /> 3-Tier Enterprise RBAC
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-display">
            Role-Based Operational Architecture
          </h2>
          <p className="text-[#64748B] text-base font-medium">
            Strict separation of concerns connecting Super Admin governance, Branch Admin ledger controls, and Field Officer mobile routes in real-time.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300 max-w-xl w-full">
            <button
              onClick={() => setActiveRoleTab('branch_admin')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRoleTab === 'branch_admin'
                  ? 'bg-white text-[#166534] shadow-md border border-slate-200'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#166534]" />
              <span>Branch Admin</span>
            </button>
            <button
              onClick={() => setActiveRoleTab('field_officer')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRoleTab === 'field_officer'
                  ? 'bg-white text-[#166534] shadow-md border border-slate-200'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#166534]" />
              <span>Field Officer</span>
            </button>
            <button
              onClick={() => setActiveRoleTab('super_admin')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRoleTab === 'super_admin'
                  ? 'bg-white text-[#166534] shadow-md border border-slate-200'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Content Cards */}
        <div className="kn-card p-8 lg:p-10 border-slate-300 bg-white shadow-xl">
          {activeRoleTab === 'branch_admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  Branch Level Portal (/admin)
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                  Centralized Ledger & Field Staff Command
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Branch managers hold complete control over active weekly & daily finance books. Monitor daily route collections, assign field staff to village sectors, edit installment entries with atomic batch save, and export accounting statements to Excel.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Full Finance Book:</strong> Spreadsheet grid with auto balance recalculation</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Field Staff Directory:</strong> Route allocation & phone masking</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>1-Click Excel:</strong> Instant .xlsx download for branch archives</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Activity Audit Trail:</strong> Complete branch event history log</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handleOpenAdminLogin}
                    className="px-6 py-3 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Launch Branch Admin Portal</span>
                    <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300"
                  >
                    View Interactive Demo
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl space-y-4 border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                  <span className="text-[#D4A017] font-bold font-mono">BRANCH DASHBOARD OVERVIEW</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">Active Session</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Total Active Borrowers</span>
                    <span className="text-xl font-bold font-mono text-white">482 Accounts</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Total Capital Deployed</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">₹94.50 Lakh</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Today's Due Collections</span>
                    <span className="text-xl font-bold font-mono text-[#D4A017]">₹1,85,000</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Field Collection Rate</span>
                    <span className="text-xl font-bold font-mono text-white">98.2%</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time sync active across 6 Field Officers on duty.</span>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === 'field_officer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                  On-Ground Operations (/employee)
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                  Mobile Route Collections & Digital Receipts
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Designed for field officers traveling by motorbike through villages and market centers. Quickly mark repayments via Cash or UPI, print or generate digital borrower receipts on the spot, log field fuel expenses, and reconcile net cash-in-hand before evening branch turnover.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Quick Collect:</strong> Instant Cash & UPI repayment entry</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Digital Receipts:</strong> Thermal & A4 printable receipts with officer seal</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Daily Expenses:</strong> Record fuel, travel & field refreshments</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Net Cash Reckoner:</strong> Collections - Expenses = Exact Cash in Hand</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handleOpenEmployeeLogin}
                    className="px-6 py-3 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Login to Field Officer App</span>
                    <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                  </button>
                  <button
                    onClick={() => navigate('/employee')}
                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300"
                  >
                    Preview Field View
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl space-y-4 border border-slate-700 shadow-2xl">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-700">
                  <span className="text-emerald-400 font-bold font-mono">FIELD ROUTE ACTIVE: VIJAYAWADA RURAL</span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-[#D4A017] text-[10px]">Officer: Ravi Kumar</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Cash Collections:</span>
                    <span className="font-mono font-bold text-white">₹28,500</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">UPI Digital Collections:</span>
                    <span className="font-mono font-bold text-emerald-400">₹14,000</span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-700">
                    <span className="text-slate-400">Fuel & Travel Allowances:</span>
                    <span className="font-mono font-bold text-rose-400">- ₹250</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span className="text-[#D4A017]">Net Cash in Hand:</span>
                    <span className="font-mono text-emerald-300 text-lg">₹28,250</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 italic">
                  * Instant balance SMS & receipt print generated for every customer payment.
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === 'super_admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4A017]" />
                  Enterprise Governance (/super-admin)
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                  System-Wide Multi-Branch Oversight & Compliance
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Designed for headquarters and executive directors. Monitor multiple branches across districts, provision branch administrators, inspect immutable audit logs with before/after mutation diffs, and issue global announcements.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Branch Management:</strong> Create, manage & deactivate branch accounts</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>Enterprise Audit Logs:</strong> Track all mutations with IP addresses</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>User Security:</strong> Fast credential reset & role revocation</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                    <span><strong>System Broadcasts:</strong> Push alerts to all branch admins and field officers</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/superadmin')}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm border border-slate-700 cursor-pointer"
                  >
                    <span>Super Admin Login</span>
                    <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-950 text-white p-6 rounded-2xl space-y-4 border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                  <span className="text-[#D4A017] font-bold font-mono">ENTERPRISE AUDIT MONITOR</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">Headquarters</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-emerald-400 font-bold block">UPDATE [FINANCE_BOOK]</span>
                      <span className="text-[10px] text-slate-400">Branch 01 • S.No 12 Repayment</span>
                    </div>
                    <span className="text-[10px] text-slate-500">IP: 103.21.x.x</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-blue-400 font-bold block">CREATE [EMPLOYEE]</span>
                      <span className="text-[10px] text-slate-400">Officer Ramesh added to Route 4</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Admin: Vijay</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-amber-400 font-bold block">BATCH_SAVE [SYNC]</span>
                      <span className="text-[10px] text-slate-400">42 installments synced</span>
                    </div>
                    <span className="text-[10px] text-slate-500">2026-10-10</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 italic">
                  * 100% compliant mutation history preserved indefinitely.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= 4 CORE MODULES SHOWCASE ================= */}
      <section id="modules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4A017]" /> Core Platform Modules
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-display">
            Engineered to Solve Ground-Reality Microfinance Challenges
          </h2>
          <p className="text-[#64748B] text-base font-medium">
            Every feature is tailor-made to replicate and enhance traditional weekly & daily notebook operations without steep learning curves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Module 1: Centralized Finance Book */}
          <div className="kn-card p-8 border-slate-300 bg-white kn-card-hover space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center text-[#166534]">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Module 01
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] font-display">
                Digital Finance Book & Ledger Grid
              </h3>
              <p className="text-xs text-[#166534] font-bold mt-0.5">
                కేంద్రీకృత ఫైనాన్స్ బుక్ / లెడ్జర్ మేనేజ్‌మెంట్
              </p>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Faithfully replicates physical weekly finance books with serial numbers, English and Telugu borrower names, loan amounts, interest rates, and installment date columns (e.g. 08-08, 15-08, 22-08). Features offline-resilient atomic batch saving.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Spreadsheet grid with live remaining balance calculation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Atomic Batch Save endpoint (/api/v1/finance-book/batch-save)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Instant SheetJS Excel (.xlsx) export for offline records</span>
              </div>
            </div>
          </div>

          {/* Module 2: Day-Wise Collection & Daily Reconciliation */}
          <div className="kn-card p-8 border-slate-300 bg-white kn-card-hover space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/30 flex items-center justify-center text-[#166534]">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                Module 02
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] font-display">
                Day-Wise Field Collections & Reconciliation
              </h3>
              <p className="text-xs text-[#166534] font-bold mt-0.5">
                రోజువారీ కలెక్షన్ & డైలీ క్యాష్ సమ్మరీ
              </p>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Field officers record repayments on route, supporting both physical Cash and UPI QR payments. Generates instant digital receipts. Reconciles daily field expenses (fuel & travel allowances) with live Net Cash in Hand computation.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Quick Collect for rapid field route entries</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Clean printable receipts with borrower balance & officer seal</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Daily Financial Summary: Cash vs UPI and Net Cash in Hand</span>
              </div>
            </div>
          </div>

          {/* Module 3: Employee Directory & Route Operations */}
          <div className="kn-card p-8 border-slate-300 bg-white kn-card-hover space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900">
                Module 03
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] font-display">
                Field Officer Directory & Route Assignment
              </h3>
              <p className="text-xs text-[#166534] font-bold mt-0.5">
                ఫీల్డ్ ఆఫీసర్ల నిర్వహణ & రూట్ మ్యాపింగ్
              </p>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Full CRUD registry for field staff with assignment to specific villages and collection routes. Includes privacy phone number masking, role permissions, and fast one-click credential recovery.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Route & Village mapping per field officer</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Security masking for personal contact numbers</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Real-time officer collection status monitoring</span>
              </div>
            </div>
          </div>

          {/* Module 4: Audit Logs & System Governance */}
          <div className="kn-card p-8 border-slate-300 bg-white kn-card-hover space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900">
                Module 04
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] font-display">
                Audit Logs & Compliance Governance
              </h3>
              <p className="text-xs text-[#166534] font-bold mt-0.5">
                ఆడిట్ లాగ్స్ & ఎంటర్‌ప్రైజ్ సెక్యూరిటీ
              </p>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Complete compliance audit trail recording user IDs, roles, mutation actions (CREATE, UPDATE, DELETE), modified entities, IP addresses, timestamps, and full before/after JSON diffs.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Immutable trail preventing unauthorized balance edits</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Search and filter by actor, date range, and action type</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-[#166534]" />
                <span>Multi-stage JWT authentication with distinct role secrets</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= INTERACTIVE TELUGU TRANSLITERATION PLAYGROUND ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="kn-card p-8 lg:p-12 border-slate-300 bg-gradient-to-br from-white via-slate-50 to-[#F2F8E1]/30 shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                Live Engine Demo
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                Bilingual Telugu Transliteration Engine (తెలుగు టైపింగ్)
              </h2>
              <p className="text-[#64748B] text-sm">
                Type Indian & Telugu names in English, and watch the platform automatically convert them into Telugu script in real time.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-2 rounded-xl border border-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#166534]" />
              <span className="text-slate-700 font-bold">transliterate.ts Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Input Box */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1.5">
                  Type Name in English (ఇంగ్లీషులో టైప్ చేయండి):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={translitInput}
                    onChange={(e) => setTranslitInput(e.target.value)}
                    placeholder="e.g., Venkatesh, Ramu, Lakshmi..."
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white text-[#0F172A] text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-transparent transition-all shadow-xs"
                  />
                  {translitInput && (
                    <button
                      onClick={() => setTranslitInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick sample chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">Quick Test Names:</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Krishna Rao', 'Venkateswarlu', 'Lakshmi Devi', 'Srinivasulu', 'Subba Rao', 'Satyanarayana'].map((name) => (
                    <button
                      key={name}
                      onClick={() => setTranslitInput(name)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Output Box */}
            <div className="lg:col-span-6 bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-[#D4A017] font-bold uppercase tracking-wider">
                  Live Telugu Transliteration Result
                </span>
                <button
                  onClick={handleCopyTelugu}
                  disabled={!translitOutput}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  {copiedTelugu ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTelugu ? 'Copied' : 'Copy Telugu'}</span>
                </button>
              </div>

              <div className="min-h-[70px] flex items-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#D4A017] font-sans tracking-wide">
                  {translitOutput || <span className="text-slate-600 text-xl font-normal">తెలుగు అనువాదం ఇక్కడ కనిపిస్తుంది...</span>}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Natural dictionary + phonetic phonetic parser for South Indian names</span>
                <span className="text-emerald-400 font-mono">0ms Latency</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= MICROFINANCE & LOAN CALCULATOR ================= */}
      <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="kn-card p-8 lg:p-12 border-slate-300 bg-white shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold mb-2">
                <Calculator className="w-3.5 h-3.5 text-[#D4A017]" />
                Interactive Financial Simulator
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                Microfinance & Field Loan Repayment Calculator
              </h2>
              <p className="text-[#64748B] text-sm">
                Calculate weekly installment schedules, daily field collection quotas, or standard monthly EMIs.
              </p>
            </div>

            {/* Calculator Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setCalcMode('weekly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calcMode === 'weekly'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Weekly Finance (వారపు)
              </button>
              <button
                onClick={() => setCalcMode('daily')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calcMode === 'daily'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Daily Field (రోజువారీ)
              </button>
              <button
                onClick={() => setCalcMode('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calcMode === 'monthly'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Monthly EMI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Controls */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Principal Amount Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">Loan Principal (మొత్తం రుణం):</span>
                  <span className="text-[#166534] font-mono text-base font-bold">
                    ₹{principalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={5000}
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                  className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>₹5,000</span>
                  <span>₹1,00,000</span>
                  <span>₹2,00,000</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">
                    {calcMode === 'weekly'
                      ? 'Tenure (Weeks / వారాలు):'
                      : calcMode === 'daily'
                      ? 'Tenure (Days / రోజులు):'
                      : 'Tenure (Months / నెలలు):'}
                  </span>
                  <span className="text-[#166534] font-mono text-base font-bold">
                    {calcResults.tenureDisplay}
                  </span>
                </div>
                {calcMode === 'weekly' && (
                  <input
                    type="range"
                    min={8}
                    max={30}
                    step={2}
                    value={weeklyTenure}
                    onChange={(e) => setWeeklyTenure(Number(e.target.value))}
                    className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                  />
                )}
                {calcMode === 'daily' && (
                  <input
                    type="range"
                    min={30}
                    max={120}
                    step={10}
                    value={dailyTenure}
                    onChange={(e) => setDailyTenure(Number(e.target.value))}
                    className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                  />
                )}
                {calcMode === 'monthly' && (
                  <input
                    type="range"
                    min={3}
                    max={36}
                    step={1}
                    value={monthlyTenure}
                    onChange={(e) => setMonthlyTenure(Number(e.target.value))}
                    className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                  />
                )}
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">
                    {calcMode === 'monthly' ? 'Annual Interest Rate (%):' : 'Monthly Interest Rate (% / వడ్డీ రేటు):'}
                  </span>
                  <span className="text-[#166534] font-mono text-base font-bold">
                    {interestRatePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.25}
                  value={interestRatePercent}
                  onChange={(e) => setInterestRatePercent(Number(e.target.value))}
                  className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Processing Fee */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">Documentation / Processing Fee (%):</span>
                  <span className="text-slate-700 font-mono text-base font-bold">
                    {processingFeePercent}% (₹{calcResults.processingFee})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={processingFeePercent}
                  onChange={(e) => setProcessingFeePercent(Number(e.target.value))}
                  className="w-full accent-[#D4A017] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
              </div>

            </div>

            {/* Results Card */}
            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Repayment Breakdown (రీపేమెంట్ వివరణ)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#166534]/10 text-[#166534]">
                  {calcMode.toUpperCase()} SCHEDULE
                </span>
              </div>

              <div>
                <p className="text-xs text-[#64748B]">{calcResults.installmentLabel}</p>
                <p className="text-3xl font-extrabold text-[#166534] font-display">
                  ₹{calcResults.installment.toLocaleString('en-IN')}{' '}
                  <span className="text-xs text-[#64748B] font-normal">{calcResults.installmentPeriod}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Principal Disbursal:</span>
                  <span className="font-bold text-[#0F172A]">₹{principalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Total Interest Earned:</span>
                  <span className="font-bold text-[#16A34A]">+₹{calcResults.totalInterest.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Processing Fee Deducted:</span>
                  <span className="font-bold text-slate-700">-₹{calcResults.processingFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#64748B] pt-2 border-t border-slate-200">
                  <span className="font-bold text-[#0F172A]">Net Cash Disbursed to Borrower:</span>
                  <span className="font-bold text-[#166534]">₹{calcResults.netDisbursal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#64748B] font-bold">
                  <span className="text-[#0F172A]">Total Repayable in Book:</span>
                  <span className="text-[#D4A017] font-mono text-sm">₹{calcResults.totalRepayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onShowToast(`Calculated: ₹${calcResults.installment} ${calcResults.installmentPeriod} for ₹${principalAmount}`);
                  handleOpenAdminLogin();
                }}
                className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#D4A017]" />
                <span>Record Loan into Finance Book</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ================= NOTEBOOK VS KN FINANCE COMPARISON ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold">
            <Coins className="w-3.5 h-3.5 text-[#D4A017]" /> Digital Transformation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-display">
            Physical Finance Notebooks vs. KN Finance Cloud
          </h2>
          <p className="text-[#64748B] text-base font-medium">
            Discover why micro-lenders across the region are upgrading their operations from paper to cloud.
          </p>
        </div>

        <div className="kn-card overflow-hidden border-slate-300 bg-white shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-[#0F172A] uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-4 sm:p-5">Operational Factor</th>
                  <th className="p-4 sm:p-5 text-rose-700 bg-rose-50/50">Physical Notebook / లెడ్జర్ బుక్</th>
                  <th className="p-4 sm:p-5 text-[#166534] bg-emerald-50/50">KN Finance Cloud Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#0F172A]">Data Security & Backup</td>
                  <td className="p-4 sm:p-5 text-slate-600 bg-rose-50/20">
                    High risk of loss, paper tearing, ink damage, or theft.
                  </td>
                  <td className="p-4 sm:p-5 text-[#166534] font-medium bg-emerald-50/20">
                    Cloud backed on MongoDB with multi-role access control & 1-click Excel exports.
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#0F172A]">Field Collections & Receipts</td>
                  <td className="p-4 sm:p-5 text-slate-600 bg-rose-50/20">
                    Manual ink handwriting on receipt slips; delays in recording payments.
                  </td>
                  <td className="p-4 sm:p-5 text-[#166534] font-medium bg-emerald-50/20">
                    Mobile quick collect for Cash & UPI with instant digital printable receipts.
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#0F172A]">Language & Name Entry</td>
                  <td className="p-4 sm:p-5 text-slate-600 bg-rose-50/20">
                    Tedious manual Telugu handwriting or mismatched spellings.
                  </td>
                  <td className="p-4 sm:p-5 text-[#166534] font-medium bg-emerald-50/20">
                    Automatic Telugu phonetic transliteration engine (type in English, converts to Telugu).
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#0F172A]">End-of-Day Cash Reconciliation</td>
                  <td className="p-4 sm:p-5 text-slate-600 bg-rose-50/20">
                    Hours spent manual tallying physical cash against field officer notebook marks.
                  </td>
                  <td className="p-4 sm:p-5 text-[#166534] font-medium bg-emerald-50/20">
                    Real-time Daily Expenses + Collections = Automated Net Cash in Hand computation.
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#0F172A]">Fraud Prevention & Audit</td>
                  <td className="p-4 sm:p-5 text-slate-600 bg-rose-50/20">
                    Zero audit trail; unauthorized pencil or pen overwriting cannot be traced.
                  </td>
                  <td className="p-4 sm:p-5 text-[#166534] font-medium bg-emerald-50/20">
                    Full enterprise audit logs with before/after mutation diffs, user IDs, and timestamps.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= TECHNOLOGY STACK SHOWCASE ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-[#166534] uppercase tracking-widest">Enterprise Architecture</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
            Built with Modern, High-Performance Tech
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="kn-card p-4 text-center border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Frontend</span>
            <p className="font-extrabold text-sm text-[#0F172A]">React v19</p>
            <span className="text-[10px] text-[#166534] font-medium">Vite v8 Bundler</span>
          </div>
          <div className="kn-card p-4 text-center border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Language</span>
            <p className="font-extrabold text-sm text-[#0F172A]">TypeScript</p>
            <span className="text-[10px] text-[#166534] font-medium">Strict Type Safety</span>
          </div>
          <div className="kn-card p-4 text-center border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Design System</span>
            <p className="font-extrabold text-sm text-[#0F172A]">Tailwind CSS v4</p>
            <span className="text-[10px] text-[#166534] font-medium">Zero-config Vite</span>
          </div>
          <div className="kn-card p-4 text-center border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Spreadsheets</span>
            <p className="font-extrabold text-sm text-[#0F172A]">SheetJS XLSX</p>
            <span className="text-[10px] text-[#166534] font-medium">1-Click .xlsx Export</span>
          </div>
          <div className="kn-card p-4 text-center border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Transliteration</span>
            <p className="font-extrabold text-sm text-[#0F172A]">Telugu Engine</p>
            <span className="text-[10px] text-[#166534] font-medium">Phonetic English ↔ Te</span>
          </div>
          <div className="kn-card p-4 text-center border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Backend & DB</span>
            <p className="font-extrabold text-sm text-[#0F172A]">Node / MongoDB</p>
            <span className="text-[10px] text-[#166534] font-medium">JWT Multi-Role Auth</span>
          </div>
        </div>
      </section>

      {/* ================= FREQUENTLY ASKED QUESTIONS (FAQ) ================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-[#D4A017]" /> Common Questions
          </div>
          <h2 className="text-3xl font-extrabold text-[#0F172A] font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-[#64748B] text-sm font-medium">
            Everything you need to know about setting up and running KN Finance for your branches.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Can field officers use KN Finance on smartphones during route collection?',
              a: 'Yes! The Field Officer Portal (/employee) is fully mobile-responsive and optimized for one-thumb usage on smartphones. Officers can record Cash or UPI payments on route, generate receipts, and log daily vehicle fuel expenses.',
            },
            {
              q: 'How does the bilingual Telugu transliteration feature work?',
              a: 'You do not need to install an external Telugu keyboard. Simply type borrower names phonetically in English (e.g. typing "venkateswarlu" or "ramayya"), and our built-in transliteration engine instantly converts them to Telugu script ("వెంకటేశ్వర్లు", "రామయ్య"). Both languages are stored and searchable.',
            },
            {
              q: 'What happens if internet connectivity drops in remote rural areas?',
              a: 'The Finance Book and Ledger tools feature atomic batch saving. Field officers and branch clerks can continue editing rows locally; once connectivity resumes, all edits are sent in a single atomic batch-save request (/api/v1/finance-book/batch-save), preventing data corruption.',
            },
            {
              q: 'Can we print receipts for borrowers on the spot?',
              a: 'Yes. Every repayment generates a clean, standardized digital receipt containing borrower details, repayment amount, date, updated remaining balance, and officer sign-off. It can be printed directly via thermal Bluetooth printers or sent digitally.',
            },
            {
              q: 'Can we export our ledger data to Excel for monthly auditing?',
              a: 'Yes, with one click! Using our integrated SheetJS xlsx engine, you can export the entire weekly or daily finance book, along with loan balances and status columns, directly into an .xlsx spreadsheet.',
            },
          ].map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="kn-card border-slate-200 bg-white transition-all overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#0F172A] hover:text-[#166534] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#166534] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-medium">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="kn-card p-10 lg:p-14 text-center space-y-6 bg-gradient-to-br from-[#166534] via-[#14532d] to-[#0f3d20] text-white rounded-3xl shadow-2xl relative overflow-hidden">
          
          {/* Subtle gold decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-extrabold font-display max-w-2xl mx-auto leading-tight">
            Ready to Digitize Your Branch Ledgers & Field Collections?
          </h2>
          <p className="text-slate-200 text-base max-w-xl mx-auto font-medium">
            Join microfinance institutions, credit societies, and field collection operators running on KN Finance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleOpenAdminLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-slate-950 bg-[#D4A017] hover:bg-[#b4850e] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-5 h-5 text-slate-950" />
              <span>Branch Admin Login</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <button
              onClick={handleOpenEmployeeLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-5 h-5 text-emerald-300" />
              <span>Field Officer Portal</span>
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-transparent hover:bg-white/10 transition-all"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
