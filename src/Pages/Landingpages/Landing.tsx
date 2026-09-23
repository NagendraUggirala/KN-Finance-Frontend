import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
  PieChart,
  Landmark,
  CreditCard,
  ChevronRight,
  Calculator,
  Globe2,
  Coins
} from 'lucide-react';

interface LandingProps {
  onOpenLogin: () => void;
  onShowToast: (msg: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onOpenLogin, onShowToast }) => {
  const navigate = useNavigate();

  // Financial Calculator state
  const [calcType, setCalcType] = useState<'investment' | 'loan'>('investment');
  const [amount, setAmount] = useState<number>(25000);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [expectedRate, setExpectedRate] = useState<number>(12);

  // Investment calculation formulas
  const totalMonths = tenureYears * 12;
  const monthlyRate = expectedRate / 12 / 100;
  const futureValue = amount * Math.pow(1 + expectedRate / 100, tenureYears);
  const totalInterestGained = futureValue - amount;

  // Loan EMI formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const emiNumerator = amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
  const emiDenominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
  const monthlyEMI = emiDenominator !== 0 ? emiNumerator / emiDenominator : 0;
  const totalPayableLoan = monthlyEMI * totalMonths;

  return (
    <div className="space-y-20 pb-16 bg-[#F8FAFC]">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-10 lg:pt-16 pb-12 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/10 border border-[#166534]/30 text-[#166534] text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Next-Gen KN Wealth v3.0 Live</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15] font-display">
                Smart Financial <br className="hidden sm:inline" />
                Management for <br />
                <span className="text-[#166534]">Next-Gen Wealth</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[#64748B] text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Empower your capital with <strong className="text-[#0F172A]">KN Finance</strong>. Algorithmic investment vaults, high-yield accounts up to 8.4% APY, and bank-grade encryption designed for high-growth investors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={onOpenLogin}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-lg shadow-green-900/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 text-[#D4A017]" />
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-[#0F172A] bg-white hover:bg-slate-100 border border-slate-300 shadow-xs transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <PieChart className="w-5 h-5 text-[#166534]" />
                  <span>Explore Live Dashboard</span>
                </button>
              </div>

              {/* Micro Trust Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-bold text-[#0F172A] font-display">$4.8B+</p>
                  <p className="text-xs text-[#64748B] font-medium">Assets Managed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0F172A] font-display">250k+</p>
                  <p className="text-xs text-[#64748B] font-medium">Active Investors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#16A34A] font-display">99.99%</p>
                  <p className="text-xs text-[#64748B] font-medium">Platform Uptime</p>
                </div>
              </div>

            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="kn-card p-6 border-slate-200 bg-white shadow-xl space-y-5">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#166534]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B] font-medium">Total Portfolio Value</p>
                      <p className="text-2xl font-bold text-[#0F172A] font-display">$148,920.50</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 flex items-center gap-1">
                    +18.4% ↑
                  </span>
                </div>

                {/* Growth Visual Bars */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-[#64748B] font-medium">
                    <span>Monthly Yield Growth</span>
                    <span className="text-[#166534] font-bold">+$2,410.00 this month</span>
                  </div>
                  <div className="h-16 flex items-end gap-1.5 pt-2">
                    {[40, 55, 35, 65, 50, 75, 60, 90, 85, 100].map((height, idx) => (
                      <div key={idx} className="flex-1 bg-slate-100 rounded-t relative group">
                        <div
                          style={{ height: `${height}%` }}
                          className="w-full bg-[#166534] rounded-t group-hover:bg-[#D4A017] transition-colors duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Asset Allocation */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#166534]" />
                    <span className="text-[#0F172A] font-medium">Global Equities (55%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]" />
                    <span className="text-[#0F172A] font-medium">Yield Vault (45%)</span>
                  </div>
                </div>

              </div>

              {/* KN Card overlay */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 bg-[#0F172A] p-4 rounded-2xl text-white shadow-2xl w-64 border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#D4A017] font-display">KN PLATINUM</span>
                  <Coins className="w-4 h-4 text-[#D4A017]" />
                </div>
                <p className="font-mono text-sm tracking-wider text-slate-300 mb-2">4912 •••• •••• 8842</p>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>VALUED INVESTOR</span>
                  <span>EXP 08/29</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= LIVE MARKET SIGNALS TICKER ================= */}
      <section className="border-y border-slate-200 bg-white py-3.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto text-xs">
          <span className="font-bold text-[#166534] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
            Live Signals:
          </span>
          <div className="flex items-center gap-8 text-[#0F172A] font-mono min-w-[650px]">
            <div className="flex items-center gap-2">
              <span className="font-bold">S&P 500</span>
              <span className="text-[#64748B]">5,982.10</span>
              <span className="text-[#16A34A] font-semibold">+0.84% ↑</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">NASDAQ</span>
              <span className="text-[#64748B]">18,740.50</span>
              <span className="text-[#16A34A] font-semibold">+1.12% ↑</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">US 10Y</span>
              <span className="text-[#64748B]">4.18%</span>
              <span className="text-[#64748B]">-0.02% ↓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">KN VAULT</span>
              <span className="text-[#166534] font-bold">8.40% APY</span>
              <span className="px-1.5 py-0.5 rounded bg-[#D4A017]/20 text-slate-900 text-[10px] font-bold">Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE FEATURES GRID ================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-extrabold text-[#166534] uppercase tracking-widest">Why Choose KN Finance</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-display">
            Built for High-Growth Wealth Creation
          </p>
          <p className="text-[#64748B] text-base font-medium">
            Everything you need to automate portfolio management, access high-yield vaults, and secure capital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="kn-card p-8 kn-card-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center text-[#166534]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] font-display">AI Wealth Engine</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Automated rebalancing algorithms that continuously optimize risk-adjusted returns across global equities and yield vaults.
            </p>
          </div>

          <div className="kn-card p-8 kn-card-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/30 flex items-center justify-center text-slate-900">
              <Lock className="w-6 h-6 text-[#166534]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] font-display">Bank-Grade Security</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Protected by 256-bit AES SSL encryption, multi-factor hardware security keys, and SOC2 Type II compliance.
            </p>
          </div>

          <div className="kn-card p-8 kn-card-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] font-display">Zero-Latency Transfers</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Execute cross-border transactions in 30+ currencies with institutional interbank exchange rates and zero markups.
            </p>
          </div>

          <div className="kn-card p-8 kn-card-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center text-[#166534]">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] font-display">High-Yield Vaults</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Earn up to 8.4% APY on idle cash reserves with daily compound payout and zero lock-in penalties.
            </p>
          </div>

          <div className="kn-card p-8 kn-card-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-700">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] font-display">Tax & EMI Analytics</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Automated capital gains tax-loss harvesting, loan EMI scheduling, and downloadable audit statements.
            </p>
          </div>

          <div className="kn-card p-8 kn-card-hover space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#D4A017]/20 border border-[#D4A017]/30 flex items-center justify-center text-slate-950">
              <CreditCard className="w-6 h-6 text-[#166534]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] font-display">Instant Credit Lines</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Borrow instantly against your investment portfolio at competitive interest rates without triggering tax events.
            </p>
          </div>

        </div>
      </section>

      {/* ================= INTERACTIVE FINANCIAL CALCULATOR ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="kn-card p-8 lg:p-12 border-slate-300 bg-white shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold mb-2">
                <Calculator className="w-3.5 h-3.5 text-[#D4A017]" /> Interactive Tool
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
                KN Wealth & Loan Calculator
              </h2>
              <p className="text-[#64748B] text-sm">Simulate your compound returns or calculate monthly loan EMIs.</p>
            </div>

            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setCalcType('investment')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  calcType === 'investment'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Wealth Growth
              </button>
              <button
                onClick={() => setCalcType('loan')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  calcType === 'loan'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Loan EMI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">
                    {calcType === 'investment' ? 'Initial Capital' : 'Loan Amount'}
                  </span>
                  <span className="text-[#166534] font-mono text-base font-bold">
                    ${amount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">Duration (Years)</span>
                  <span className="text-[#166534] font-mono text-base font-bold">
                    {tenureYears} Years
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-[#0F172A]">
                    {calcType === 'investment' ? 'Expected Annual Return' : 'Annual Interest Rate'}
                  </span>
                  <span className="text-[#166534] font-mono text-base font-bold">
                    {expectedRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.5}
                  value={expectedRate}
                  onChange={(e) => setExpectedRate(Number(e.target.value))}
                  className="w-full accent-[#166534] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
              </div>

            </div>

            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Estimated Projection</h3>

              {calcType === 'investment' ? (
                <>
                  <div>
                    <p className="text-xs text-[#64748B]">Total Projected Portfolio Value</p>
                    <p className="text-3xl font-extrabold text-[#166534] font-display">
                      ${Math.round(futureValue).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Initial Capital:</span>
                      <span className="font-bold text-[#0F172A]">${amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#64748B]">
                      <span>Est. Interest Earned:</span>
                      <span className="font-bold text-[#16A34A]">+${Math.round(totalInterestGained).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-[#64748B]">Estimated Monthly EMI</p>
                    <p className="text-3xl font-extrabold text-[#166534] font-display">
                      ${Math.round(monthlyEMI).toLocaleString()} <span className="text-xs text-[#64748B] font-normal">/mo</span>
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Principal Amount:</span>
                      <span className="font-bold text-[#0F172A]">${amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#64748B]">
                      <span>Total Loan Payable:</span>
                      <span className="font-bold text-[#0F172A]">${Math.round(totalPayableLoan).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  onShowToast(`Applied ${calcType === 'investment' ? 'Investment Plan' : 'Loan Estimate'} parameters.`);
                  onOpenLogin();
                }}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all"
              >
                {calcType === 'investment' ? 'Start Investing' : 'Apply for Credit'}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="kn-card p-10 lg:p-14 text-center space-y-6 bg-gradient-to-br from-[#166534] to-[#14532d] text-white rounded-3xl shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display max-w-2xl mx-auto">
            Ready to Take Control of Your Financial Future?
          </h2>
          <p className="text-slate-100 text-base max-w-xl mx-auto font-medium">
            Join over 250,000 investors growing their wealth on KN Finance today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-slate-950 bg-[#D4A017] hover:bg-[#b4850e] shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              Contact Wealth Advisor
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
