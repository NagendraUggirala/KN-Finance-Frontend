import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  Wallet,
  Receipt,
  Clock,
  Sparkles,
  ArrowRight,
  CreditCard,
  Banknote,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { DailyExpense, CollectionRecord, AssignedBorrower, EmployeeProfile } from '../types';
import {
  transliterateEnglishToTelugu,
  transliterateTeluguToEnglish,
  isTeluguText
} from '../../AdminDashboard/Sidebarpages/transliterate';
import {
  getActiveFinanceBookApi,
  createBorrowerRowApi,
  updateBorrowerRowApi,
  updateBorrowerStatusApi,
  deleteBorrowerRowApi,
  batchSaveFinanceBookApi,
  recordEmployeeCollectionApi,
  searchEmployeeLedgerBorrowersApi,
  getEmployeeLedgerBorrowerDossierApi,
  recordEmployeeInstallmentPaymentApi,
  toggleEmployeeBorrowerStatusApi,
  createEmployeeExpenseApi,
  getEmployeeExpensesApi,
  deleteEmployeeExpenseApi,
} from '../../../lib/api';
import type { EmployeeLedgerBorrowerSummary } from '../../../lib/api';

export interface LedgerPaymentItem {
  date: string;
  amount: string;
  paymentType?: 'Cash' | 'UPI' | 'Card';
}

export interface IndividualLedgerRow {
  id: string;
  _id?: string;
  sNo: string;
  date: string; // Borrow Date (DD-MM)
  name: string;
  nameTelugu: string;
  nameEnglish: string;
  item: string;
  amount: string; // Principal
  initialRemaining?: string; // Target due with interest
  remaining?: string;
  remainingBalance?: number;
  totalPaid?: number;
  interestRate?: number;
  isClosed?: boolean;
  payments: { [key: number]: LedgerPaymentItem };
}

export interface DailyExpensesAndSummaryProps {
  expenses: DailyExpense[];
  setExpenses: React.Dispatch<React.SetStateAction<DailyExpense[]>>;
  collections: CollectionRecord[];
  setCollections?: React.Dispatch<React.SetStateAction<CollectionRecord[]>>;
  borrowers: AssignedBorrower[];
  setBorrowers?: React.Dispatch<React.SetStateAction<AssignedBorrower[]>>;
  employee: EmployeeProfile | null;
  onShowToast: (msg: string) => void;
}

export const DailyExpensesAndSummary: React.FC<DailyExpensesAndSummaryProps> = ({
  expenses,
  setExpenses,
  collections,
  setCollections,
  borrowers,
  setBorrowers,
  employee,
  onShowToast,
}) => {
  // 1. Date Navigation State (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // 2. Active Finance Book Ledger State
  const [ledgerBookId, setLedgerBookId] = useState<string>('');
  const [ledgerVersion, setLedgerVersion] = useState<number>(1);
  const [dateColumns, setDateColumns] = useState<string[]>(['08-08', '15-08', '22-08', '29-08']);
  const [rows, setRows] = useState<IndividualLedgerRow[]>([]);
  const [isSyncingLedger, setIsSyncingLedger] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 3. Targeted Borrower Search & Active Selection State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');
  const [isSearchingServer, setIsSearchingServer] = useState<boolean>(false);
  const [serverSearchResults, setServerSearchResults] = useState<EmployeeLedgerBorrowerSummary[]>([]);
  const [isLoadingDossier, setIsLoadingDossier] = useState<boolean>(false);

  // 4. Modals State
  const [showAddBorrowerModal, setShowAddBorrowerModal] = useState<boolean>(false);
  const [showEditBorrowerModal, setShowEditBorrowerModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 5. New Borrower Form State
  const [newBorrowerForm, setNewBorrowerForm] = useState({
    sNo: '',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-'),
    nameTelugu: '',
    nameEnglish: '',
    item: 'వారపు అప్పు (Weekly Terms)',
    amount: '',
    initialRemaining: '',
    interestRate: '5',
  });

  // 6. Edit Borrower Form State
  const [editBorrowerForm, setEditBorrowerForm] = useState({
    id: '',
    sNo: '',
    date: '',
    nameTelugu: '',
    nameEnglish: '',
    item: '',
    amount: '',
    initialRemaining: '',
    interestRate: '5',
    isClosed: false,
  });

  // 7. Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    colIdx: 0,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-'),
    amount: '',
    paymentType: 'Cash' as 'Cash' | 'UPI',
    notes: '',
  });

  // 8. Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    category: 'Fuel/Petrol' as DailyExpense['category'],
    amount: '',
    description: '',
    receiptNumber: '',
  });

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

  // Fetch active finance book from cloud backend on initial load
  const fetchActiveLedger = async () => {
    setIsSyncingLedger(true);
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
          const loadedRows: IndividualLedgerRow[] = res.data.rows.map((r, idx) => {
            const paymentsMap: { [key: number]: LedgerPaymentItem } = {};
            if (r.payments) {
              Object.entries(r.payments).forEach(([k, p]) => {
                paymentsMap[parseInt(k, 10)] = {
                  date: p.date || '',
                  amount: String(p.amount ?? ''),
                  paymentType: (p as any).paymentType || 'Cash'
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
          return;
        }
      }
      populateFallbackFromBorrowers();
    } catch (err: any) {
      console.warn('Backend active ledger fetch notice:', err?.message);
      populateFallbackFromBorrowers();
    } finally {
      setIsSyncingLedger(false);
    }
  };

  // Fallback to populate from borrowers prop
  const populateFallbackFromBorrowers = () => {
    if (rows.length > 0) return;
    if (borrowers && borrowers.length > 0) {
      const fallbackList: IndividualLedgerRow[] = borrowers.map((b, idx) => {
        const rowPayments: { [key: number]: LedgerPaymentItem } = {};
        if (b.payments) {
          if (Array.isArray(b.payments)) {
            b.payments.forEach((p, pIdx) => {
              const parts = p.date ? p.date.split('-') : [];
              const dayMonth = parts.length >= 3 ? `${parts[2]}-${parts[1]}` : '08-08';
              rowPayments[pIdx] = {
                date: dayMonth,
                amount: String(p.amount || ''),
                paymentType: p.paymentType || 'Cash'
              };
            });
          } else {
            Object.entries(b.payments).forEach(([k, p]) => {
              rowPayments[parseInt(k, 10)] = {
                date: (p as any).date || '',
                amount: String((p as any).amount || ''),
                paymentType: (p as any).paymentType || 'Cash'
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

  useEffect(() => {
    fetchActiveLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------
  // OPERATING EXPENSES CLOUD PERSISTENCE (GET /api/v1/employee/expenses)
  // -------------------------------------------------------------
  useEffect(() => {
    let isSubscribed = true;

    const loadServerExpenses = async () => {
      try {
        const res = await getEmployeeExpensesApi({ date: selectedDate });
        if (res?.data?.expenses && isSubscribed) {
          const loaded: DailyExpense[] = res.data.expenses.map((e: any) => ({
            id: e.id || e._id || `exp-${Date.now()}`,
            date: e.date || selectedDate,
            category: (e.category as any) || 'Miscellaneous',
            amount: e.amount,
            description: e.description || '',
            paidBy: e.paidBy || employee?.name || 'Field Officer',
            receiptNumber: e.receiptNumber,
            createdAt: e.createdAt || new Date().toISOString(),
          }));

          setExpenses((prev) => {
            const otherDates = prev.filter((ex) => ex.date !== selectedDate);
            return [...otherDates, ...loaded];
          });
        }
      } catch (err: any) {
        console.warn('Backend expenses fetch notice (using current state):', err?.message);
      }
    };

    loadServerExpenses();

    return () => {
      isSubscribed = false;
    };
  }, [selectedDate, employee?.name, setExpenses]);

  // -------------------------------------------------------------
  // TARGETED BORROWER SEARCH WITH 300MS DEBOUNCE (GET /api/v1/employee/ledger/search)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setServerSearchResults([]);
      setIsSearchingServer(false);
      return;
    }

    setIsSearchingServer(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await searchEmployeeLedgerBorrowersApi({
          query: searchTerm,
          status: statusFilter,
          limit: 15,
        });

        if (res?.data?.borrowers) {
          setServerSearchResults(res.data.borrowers);
        }
      } catch (err: any) {
        console.warn('Backend ledger search notice (falling back to client):', err?.message);
        setServerSearchResults([]);
      } finally {
        setIsSearchingServer(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  // Sync back to parent borrowers state if prop exists
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

  // Shift selected date back/forward by 1 day
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Reconciled daily collections calculations
  const dateCollections = collections.filter((c) => c.date === selectedDate);
  const totalCollections = dateCollections.reduce((sum, c) => sum + c.amount, 0);
  const cashCollections = dateCollections.filter((c) => c.paymentType === 'Cash').reduce((sum, c) => sum + c.amount, 0);
  const upiCollections = dateCollections.filter((c) => c.paymentType === 'UPI').reduce((sum, c) => sum + c.amount, 0);

  // Daily expenses calculations
  const dateExpenses = expenses.filter((e) => e.date === selectedDate);
  const totalExpenses = dateExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Remaining Net Cash in Hand
  const remainingCashInHand = Math.max(0, cashCollections - totalExpenses);

  // Customer Lifecycle counts
  const newCustomersOnDate = rows.filter(
    (b) => b.date === selectedDate || b.date === selectedDate.slice(5) || b.date === `${selectedDate.split('-')[2]}-${selectedDate.split('-')[1]}`
  );
  const closedAccountsOnDate = rows.filter((b) => b.isClosed);

  // Helper to calculate totals for an individual borrower
  const calculateBorrowerTotals = (row: IndividualLedgerRow) => {
    let totalPaid = 0;
    Object.values(row.payments || {}).forEach((p) => {
      const amt = parseFloat((p.amount || '').replace(/,/g, '')) || 0;
      totalPaid += amt;
    });

    const principal = parseFloat((row.amount || '').replace(/,/g, '')) || 0;
    let target = principal;
    if (row.initialRemaining !== undefined && row.initialRemaining !== '') {
      target = parseFloat((row.initialRemaining || '').replace(/,/g, '')) || 0;
    }
    const remaining = Math.max(0, target - totalPaid);

    return { totalPaid, remaining, target, principal };
  };

  // Unified search results: prefer server-scoped results if available, else client-filter
  const unifiedSearchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return rows.filter((row) => {
        if (statusFilter === 'Active' && row.isClosed) return false;
        if (statusFilter === 'Closed' && !row.isClosed) return false;
        return true;
      });
    }

    if (serverSearchResults.length > 0) {
      return serverSearchResults.map((sb) => {
        const localMatch = rows.find((r) => r.id === sb.id || r._id === sb.id);
        if (localMatch) return localMatch;
        return {
          id: sb.id,
          sNo: String(sb.sNo),
          date: sb.date || sb.borrowDate || '03-08',
          name: sb.nameTelugu || sb.nameEnglish || '',
          nameTelugu: sb.nameTelugu,
          nameEnglish: sb.nameEnglish || '',
          item: sb.productItem || sb.item || 'Weekly Terms',
          amount: String(sb.principalAmount || ''),
          initialRemaining: String(sb.initialRemaining || ''),
          remaining: String(sb.remainingBalance || ''),
          remainingBalance: sb.remainingBalance,
          totalPaid: sb.totalPaid || 0,
          interestRate: sb.interestRate || 5,
          isClosed: !!sb.isClosed,
          payments: {},
        } as IndividualLedgerRow;
      });
    }

    // Client fallback filter
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((row) => {
      if (statusFilter === 'Active' && row.isClosed) return false;
      if (statusFilter === 'Closed' && !row.isClosed) return false;

      const sNoMatch = (row.sNo || '').toLowerCase().includes(term);
      const teMatch = (row.nameTelugu || '').toLowerCase().includes(term);
      const enMatch = (row.nameEnglish || '').toLowerCase().includes(term);
      const itemMatch = (row.item || '').toLowerCase().includes(term);
      const dateMatch = (row.date || '').toLowerCase().includes(term);

      return sNoMatch || teMatch || enMatch || itemMatch || dateMatch;
    });
  }, [rows, searchTerm, serverSearchResults, statusFilter]);

  // Selected active borrower object
  const activeBorrower = useMemo(() => {
    if (!selectedBorrowerId) return null;
    return rows.find((r) => r.id === selectedBorrowerId) || null;
  }, [rows, selectedBorrowerId]);

  // -------------------------------------------------------------
  // SELECT BORROWER & LOAD FULL DOSSIER (GET /api/v1/employee/ledger/borrower/:id)
  // -------------------------------------------------------------
  const handleSelectBorrower = async (borrowerId: string) => {
    setSelectedBorrowerId(borrowerId);
    setSearchTerm('');
    setIsLoadingDossier(true);

    try {
      const res = await getEmployeeLedgerBorrowerDossierApi(borrowerId);
      if (res?.data?.borrower) {
        const b = res.data.borrower;
        if (res.data.dateColumns && res.data.dateColumns.length > 0) {
          setDateColumns(res.data.dateColumns);
        }

        const mappedPayments: { [key: number]: LedgerPaymentItem } = {};
        if (b.payments) {
          Object.entries(b.payments).forEach(([k, p]) => {
            const pay = p as any;
            mappedPayments[parseInt(k, 10)] = {
              date: pay?.date || '',
              amount: String(pay?.amount || ''),
              paymentType: pay?.paymentType || 'Cash',
            };
          });
        }

        const updatedRow: IndividualLedgerRow = {
          id: b.id,
          sNo: String(b.sNo),
          date: b.date || b.borrowDate || '03-08',
          name: b.nameTelugu || b.nameEnglish || '',
          nameTelugu: b.nameTelugu || '',
          nameEnglish: b.nameEnglish || '',
          item: b.productItem || b.item || 'Weekly Terms',
          amount: String(b.principalAmount || ''),
          initialRemaining: String(b.initialRemaining || ''),
          remaining: String(b.remainingBalance || ''),
          remainingBalance: b.remainingBalance,
          totalPaid: b.totalPaid || 0,
          interestRate: b.interestRate || 5,
          isClosed: !!b.isClosed,
          payments: mappedPayments,
        };

        setRows((prev) => {
          const exists = prev.some((r) => r.id === b.id);
          return exists ? prev.map((r) => (r.id === b.id ? updatedRow : r)) : [updatedRow, ...prev];
        });
      }
    } catch (err: any) {
      console.warn('Dossier fetch fallback to local:', err?.message);
    } finally {
      setIsLoadingDossier(false);
    }
  };

  // Open Edit Borrower Modal
  const handleOpenEdit = (borrower: IndividualLedgerRow) => {
    setEditBorrowerForm({
      id: borrower.id,
      sNo: borrower.sNo,
      date: borrower.date,
      nameTelugu: borrower.nameTelugu || borrower.name,
      nameEnglish: borrower.nameEnglish || '',
      item: borrower.item,
      amount: borrower.amount,
      initialRemaining: borrower.initialRemaining || borrower.amount,
      interestRate: String(borrower.interestRate || '5'),
      isClosed: !!borrower.isClosed,
    });
    setShowEditBorrowerModal(true);
  };

  // Submit Edit Borrower
  const handleSaveEditBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBorrowerForm.id) return;
    setIsSubmitting(true);

    const principalNum = parseFloat(editBorrowerForm.amount.replace(/,/g, '')) || 0;
    const initialDueNum = parseFloat(editBorrowerForm.initialRemaining.replace(/,/g, '')) || Math.round(principalNum * 1.25);

    const updatedRows = rows.map((r) => {
      if (r.id === editBorrowerForm.id) {
        return {
          ...r,
          sNo: editBorrowerForm.sNo,
          date: editBorrowerForm.date,
          name: editBorrowerForm.nameTelugu || editBorrowerForm.nameEnglish,
          nameTelugu: editBorrowerForm.nameTelugu,
          nameEnglish: editBorrowerForm.nameEnglish,
          item: editBorrowerForm.item,
          amount: editBorrowerForm.amount,
          initialRemaining: String(initialDueNum),
          isClosed: editBorrowerForm.isClosed,
        };
      }
      return r;
    });

    setRows(updatedRows);
    setShowEditBorrowerModal(false);

    try {
      if (/^[0-9a-fA-F]{24}$/.test(editBorrowerForm.id)) {
        await updateBorrowerRowApi(editBorrowerForm.id, {
          borrowDate: editBorrowerForm.date,
          nameTelugu: editBorrowerForm.nameTelugu,
          nameEnglish: editBorrowerForm.nameEnglish,
          productItem: editBorrowerForm.item,
          principalAmount: principalNum,
          initialRemaining: initialDueNum,
        });
      } else {
        const formattedRows = updatedRows.map((r, idx) => {
          const formattedPayments: Record<string, { date: string; amount: number; paymentType?: string }> = {};
          Object.entries(r.payments || {}).forEach(([k, p]) => {
            formattedPayments[k] = {
              date: p.date,
              amount: parseFloat(p.amount) || 0,
              paymentType: p.paymentType || 'Cash'
            };
          });

          return {
            id: /^[0-9a-fA-F]{24}$/.test(r.id) ? r.id : undefined,
            sNo: parseInt(r.sNo, 10) || idx + 1,
            date: r.date,
            nameTelugu: r.nameTelugu,
            nameEnglish: r.nameEnglish,
            item: r.item,
            amount: parseFloat(r.amount) || 0,
            initialRemaining: parseFloat(r.initialRemaining || r.amount) || 0,
            isClosed: !!r.isClosed,
            payments: formattedPayments,
          };
        });

        await batchSaveFinanceBookApi({
          ledgerBookId: ledgerBookId && /^[0-9a-fA-F]{24}$/.test(ledgerBookId) ? ledgerBookId : undefined,
          version: ledgerVersion,
          dateColumns,
          rows: formattedRows,
        });
      }
      onShowToast('Borrower details updated successfully! ✏️');
    } catch (err: any) {
      console.warn('Backend update notice:', err);
      onShowToast('Borrower updated in session! 💾');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Add Borrower Modal
  const handleOpenAddBorrower = () => {
    const nextSNo = (rows.length + 1).toString();
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-');
    setNewBorrowerForm({
      sNo: nextSNo,
      date: todayFormatted,
      nameTelugu: '',
      nameEnglish: '',
      item: 'వారపు అప్పు (Weekly Terms)',
      amount: '',
      initialRemaining: '',
      interestRate: '5',
    });
    setShowAddBorrowerModal(true);
  };

  // Submit Add Borrower
  const handleSaveAddBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBorrowerForm.nameTelugu && !newBorrowerForm.nameEnglish) {
      onShowToast('Please enter the customer name in Telugu or English.');
      return;
    }
    setIsSubmitting(true);

    const principalNum = parseFloat(newBorrowerForm.amount.replace(/,/g, '')) || 0;
    const initialDueNum =
      parseFloat(newBorrowerForm.initialRemaining.replace(/,/g, '')) ||
      (principalNum > 0 ? Math.round(principalNum * 1.25) : 0);

    const newId = `row-${Date.now()}`;
    const teName = (newBorrowerForm.nameTelugu || newBorrowerForm.nameEnglish).trim();
    const enName = (newBorrowerForm.nameEnglish || transliterateTeluguToEnglish(teName)).trim();

    const newRow: IndividualLedgerRow = {
      id: newId,
      sNo: newBorrowerForm.sNo || (rows.length + 1).toString(),
      date: newBorrowerForm.date,
      name: teName,
      nameTelugu: teName,
      nameEnglish: enName,
      item: newBorrowerForm.item || 'Weekly Terms',
      amount: newBorrowerForm.amount,
      initialRemaining: String(initialDueNum),
      remaining: String(initialDueNum),
      isClosed: false,
      payments: {},
    };

    const nextRows = [...rows, newRow];
    setRows(nextRows);
    setSelectedBorrowerId(newId);
    setShowAddBorrowerModal(false);

    try {
      if (ledgerBookId && /^[0-9a-fA-F]{24}$/.test(ledgerBookId)) {
        await createBorrowerRowApi({
          ledgerBookId,
          borrowDate: newBorrowerForm.date,
          nameTelugu: teName,
          nameEnglish: enName,
          productItem: newBorrowerForm.item,
          principalAmount: principalNum,
          interestRate: Number(newBorrowerForm.interestRate) || 5,
        });
      }
      onShowToast(`Added borrower "${teName}" to ledger! ➕`);
    } catch (err) {
      console.warn('Backend row creation notice:', err);
      onShowToast(`Added borrower "${teName}" to session! 💾`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // TOGGLE ACCOUNT STATUS (PATCH /api/v1/employee/ledger/borrower/:id/status)
  // -------------------------------------------------------------
  const handleToggleBorrowerStatus = async (borrower: IndividualLedgerRow) => {
    const nextStatus = !borrower.isClosed;
    const { remaining } = calculateBorrowerTotals(borrower);

    if (nextStatus && remaining > 0) {
      const confirmClose = window.confirm(
        `Borrower has an outstanding balance of ₹${remaining.toLocaleString('en-IN')}. Are you sure you want to mark this account as CLOSED?`
      );
      if (!confirmClose) return;
    }

    const updated = rows.map((r) => (r.id === borrower.id ? { ...r, isClosed: nextStatus } : r));
    setRows(updated);

    try {
      // 1. Try dedicated employee scoped status endpoint
      await toggleEmployeeBorrowerStatusApi(borrower.id, nextStatus);
      onShowToast(`Account marked as ${nextStatus ? 'Closed' : 'Active'}! 🔄`);
    } catch (err: any) {
      // 2. Fallback to generic status endpoint or local
      try {
        if (/^[0-9a-fA-F]{24}$/.test(borrower.id)) {
          await updateBorrowerStatusApi(borrower.id, nextStatus);
        }
      } catch {}
      onShowToast(`Account marked as ${nextStatus ? 'Closed' : 'Active'}! 🔄`);
    }
  };

  // Delete Borrower
  const handleDeleteBorrower = async (borrower: IndividualLedgerRow) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete borrower #${borrower.sNo} (${borrower.nameTelugu || borrower.nameEnglish})?`
    );
    if (!confirmDelete) return;

    const filtered = rows.filter((r) => r.id !== borrower.id);
    setRows(filtered);
    if (selectedBorrowerId === borrower.id) {
      setSelectedBorrowerId(null);
    }

    try {
      if (/^[0-9a-fA-F]{24}$/.test(borrower.id)) {
        await deleteBorrowerRowApi(borrower.id);
      }
      onShowToast(`Borrower #${borrower.sNo} removed from ledger. 🗑️`);
    } catch (err) {
      console.warn('Delete borrower notice:', err);
      onShowToast(`Borrower removed from session.`);
    }
  };

  // Open Payment Entry Modal for Borrower
  const handleOpenPayment = (colIdx: number = 0) => {
    if (!activeBorrower) return;
    const existing = activeBorrower.payments[colIdx];
    const defaultDate = existing?.date || dateColumns[colIdx] || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace('/', '-');

    setPaymentForm({
      colIdx,
      date: defaultDate,
      amount: existing?.amount || '',
      paymentType: (existing?.paymentType as any) || 'Cash',
      notes: `Installment #${colIdx + 1} for ${activeBorrower.nameTelugu || activeBorrower.nameEnglish}`,
    });
    setShowPaymentModal(true);
  };

  // -------------------------------------------------------------
  // ATOMIC INSTALLMENT PAYMENT (POST /api/v1/employee/ledger/borrower/:id/payment)
  // -------------------------------------------------------------
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBorrower) return;

    const payNum = parseFloat(paymentForm.amount.replace(/,/g, '')) || 0;
    if (payNum <= 0) {
      onShowToast('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);

    // 1. Optimistic Local update of borrower payments
    const updatedRows = rows.map((r) => {
      if (r.id === activeBorrower.id) {
        const nextPayments = {
          ...r.payments,
          [paymentForm.colIdx]: {
            date: paymentForm.date,
            amount: String(payNum),
            paymentType: paymentForm.paymentType,
          },
        };
        return {
          ...r,
          payments: nextPayments,
        };
      }
      return r;
    });

    setRows(updatedRows);

    // 2. Add to daily collections so cash in hand updates
    const receiptCode = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCollectionRec: CollectionRecord = {
      id: `col-${Date.now()}`,
      receiptNo: receiptCode,
      borrowerId: activeBorrower.id,
      borrowerNameTelugu: activeBorrower.nameTelugu || activeBorrower.name,
      borrowerNameEnglish: activeBorrower.nameEnglish || '',
      borrowerPhone: '',
      village: 'Field Route',
      amount: payNum,
      paymentType: paymentForm.paymentType,
      date: selectedDate,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      collectedBy: employee?.name || 'Field Officer',
      notes: `Installment ${paymentForm.colIdx + 1} (${paymentForm.date})`,
    };

    if (setCollections) {
      setCollections((prev) => [newCollectionRec, ...prev]);
    }

    setShowPaymentModal(false);

    try {
      // 3. Call new atomic installment collection API
      const payRes = await recordEmployeeInstallmentPaymentApi(activeBorrower.id, {
        columnIndex: paymentForm.colIdx,
        paymentDate: paymentForm.date,
        amount: payNum,
        paymentType: paymentForm.paymentType,
        notes: paymentForm.notes || `Installment #${paymentForm.colIdx + 1}`,
      });

      if (payRes?.data) {
        const { remainingBalance, totalPaid, isClosed, receiptNo } = payRes.data;
        setRows((prev) =>
          prev.map((r) =>
            r.id === activeBorrower.id
              ? {
                  ...r,
                  remainingBalance,
                  remaining: remainingBalance !== undefined ? String(remainingBalance) : r.remaining,
                  totalPaid: totalPaid !== undefined ? totalPaid : r.totalPaid,
                  isClosed: isClosed !== undefined ? isClosed : r.isClosed,
                }
              : r
          )
        );

        onShowToast(`Payment recorded! Receipt: ${receiptNo || receiptCode} 💰`);
        return;
      }
    } catch (err: any) {
      console.warn('Atomic payment API note, trying collection fallback:', err?.message);
      // Fallback to recordEmployeeCollectionApi
      try {
        if (/^[0-9a-fA-F]{24}$/.test(activeBorrower.id)) {
          await recordEmployeeCollectionApi({
            borrowerId: activeBorrower.id,
            amount: payNum,
            paymentDate: selectedDate,
            paymentType: paymentForm.paymentType,
          });
        }
      } catch {}
      onShowToast(`Recorded ₹${payNum.toLocaleString('en-IN')} payment (${paymentForm.paymentType})! 💰`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // OPERATING EXPENSES CREATION (POST /api/v1/employee/expenses)
  // -------------------------------------------------------------
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const expNum = parseFloat(expenseForm.amount.replace(/,/g, '')) || 0;
    if (expNum <= 0) {
      onShowToast('Please enter a valid expense amount.');
      return;
    }

    const tempId = `exp-${Date.now()}`;
    const newExp: DailyExpense = {
      id: tempId,
      date: selectedDate,
      category: expenseForm.category,
      amount: expNum,
      description: expenseForm.description || `${expenseForm.category} operating cost`,
      paidBy: employee?.name || 'Field Officer',
      receiptNumber: expenseForm.receiptNumber || undefined,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);
    setShowAddExpenseModal(false);

    try {
      const res = await createEmployeeExpenseApi({
        date: selectedDate,
        category: expenseForm.category,
        amount: expNum,
        description: expenseForm.description,
        receiptNumber: expenseForm.receiptNumber,
      });

      if (res?.data?.id || res?.data?._id) {
        const serverId = res.data.id || res.data._id;
        setExpenses((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, id: serverId } : e))
        );
      }
      onShowToast(`Logged expense ₹${expNum.toLocaleString('en-IN')} for ${expenseForm.category}! 🧾`);
    } catch (err: any) {
      console.warn('Backend expense create notice:', err?.message);
      onShowToast(`Logged expense ₹${expNum.toLocaleString('en-IN')} in session! 🧾`);
    } finally {
      setExpenseForm({
        category: 'Fuel/Petrol',
        amount: '',
        description: '',
        receiptNumber: '',
      });
    }
  };

  // -------------------------------------------------------------
  // OPERATING EXPENSES REMOVAL (DELETE /api/v1/employee/expenses/:id)
  // -------------------------------------------------------------
  const handleDeleteExpense = async (expId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expId));

    try {
      await deleteEmployeeExpenseApi(expId);
      onShowToast('Expense entry removed from cloud database.');
    } catch (err: any) {
      console.warn('Backend delete expense notice:', err?.message);
      onShowToast('Expense entry removed.');
    }
  };

  // Export Daily Settlement Sheet to Excel
  const handleExportDailySettlement = () => {
    try {
      const summaryAoa = [
        ['KN FINANCE - DAILY OPERATIONS SETTLEMENT REPORT (రోజువారీ లెక్కల నివేదిక)'],
        [`Date of Audit: ${selectedDate}`, `Officer: ${employee?.name || 'Field Officer'}`],
        [`Route: ${employee?.assignedOperationalArea || 'Sector North'}`],
        [],
        ['RECONCILIATION SUMMARY', 'AMOUNT (₹)'],
        ['Total Collections Recorded', totalCollections],
        ['Cash Collected', cashCollections],
        ['UPI Collected', upiCollections],
        ['Total Daily Expenses Deducted', totalExpenses],
        ['NET CASH IN HAND / REMAINING MONEY', remainingCashInHand],
        [],
        ['CUSTOMER LIFECYCLE ON DATE', 'COUNT'],
        ['New Customers Added', newCustomersOnDate.length],
        ['Borrower Accounts Cleared & Closed', closedAccountsOnDate.length],
        [],
        ['EXPENSES BREAKDOWN'],
        ['ID', 'Category', 'Description', 'Bill/Receipt #', 'Amount (₹)'],
      ];

      dateExpenses.forEach((exp) => {
        summaryAoa.push([
          exp.id,
          exp.category,
          exp.description,
          exp.receiptNumber || '—',
          exp.amount.toString(),
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(summaryAoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Settlement');
      XLSX.writeFile(wb, `KN_Daily_Settlement_${selectedDate}.xlsx`);
      onShowToast(`Exported Daily Settlement for ${selectedDate} to Excel! 📊`);
    } catch {
      onShowToast('Failed to export daily settlement sheet.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .telugu-font {
          font-family: 'Noto Serif Telugu', 'Noto Sans Telugu', serif;
        }
      `,
        }}
      />

      {/* 1. Header Banner & Settlement Date Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Secure Field Operations
              </span>
              <span className="text-xs text-slate-500 font-semibold">• రోజువారీ ఖర్చులు, వసూళ్లు & ఖాతాదారుల నిర్వహణ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Daily Settlement & Targeted Borrower Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Search any borrower by S.No, Name, or Product to inspect and modify their ledger record securely without exposing the entire branch book. Reconcile daily cash and log field expenses below.
            </p>
          </div>

          {/* Date Picker & Action Controls */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* Previous Day */}
            <button
              onClick={() => handleDateShift(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Date Input */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-[#166534]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-slate-900 font-bold"
              />
            </div>

            {/* Next Day */}
            <button
              onClick={() => handleDateShift(1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Today Button */}
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#166534] hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Today
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportDailySettlement}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="Export Day Settlement to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export</span>
            </button>

            {/* Sync Cloud */}
            <button
              onClick={fetchActiveLedger}
              disabled={isSyncingLedger}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-60"
              title={lastSyncTime ? `Synced: ${lastSyncTime}` : 'Sync with Database'}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingLedger ? 'animate-spin text-[#166534]' : 'text-slate-500'}`} />
            </button>
          </div>
        </div>

        {/* 2. Top Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Total Collections */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">మొత్తం వసూలు (Collections)</div>
            <div className="text-lg font-extrabold text-[#166534] mt-0.5">
              ₹{totalCollections.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-semibold mt-1">
              <span className="text-emerald-700 font-bold">Cash: ₹{cashCollections.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="text-sky-700 font-bold">UPI: ₹{upiCollections.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">రోజు ఖర్చులు (Expenses)</div>
            <div className="text-lg font-extrabold text-amber-700 mt-0.5">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-[10.5px] text-slate-500 font-medium mt-1">
              {dateExpenses.length} expense entries logged
            </div>
          </div>

          {/* Net Cash in Hand */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">చేతిలో నికర నగదు (Cash in Hand)</div>
            <div className="text-lg font-extrabold text-emerald-950 mt-0.5">
              ₹{remainingCashInHand.toLocaleString('en-IN')}
            </div>
            <div className="text-[10.5px] text-emerald-800 font-medium mt-1">
              Cash (₹{cashCollections}) - Exp (₹{totalExpenses})
            </div>
          </div>

          {/* Active Accounts on Book */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ఖాతాదారుల సంఖ్య (Borrowers)</div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {rows.length} <span className="text-xs font-semibold text-slate-400">Total</span>
            </div>
            <div className="text-[10.5px] text-slate-500 font-medium mt-1">
              {rows.filter((r) => !r.isClosed).length} Active • {rows.filter((r) => r.isClosed).length} Closed
            </div>
          </div>
        </div>
      </div>

      {/* 3. TARGETED BORROWER SEARCH & SECURE CRUD CONSOLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        {/* Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                వ్యక్తిగత ఖాతా శోధన & నిర్వహణ (Individual Person Search & CRUD)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Type S.No, Name (తెలుగు / English), or Product Item to query the server and open their individual ledger card.
            </p>
          </div>

          {/* Add New Borrower Button */}
          <button
            onClick={handleOpenAddBorrower}
            className="h-9 px-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-[#166534] hover:from-emerald-700 hover:to-[#14532d] text-white shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>కొత్త ఆసామిని చేర్చండి (Add Borrower)</span>
          </button>
        </div>

        {/* Search Bar Input & Filter */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Main Search Input with live search spinner */}
          <div className="relative flex-1 w-full">
            {isSearchingServer ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by S.No (1, 2..), Name (రాజేష్ / Rajesh), లేదా వస్తువు (గాజులు)..."
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-[13px] bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 rounded-xl text-slate-900 placeholder-slate-400 transition-all outline-none font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setServerSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-stretch md:self-auto justify-center">
            {(['All', 'Active', 'Closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Autocomplete / Suggestions Dropdown List */}
        {searchTerm.trim() && (
          <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50/50 max-h-60 overflow-y-auto space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Borrowers ({unifiedSearchResults.length})
              </span>
              {isSearchingServer && (
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Querying Server...
                </span>
              )}
            </div>

            {unifiedSearchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No borrower matching &quot;{searchTerm}&quot; found. Click &quot;Add Borrower&quot; to create a new record.
              </div>
            ) : (
              unifiedSearchResults.slice(0, 15).map((b) => {
                const { remaining, totalPaid } = calculateBorrowerTotals(b);
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBorrower(b.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#166534] font-bold text-xs flex items-center justify-center shrink-0">
                        #{b.sNo}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 telugu-font">
                          {b.nameTelugu || b.name}
                          {b.nameEnglish && (
                            <span className="text-[11px] text-slate-500 font-normal ml-1.5">
                              ({b.nameEnglish})
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                          {b.item} • Principal: ₹{Number(b.amount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-xs font-extrabold text-rose-700">
                          ₹{remaining.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">due</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Paid: ₹{totalPaid.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#166534] transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* 4. ACTIVE SELECTED BORROWER DOSSIER & LEDGER SPREAD */}
        {activeBorrower ? (
          <div className="rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-50/30 via-white to-amber-50/20 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200 relative">
            {isLoadingDossier && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs rounded-2xl flex items-center justify-center z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-emerald-200 text-xs font-bold text-emerald-900">
                  <Loader2 className="w-4 h-4 animate-spin text-[#166534]" />
                  <span>Loading full borrower dossier...</span>
                </div>
              </div>
            )}

            {/* Top Toolbar for Active Borrower */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#166534] text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                  #{activeBorrower.sNo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 telugu-font">
                      {activeBorrower.nameTelugu || activeBorrower.name}
                    </h4>
                    {activeBorrower.nameEnglish && (
                      <span className="text-xs font-semibold text-slate-600">
                        ({activeBorrower.nameEnglish})
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        activeBorrower.isClosed
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {activeBorrower.isClosed ? 'Closed (ముగిసింది)' : 'Active (వసూలులో)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                    <span>Borrow Date: <strong className="text-slate-800">{activeBorrower.date}</strong></span>
                    <span>•</span>
                    <span>Product Item: <strong className="text-slate-800">{activeBorrower.item}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for this person */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Record Payment Button */}
                <button
                  onClick={() => handleOpenPayment(0)}
                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all cursor-pointer"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>వసూలు నమోదు (Record Pay)</span>
                </button>

                {/* Edit Details */}
                <button
                  onClick={() => handleOpenEdit(activeBorrower)}
                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                  title="Edit borrower details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>సవరించండి (Edit)</span>
                </button>

                {/* Close/Reopen Account */}
                <button
                  onClick={() => handleToggleBorrowerStatus(activeBorrower)}
                  className={`h-8 px-2.5 inline-flex items-center justify-center gap-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    activeBorrower.isClosed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                  title="Toggle active / closed status"
                >
                  {activeBorrower.isClosed ? 'Reopen' : 'Close'}
                </button>

                {/* Delete Account */}
                <button
                  onClick={() => handleDeleteBorrower(activeBorrower)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete borrower row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Clear Active Selection */}
                <button
                  onClick={() => setSelectedBorrowerId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close borrower card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Financial Balance Breakdown */}
            {(() => {
              const { totalPaid, remaining, target, principal } = calculateBorrowerTotals(activeBorrower);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">అప్పు సొమ్ము (Principal)</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      ₹{principal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">మొత్తం బాకీ (Target Due)</div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      ₹{target.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider">చెల్లించినది (Paid)</div>
                    <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold text-rose-700 uppercase tracking-wider">మిగిలిన బాకీ (Remaining)</div>
                    <div className="text-base font-extrabold text-rose-700 mt-0.5">
                      ₹{remaining.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Installments Ledger Spread for this Borrower */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#166534]" />
                  <span>వాయిదాల వివరాలు (Weekly Installment Columns & Payments)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Click any installment cell to log or modify payment
                </span>
              </div>

              {/* Installment Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {dateColumns.map((colDate, colIdx) => {
                  const pay = activeBorrower.payments[colIdx];
                  const hasPay = Boolean(pay && (pay.amount || pay.date));

                  return (
                    <div
                      key={colIdx}
                      onClick={() => handleOpenPayment(colIdx)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer group ${
                        hasPay
                          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-extrabold text-slate-800">
                        వా. {colIdx + 1}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        {pay?.date || colDate}
                      </div>

                      <div className="mt-1 pt-1 border-t border-slate-100">
                        {hasPay ? (
                          <>
                            <div className="text-xs font-extrabold text-[#166534]">
                              ₹{Number(pay?.amount || 0).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {pay?.paymentType || 'Cash'}
                            </span>
                          </>
                        ) : (
                          <div className="text-xs text-slate-300 font-medium group-hover:text-emerald-700">
                            + Add ₹
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* When no borrower is actively open: Prompt / Popular Borrowers Chips */
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#166534] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                వ్యక్తిగత ఖాతాను శోధించండి (Search a Borrower to Manage)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
                No borrower card opened. Search above by S.No, Name, or Product to inspect and record payments, or click any account below:
              </p>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 max-w-xl mx-auto">
              {rows.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBorrower(b.id)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="text-[#166534] font-bold">#{b.sNo}</span>
                  <span className="telugu-font">{b.nameTelugu || b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. DAILY OPERATING EXPENSES SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ఫీల్డ్ ఖర్చులు & రోజువారీ నివేదిక (Daily Operating Expenses for {selectedDate})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Log fuel, tea, vehicle maintenance, and route costs to synchronize with cloud database and deduct from total collections.
            </p>
          </div>

          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="h-9 px-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ఖర్చు నమోదు (Log Expense)</span>
          </button>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">విభాగం (Category)</th>
                <th className="py-2.5 px-3">వివరణ (Description)</th>
                <th className="py-2.5 px-3">బిల్ సంఖ్య (Receipt #)</th>
                <th className="py-2.5 px-3 text-right">సొమ్ము (Amount ₹)</th>
                <th className="py-2.5 px-3 text-center w-16">చర్య (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dateExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-slate-400 font-medium">
                    ఈ తేదీన ఎటువంటి ఖర్చులు నమోదు చేయబడలేదు (No operating expenses logged for {selectedDate}).
                  </td>
                </tr>
              ) : (
                dateExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {exp.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {exp.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {exp.receiptNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-amber-800 font-mono">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete expense entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {dateExpenses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/50 font-bold text-slate-900">
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[10px] text-slate-500">
                    మొత్తం ఖర్చులు (Total Expenses):
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-amber-900 font-mono">
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW BORROWER (కొత్త ఆసామిని చేర్చండి)              */}
      {/* ============================================================== */}
      {showAddBorrowerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 telugu-font">
                  కొత్త ఆసామిని చేర్చండి (Add New Borrower)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign serial number, name in Telugu/English, and loan amount.
                </p>
              </div>
              <button
                onClick={() => setShowAddBorrowerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddBorrower} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* S.No */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    వరుస సంఖ్య (S.No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBorrowerForm.sNo}
                    onChange={(e) => setNewBorrowerForm({ ...newBorrowerForm, sNo: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534] font-bold"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    తేది (Date DD-MM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBorrowerForm.date}
                    onChange={(e) => setNewBorrowerForm({ ...newBorrowerForm, date: e.target.value })}
                    placeholder="DD-MM"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534] font-mono"
                  />
                </div>
              </div>

              {/* Telugu Name with Live Transliteration */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ఆసామి పేరు (తెలుగు) *
                </label>
                <input
                  type="text"
                  required
                  value={newBorrowerForm.nameTelugu}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoEn = transliterateTeluguToEnglish(val);
                    setNewBorrowerForm({
                      ...newBorrowerForm,
                      nameTelugu: val,
                      nameEnglish: autoEn || newBorrowerForm.nameEnglish,
                    });
                  }}
                  placeholder="ఉదా: కృష్ణారావు"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534] font-bold telugu-font"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Customer Name (English)
                </label>
                <input
                  type="text"
                  value={newBorrowerForm.nameEnglish}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoTe = transliterateEnglishToTelugu(val);
                    setNewBorrowerForm({
                      ...newBorrowerForm,
                      nameEnglish: val,
                      nameTelugu: newBorrowerForm.nameTelugu || autoTe,
                    });
                  }}
                  placeholder="e.g. Krishna Rao"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534]"
                />
              </div>

              {/* Product Item */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  వస్తువు / వివరాలు (Product Item)
                </label>
                <input
                  type="text"
                  value={newBorrowerForm.item}
                  onChange={(e) => setNewBorrowerForm({ ...newBorrowerForm, item: e.target.value })}
                  placeholder="వారపు అప్పు, బంగారం, మొదలైనవి"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534]"
                />
              </div>

              {/* Principal Amount & Target Due */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    అప్పు సొమ్ము (Principal ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newBorrowerForm.amount}
                    onChange={(e) => {
                      const amt = e.target.value;
                      const num = parseFloat(amt) || 0;
                      const autoTarget = num > 0 ? Math.round(num * 1.25).toString() : '';
                      setNewBorrowerForm({
                        ...newBorrowerForm,
                        amount: amt,
                        initialRemaining: autoTarget,
                      });
                    }}
                    placeholder="10000"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534] font-bold font-mono text-[#166534]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    మొత్తం బాకీ (Target Due ₹)
                  </label>
                  <input
                    type="number"
                    value={newBorrowerForm.initialRemaining}
                    onChange={(e) => setNewBorrowerForm({ ...newBorrowerForm, initialRemaining: e.target.value })}
                    placeholder="12500"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#166534] font-bold font-mono text-rose-700"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBorrowerModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'చేర్చండి (Save Borrower)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT BORROWER DETAILS (ఆసామి వివరాలు సవరించండి)         */}
      {/* ============================================================== */}
      {showEditBorrowerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 telugu-font">
                  వివరాలు సవరించండి (Edit Borrower #{editBorrowerForm.sNo})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update customer details, loan target balance, or closure status.
                </p>
              </div>
              <button
                onClick={() => setShowEditBorrowerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBorrower} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    S.No *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBorrowerForm.sNo}
                    onChange={(e) => setEditBorrowerForm({ ...editBorrowerForm, sNo: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Date (DD-MM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBorrowerForm.date}
                    onChange={(e) => setEditBorrowerForm({ ...editBorrowerForm, date: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ఆసామి పేరు (తెలుగు) *
                </label>
                <input
                  type="text"
                  required
                  value={editBorrowerForm.nameTelugu}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditBorrowerForm({
                      ...editBorrowerForm,
                      nameTelugu: val,
                      nameEnglish: transliterateTeluguToEnglish(val) || editBorrowerForm.nameEnglish,
                    });
                  }}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold telugu-font"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Customer Name (English)
                </label>
                <input
                  type="text"
                  value={editBorrowerForm.nameEnglish}
                  onChange={(e) => setEditBorrowerForm({ ...editBorrowerForm, nameEnglish: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Product Item
                </label>
                <input
                  type="text"
                  value={editBorrowerForm.item}
                  onChange={(e) => setEditBorrowerForm({ ...editBorrowerForm, item: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Principal Amount ₹
                  </label>
                  <input
                    type="number"
                    value={editBorrowerForm.amount}
                    onChange={(e) => setEditBorrowerForm({ ...editBorrowerForm, amount: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[#166534]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Target Due ₹
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(editBorrowerForm.initialRemaining || editBorrowerForm.amount || '0') || 0;
                        setEditBorrowerForm({
                          ...editBorrowerForm,
                          initialRemaining: Math.round(cur * 1.05).toString(),
                        });
                      }}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                    >
                      +5% Interest
                    </button>
                  </div>
                  <input
                    type="number"
                    value={editBorrowerForm.initialRemaining}
                    onChange={(e) => setEditBorrowerForm({ ...editBorrowerForm, initialRemaining: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBorrowerModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'నవీకరించండి (Save Changes)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RECORD REPAYMENT (వాయిదా వసూలు నమోదు)                 */}
      {/* ============================================================== */}
      {showPaymentModal && activeBorrower && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 telugu-font">
                  వాయిదా వసూలు నమోదు (Record Installment Payment)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  #{activeBorrower.sNo} {activeBorrower.nameTelugu || activeBorrower.nameEnglish}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              {/* Installment Column Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  వాయిదా కాలమ్ (Installment Column)
                </label>
                <select
                  value={paymentForm.colIdx}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    const existing = activeBorrower.payments[idx];
                    setPaymentForm({
                      ...paymentForm,
                      colIdx: idx,
                      date: existing?.date || dateColumns[idx] || paymentForm.date,
                      amount: existing?.amount || paymentForm.amount,
                    });
                  }}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  {dateColumns.map((col, idx) => (
                    <option key={idx} value={idx}>
                      వాయిదా {idx + 1} ({col})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Date & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    తేది (Date DD-MM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    వసూలు సొమ్ము (Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="500"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-extrabold text-[#166534] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Payment Mode Toggle (Cash / UPI) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  చెల్లింపు విధానం (Payment Mode)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'Cash' })}
                    className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      paymentForm.paymentType === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Cash (నగదు)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'UPI' })}
                    className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      paymentForm.paymentType === 'UPI'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>UPI (PhonePe / GPay)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Recording...' : 'వసూలు నమోదు చేయండి (Record)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ADD OPERATING EXPENSE (ఖర్చు నమోదు)                  */}
      {/* ============================================================== */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  ఫీల్డ్ ఖర్చు నమోదు (Log Operating Expense)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deducted from daily collections for {selectedDate}.
                </p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  విభాగం (Expense Category) *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  <option value="Fuel/Petrol">Fuel / Petrol (బైక్ పెట్రోల్)</option>
                  <option value="Food & Tea">Food & Tea (టిఫిన్ & టీ)</option>
                  <option value="Travel/Vehicle">Vehicle Maintenance / Repair</option>
                  <option value="Mobile Recharge">Mobile Recharge</option>
                  <option value="Stationery">Stationery & Printing</option>
                  <option value="Miscellaneous">Miscellaneous (ఇతర ఖర్చులు)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  సొమ్ము (Amount ₹) *
                </label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="150"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-extrabold text-amber-800 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  వివరణ (Description)
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Rampur route bike petrol"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  బిల్ సంఖ్య (Receipt / Bill #)
                </label>
                <input
                  type="text"
                  value={expenseForm.receiptNumber}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                  placeholder="HP-4091"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  ఖర్చు నమోదు (Log Expense)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
