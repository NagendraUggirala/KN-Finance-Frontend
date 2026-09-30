import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Users,
  Calendar
} from 'lucide-react';
import type { AssignedBorrower, EmployeeProfile } from '../types';
import {
  transliterateEnglishToTelugu,
  transliterateTeluguToEnglish,
  isTeluguText
} from '../../AdminDashboard/Sidebarpages/transliterate';
import {
  getActiveFinanceBookApi,
  batchSaveFinanceBookApi,
  updateBorrowerStatusApi
} from '../../../lib/api';

export interface LedgerPayment {
  date: string;
  amount: string;
}

export interface LedgerRowData {
  id: string;
  _id?: string;
  date: string; // Borrow Date (DD-MM)
  borrowDate?: string;
  sNo: string;
  name: string; // primary display name
  nameTelugu: string; // Telugu script name
  nameEnglish: string; // English script name
  item: string;
  productItem?: string;
  amount: string;
  principalAmount?: number;
  payments: { [key: number]: LedgerPayment };
  initialRemaining?: string;
  remaining?: string;
  remainingBalance?: number;
  totalPaid?: number;
  interestRate?: number;
  isClosed?: boolean;
}

export interface EmployeeLedgerBookProps {
  borrowers?: AssignedBorrower[];
  setBorrowers?: React.Dispatch<React.SetStateAction<AssignedBorrower[]>>;
  userName?: string;
  employee?: EmployeeProfile | null;
  onShowToast: (msg: string) => void;
}

export const EmployeeLedgerBook: React.FC<EmployeeLedgerBookProps> = ({
  borrowers = [],
  setBorrowers,
  userName = 'Field Officer',
  employee,
  onShowToast,
}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');

  // Dynamic Date / Installment Columns
  const [dateColumns, setDateColumns] = useState<string[]>(['08-08', '15-08', '22-08', '29-08']);

  // Master ledger rows in state
  const [rows, setRows] = useState<LedgerRowData[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempRows, setTempRows] = useState<LedgerRowData[]>([]);
  const [tempDateColumns, setTempDateColumns] = useState<string[]>([]);

  // Backend Cloud Synchronization State
  const [ledgerBookId, setLedgerBookId] = useState<string>('');
  const [ledgerVersion, setLedgerVersion] = useState<number>(1);
  const [isSyncingWithBackend, setIsSyncingWithBackend] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [loadingSeconds, setLoadingSeconds] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOfflineBypassed, setIsOfflineBypassed] = useState<boolean>(false);

  // In-component Save Status & Notification
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<{
    type: 'saving' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Focus reference coordinates for active cell navigation
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);

  // Helper variables for reading vs editing
  const currentRows = isEditing ? tempRows : rows;
  const currentDateColumns = isEditing ? tempDateColumns : dateColumns;

  // Safe payment getter for row and colIdx
  const getPayment = (row: LedgerRowData, colIdx: number): LedgerPayment => {
    const p = row.payments?.[colIdx];
    if (!p) return { date: '', amount: '' };
    if (typeof p === 'object' && p !== null) return { date: p.date || '', amount: p.amount || '' };
    return { date: '', amount: String(p || '') };
  };

  // Dynamically load Google Font for Telugu if not present
  useEffect(() => {
    const fontId = 'google-telugu-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&family=Noto+Serif+Telugu:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Track loading elapsed seconds to detect delayed network / cold start
  useEffect(() => {
    let timer: any = null;
    if (isSyncingWithBackend) {
      timer = setInterval(() => {
        setLoadingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSyncingWithBackend]);

  // Fetch Active Ledger from Cloud Backend (GET /api/v1/finance-book/active)
  const fetchActiveLedger = async () => {
    setIsSyncingWithBackend(true);
    setLoadError(null);
    setLoadingSeconds(0);
    try {
      const res = await getActiveFinanceBookApi();
      if (res?.data) {
        if (res.data.ledgerBook?.id) {
          setLedgerBookId(res.data.ledgerBook.id);
        }
        if (res.data.ledgerBook?.version) {
          setLedgerVersion(res.data.ledgerBook.version);
        }
        if (res.data.dateColumns && res.data.dateColumns.length > 0) {
          setDateColumns(res.data.dateColumns);
        }
        if (res.data.rows && res.data.rows.length > 0) {
          const loadedRows: LedgerRowData[] = res.data.rows.map((r, idx) => {
            const paymentsMap: { [key: number]: LedgerPayment } = {};
            if (r.payments) {
              Object.entries(r.payments).forEach(([k, p]) => {
                paymentsMap[parseInt(k, 10)] = {
                  date: p.date || '',
                  amount: String(p.amount ?? '')
                };
              });
            }
            return {
              id: r.id || `row-${idx}`,
              sNo: String(r.sNo || idx + 1),
              date: r.date || r.borrowDate || '03-08',
              name: r.nameTelugu,
              nameTelugu: r.nameTelugu,
              nameEnglish: r.nameEnglish || '',
              item: r.item || r.productItem || 'Weekly Terms',
              amount: String(r.amount ?? r.principalAmount ?? ''),
              initialRemaining: String(r.initialRemaining ?? r.amount ?? ''),
              remaining: String(r.remainingBalance ?? r.initialRemaining ?? r.amount ?? ''),
              isClosed: !!r.isClosed,
              payments: paymentsMap
            };
          });
          setRows(loadedRows);
          setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
          onShowToast('Ledger data synchronized with server! 🔄');
          return;
        }
      }
      populateFallbackFromBorrowers();
    } catch (err: any) {
      console.warn('Backend active ledger fetch notice:', err.message);
      setLoadError(err.message || 'Unable to connect to cloud database server.');
      populateFallbackFromBorrowers();
    } finally {
      setIsSyncingWithBackend(false);
    }
  };

  // Helper to populate initial rows from borrowers prop or defaults
  const populateFallbackFromBorrowers = () => {
    if (rows.length > 0) return;

    if (borrowers && borrowers.length > 0) {
      const fallbackList: LedgerRowData[] = borrowers.map((b, idx) => {
        const rowPayments: { [key: number]: LedgerPayment } = {};
        if (b.payments) {
          if (Array.isArray(b.payments)) {
            b.payments.forEach((p, pIdx) => {
              const parts = p.date ? p.date.split('-') : [];
              const dayMonth = parts.length >= 3 ? `${parts[2]}-${parts[1]}` : '08-08';
              rowPayments[pIdx] = {
                date: dayMonth,
                amount: String(p.amount || '')
              };
            });
          } else {
            Object.entries(b.payments).forEach(([k, p]) => {
              rowPayments[parseInt(k, 10)] = {
                date: (p as any).date || '',
                amount: String((p as any).amount || '')
              };
            });
          }
        }

        const recName = b.nameTelugu || b.nameEnglish || '';
        let teName = b.nameTelugu || '';
        let enName = b.nameEnglish || '';
        if (!teName && isTeluguText(recName)) {
          teName = recName;
          enName = transliterateTeluguToEnglish(recName);
        } else if (!enName && recName) {
          enName = transliterateTeluguToEnglish(recName);
        }

        return {
          id: b.id || `row-prop-${idx}`,
          sNo: String(b.sNo || idx + 1),
          date: b.borrowDate || b.date || '03-08',
          name: teName || enName,
          nameTelugu: teName,
          nameEnglish: enName,
          item: b.productItem || b.item || 'Weekly Terms',
          amount: String(b.principalAmount || ''),
          initialRemaining: String(b.initialRemaining || b.principalAmount || ''),
          remaining: String(b.remainingBalance || ''),
          isClosed: !!b.isClosed,
          payments: rowPayments
        };
      });
      setRows(fallbackList);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    fetchActiveLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync back to parent borrowers state if provided
  useEffect(() => {
    if (!setBorrowers || rows.length === 0) return;

    const mappedBorrowers: AssignedBorrower[] = rows.map((r, index) => {
      const sNoNum = parseInt(r.sNo, 10) || index + 1;
      const principal = parseFloat(r.amount.replace(/,/g, '')) || 0;
      let target = principal;
      if (r.initialRemaining !== undefined && r.initialRemaining !== '') {
        target = parseFloat(r.initialRemaining.replace(/,/g, '')) || 0;
      }

      let totalPaid = 0;
      Object.values(r.payments || {}).forEach((p) => {
        const amt = parseFloat((p.amount || '').replace(/,/g, '')) || 0;
        totalPaid += amt;
      });
      const remaining = Math.max(0, target - totalPaid);

      return {
        id: r.id,
        sNo: sNoNum,
        borrowDate: r.date || '03-08',
        date: r.date || '03-08',
        nameTelugu: r.nameTelugu || r.name,
        nameEnglish: r.nameEnglish || '',
        phone: '',
        village: '',
        productItem: r.item || 'Weekly Terms',
        item: r.item || 'Weekly Terms',
        principalAmount: principal,
        initialRemaining: target,
        remainingBalance: remaining,
        totalPaid: totalPaid,
        interestRate: 5,
        isClosed: !!r.isClosed,
        payments: r.payments
      };
    });

    setBorrowers(mappedBorrowers);
  }, [rows, setBorrowers]);

  // Start Edit Session
  const handleStartEdit = () => {
    setTempRows(JSON.parse(JSON.stringify(rows)));
    setTempDateColumns([...dateColumns]);
    setIsEditing(true);
    onShowToast('Editing Mode Active. Edit cells directly, manage columns, or add rows! ✏️');
  };

  // Save Edit Changes (POST /api/v1/finance-book/batch-save)
  const handleSave = async () => {
    setIsSaving(true);
    setSaveNotification({
      type: 'saving',
      message: 'Saving and synchronizing ledger changes to cloud database... ⏳'
    });

    // Clean, validate and prepare batch save payload
    const cleanedRows = tempRows.map((r, idx) => {
      const sNoNum = parseInt(String(r.sNo), 10) || idx + 1;
      const teName = (r.nameTelugu || r.name || r.nameEnglish || `ఆసామి ${sNoNum}`).trim();
      const enName = (r.nameEnglish || '').trim();
      const productItem = (r.item || 'Daily Terms').trim() || 'Daily Terms';
      const principalNum = parseFloat(String(r.amount).replace(/,/g, '')) || 0;
      const initialRemainingNum =
        parseFloat(String(r.initialRemaining || r.amount).replace(/,/g, '')) || Math.round(principalNum * 1.2 * 1.05);

      const formattedPayments: Record<string, { date: string; amount: number; paymentType?: string }> = {};
      Object.entries(r.payments || {}).forEach(([k, p]) => {
        const colNum = parseInt(k, 10);
        if (!isNaN(colNum) && colNum >= 0) {
          formattedPayments[k] = {
            date: p.date || tempDateColumns[colNum] || '08-08',
            amount: parseFloat(String(p.amount).replace(/,/g, '')) || 0,
            paymentType: (p as any).paymentType || 'Cash'
          };
        }
      });

      // Only pass MongoDB ObjectId if valid 24-char hex string
      const isValidId = Boolean(r.id && /^[0-9a-fA-F]{24}$/.test(r.id));

      return {
        id: isValidId ? r.id : undefined,
        sNo: sNoNum,
        date: r.date || '08-08',
        borrowDate: r.date || '08-08',
        nameTelugu: teName,
        nameEnglish: enName,
        item: productItem,
        productItem: productItem,
        amount: principalNum,
        principalAmount: principalNum,
        initialRemaining: initialRemainingNum,
        interestRate: Number(r.interestRate) || 5,
        isClosed: !!r.isClosed,
        payments: formattedPayments
      };
    });

    const batchPayload = {
      ledgerBookId: ledgerBookId && /^[0-9a-fA-F]{24}$/.test(ledgerBookId) ? ledgerBookId : undefined,
      version: ledgerVersion,
      dateColumns: tempDateColumns,
      rows: cleanedRows
    };

    try {
      const saveRes = await batchSaveFinanceBookApi(batchPayload);
      setRows(tempRows);
      setDateColumns(tempDateColumns);
      setIsEditing(false);

      if (saveRes?.data?.ledgerBook?.version) {
        setLedgerVersion(saveRes.data.ledgerBook.version);
      }
      if (saveRes?.data?.ledgerBook?.id) {
        setLedgerBookId(saveRes.data.ledgerBook.id);
      }

      const syncTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(syncTime);
      setSaveNotification({
        type: 'success',
        message: saveRes?.message || 'All ledger changes successfully saved to database! 💾'
      });
      onShowToast('All ledger changes successfully saved to database! 💾');

      // Auto clear success notice after 6 seconds
      setTimeout(() => {
        setSaveNotification((prev) => (prev?.type === 'success' ? null : prev));
      }, 6000);
    } catch (err: any) {
      console.error('Batch save error:', err);
      // Keep changes in editor so officer does not lose work
      const errMsg = err?.message || 'Server error occurred while saving';
      setSaveNotification({
        type: 'error',
        message: `Database Save Error: ${errMsg}. Local edits are preserved in editor.`
      });
      onShowToast(`Save Error: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel Edit Session
  const handleCancel = () => {
    setIsEditing(false);
    setSaveNotification(null);
    onShowToast('Edits cancelled.');
  };

  // Toggle Row Closed Status (PATCH /api/v1/finance-book/rows/:id/status)
  const handleToggleClosed = async (rowId: string) => {
    if (!isEditing) return;
    const target = tempRows.find(r => r.id === rowId);
    const nextClosed = target ? !target.isClosed : false;

    const updated = tempRows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          isClosed: nextClosed
        };
      }
      return r;
    });
    setTempRows(updated);

    try {
      await updateBorrowerStatusApi(rowId, nextClosed);
    } catch (err) {
      console.warn('Update borrower status notice:', err);
    }
  };

  // Add new date column
  const handleAddColumn = () => {
    if (!isEditing) return;
    let newDate = '15-08';
    if (tempDateColumns.length > 0) {
      const lastDate = tempDateColumns[tempDateColumns.length - 1];
      const match = lastDate.match(/^(\d{2})-(\d{2})$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const d = new Date(2026, month - 1, day + 7);
        const nextDay = String(d.getDate()).padStart(2, '0');
        const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
        newDate = `${nextDay}-${nextMonth}`;
      } else {
        newDate = `వా. ${tempDateColumns.length + 1}`;
      }
    }
    setTempDateColumns([...tempDateColumns, newDate]);
    onShowToast(`Added Installment column (${newDate}).`);
  };

  // Delete date column
  const handleDeleteColumn = (colIdx: number) => {
    if (!isEditing) return;
    const updatedCols = tempDateColumns.filter((_, idx) => idx !== colIdx);

    const updatedRows = tempRows.map(row => {
      const newPayments: { [key: number]: LedgerPayment } = {};
      Object.entries(row.payments || {}).forEach(([kStr, val]) => {
        const k = parseInt(kStr, 10);
        const payObj: LedgerPayment = typeof val === 'object' && val !== null ? val : { date: '', amount: String(val || '') };
        if (k < colIdx) {
          newPayments[k] = payObj;
        } else if (k > colIdx) {
          newPayments[k - 1] = payObj;
        }
      });
      return {
        ...row,
        payments: newPayments
      };
    });

    setTempDateColumns(updatedCols);
    setTempRows(updatedRows);
    onShowToast('Installment column removed.');
  };

  // Add row inside table
  const handleAddRow = () => {
    if (!isEditing) {
      handleStartEdit();
    }
    const targetRows = isEditing ? tempRows : rows;
    const nextSNo = targetRows.length + 1;
    const newRow: LedgerRowData = {
      id: `row-${nextSNo}-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-'),
      sNo: nextSNo.toString(),
      name: '',
      nameTelugu: '',
      nameEnglish: '',
      item: 'Weekly Terms',
      amount: '',
      payments: {},
      isClosed: false
    };
    if (isEditing) {
      setTempRows([...tempRows, newRow]);
    } else {
      setTempRows([...rows, newRow]);
      setTempDateColumns([...dateColumns]);
      setIsEditing(true);
    }
    onShowToast('Added new borrower row. Fill details and click Save Changes! ➕');
  };

  // Delete row inside table
  const handleDeleteRow = (rowId: string) => {
    if (!isEditing) return;
    const updatedRows = tempRows.filter(r => r.id !== rowId).map((r, index) => ({
      ...r,
      sNo: (index + 1).toString()
    }));
    setTempRows(updatedRows);
    onShowToast('Person row deleted.');
  };

  // Handle person name changes with real-time automatic transliteration
  const handleNameChange = (rowId: string, source: 'telugu' | 'english', value: string) => {
    if (!isEditing) return;
    const updated = tempRows.map(r => {
      if (r.id === rowId) {
        if (source === 'telugu') {
          const autoEnglish = transliterateTeluguToEnglish(value);
          return {
            ...r,
            name: value || autoEnglish,
            nameTelugu: value,
            nameEnglish: autoEnglish
          };
        } else {
          const autoTelugu = transliterateEnglishToTelugu(value);
          return {
            ...r,
            name: autoTelugu || value,
            nameTelugu: autoTelugu,
            nameEnglish: value
          };
        }
      }
      return r;
    });
    setTempRows(updated);
  };

  // Handle payment changes for specific row and column
  const handlePaymentChange = (rowId: string, colIdx: number, subField: 'date' | 'amount', value: string) => {
    if (!isEditing) return;
    const updated = tempRows.map(r => {
      if (r.id === rowId) {
        const currentPay = r.payments?.[colIdx];
        const existingDate = typeof currentPay === 'object' && currentPay !== null
          ? currentPay.date
          : (tempDateColumns[colIdx] || '');
        const existingAmt = typeof currentPay === 'object' && currentPay !== null
          ? currentPay.amount
          : (currentPay ? String(currentPay) : '');

        return {
          ...r,
          payments: {
            ...r.payments,
            [colIdx]: {
              date: subField === 'date' ? value : existingDate,
              amount: subField === 'amount' ? value : existingAmt
            }
          }
        };
      }
      return r;
    });
    setTempRows(updated);
  };

  // Handle cell text edits by row ID
  const handleCellChange = (rowId: string, field: keyof LedgerRowData, value: string) => {
    if (!isEditing) return;
    const updated = tempRows.map(r => {
      if (r.id === rowId) {
        if (field === 'amount') {
          const numVal = parseFloat(value.replace(/,/g, '')) || 0;
          const defaultInitialRemaining = numVal > 0 ? Math.round(numVal * 1.25).toString() : '';
          return {
            ...r,
            amount: value,
            initialRemaining: defaultInitialRemaining
          };
        }
        return {
          ...r,
          [field]: value
        };
      }
      return r;
    });
    setTempRows(updated);
  };

  // Calculations for sum & balance
  const getRowTotals = (row: LedgerRowData) => {
    let totalPaid = 0;
    const rowPayments = row.payments || {};
    currentDateColumns.forEach((_, colIdx) => {
      const pay = rowPayments[colIdx];
      const val = typeof pay === 'object' && pay !== null ? pay.amount || '' : String(pay || '');
      const num = parseFloat(val.replace(/,/g, '')) || 0;
      totalPaid += num;
    });
    const amount = parseFloat((row.amount || '').replace(/,/g, '')) || 0;

    let target = amount;
    if (row.initialRemaining !== undefined && row.initialRemaining !== '') {
      target = parseFloat(row.initialRemaining.replace(/,/g, '')) || 0;
    }
    const remaining = Math.max(0, target - totalPaid);
    return { totalPaid, remaining, target, amount };
  };

  // Start offline manual mode
  const handleStartOffline = () => {
    setIsOfflineBypassed(true);
    setIsSyncingWithBackend(false);
    if (rows.length === 0) {
      const initialRow: LedgerRowData = {
        id: `row-1-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-'),
        sNo: '1',
        name: '',
        nameTelugu: '',
        nameEnglish: '',
        item: 'Weekly Terms',
        amount: '',
        payments: {},
        isClosed: false
      };
      setRows([initialRow]);
      setTempRows([initialRow]);
      setTempDateColumns([...dateColumns]);
      setIsEditing(true);
      onShowToast('Started offline ledger session. Enter details and save anytime! 📝');
    } else {
      setIsEditing(true);
    }
  };

  // Filtered rows matching Name (Telugu/English), S.No, Date, or Item + Status filter
  const filteredRows = currentRows.filter(row => {
    if (statusFilter === 'Active' && row.isClosed) return false;
    if (statusFilter === 'Closed' && !row.isClosed) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (row.nameTelugu || '').toLowerCase().includes(term) ||
      (row.nameEnglish || '').toLowerCase().includes(term) ||
      (row.name || '').toLowerCase().includes(term) ||
      (row.sNo || '').toLowerCase().includes(term) ||
      (row.date || '').toLowerCase().includes(term) ||
      (row.item || '').toLowerCase().includes(term)
    );
  });

  // Calculate book active & closed counts
  const activeCount = currentRows.filter(r => !r.isClosed).length;
  const closedCount = currentRows.filter(r => !!r.isClosed).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Styles Injection for Telugu font, warm parchment textures, and aligned cells */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .telugu-font {
          font-family: 'Noto Serif Telugu', 'Noto Sans Telugu', serif;
        }

        /* Warm ambient leather/wood desk background */
        .executive-desk-bg {
          background-color: #f7f3ec;
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(217, 119, 6, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 85% 85%, rgba(22, 101, 52, 0.04) 0%, transparent 60%),
            linear-gradient(to right, rgba(180, 83, 9, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(180, 83, 9, 0.03) 1px, transparent 1px);
          background-size: auto, auto, 24px 24px, 24px 24px;
        }

        /* Crisp ivory ledger paper with subtle warmth */
        .ledger-paper {
          background-color: #fefdf9;
          position: relative;
        }

        .ledger-shadow {
          box-shadow: 
            0 2px 4px rgba(180, 83, 9, 0.05),
            0 10px 25px -5px rgba(30, 41, 59, 0.08),
            0 20px 25px -5px rgba(0, 0, 0, 0.04);
        }

        .ledger-cell-border {
          border: 1px solid #e7ded0 !important;
        }

        .double-header-border {
          border-bottom: 3.5px double #b45309 !important;
        }

        .ledger-cell-input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          height: 100%;
          color: #0f172a;
          font-weight: 500;
          font-size: 12.5px;
          transition: background-color 0.15s ease;
        }

        .ledger-cell-input:focus {
          background-color: rgba(217, 119, 6, 0.12);
        }

        .ledger-cell-input:disabled {
          color: #0f172a;
          cursor: default;
          opacity: 1;
          -webkit-text-fill-color: #0f172a;
        }

        .closed-row-input {
          text-decoration: line-through !important;
          text-decoration-color: #ef4444 !important;
          color: #94a3b8 !important;
          opacity: 0.65;
          -webkit-text-fill-color: #94a3b8 !important;
        }

        .scrollbar-ledger {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        .scrollbar-ledger::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scrollbar-ledger::-webkit-scrollbar-track {
          background: #f1ebd9;
          border-radius: 4px;
        }
        .scrollbar-ledger::-webkit-scrollbar-thumb {
          background: #c59b27;
          border-radius: 4px;
        }

        .book-spine-divider {
          background: linear-gradient(to right, 
            rgba(180, 83, 9, 0.1) 0%, 
            rgba(217, 119, 6, 0.25) 45%, 
            rgba(146, 64, 14, 0.4) 50%, 
            rgba(217, 119, 6, 0.25) 55%, 
            rgba(180, 83, 9, 0.1) 100%
          );
        }
      `}} />

      {/* 1. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">మొత్తం ఖాతాలు</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {currentRows.length} <span className="text-xs font-semibold text-slate-400">({activeCount} Active)</span>
            </div>
          </div>
        </div>
      </div>


      {/* Row 2: Operational Action Buttons & Status (Cleanly Arranged) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">

        {/* Left: DB Sync & Field Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchActiveLedger}
            disabled={isSyncingWithBackend}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer disabled:opacity-60"
            title="Sync Ledger with Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithBackend ? 'animate-spin text-[#166534]' : 'text-slate-500'}`} />
            <span>{isSyncingWithBackend ? `Syncing (${loadingSeconds}s)...` : lastSyncTime ? `Synced: ${lastSyncTime}` : 'Sync Database'}</span>
          </button>

          {isEditing && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>Editing Active </span>
            </span>
          )}
        </div>

        {/* Right: Functional Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">

          {!isEditing ? (
            <>

              {/* Primary: Edit Ledger Button */}
              <button
                onClick={handleStartEdit}
                className="h-9 px-4 inline-flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs hover:shadow transition-all transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-100" />
                <span>Edit Ledger</span>
              </button>
            </>
          ) : (
            <>
              {/* Add Column Button */}
              <button
                onClick={handleAddColumn}
                className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs transition-all cursor-pointer"
                title="Add next weekly installment column"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Column</span>
              </button>

              {/* Add Row Button */}
              <button
                onClick={handleAddRow}
                className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 shadow-2xs transition-all cursor-pointer"
                title="Add new borrower person row"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>Person</span>
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-rose-500" />
                <span>Cancel </span>
              </button>

              {/* Save Changes Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 px-4 inline-flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-[#166534] hover:from-emerald-700 hover:to-[#14532d] text-white shadow-xs hover:shadow transition-all transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-75"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-100" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          )}

        </div>

      </div>

      {/* Real-time Save & Sync Status Banner */}
      {saveNotification && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-sm ${
            saveNotification.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
              : saveNotification.type === 'error'
              ? 'bg-rose-50 text-rose-950 border border-rose-300'
              : 'bg-amber-50 text-amber-950 border border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {saveNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {saveNotification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {saveNotification.type === 'saving' && <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />}
            <span>{saveNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Structured & Well-Arranged Functionality Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">

        {/* Row 1: Search & Status Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">

          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by S.No, Name (తెలుగు / English), లేదా వస్తువు..."
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-[13px] bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 rounded-xl text-slate-900 placeholder-slate-400 transition-all outline-none font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs (Segmented Control) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto shrink-0 justify-center">
            {(['All', 'Active', 'Closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${statusFilter === st
                  ? 'bg-[#166534] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {st} {st === 'All' ? `(${currentRows.length})` : st === 'Active' ? `(${activeCount})` : `(${closedCount})`}
              </button>
            ))}
          </div>

        </div>



      </div>

      {/* 3. Authentic Warm Ledger Book Container */}
      <div className="executive-desk-bg p-3 sm:p-5 md:p-6 rounded-3xl border border-amber-900/15 shadow-xl">

        {/* Loading Spinner with Cold Start / Retry handling */}
        {isSyncingWithBackend && rows.length === 0 && !isOfflineBypassed ? (
          <div className="max-w-xl w-full ledger-paper rounded-3xl p-6 sm:p-10 border-2 border-amber-800/30 ledger-shadow text-center my-6 mx-auto animate-in fade-in duration-300">
            <div className="relative my-4 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-[#166534] animate-spin" />
                <BookOpen className="w-7 h-7 text-amber-800" />
              </div>

              <h3 className="text-xl font-extrabold text-amber-950 font-serif mt-4">
                ఖాతా పుస్తకం వివరాలు లోడ్ అవుతున్నాయి...
              </h3>
              <p className="text-xs font-semibold text-amber-800/80 mt-1">
                Loading Active Finance Ledger from Cloud Database
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold mt-3">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Elapsed: {loadingSeconds}s</span>
              </div>
            </div>

            {(loadingSeconds >= 3 || loadError) && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-left shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">Cloud Server Response Delayed</p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      Cloud backend is waking up or connection is slow. You can wait, retry, or start working offline immediately.
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={fetchActiveLedger}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-all cursor-pointer"
                      >
                        Retry Sync
                      </button>
                      <button
                        onClick={handleStartOffline}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#166534] hover:bg-[#14532d] text-white rounded-lg transition-all cursor-pointer"
                      >
                        Start Offline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : rows.length === 0 && !isEditing ? (
          /* Empty Ledger State */
          <div className="max-w-md w-full ledger-paper rounded-3xl p-8 border-2 border-amber-800/20 ledger-shadow text-center my-6 mx-auto animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3 text-amber-800">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-amber-950 font-serif">
              ఖాతా పుస్తకంలో రికార్డులు లేవు
            </h3>
            <p className="text-xs text-amber-800/80 mt-1">
              No active ledger accounts loaded. Click below to add the first borrower account row.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={handleStartOffline}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>కొత్త ఖాతా ప్రారంభించండి (Add Person)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Unified Single Table Book Spread with 100% Guaranteed Row Alignment */
          <div className="ledger-paper rounded-2xl border-2 border-amber-900/30 ledger-shadow overflow-hidden transition-all duration-300">

            {/* Authentic Warm Ledger Book Header Bar */}
            <div className="bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-100/90 border-b-2 border-amber-900/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="font-serif text-sm font-extrabold tracking-wide">
                  శ్రీ లక్ష్మీ గణపతి ఫైనాన్స్
                </span>

              </div>
              <div className="flex items-center gap-3 text-xs text-amber-900 font-medium">
                <span>Officer: <strong className="font-bold text-slate-900">{userName || employee?.name || 'Field Officer'}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span className="font-mono text-amber-800">Showing {filteredRows.length} Accounts</span>
              </div>
            </div>

            {/* Unified Scrollable Table Container */}
            <div className="overflow-x-auto scrollbar-ledger">
              <table className="w-full border-collapse select-text telugu-font text-xs" style={{ minWidth: `${750 + currentDateColumns.length * 84}px` }}>

                {/* 1. Table Headers */}
                <thead className="bg-[#b45309]/5 select-none">
                  <tr className="double-header-border text-slate-900 font-bold text-center h-[52px] text-[11px] leading-tight">

                    {/* S.No */}
                    <th className="ledger-cell-border w-[44px] p-1 align-middle">
                      వ.సం.<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">S.No</span>
                    </th>

                    {/* Borrow Date */}
                    <th className="ledger-cell-border w-[68px] p-1 align-middle">
                      తేది<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Date</span>
                    </th>

                    {/* Telugu Name */}
                    <th className="ledger-cell-border min-w-[140px] p-1.5 text-left align-middle">
                      ఆసామి పేరు (తెలుగు)<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Telugu Name</span>
                    </th>

                    {/* English Name */}
                    <th className="ledger-cell-border min-w-[130px] p-1.5 text-left align-middle">
                      పేరు (English)<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">English Name</span>
                    </th>

                    {/* Product */}
                    <th className="ledger-cell-border min-w-[110px] p-1.5 text-left align-middle">
                      వస్తువు<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Product Item</span>
                    </th>

                    {/* Principal Amount */}
                    <th className="ledger-cell-border w-[85px] p-1 text-right align-middle">
                      సొమ్ము ₹<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Amount</span>
                    </th>

                    {/* Center Spine Marker / Visual Divider Column */}
                    <th className="w-[12px] p-0 book-spine-divider border-y border-[#e7ded0] align-middle" title="Book Center Fold">
                      <div className="w-[12px] h-full" />
                    </th>

                    {/* Dynamic Installment Columns */}
                    {currentDateColumns.map((colDate, colIdx) => (
                      <th key={colIdx} className="ledger-cell-border w-[84px] p-0 align-middle">
                        <div className="relative flex flex-col items-center justify-center h-full px-1 py-1">
                          <span className="text-[10.5px] text-amber-950 font-bold leading-tight">
                            వా. {colIdx + 1}
                          </span>
                          <span className="text-[8.5px] text-amber-800/80 font-sans font-bold tracking-tight">
                            {colDate}
                          </span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(colIdx)}
                              className="absolute -top-1.5 right-0.5 text-[10px] text-red-500 hover:text-red-700 bg-white rounded-full w-4 h-4 flex items-center justify-center shadow border border-red-200 cursor-pointer"
                              title="Delete Installment Column"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </th>
                    ))}

                    {/* Total Paid */}
                    <th className="ledger-cell-border w-[95px] p-1 text-right align-middle">
                      మొత్తం వసూలు<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Paid ₹</span>
                    </th>

                    {/* Remaining Balance */}
                    <th className="ledger-cell-border w-[100px] p-1 text-right align-middle">
                      బాకీ సొమ్ము<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Remaining ₹</span>
                    </th>

                    {/* Status */}
                    <th className="ledger-cell-border w-[85px] p-1 text-center align-middle">
                      ముగింపు<br />
                      <span className="text-[9px] text-slate-500 font-sans font-semibold">Status</span>
                    </th>
                  </tr>
                </thead>

                {/* 2. Table Body (Rows) */}
                <tbody className="divide-y divide-amber-200/50 bg-white/70">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10 + currentDateColumns.length} className="ledger-cell-border p-10 text-center text-amber-900/60 font-medium text-xs">
                        {searchTerm ? `"${searchTerm}" కి సంబంధించి ఎటువంటి రికార్డులు కనుగొనబడలేదు` : 'ఈ ఖాతా పుస్తకంలో రికార్డులు ఏవీ లేవు'}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => {
                      const { totalPaid, remaining } = getRowTotals(row);

                      return (
                        <tr
                          key={row.id}
                          className={`h-[46px] hover:bg-amber-100/35 transition-colors ${row.isClosed ? 'bg-slate-100/70 opacity-75' : ''
                            }`}
                        >
                          {/* S.No */}
                          <td className="ledger-cell-border p-0 text-center font-sans">
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={row.sNo}
                              onChange={(e) => handleCellChange(row.id, 'sNo', e.target.value)}
                              className={`ledger-cell-input text-center font-bold text-slate-800 ${row.isClosed ? 'closed-row-input' : ''}`}
                            />
                          </td>

                          {/* Borrow Date */}
                          <td className="ledger-cell-border p-0 text-center font-sans">
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={row.date}
                              placeholder="DD-MM"
                              onChange={(e) => handleCellChange(row.id, 'date', e.target.value)}
                              className={`ledger-cell-input text-center text-slate-600 ${row.isClosed ? 'closed-row-input' : ''}`}
                            />
                          </td>

                          {/* Telugu Name (with inline delete icon when editing) */}
                          <td className="ledger-cell-border p-0 text-left telugu-font">
                            <div className="flex items-center w-full h-full relative px-1">
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(row.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex-shrink-0 cursor-pointer mr-1"
                                  title="Delete Person Row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <input
                                type="text"
                                disabled={!isEditing}
                                value={row.nameTelugu || ''}
                                placeholder="తెలుగు పేరు"
                                onChange={(e) => handleNameChange(row.id, 'telugu', e.target.value)}
                                className={`ledger-cell-input text-left px-1.5 font-bold text-slate-900 ${row.isClosed ? 'closed-row-input' : ''}`}
                              />
                            </div>
                          </td>

                          {/* English Name (with automatic bidirectional transliteration) */}
                          <td className="ledger-cell-border p-0 text-left font-sans">
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={row.nameEnglish || ''}
                              placeholder="English Name"
                              onChange={(e) => handleNameChange(row.id, 'english', e.target.value)}
                              className={`ledger-cell-input text-left px-2 text-xs font-semibold text-slate-700 ${row.isClosed ? 'closed-row-input' : ''}`}
                            />
                          </td>

                          {/* Product Item */}
                          <td className="ledger-cell-border p-0 text-left">
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={row.item || ''}
                              placeholder="Weekly Terms"
                              onChange={(e) => handleCellChange(row.id, 'item', e.target.value)}
                              className={`ledger-cell-input text-left px-2 text-xs text-slate-600 ${row.isClosed ? 'closed-row-input' : ''}`}
                            />
                          </td>

                          {/* Principal Amount */}
                          <td className="ledger-cell-border p-0 text-right font-sans">
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={row.amount}
                              placeholder="₹0"
                              onChange={(e) => handleCellChange(row.id, 'amount', e.target.value)}
                              className={`ledger-cell-input text-right px-2 font-bold text-[#166534] ${row.isClosed ? 'closed-row-input' : ''}`}
                            />
                          </td>

                          {/* Visual Spine Divider */}
                          <td className="w-[12px] p-0 book-spine-divider border-y border-[#e7ded0]">
                            <div className="w-[12px] h-full" />
                          </td>

                          {/* Dynamic Installments (Date + Amount cells) */}
                          {currentDateColumns.map((_, colIdx) => {
                            const pay = getPayment(row, colIdx);

                            return (
                              <td key={colIdx} className="ledger-cell-border p-0 text-center font-sans bg-amber-50/20">
                                {isEditing ? (
                                  <div className="flex flex-col h-full w-full justify-center">
                                    <input
                                      type="text"
                                      value={pay.date}
                                      placeholder="DD-MM"
                                      onChange={(e) => handlePaymentChange(row.id, colIdx, 'date', e.target.value)}
                                      className="w-full text-center text-[10px] font-semibold text-amber-900 bg-amber-50/50 border-b border-amber-200/60 outline-none py-0.5 leading-tight placeholder-slate-400/50"
                                      title="Payment Date"
                                    />
                                    <input
                                      type="text"
                                      value={pay.amount}
                                      placeholder="₹ సొమ్ము"
                                      onChange={(e) => handlePaymentChange(row.id, colIdx, 'amount', e.target.value)}
                                      className="w-full text-center text-[11px] font-bold text-slate-800 bg-transparent outline-none py-0.5 leading-tight placeholder-slate-400/50"
                                      title="Payment Amount"
                                    />
                                  </div>
                                ) : (
                                  <div className={`flex flex-col items-center justify-center h-full py-0.5 leading-tight ${row.isClosed ? 'closed-row-input' : ''}`}>
                                    {pay.amount || pay.date ? (
                                      <>
                                        <span className="text-[9.5px] text-amber-900/80 font-bold font-sans">
                                          {pay.date || '—'}
                                        </span>
                                        <span className="text-[11.5px] font-bold text-[#166534] font-sans">
                                          {pay.amount ? `₹${pay.amount}` : '—'}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-slate-300 font-sans text-xs">—</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Total Paid */}
                          <td className={`ledger-cell-border p-1.5 text-right font-sans font-extrabold text-[#166534] bg-emerald-50/25 ${row.isClosed ? 'line-through text-slate-400 opacity-60' : ''
                            }`}>
                            ₹{totalPaid.toLocaleString('en-IN')}
                          </td>

                          {/* Remaining Balance with +5% calculation shortcut */}
                          <td className={`ledger-cell-border p-0 text-right font-sans ${remaining <= 0 && totalPaid > 0 ? 'bg-emerald-100/40 text-emerald-800' : 'bg-amber-50/15'
                            }`}>
                            <div className="relative flex items-center justify-end h-full w-full pr-1.5">
                              <input
                                type="text"
                                disabled={!isEditing}
                                value={
                                  activeCell?.row === rIdx && activeCell?.col === 99
                                    ? (row.initialRemaining !== undefined ? row.initialRemaining : (row.amount || ''))
                                    : (row.amount ? remaining.toString() : '')
                                }
                                onChange={(e) => handleCellChange(row.id, 'initialRemaining', e.target.value)}
                                onFocus={() => setActiveCell({ row: rIdx, col: 99 })}
                                onBlur={() => setTimeout(() => setActiveCell(null), 150)}
                                className={`ledger-cell-input text-right text-xs font-extrabold ${remaining <= 0 && totalPaid > 0 ? 'text-emerald-700' : 'text-rose-700'
                                  } ${row.isClosed ? 'closed-row-input' : ''} ${isEditing && activeCell?.row === rIdx ? 'pr-7' : ''
                                  }`}
                              />
                              {isEditing && activeCell?.row === rIdx && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const currentVal = parseFloat(row.initialRemaining || row.amount || '0') || 0;
                                    const newVal = Math.round(currentVal * 1.05);
                                    handleCellChange(row.id, 'initialRemaining', newVal.toString());
                                  }}
                                  className="absolute left-1 px-1 py-0.5 text-[8.5px] bg-amber-600 hover:bg-amber-700 text-white rounded font-sans font-bold cursor-pointer"
                                  title="Add 5% Interest"
                                >
                                  +5%
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="ledger-cell-border p-1 text-center font-sans">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => handleToggleClosed(row.id)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded shadow-2xs transition-all cursor-pointer ${row.isClosed
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200'
                                  : 'bg-emerald-100 text-[#166534] border border-emerald-200 hover:bg-emerald-200'
                                  }`}
                              >
                                {row.isClosed ? 'Reopen' : 'Close'}
                              </button>
                            ) : (
                              <span
                                className={`inline-block py-0.5 px-2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${row.isClosed
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-[#166534] border border-emerald-200'
                                  }`}
                              >
                                {row.isClosed ? 'Closed' : 'Active'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Add Person Row Button in Edit Mode */}
                  {isEditing && (
                    <tr className="h-[44px] bg-amber-50/40">
                      <td colSpan={10 + currentDateColumns.length} className="ledger-cell-border p-2 text-center">
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="px-4 py-1.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold transition-all shadow-xs hover:scale-[1.01] active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Person </span>
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>



              </table>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
