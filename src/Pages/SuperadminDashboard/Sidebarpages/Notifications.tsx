import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Send,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Info,
  AlertTriangle,
  Users,
  Search,
  Megaphone,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { type UserAccount } from './UserAccountControl';

interface NotificationLog {
  id: string;
  recipientType: 'all' | 'single' | 'status' | 'tier';
  recipientTarget: string;
  title: string;
  message: string;
  severity: 'Info' | 'Success' | 'Warning' | 'Critical';
  timestamp: string;
  actionLink?: string;
  status: 'Delivered' | 'Recalled';
}

interface NotificationsProps {
  onShowToast: (msg: string) => void;
  usersList: UserAccount[];
}

export const Notifications: React.FC<NotificationsProps> = ({ onShowToast, usersList }) => {
  // Mock sent history
  const [logs, setLogs] = useState<NotificationLog[]>([
    {
      id: 'NTF-901',
      recipientType: 'all',
      recipientTarget: 'All Platform Users',
      title: 'Scheduled System Maintenance',
      message: 'We will be conducting scheduled backend optimizations on August 16, 2026, from 02:00 to 04:00 UTC. Temporary dashboard latency may occur.',
      severity: 'Warning',
      timestamp: '2026-08-12 23:10:45',
      actionLink: '/status',
      status: 'Delivered'
    },
    {
      id: 'NTF-902',
      recipientType: 'single',
      recipientTarget: 'Eleanor Vance (USR-101)',
      title: 'Enterprise Portfolio Activated',
      message: 'Welcome! Your institutional-grade portfolio dashboards and AI risk models are now unlocked.',
      severity: 'Success',
      timestamp: '2026-08-13 09:15:32',
      status: 'Delivered'
    },
    {
      id: 'NTF-903',
      recipientType: 'status',
      recipientTarget: 'Status: Renewal Pending',
      title: 'Action Required: License Renewal',
      message: 'Your platform access license is expiring in 15 days. Please update your billing info to prevent automated rate-limiting.',
      severity: 'Critical',
      timestamp: '2026-08-13 11:04:12',
      actionLink: '/billing',
      status: 'Delivered'
    }
  ]);

  // Form States
  const [recipientType, setRecipientType] = useState<'all' | 'single' | 'status' | 'tier'>('all');
  const [targetSingle, setTargetSingle] = useState(usersList[0]?.id || '');
  const [targetStatus, setTargetStatus] = useState<string>('Active');
  const [targetTier, setTargetTier] = useState<string>('Enterprise Pro');
  const [severity, setSeverity] = useState<'Info' | 'Success' | 'Warning' | 'Critical'>('Info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionLink, setActionLink] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Quick Templates
  const templates = [
    {
      name: 'System Maintenance',
      title: 'Scheduled System Maintenance',
      message: 'Please note that the system will undergo scheduled maintenance to optimize AI recommendation speeds. Expect 15 mins of downtime.',
      severity: 'Warning' as const,
      link: '/status'
    },
    {
      name: 'Billing Expiring',
      title: 'Subscription Expiration Warning',
      message: 'Your wealth subscription plan is coming to an end. Renew today to lock in your legacy portfolio management fees.',
      severity: 'Critical' as const,
      link: '/settings/billing'
    },
    {
      name: 'Security Alert',
      title: 'Security System Recommendations',
      message: 'We have updated our authentication protocols. We advise all corporate admins to cycle password credentials and verify API keys.',
      severity: 'Critical' as const,
      link: '/security'
    },
    {
      name: 'New Feature Announcement',
      title: 'AI Portfolio Optimization Active',
      message: 'Our next-generation AI rebalancing model is now active! Review your automated asset suggestions from the dashboard.',
      severity: 'Success' as const,
      link: '/ai-adviser'
    }
  ];

  const applyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setSeverity(tpl.severity);
    setActionLink(tpl.link);
    onShowToast(`Applied template: "${tpl.name}"`);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onShowToast('Please complete the title and message fields.');
      return;
    }

    let recipientName = 'All Platform Users';
    if (recipientType === 'single') {
      const targetUser = usersList.find(u => u.id === targetSingle);
      recipientName = targetUser ? `${targetUser.name} (${targetUser.id})` : targetSingle || 'Unknown User';
    } else if (recipientType === 'status') {
      recipientName = `Status: ${targetStatus}`;
    } else if (recipientType === 'tier') {
      recipientName = `Tier: ${targetTier}`;
    }

    const newLog: NotificationLog = {
      id: `NTF-${900 + logs.length + 1}`,
      recipientType,
      recipientTarget: recipientName,
      title,
      message,
      severity,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionLink: actionLink || undefined,
      status: 'Delivered'
    };

    setLogs([newLog, ...logs]);
    onShowToast(`Notification "${title}" successfully dispatched.`);
    
    // Clear input fields
    setTitle('');
    setMessage('');
    setActionLink('');
  };

  const handleRecallNotification = (id: string) => {
    if (window.confirm(`Are you sure you want to recall the notification ${id}? This removes the broadcast from client apps.`)) {
      setLogs(prev => prev.map(log => log.id === id ? { ...log, status: 'Recalled' as const } : log));
      onShowToast(`Recalled and retracted alert ${id}.`);
    }
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm(`Delete audit log ${id} from memory?`)) {
      setLogs(prev => prev.filter(log => log.id !== id));
      onShowToast(`Audit log ${id} purged.`);
    }
  };

  // Stat Calculations
  const totalSent = logs.length;
  const broadcasts = logs.filter(l => l.recipientType === 'all').length;
  const targeted = logs.filter(l => l.recipientType === 'single').length;
  const criticals = logs.filter(l => l.severity === 'Critical').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-extrabold text-[#166534] uppercase tracking-wider bg-[#166534]/10 px-2 py-0.5 rounded border border-[#166534]/20">
              AUDIENCE BROADCASTS
            </span>
            <span className="text-xs text-[#64748B] font-mono">• MASTER COMMUNICATIONS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] font-display flex items-center gap-2">
            System Dispatch & Notifications
          </h1>
          <p className="text-xs text-[#475569] font-medium">
            Broadcast emergency advisories, schedule maintenance notices, or send targeted portfolio account notifications.
          </p>
        </div>

        <button
          onClick={() => {
            setLogs([]);
            onShowToast('Cleared local notifications history.');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all self-start sm:self-center"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Purge History</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Total Broadcasted Logs</span>
            <Bell className="w-4 h-4 text-[#166534]" />
          </div>
          <p className="text-3xl font-extrabold text-[#0F172A] font-display">{totalSent}</p>
          <div className="text-[11px] text-[#64748B] font-mono">Delivered Messages</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Universal Broadcasts</span>
            <Megaphone className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 font-display">{broadcasts}</p>
          <div className="text-[11px] text-emerald-600 font-bold">Global Target</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-bold">
            <span>Targeted Account Alerts</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600 font-display">{targeted}</p>
          <div className="text-[11px] text-blue-600 font-bold">Individual Users</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/50 border border-[#C5E1A5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Critical Severity</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-700 font-display">{criticals}</p>
          <div className="text-[11px] text-amber-600 font-mono">High Attention Required</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Compose Notification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-[#166534]" />
                Dispatch Console
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Specify recipient guidelines and content below.</p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              
              {/* Recipient Selector Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Recipient Filter Type</span>
                  <span className="text-[10px] text-slate-400 font-mono">Select target sector</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['all', 'single', 'status', 'tier'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRecipientType(type)}
                      className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-all ${
                        recipientType === type
                          ? 'bg-[#166534] text-white border-[#166534]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Target Input */}
              {recipientType === 'single' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-[#0F172A]">Target Specific Registered User</label>
                  {usersList.length === 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
                      No registered users found. Add users in User Account Control.
                    </div>
                  ) : (
                    <select
                      value={targetSingle}
                      onChange={(e) => setTargetSingle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
                    >
                      {usersList.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.id}) — {user.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {recipientType === 'status' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-[#0F172A]">Target Status Group</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
                  >
                    <option value="Active">Active Accounts Only</option>
                    <option value="Renewal">Renewal Pending Accounts Only</option>
                    <option value="Inactive">Inactive Accounts Only</option>
                  </select>
                </div>
              )}

              {recipientType === 'tier' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-[#0F172A]">Target Subscription Tier</label>
                  <select
                    value={targetTier}
                    onChange={(e) => setTargetTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
                  >
                    <option value="Enterprise Pro">Enterprise Pro Tier</option>
                    <option value="Institutional Prime">Institutional Prime Tier</option>
                    <option value="Standard Business">Standard Business Tier</option>
                    <option value="Independent Investor">Independent Investor Tier</option>
                  </select>
                </div>
              )}

              {/* Severity Button Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#0F172A]">Notification Level & Styling</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Info', 'Success', 'Warning', 'Critical'] as const).map(sev => {
                    const activeStyles = {
                      Info: 'bg-blue-600 text-white border-blue-600',
                      Success: 'bg-green-600 text-white border-green-600',
                      Warning: 'bg-amber-500 text-white border-amber-500',
                      Critical: 'bg-red-600 text-white border-red-600'
                    };
                    const normalStyles = {
                      Info: 'text-blue-600 border-blue-200 hover:bg-blue-50',
                      Success: 'text-green-600 border-green-200 hover:bg-green-50',
                      Warning: 'text-amber-600 border-amber-200 hover:bg-amber-50',
                      Critical: 'text-red-600 border-red-200 hover:bg-red-50'
                    };
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                          severity === sev ? activeStyles[sev] : `bg-white ${normalStyles[sev]}`
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0F172A]">Notification Header Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical API System Outage Alert"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0F172A]">Content Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Draft system details, updates, reminders or emergency instructions for the client dashboard here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] resize-none"
                />
              </div>

              {/* Action Link (Optional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Action URI / Hyperlink <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. /settings/billing or https://status.knfinance.com"
                  value={actionLink}
                  onChange={(e) => setActionLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={recipientType === 'single' && usersList.length === 0}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Dispatch Broadcast Alert</span>
              </button>

            </form>
          </div>

          {/* Quick templates panel */}
          <div className="p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                Pre-Approved Dispatch Templates
              </h3>
              <p className="text-[10px] text-[#64748B]">Click a template to load metadata into composer.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map(tpl => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-[#166534] hover:bg-[#F8FCEE] transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#0F172A] group-hover:text-[#166534] transition-colors">{tpl.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      tpl.severity === 'Critical' ? 'bg-red-600' :
                      tpl.severity === 'Warning' ? 'bg-amber-500' :
                      tpl.severity === 'Success' ? 'bg-green-600' : 'bg-blue-600'
                    }`} />
                  </div>
                  <p className="text-[9px] text-[#64748B] line-clamp-2 leading-relaxed">{tpl.message}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Audit Logs */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#166534]" />
                Audit Logs & Dispatch History
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Realtime view of system broadcasts, user alerts, and status recalls.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#166534]">Audits Sync Live</span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search audit headers, targets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] text-[#0F172A]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
            >
              <option value="all">All Severities</option>
              <option value="Info">Info</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* History List */}
          <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
            {logs
              .filter(log => {
                const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.recipientTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.id.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
                return matchesSearch && matchesSeverity;
              })
              .map((log) => {
                const severityColors = {
                  Info: 'bg-blue-50 border-blue-200 text-blue-800',
                  Success: 'bg-green-50 border-green-200 text-green-800',
                  Warning: 'bg-amber-50 border-amber-200 text-amber-800',
                  Critical: 'bg-red-50 border-red-200 text-red-800'
                };
                const severityIcon = {
                  Info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
                  Success: <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />,
                  Warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
                  Critical: <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                };

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border transition-all ${
                      log.status === 'Recalled'
                        ? 'bg-slate-50/50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-[#166534]/40 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col gap-2.5">
                      
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-[#166534] font-extrabold">{log.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${severityColors[log.severity]}`}>
                            {log.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {log.status === 'Delivered' ? (
                            <button
                              onClick={() => handleRecallNotification(log.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-extrabold border border-amber-300 hover:bg-amber-50 text-amber-700 transition-colors"
                              title="Recall alert from dashboards"
                            >
                              Recall
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold bg-slate-100 border border-slate-200 text-slate-500">
                              RECALLED
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete log permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          {severityIcon[log.severity]}
                          <h4 className="text-xs font-bold text-[#0F172A] leading-normal">{log.title}</h4>
                        </div>
                        <p className="text-[11px] text-[#475569] leading-relaxed pl-6">{log.message}</p>
                      </div>

                      {/* Recipient Details & Action Link */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[#0F172A]">Target Recipient:</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-extrabold text-[#334155]">
                            {log.recipientTarget}
                          </span>
                        </div>

                        {log.actionLink && (
                          <div className="flex items-center gap-1 text-[#166534] font-bold">
                            <ExternalLink className="w-3 h-3 text-[#D4A017]" />
                            <span className="font-mono">{log.actionLink}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}

            {logs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                No system alerts dispatched yet. Formulate a notification and press dispatch.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
