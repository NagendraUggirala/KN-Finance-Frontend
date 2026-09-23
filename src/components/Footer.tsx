import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Send, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onShowToast: (msg: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onShowToast }) => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onShowToast(`Subscribed ${email} to KN Finance Market Briefing!`);
    setEmail('');
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-[#64748B] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#166534] shadow-md shadow-green-950/10">
                <span className="font-display font-extrabold text-lg text-[#D4A017]">KN</span>
              </div>
              <span className="font-display text-2xl font-bold text-[#0F172A]">KN Finance</span>
            </div>

            <p className="text-[#64748B] text-sm leading-relaxed max-w-sm">
              KN Finance empowers modern investors and corporations with AI-driven wealth strategies, high-yield vaults, and bank-grade security.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-200 text-[#0F172A]">
                <ShieldCheck className="w-4 h-4 text-[#166534]" />
                FDIC Partner Insured
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-200 text-[#0F172A]">
                <Lock className="w-4 h-4 text-[#D4A017]" />
                256-Bit SSL
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4 font-display">Solutions</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/features" className="hover:text-[#166534] transition-colors">
                  AI Wealth Manager
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#166534] transition-colors">
                  Portfolio Tracking
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#166534] transition-colors">
                  High-Yield Vaults
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#166534] transition-colors">
                  Instant Credit Lines
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company Links */}
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4 font-display">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-[#166534] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#166534] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#166534] transition-colors">
                  Leadership Team
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#166534] transition-colors">
                  Global Offices
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4 font-display">Market Insights</h3>
            <p className="text-xs text-[#64748B] mb-3">
              Subscribe to KN Finance Weekly for market signals and wealth reports.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#166534]" /> Unsubscribe at any time.
              </p>
            </form>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© {new Date().getFullYear()} KN Finance Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); onShowToast('Privacy Policy'); }} className="hover:text-[#0F172A]">Privacy Policy</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); onShowToast('Terms of Service'); }} className="hover:text-[#0F172A]">Terms of Service</a>
            <a href="#compliance" onClick={(e) => { e.preventDefault(); onShowToast('Regulatory Disclosures'); }} className="hover:text-[#0F172A]">Disclosures</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
