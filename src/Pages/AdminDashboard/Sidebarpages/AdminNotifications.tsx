import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Info,
  Calendar,
  Mail,
  Trash2,
  CheckCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Inbox,
  Check
} from 'lucide-react';
import {
  notificationApi,
  type NotificationItem
} from '../../../lib/api';

interface AdminNotificationsProps {
  userName?: string;
  onShowToast: (msg: string) => void;
  onNotificationReadChange?: () => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  userName,
  onShowToast,
  onNotificationReadChange
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'Critical' | 'Warning' | 'Expiry' | 'Info' | 'Success'>('all');

  const fetchNotifications = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await notificationApi.getAdminInbox({
        unreadOnly: activeFilter === 'unread' ? true : undefined,
        severity: ['Critical', 'Warning', 'Expiry', 'Info', 'Success'].includes(activeFilter) ? activeFilter : undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load notifications:', err);
      onShowToast(err.message || 'Could not load notifications from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setMarkingReadId(id);
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      onShowToast('Notification marked as read.');
      if (onNotificationReadChange) onNotificationReadChange();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update notification.');
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAllRead(true);
      const res = await notificationApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      onShowToast(res.message || 'All notifications marked as read.');
      if (onNotificationReadChange) onNotificationReadChange();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update notifications.');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this notification?')) return;

    try {
      setDeletingId(id);
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      onShowToast('Notification removed.');
      if (onNotificationReadChange) onNotificationReadChange();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete notification.');
    } finally {
      setDeletingId(null);
    }
  };

  // Local filter for responsive instantaneous typing
  const filteredList = useMemo(() => {
    return notifications.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.recipientTarget && item.recipientTarget.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (activeFilter === 'unread') return !item.isRead;
      if (activeFilter === 'Critical') return item.severity === 'Critical';
      if (activeFilter === 'Warning') return item.severity === 'Warning';
      if (activeFilter === 'Expiry') return item.severity === 'Expiry' || item.recipientType === 'expiry';
      if (activeFilter === 'Info') return item.severity === 'Info';
      if (activeFilter === 'Success') return item.severity === 'Success';
      return true;
    });
  }, [notifications, searchQuery, activeFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#C5E1A5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-extrabold text-[#166534] uppercase tracking-wider bg-[#166534]/10 px-2.5 py-0.5 rounded-full border border-[#166534]/20">
              OFFICIAL SYSTEM NOTIFICATIONS
            </span>
            <span className="text-xs text-slate-400 font-mono">• SUPER ADMIN DISPATCHES</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] font-display flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#166534]" />
            <span>Administrator Inbox & Alerts</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Critical system advisories, dashboard status updates, and license expiry alerts dispatched to {userName || 'Administrator'}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#C5E1A5] bg-[#F2F8E1]/60 hover:bg-[#E2F0C2] text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#166534]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isMarkingAllRead ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#D4A017]" />
              ) : (
                <CheckCheck className="w-4 h-4 text-[#D4A017]" />
              )}
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-[#C5E1A5] shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1">
          {[
            { id: 'all', label: 'All Alerts', count: notifications.length },
            { id: 'unread', label: 'Unread Only', count: unreadCount },
            { id: 'Critical', label: 'Critical', count: notifications.filter(n => n.severity === 'Critical').length },
            { id: 'Warning', label: 'Warning', count: notifications.filter(n => n.severity === 'Warning').length },
            { id: 'Expiry', label: 'Expiry', count: notifications.filter(n => n.severity === 'Expiry' || n.recipientType === 'expiry').length },
            { id: 'Info', label: 'Info', count: notifications.filter(n => n.severity === 'Info').length },
            { id: 'Success', label: 'Success', count: notifications.filter(n => n.severity === 'Success').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilter === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 pr-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#166534] focus:bg-white text-slate-900 transition-all"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#166534] mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading inbox alerts from server...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#166534] flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-[#0F172A]">No Notifications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No notifications matched "${searchQuery}". Try changing your search.`
                : activeFilter === 'unread'
                ? 'All caught up! There are no unread system notifications.'
                : 'No official notifications received from Super Admin yet.'}
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isUnread = !item.isRead;
            const isMarkingThis = markingReadId === item._id;
            const isDeletingThis = deletingId === item._id;

            const severityStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
              Info: {
                bg: 'bg-blue-50/60',
                border: 'border-blue-200',
                text: 'text-blue-800',
                icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />
              },
              Success: {
                bg: 'bg-emerald-50/60',
                border: 'border-emerald-200',
                text: 'text-emerald-800',
                icon: <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              },
              Warning: {
                bg: 'bg-amber-50/60',
                border: 'border-amber-200',
                text: 'text-amber-800',
                icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              },
              Critical: {
                bg: 'bg-rose-50/60',
                border: 'border-rose-200',
                text: 'text-rose-800',
                icon: <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              },
              Expiry: {
                bg: 'bg-purple-50/60',
                border: 'border-purple-200',
                text: 'text-purple-800',
                icon: <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
              }
            };

            const styling = severityStyles[item.severity] || severityStyles.Info;

            return (
              <div
                key={item._id}
                onClick={() => {
                  if (isUnread) handleMarkAsRead(item._id);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-white border-[#166534]/30 shadow-xs hover:border-[#166534]'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Content */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`p-2.5 rounded-xl border ${styling.bg} ${styling.border}`}>
                      {styling.icon}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" title="Unread" />
                        )}
                        <h3 className={`text-sm font-extrabold leading-snug ${isUnread ? 'text-[#0F172A]' : 'text-slate-700'}`}>
                          {item.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${styling.bg} ${styling.border} ${styling.text}`}>
                          {item.severity.toUpperCase()}
                        </span>
                        {item.sendEmail && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Mail className="w-2.5 h-2.5 text-emerald-600" />
                            Email Alert Sent
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {item.message}
                      </p>

                      {/* Expiry Details Banner */}
                      {item.expiryDate && (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-mono font-bold mt-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>Expiry Target: {item.expiryDate}</span>
                        </div>
                      )}

                      {/* Footer Details */}
                      <div className="flex items-center gap-4 pt-1.5 text-[10px] text-slate-400 font-mono flex-wrap">
                        <span>From: <strong className="text-slate-700">{item.senderName || 'Super Admin'}</strong></span>
                        {item.createdAt && (
                          <span>{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                        )}
                        {item.readAt && (
                          <span className="text-emerald-700">Read on {new Date(item.readAt).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.actionLink && (
                      <a
                        href={item.actionLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Open Action Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open</span>
                      </a>
                    )}

                    {isUnread ? (
                      <button
                        onClick={(e) => handleMarkAsRead(item._id, e)}
                        disabled={isMarkingThis}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#166534] border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Mark as Read"
                      >
                        {isMarkingThis ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-[#166534]" />
                        ) : (
                          'Mark as Read'
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold px-2 py-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Read
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      disabled={isDeletingThis}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Notification"
                    >
                      {isDeletingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
