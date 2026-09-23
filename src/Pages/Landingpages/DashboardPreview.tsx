import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Send,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  ShieldCheck,
  Zap,
  RefreshCw,
  Coins
} from 'lucide-react';

interface DashboardProps {
  userName: string;
  onShowToast: (msg: string) => void;
}

export const DashboardPreview: React.FC<DashboardProps> = ({ userName, onShowToast }) => {
  const [balance, setBalance] = useState(284950.00);
  const [vaultYield] = useState(86400.00);
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [transactions, setTransactions] = useState([
    { id: 1, name: 'Apple Inc. Dividend', category: 'Equities', amount: '+ $420.50', date: 'Today, 2:15 PM', status: 'Completed', positive: true },
    { id: 2, name: 'KN High-Yield Interest', category: 'Vault APY', amount: '+ $604.80', date: 'Yesterday', status: 'Completed', positive: true },
    { id: 3, name: 'Wire Transfer to Vanguard', category: 'Investment', amount: '- $5,000.00', date: 'Aug 10, 2026', status: 'Completed', positive: false },
    { id: 4, name: 'AWS Cloud Hosting', category: 'Business Expense', amount: '- $340.20', date: 'Aug 08, 2026', status: 'Completed', positive: false },
    { id: 5, name: 'NVIDIA Stock Purchase', category: 'Equities', amount: '- $2,500.00', date: 'Aug 05, 2026', status: 'Completed', positive: false },
  ]);

  const handleSendTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(transferAmount);
    if (isNaN(num) || num <= 0) return;

    if (num > balance) {
      onShowToast('Error: Insufficient available liquidity balance.');
      return;
    }

    setIsTransferring(true);
    setTimeout(() => {
      setBalance((prev) => prev - num);
      setTransactions([
        {
          id: Date.now(),
          name: `Wire Transfer to ${recipient}`,
          category: 'Global Wire',
          amount: `- $${num.toLocaleString()}`,
          date: 'Just now',
          status: 'Completed',
          positive: false,
        },
        ...transactions,
      ]);
      onShowToast(`Transferred $${num.toLocaleString()} to ${recipient}!`);
      setRecipient('');
      setTransferAmount('');
      setIsTransferring(false);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8FAFC]">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl kn-card bg-white border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">KN Investor Portal</span>
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
            Welcome back, {userName || 'Investor'} 👋
          </h1>
          <p className="text-xs text-[#64748B] font-medium">Your AI portfolio and vault strategies are actively optimizing.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setBalance((prev) => prev + 1250);
              onShowToast('Added +$1,250.00 mock dividend yield!');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold border border-slate-300 transition-all"
          >
            <Plus className="w-4 h-4 text-[#166534]" />
            <span>Deposit Funds</span>
          </button>

          <button
            onClick={() => onShowToast('Portfolio rebalance complete! Risk score: Optimal (1.2)')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-sm"
          >
            <Zap className="w-4 h-4 text-[#D4A017]" />
            <span>AI Rebalance</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Total Net Worth</span>
            <span className="px-2 py-0.5 rounded bg-[#16A34A]/10 text-[#16A34A] font-extrabold">+14.2% YTD</span>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A] font-display">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
            <span>1:1 Vault Backing</span>
          </div>
        </div>

        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>High-Yield Vault</span>
            <span className="px-2 py-0.5 rounded bg-[#D4A017]/20 text-slate-900 font-extrabold">8.40% APY</span>
          </div>
          <p className="text-3xl font-extrabold text-[#166534] font-display">
            ${vaultYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <TrendingUp className="w-3.5 h-3.5 text-[#166534]" />
            <span>+$604.80 this month</span>
          </div>
        </div>

        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Equities & ETFs</span>
            <span className="text-[#64748B] font-mono font-bold">18 Assets</span>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A] font-display">
            $172,300.00
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <PieChart className="w-3.5 h-3.5 text-[#166534]" />
            <span>Risk Score: Balanced</span>
          </div>
        </div>

        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Credit Limit</span>
            <span className="text-[#64748B] font-mono font-bold">4.5% Rate</span>
          </div>
          <p className="text-3xl font-extrabold text-[#166534] font-display">
            $75,000.00
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <CreditCard className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>Instant Drawdown</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Quick Transfer Widget */}
        <div className="lg:col-span-4 kn-card p-6 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0F172A] font-display flex items-center gap-2">
              <Send className="w-4 h-4 text-[#166534]" />
              Quick Wire Transfer
            </h3>
            <span className="text-[10px] text-[#166534] bg-[#166534]/10 px-2 py-0.5 rounded font-bold border border-[#166534]/20">
              0% Fee
            </span>
          </div>

          <form onSubmit={handleSendTransfer} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-[#0F172A] font-bold">Recipient / IBAN</label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Sarah Jenkins or US88 9102..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#0F172A] font-bold">Amount ($)</label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
              />
            </div>

            <button
              type="submit"
              disabled={isTransferring}
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isTransferring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Authorize Transfer</span>
                  <ArrowUpRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>
          </form>

          {/* Card Mockup */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-[#0F172A] mb-3 font-bold">KN Corporate Card</p>
            <div className="p-4 rounded-xl bg-[#0F172A] text-white shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-display font-bold text-xs text-[#D4A017]">KN PLATINUM VIP</span>
                <Coins className="w-4 h-4 text-[#D4A017]" />
              </div>
              <p className="font-mono text-sm tracking-widest text-white">4912 •••• •••• 9920</p>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{userName.toUpperCase() || 'ALEX STERLING'}</span>
                <span>LIMIT: $50,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div className="lg:col-span-8 kn-card p-6 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] font-display">Recent Activity & Vault Earnings</h3>
              <p className="text-xs text-[#64748B] font-medium">Real-time ledger updates.</p>
            </div>
            <button
              onClick={() => onShowToast('Exported CSV statement to downloads.')}
              className="text-xs font-bold text-[#166534] hover:underline"
            >
              Export Statement
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#64748B] font-bold">
                  <th className="pb-3">Transaction</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0F172A] font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${tx.positive ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-slate-100 text-slate-500'}`}>
                        {tx.positive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <span>{tx.name}</span>
                    </td>
                    <td className="py-3 text-[#64748B]">{tx.category}</td>
                    <td className="py-3 text-[#64748B]">{tx.date}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-mono font-bold ${tx.positive ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};
