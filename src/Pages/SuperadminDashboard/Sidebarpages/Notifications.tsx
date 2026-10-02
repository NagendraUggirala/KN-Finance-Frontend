import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Mail,
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  getAllAdminsApi,
  notificationApi,
  type AdminItem,
  type NotificationItem,
  type CreateNotificationPayload,
  type NotificationSeverity,
  type RecipientType
} from '../../../lib/api';

interface NotificationsProps {
  onShowToast: (msg: string) => void;
  usersList?: any[];
}

export const Notifications: React.FC<NotificationsProps> = ({ onShowToast }) => {
  // Live Admins loaded from backend (GET /api/superadmin/admins)
  const [adminsList, setAdminsList] = useState<AdminItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState<boolean>(true);

  // Sent history from backend (GET /api/v1/notifications/history)
  const [historyItems, setHistoryItems] = useState<NotificationItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form States
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [targetSingleAdminId, setTargetSingleAdminId] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<'active' | 'inactive'>('active');
  const [targetExpiryDays, setTargetExpiryDays] = useState<string>('15');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [severity, setSeverity] = useState<NotificationSeverity>('Info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Fetch real Admins from /api/superadmin/admins
  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoadingAdmins(true);
      try {
        const res = await getAllAdminsApi();
        if (res && Array.isArray(res.admins)) {
          setAdminsList(res.admins);
          if (res.admins.length > 0) {
            setTargetSingleAdminId(res.admins[0]._id);
          }
        }
      } catch (err) {
        console.warn('Unable to load live admins for notification targeting:', err);
      } finally {
        setIsLoadingAdmins(false);
      }
    };
    fetchAdmins();
  }, []);

  // Fetch real Dispatched History from GET /api/v1/notifications/history
  const fetchHistory = async (isManual = false) => {
    if (isManual) setIsRefreshingHistory(true);
    else setIsLoadingHistory(true);

    try {
      const res = await notificationApi.getDispatchedHistory({
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res && Array.isArray(res.data)) {
        setHistoryItems(res.data);
      }
    } catch (err: any) {
      console.warn('Backend history fetch notice:', err);
      if (err?.message?.includes('Super Admin only') || err?.message?.includes('403')) {
        onShowToast('Access restricted: Please ensure you are logged in with Super Admin credentials.');
      } else if (isManual) {
        onShowToast(err.message || 'Could not refresh dispatched history.');
      }
    } finally {
      setIsLoadingHistory(false);
      setIsRefreshingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [severityFilter]);

  // Quick Templates targeted at Admin Management
  const templates = [
    {
      name: 'License Expiry Alert (15 Days)',
      title: 'Action Required: Dashboard License Expiring Soon',
      message: 'Your KN Finance Branch Administrator license is due to expire in 15 days. Please contact root Superadmin to renew your access.',
      severity: 'Expiry' as NotificationSeverity,
      recipientType: 'expiry' as RecipientType,
      link: '/admin'
    },
    {
      name: 'Account Inactive Notice',
      title: 'Notice: Administrator Account Suspended / Inactive',
      message: 'Your administrator dashboard account has been set to Inactive status by Super Admin. Operations permissions are temporarily paused.',
      severity: 'Critical' as NotificationSeverity,
      recipientType: 'status' as RecipientType,
      link: '/admin'
    },
    {
      name: 'System Maintenance',
      title: 'Scheduled System Maintenance Notice',
      message: 'Please note that the system will undergo scheduled cloud maintenance to optimize database speeds. Expect 15 mins of downtime.',
      severity: 'Warning' as NotificationSeverity,
      recipientType: 'all' as RecipientType,
      link: '/admin'
    },
    {
      name: 'Security Alert',
      title: 'Security Advisory: Password & Key Rotation',
      message: 'We have updated authentication protocols. We advise all branch administrators to verify their credentials and ensure audit compliance.',
      severity: 'Critical' as NotificationSeverity,
      recipientType: 'all' as RecipientType,
      link: '/admin/audit-logs'
    },
    {
      name: 'New Feature Announcement',
      title: 'New Feature: Immutable Audit Trail Live',
      message: 'Centralized immutable activity logging is now available on your Admin Portal under the Audit Logs tab.',
      severity: 'Success' as NotificationSeverity,
      recipientType: 'all' as RecipientType,
      link: '/admin/audit-logs'
    }
  ];

  const applyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setSeverity(tpl.severity);
    setRecipientType(tpl.recipientType);
    setActionLink(tpl.link);
    onShowToast(`Applied template: "${tpl.name}"`);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onShowToast('Please complete the title and message fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      let recipientName = 'All Platform Administrators';
      let targetEmail: string | undefined = undefined;
      let targetName: string | undefined = undefined;

      if (recipientType === 'single') {
        const found = adminsList.find(a => a._id === targetSingleAdminId);
        if (found) {
          targetEmail = found.email;
          targetName = found.name || found.username;
          recipientName = `${targetName} (${targetEmail})`;
        } else {
          recipientName = 'Single Admin';
        }
      } else if (recipientType === 'status') {
        const count = adminsList.filter(a => a.status === targetStatus).length;
        recipientName = `${targetStatus.toUpperCase()} Admins (${count} accounts)`;
      } else if (recipientType === 'expiry') {
        const expStr = customExpiryDate || `${targetExpiryDays} days`;
        recipientName = `Expiring Dashboards (${expStr})`;
      }

      // Compute final expiry date string if recipient is expiry
      let computedExpiryDate: string | null = null;
      if (recipientType === 'expiry') {
        if (customExpiryDate) {
          computedExpiryDate = customExpiryDate;
        } else if (targetExpiryDays) {
          const d = new Date();
          d.setDate(d.getDate() + parseInt(targetExpiryDays, 10));
          computedExpiryDate = d.toISOString().split('T')[0];
        }
      }

      const payload: CreateNotificationPayload = {
        title: title.trim(),
        message: message.trim(),
        severity,
        recipientType,
        recipientTarget: recipientName,
        targetAdminId: recipientType === 'single' ? targetSingleAdminId : null,
        targetAdminEmail: targetEmail || null,
        targetAdminName: targetName || null,
        targetStatus: recipientType === 'status' ? targetStatus : null,
        expiryDate: computedExpiryDate,
        sendEmail,
        actionLink: actionLink.trim() || null,
        senderName: 'Super Admin'
      };

      const result = await notificationApi.dispatchNotification(payload);

      onShowToast(result.message || `Notification "${title}" successfully dispatched.`);

      // Reset fields
      setTitle('');
      setMessage('');
      setActionLink('');

      // Refresh real dispatched history from server
      await fetchHistory(true);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to dispatch notification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setResendingId(id);
      const res = await notificationApi.resendEmail(id);
      onShowToast(res.message || 'Email alert resent successfully via SMTP.');
      // Mark as email sent locally
      setHistoryItems(prev =>
        prev.map(item => item._id === id ? { ...item, isEmailSent: true } : item)
      );
    } catch (err: any) {
      onShowToast(err.message || 'Failed to resend email.');
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this notification record?')) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await notificationApi.deleteNotification(id);
      setHistoryItems(prev => prev.filter(item => item._id !== id));
      onShowToast(res.message || 'Notification deleted.');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete notification.');
    } finally {
      setDeletingId(null);
    }
  };

  // Stat Calculations from real history
  const totalSent = historyItems.length;
  const broadcasts = historyItems.filter(l => l.recipientType === 'all').length;
  const targeted = historyItems.filter(l => l.recipientType === 'single').length;
  const criticals = historyItems.filter(l => l.severity === 'Critical').length;

  // Filtered displayed list
  const filteredList = historyItems.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q) ||
      (item.recipientTarget && item.recipientTarget.toLowerCase().includes(q)) ||
      (item.targetAdminEmail && item.targetAdminEmail.toLowerCase().includes(q)) ||
      item._id.toLowerCase().includes(q);

    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

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
          onClick={() => fetchHistory(true)}
          disabled={isRefreshingHistory}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all self-start sm:self-center cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHistory ? 'animate-spin text-[#166534]' : 'text-slate-500'}`} />
          <span>Refresh History</span>
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
          <div className="text-[11px] text-[#64748B] font-mono">Dispatched Items</div>
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

      {/* Main Grid: Left Composer & Right History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Compose Notification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-[#166534]" />
                Dispatch Console
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">Specify recipient targeting, message content, and email dispatch.</p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              
              {/* Recipient Selector Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Target Recipient Category</span>
                  <span className="text-[10px] text-[#166534] font-mono font-bold">Admin Management Registry</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'all', label: 'All Admins' },
                    { id: 'single', label: 'Single Admin' },
                    { id: 'status', label: 'By Status' },
                    { id: 'expiry', label: 'Expiry Alert' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setRecipientType(cat.id as RecipientType)}
                      className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-all cursor-pointer ${
                        recipientType === cat.id
                          ? 'bg-[#166534] text-white border-[#166534] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Target Input: Single Admin */}
              {recipientType === 'single' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#0F172A]">Target Specific Admin (From Admin Management)</label>
                    <span className="text-[10px] text-slate-400 font-mono">Contact Info</span>
                  </div>
                  {isLoadingAdmins ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#166534]" />
                      <span>Loading registered administrators...</span>
                    </div>
                  ) : adminsList.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl">
                      No admin accounts found. Create an admin in Admin Management first.
                    </div>
                  ) : (
                    <>
                      <select
                        value={targetSingleAdminId}
                        onChange={(e) => setTargetSingleAdminId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#166534]"
                      >
                        {adminsList.map((adm) => (
                          <option key={adm._id} value={adm._id}>
                            {adm.name || adm.username} ({adm.email}) — [{adm.status.toUpperCase()}]
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const targetAdmin = adminsList.find(a => a._id === targetSingleAdminId);
                        if (!targetAdmin) return null;
                        return (
                          <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-center justify-between mt-1">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Mail className="w-3.5 h-3.5 text-[#166534]" />
                              {targetAdmin.email}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{targetAdmin.phone || 'No phone'}</span>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* Dynamic Target Input: Status Group */}
              {recipientType === 'status' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-[#0F172A]">Target Dashboard Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534]"
                  >
                    <option value="active">Active Administrators ({adminsList.filter(a => a.status === 'active').length} accounts)</option>
                    <option value="inactive">Inactive / Suspended Administrators ({adminsList.filter(a => a.status === 'inactive').length} accounts)</option>
                  </select>
                </div>
              )}

              {/* Dynamic Target Input: Expiration Alert */}
              {recipientType === 'expiry' && (
                <div className="space-y-2 p-3 rounded-xl bg-amber-50/70 border border-amber-300/80 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Dashboard / License Expiration Timeline</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['7', '15', '30'].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setTargetExpiryDays(days);
                          const d = new Date();
                          d.setDate(d.getDate() + parseInt(days, 10));
                          setCustomExpiryDate(d.toISOString().split('T')[0]);
                        }}
                        className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          targetExpiryDays === days
                            ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        In {days} Days
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-900">Or Set Target Expiry Date</label>
                    <input
                      type="date"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-mono font-bold text-amber-950 focus:outline-none focus:border-amber-700"
                    />
                  </div>
                </div>
              )}

              {/* Channel: Email Dispatch Option */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Send Email Alert via SMTP</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 accent-[#166534] rounded cursor-pointer"
                  />
                </label>
                <p className="text-[10px] text-[#64748B] leading-tight">
                  {sendEmail
                    ? 'Dispatches formatted HTML alert to target administrator mailbox via Backend SMTP / Nodemailer.'
                    : 'Delivers in-app notification only on the Admin Dashboard.'}
                </p>
              </div>

              {/* Severity Button Group */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#0F172A]">Notification Level & Severity</label>
                <div className="grid grid-cols-5 gap-1">
                  {(['Info', 'Success', 'Warning', 'Critical', 'Expiry'] as const).map(sev => {
                    const activeStyles: Record<string, string> = {
                      Info: 'bg-blue-600 text-white border-blue-600',
                      Success: 'bg-green-600 text-white border-green-600',
                      Warning: 'bg-amber-500 text-white border-amber-500',
                      Critical: 'bg-red-600 text-white border-red-600',
                      Expiry: 'bg-purple-600 text-white border-purple-600'
                    };
                    const normalStyles: Record<string, string> = {
                      Info: 'text-blue-600 border-blue-200 hover:bg-blue-50',
                      Success: 'text-green-600 border-green-200 hover:bg-green-50',
                      Warning: 'text-amber-600 border-amber-200 hover:bg-amber-50',
                      Critical: 'text-red-600 border-red-200 hover:bg-red-50',
                      Expiry: 'text-purple-600 border-purple-200 hover:bg-purple-50'
                    };
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
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
                  placeholder="e.g. Branch Audit Pending or License Renewal"
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
                  placeholder="Draft system details, updates, reminders, or instructions for the branch admin dashboard..."
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
                  placeholder="e.g. https://portal.knfinance.com or /admin/finance-book"
                  value={actionLink}
                  onChange={(e) => setActionLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (recipientType === 'single' && adminsList.length === 0)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4A017]" />
                    <span>Dispatching Notification & Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#D4A017]" />
                    <span>Dispatch Notification</span>
                  </>
                )}
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
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-[#166534] hover:bg-[#F8FCEE] transition-all space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#0F172A] group-hover:text-[#166534] transition-colors">{tpl.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      tpl.severity === 'Critical' ? 'bg-red-600' :
                      tpl.severity === 'Warning' ? 'bg-amber-500' :
                      tpl.severity === 'Success' ? 'bg-green-600' :
                      tpl.severity === 'Expiry' ? 'bg-purple-600' : 'bg-blue-600'
                    }`} />
                  </div>
                  <p className="text-[9px] text-[#64748B] line-clamp-2 leading-relaxed">{tpl.message}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Dispatched History Table & Controls */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#166534]" />
                Dispatched History & Delivery Status
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Real-time view of dispatched notifications, recipient tracking, and SMTP email delivery status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#166534]">Backend Synced</span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title, message, recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-[#166534] text-[#0F172A]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#166534] cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Info">Info</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
              <option value="Expiry">Expiry</option>
            </select>
          </div>

          {/* History List */}
          <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
            {isLoadingHistory ? (
              <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-slate-200 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#166534] mx-auto" />
                <p className="text-xs font-bold text-slate-600">Loading dispatched notification history...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                {searchQuery
                  ? `No notifications found matching "${searchQuery}".`
                  : 'No system alerts dispatched yet. Create a notification on the left to dispatch.'}
              </div>
            ) : (
              filteredList.map((log) => {
                const severityColors: Record<string, string> = {
                  Info: 'bg-blue-50 border-blue-200 text-blue-800',
                  Success: 'bg-green-50 border-green-200 text-green-800',
                  Warning: 'bg-amber-50 border-amber-200 text-amber-800',
                  Critical: 'bg-red-50 border-red-200 text-red-800',
                  Expiry: 'bg-purple-50 border-purple-200 text-purple-800'
                };
                const severityIcon: Record<string, React.ReactNode> = {
                  Info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
                  Success: <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />,
                  Warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
                  Critical: <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />,
                  Expiry: <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                };

                const isResending = resendingId === log._id;
                const isDeleting = deletingId === log._id;
                const readCount = typeof log.readCount === 'number' ? log.readCount : ((log as any).readBy?.length ?? 0);

                return (
                  <div
                    key={log._id}
                    className="p-4 rounded-xl border bg-white border-slate-200 hover:border-[#166534]/40 hover:shadow-xs transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-[#166534] font-extrabold">
                          #{log._id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${severityColors[log.severity] || severityColors.Info}`}>
                          {log.severity.toUpperCase()}
                        </span>
                        
                        {/* Email Delivery Badge */}
                        {log.sendEmail ? (
                          log.isEmailSent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Mail className="w-2.5 h-2.5 text-emerald-600" />
                              SMTP Email Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Mail className="w-2.5 h-2.5 text-amber-600" />
                              Email Queued / Pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            In-App Only
                          </span>
                        )}

                        {/* Read Count Badge */}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Eye className="w-2.5 h-2.5 text-blue-600" />
                          <span>{readCount} Read</span>
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : ''}
                        </span>
                      </div>

                      {/* Action Buttons: Resend Email + Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => handleResendEmail(log._id, e)}
                          disabled={isResending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#166534] text-slate-700 text-[10px] font-extrabold transition-all cursor-pointer disabled:opacity-50"
                          title="Resend email notification via SMTP"
                        >
                          <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin text-[#166534]' : 'text-slate-600'}`} />
                          <span>{isResending ? 'Resending...' : 'Resend'}</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteNotification(log._id, e)}
                          disabled={isDeleting}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete notification permanently"
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        {severityIcon[log.severity] || severityIcon.Info}
                        <h4 className="text-xs font-bold text-[#0F172A] leading-normal">{log.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#475569] leading-relaxed pl-6">{log.message}</p>
                    </div>

                    {/* Expiry Date Alert */}
                    {log.expiryDate && (
                      <div className="ml-6 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-mono font-bold">
                        <Calendar className="w-3 h-3 text-purple-600" />
                        <span>Expiry Date: {log.expiryDate}</span>
                      </div>
                    )}

                    {/* Footer Row: Recipient & Action Link */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-[#0F172A]">Target:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-extrabold text-[#334155]">
                          {log.recipientTarget || log.recipientType}
                        </span>
                        {log.targetAdminEmail && (
                          <span className="text-slate-400 font-mono">({log.targetAdminEmail})</span>
                        )}
                      </div>

                      {log.actionLink && (
                        <div className="flex items-center gap-1 text-[#166534] font-bold">
                          <ExternalLink className="w-3 h-3 text-[#D4A017]" />
                          <span className="font-mono">{log.actionLink}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
