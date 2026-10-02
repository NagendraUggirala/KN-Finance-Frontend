export type NotificationSeverity = 'Info' | 'Success' | 'Warning' | 'Critical' | 'Expiry';
export type RecipientType = 'all' | 'single' | 'status' | 'expiry';

export interface NotificationItem {
  _id: string;
  id?: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  recipientType: RecipientType;
  recipientTarget: string;
  targetAdminId?: string | { _id: string; name?: string; username?: string; email?: string } | null;
  targetAdminEmail?: string | null;
  targetAdminName?: string | null;
  targetStatus?: 'active' | 'inactive' | null;
  expiryDate?: string | null;
  sendEmail: boolean;
  isEmailSent: boolean;
  actionLink?: string | null;
  senderName: string;
  isRead?: boolean; // Available on Admin Inbox
  read?: boolean;   // Backward compatibility with legacy components
  readAt?: string | null;
  readCount?: number; // Available on Superadmin History
  readBy?: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  severity: NotificationSeverity;
  recipientType: RecipientType;
  recipientTarget?: string;
  targetAdminId?: string | null;
  targetAdminEmail?: string | null;
  targetAdminName?: string | null;
  targetStatus?: 'active' | 'inactive' | null;
  expiryDate?: string | null;
  sendEmail?: boolean;
  actionLink?: string | null;
  senderName?: string;
}

export interface NotificationHistoryResponse {
  success: boolean;
  data: NotificationItem[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  metrics?: {
    total: number;
    sentEmails: number;
    unreadTotal?: number;
    [key: string]: any;
  };
}

export interface AdminInboxResponse {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}
