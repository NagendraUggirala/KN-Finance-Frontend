import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Target, Zap, Globe, Building2, Lock, Sparkles } from 'lucide-react';

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
          <Building2 className="w-3.5 h-3.5" /> About KN Finance
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] font-display">
          Redefining Wealth Management Through Intelligent Innovation
        </h1>
        <p className="text-[#64748B] text-lg leading-relaxed font-medium">
          Founded with a clear vision: democratize institutional wealth tools, automated portfolio algorithms, and global liquidity for investors worldwide.
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
            To provide transparent capital growth solutions that eliminate broker friction, lower overhead costs, and maximize long-term compound yield for every client.
          </p>
        </div>

        <div className="kn-card p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#D4A017]/20 flex items-center justify-center text-slate-900">
            <Sparkles className="w-6 h-6 text-[#166534]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] font-display">Our Vision</h2>
          <p className="text-[#64748B] text-sm leading-relaxed font-medium">
            A global financial ecosystem where portfolio management is effortless, fully secured by bank-grade encryption, and accessible 24/7.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0F172A] font-display">Our Core Principles</h2>
          <p className="text-[#64748B] text-sm font-medium">Guided by security, integrity, and quantitative precision.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="kn-card p-6 space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#166534]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Security First</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Audited by leading cybersecurity firms with AES-256 encryption.
            </p>
          </div>

          <div className="kn-card p-6 space-y-3">
            <Zap className="w-8 h-8 text-[#166534]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Algorithmic Edge</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Machine learning models optimizing portfolio yields continuously.
            </p>
          </div>

          <div className="kn-card p-6 space-y-3">
            <Globe className="w-8 h-8 text-[#166534]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Global Liquidity</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Instant multi-currency deposits and zero-markup wires.
            </p>
          </div>

          <div className="kn-card p-6 space-y-3">
            <Lock className="w-8 h-8 text-[#D4A017]" />
            <h3 className="text-lg font-bold text-[#0F172A]">Full Custody</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Real-time proof of reserves and 1:1 asset backing in partner banks.
            </p>
          </div>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0F172A] font-display">Leadership Team</h2>
          <p className="text-[#64748B] text-sm font-medium">Led by leaders in finance, AI engineering, and quantitative risk.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="kn-card p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#166534] text-[#D4A017] font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
              KN
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">Kevin N.</h3>
            <p className="text-xs text-[#166534] font-bold">Chief Executive Officer</p>
            <p className="text-xs text-[#64748B]">Former VP of Quantitative Strategy at Goldman Sachs.</p>
          </div>

          <div className="kn-card p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#0F172A] text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
              ER
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">Elena Rostova</h3>
            <p className="text-xs text-[#166534] font-bold">Chief Technology Officer</p>
            <p className="text-xs text-[#64748B]">Ex-Principal Engineer in Distributed Systems & AI.</p>
          </div>

          <div className="kn-card p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#D4A017] text-slate-950 font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
              AC
            </div>
            <h3 className="text-lg font-bold text-[#0F172A]">Arthur Chen</h3>
            <p className="text-xs text-[#166534] font-bold">Chief Risk Officer</p>
            <p className="text-xs text-[#64748B]">18+ years managing institutional capital risk.</p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="kn-card p-8 text-center space-y-4 bg-white border-slate-300 shadow-md">
        <h2 className="text-2xl font-bold text-[#0F172A] font-display">Start Growing Your Assets Today</h2>
        <p className="text-[#64748B] text-sm max-w-xl mx-auto">Open your account in 2 minutes or speak with our wealth advisory team.</p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={onOpenLogin}
            className="px-6 py-3 rounded-xl bg-[#166534] text-white font-bold text-xs hover:bg-[#14532d] shadow-sm"
          >
            Open Account
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 rounded-xl bg-slate-100 text-[#0F172A] font-bold text-xs border border-slate-300 hover:bg-slate-200"
          >
            Contact Support
          </button>
        </div>
      </div>

    </div>
  );
};
