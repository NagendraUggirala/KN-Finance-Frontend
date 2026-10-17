import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Smartphone,
  Receipt,
  Download,
  Building2,
  CheckCircle2,
  ArrowRight,
  Plus
} from 'lucide-react';

interface DashboardProps {
  userName: string;
  onShowToast: (msg: string) => void;
}

export const DashboardPreview: React.FC<DashboardProps> = ({ userName, onShowToast }) => {
  const navigate = useNavigate();

  const [activeBorrowers, setActiveBorrowers] = useState(482);
  const [todayCollections, setTodayCollections] = useState(42500);
  const [cashInHand, setCashInHand] = useState(28250);

  // Simulated quick collection entry
  const [borrowerName, setBorrowerName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('upi');

  const [collectionsList, setCollectionsList] = useState([
    { id: 1, name: 'వెంకటేశ్వర్లు (Venkateswarlu)', route: 'Vijayawada Rural', amount: 1000, mode: 'UPI', time: '10:45 AM', status: 'Reconciled' },
    { id: 2, name: 'రామయ్య నాయుడు (Ramayya Naidu)', route: 'Guntur Market', amount: 750, mode: 'Cash', time: '11:15 AM', status: 'Reconciled' },
    { id: 3, name: 'లక్ష్మి దేవి (Lakshmi Devi)', route: 'Tenali South', amount: 1000, mode: 'UPI', time: '11:50 AM', status: 'Reconciled' },
    { id: 4, name: 'శ్రీనివాస రావు (Srinivasa Rao)', route: 'Vijayawada Rural', amount: 1500, mode: 'Cash', time: '12:20 PM', status: 'Reconciled' },
    { id: 5, name: 'సుబ్బారావు (Subba Rao)', route: 'Mangalagiri Town', amount: 1250, mode: 'UPI', time: '01:10 PM', status: 'Reconciled' },
  ]);

  const handleRecordCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!borrowerName.trim() || isNaN(val) || val <= 0) return;

    const newEntry = {
      id: Date.now(),
      name: borrowerName,
      route: 'Route 01 (Vijayawada)',
      amount: val,
      mode: paymentMode.toUpperCase(),
      time: 'Just now',
      status: 'Reconciled',
    };

    setCollectionsList([newEntry, ...collectionsList]);
    setTodayCollections((prev) => prev + val);
    setActiveBorrowers((prev) => prev + 1);
    if (paymentMode === 'cash') {
      setCashInHand((prev) => prev + val);
    }
    onShowToast(`Recorded collection: ₹${val.toLocaleString()} via ${paymentMode.toUpperCase()} for ${borrowerName}!`);
    setBorrowerName('');
    setAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8FAFC]">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl kn-card bg-white border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">Branch Command Center Preview</span>
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-display">
            Welcome, {userName || 'Branch Manager'} 👋
          </h1>
          <p className="text-xs text-[#64748B] font-medium">
            Live branch operations, weekly Finance Book status, and field officer route collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Exporting active Finance Book to Excel (.xlsx)...')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold border border-slate-300 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#166534]" />
            <span>Excel Export (.xlsx)</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#D4A017]" />
            <span>Open Branch Admin</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Active Borrowers</span>
            <span className="px-2 py-0.5 rounded bg-[#16A34A]/10 text-[#16A34A] font-extrabold">+12 this week</span>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A] font-display">
            {activeBorrowers} Accounts
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <Users className="w-3.5 h-3.5 text-[#166534]" />
            <span>Spreadsheet Ledger Synced</span>
          </div>
        </div>

        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Today's Total Collections</span>
            <span className="px-2 py-0.5 rounded bg-[#D4A017]/20 text-slate-900 font-extrabold">98.4% Rate</span>
          </div>
          <p className="text-3xl font-extrabold text-[#166534] font-display">
            ₹{todayCollections.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <Receipt className="w-3.5 h-3.5 text-[#166534]" />
            <span>Cash + UPI Combined</span>
          </div>
        </div>

        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Net Cash in Hand</span>
            <span className="text-[#64748B] font-mono font-bold">Reconciled</span>
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A] font-display">
            ₹{cashInHand.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>After Fuel & Travel Exp (-₹250)</span>
          </div>
        </div>

        <div className="kn-card p-6 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs text-[#64748B] font-medium">
            <span>Field Officers on Route</span>
            <span className="text-emerald-700 font-bold font-mono">All Active</span>
          </div>
          <p className="text-3xl font-extrabold text-[#166534] font-display">
            6 Officers
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <Smartphone className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>Mobile App Live</span>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Quick Collection Simulator */}
        <div className="lg:col-span-5 kn-card p-6 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0F172A] font-display flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#166534]" />
              Quick Collection Entry
            </h3>
            <span className="text-[10px] text-[#166534] bg-[#166534]/10 px-2 py-0.5 rounded font-bold border border-[#166534]/20">
              Field Simulation
            </span>
          </div>

          <form onSubmit={handleRecordCollection} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-[#0F172A] font-bold">Borrower Name (ఖాతాదారుని పేరు)</label>
              <input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="e.g. Venkateswarlu / వెంకటేశ్వర్లు"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#0F172A] font-bold">Repayment Amount (₹)</label>
              <input
                type="number"
                required
                min={100}
                step="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-xs focus:outline-none focus:border-[#166534]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#0F172A] font-bold">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    paymentMode === 'upi'
                      ? 'bg-emerald-50 border-[#166534] text-[#166534]'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  UPI Digital
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    paymentMode === 'cash'
                      ? 'bg-amber-50 border-amber-600 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  Physical Cash
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Record & Generate Receipt</span>
            </button>
          </form>

          {/* Quick info note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            💡 In live deployment, field officers record collections directly on their phone using the <strong>/employee</strong> portal.
          </div>
        </div>

        {/* Collections Stream Ledger */}
        <div className="lg:col-span-7 kn-card p-6 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] font-display">Today's Route Collections Stream</h3>
              <p className="text-xs text-[#64748B] font-medium">Real-time ledger entries from all assigned routes.</p>
            </div>
            <button
              onClick={() => onShowToast('Ledger batch synced with cloud database.')}
              className="text-xs font-bold text-[#166534] hover:underline cursor-pointer"
            >
              Batch Synced
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#64748B] font-bold">
                  <th className="pb-3">Borrower / Route</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0F172A] font-medium">
                {collectionsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <p className="font-bold text-[#0F172A]">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.route}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.mode === 'UPI' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {item.mode}
                      </span>
                    </td>
                    <td className="py-3 text-[#64748B] text-[11px]">{item.time}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A]">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-[#166534]">
                      +₹{item.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => navigate('/employee')}
              className="text-xs font-bold text-[#166534] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View Field Officer Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
