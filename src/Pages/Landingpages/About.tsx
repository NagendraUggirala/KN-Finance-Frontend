import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Target, Building2, Sparkles, Smartphone, FileSpreadsheet, CheckCircle2, ArrowRight } from 'lucide-react';

interface AboutProps {
  onOpenLogin: () => void;
}

export const About: React.FC<AboutProps> = ({ onOpenLogin }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16 bg-[#F8FAFC]">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold">
          <Building2 className="w-3.5 h-3.5" /> About KN Finance (కేఎన్ ఫైనాన్స్)
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] font-display">
          Modernizing Microfinance & Field Loan Operations
        </h1>
        <p className="text-[#64748B] text-lg leading-relaxed font-medium">
          Engineered specifically for financial institutions, credit societies, and daily/weekly micro-lenders operating regional branches and on-ground field routes.
        </p>
      </div>

      {/* Mission / Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="kn-card p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#166534]/10 flex items-center justify-center text-[#166534]">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] font-display">Our Mission</h2>
          <p className="text-[#64748B] text-sm leading-relaxed font-medium">
            To eliminate the friction, calculation errors, and data loss of physical handwritten finance notebooks ("Finance Books" / లెడ్జర్ బుక్). We empower branch staff and field officers with instant cloud syncing, digital receipts, and automated cash reconciliation.
          </p>
        </div>

        <div className="kn-card p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#D4A017]/20 flex items-center justify-center text-slate-900">
            <Sparkles className="w-6 h-6 text-[#166534]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] font-display">Our Vision</h2>
          <p className="text-[#64748B] text-sm leading-relaxed font-medium">
            A fully transparent, bilingual microfinance ecosystem where credit societies can manage thousands of daily and weekly borrowers with zero paper overhead, complete audit compliance, and seamless English & Telugu operations.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0F172A] font-display">Four Operational Pillars</h2>
          <p className="text-[#64748B] text-sm font-medium">Tailored for the real-world conditions of field loan collections.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="kn-card p-6 space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-[#166534]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Digital Ledger Book</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Spreadsheet layout replicating physical weekly books with installment date columns and automatic balance recalculations.
            </p>
          </div>

          <div className="kn-card p-6 space-y-3">
            <Smartphone className="w-8 h-8 text-[#166534]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Field Mobility</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Mobile-optimized route collections for field officers with Cash/UPI recording and instant digital receipts.
            </p>
          </div>

          <div className="kn-card p-6 space-y-3">
            <Sparkles className="w-8 h-8 text-[#166534]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Bilingual Transliteration</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Real-time phonetic English-to-Telugu engine enabling seamless typing of local names without special keyboards.
            </p>
          </div>

          <div className="kn-card p-6 space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#D4A017]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Enterprise Governance</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Immutable audit logs tracking actor IDs, timestamps, and mutation diffs across Super Admin and Branch portals.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Impact */}
      <div className="kn-card p-8 lg:p-10 bg-white border-slate-300 shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-[#0F172A] font-display">
          How KN Finance Transforms Daily Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-[#166534] text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 1. Morning Route Briefing
            </span>
            <p className="text-slate-600 leading-relaxed">
              Branch managers open the digital Finance Book, verify dues for today's date column, and dispatch field officers to assigned village sectors.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-[#166534] text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 2. On-Ground Collection
            </span>
            <p className="text-slate-600 leading-relaxed">
              Field officers record repayments in seconds, issue thermal or digital receipts, and track fuel expenses directly on their mobile portal.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-[#166534] text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 3. Evening Reconciliation
            </span>
            <p className="text-slate-600 leading-relaxed">
              Total collections minus field allowances are automatically balanced, presenting the exact Net Cash in Hand for immediate branch turnover.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="kn-card p-8 text-center space-y-4 bg-white border-slate-300 shadow-md">
        <h2 className="text-2xl font-bold text-[#0F172A] font-display">
          Ready to Modernize Your Finance Branch?
        </h2>
        <p className="text-[#64748B] text-sm max-w-xl mx-auto">
          Access the branch administration portal or contact our support team to get your branches set up today.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={onOpenLogin}
            className="px-6 py-3 rounded-xl bg-[#166534] text-white font-bold text-xs hover:bg-[#14532d] shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Branch Admin Login</span>
            <ArrowRight className="w-4 h-4 text-[#D4A017]" />
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 rounded-xl bg-slate-100 text-[#0F172A] font-bold text-xs border border-slate-300 hover:bg-slate-200 cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>

    </div>
  );
};
