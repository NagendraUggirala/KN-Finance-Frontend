import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  Trash2, 
  FileSpreadsheet, 
  Download 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, FinanceRecord } from '../types';
import {
  transliterateEnglishToTelugu,
  transliterateTeluguToEnglish,
  isTeluguText
} from './transliterate';

interface FinanceBookProps {
  records: FinanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  employees: Employee[];
  userName: string;
  onShowToast: (msg: string) => void;
}

export interface LedgerPayment {
  date: string;
  amount: string;
}

interface LedgerRowData {
  id: string;
  date: string; // Borrow Date
  sNo: string;
  name: string; // primary display name
  nameTelugu: string; // Telugu script name
  nameEnglish: string; // English script name
  item: string;
  amount: string;
  payments: { [key: number]: LedgerPayment };
  initialRemaining?: string;
  remaining?: string;
  isClosed?: boolean;
}

export const FinanceBook: React.FC<FinanceBookProps> = ({
  records,
  setRecords,
  userName,
  onShowToast,
}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Symmetrical Date / Installment Columns (headers editable manually, dynamically expandable)
  const [dateColumns, setDateColumns] = useState<string[]>(['08-08']);

  // master rows in state
  const [rows, setRows] = useState<LedgerRowData[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempRows, setTempRows] = useState<LedgerRowData[]>([]);
  const [tempDateColumns, setTempDateColumns] = useState<string[]>([]);

  // Helper variables for reading vs editing
  const currentRows = isEditing ? tempRows : rows;
  const currentDateColumns = isEditing ? tempDateColumns : dateColumns;

  const leftPageCount = Math.ceil(currentDateColumns.length / 2);
  const rightPageCount = currentDateColumns.length - leftPageCount;

  // Accommodate dual Telugu & English name columns on the left page
  const leftPageWidth = 535 + leftPageCount * 88;
  const rightPageWidth = 380 + rightPageCount * 88; // Expanded to accommodate Status column
  const bookSpreadWidth = leftPageWidth + rightPageWidth;

  // Safe payment getter for row and colIdx
  const getPayment = (row: LedgerRowData, colIdx: number): LedgerPayment => {
    const p = row.payments?.[colIdx];
    if (!p) return { date: '', amount: '' };
    if (typeof p === 'object' && p !== null) return { date: p.date || '', amount: p.amount || '' };
    return { date: '', amount: String(p || '') };
  };

  // Start Edit Session
  const handleStartEdit = () => {
    setTempRows(JSON.parse(JSON.stringify(rows)));
    setTempDateColumns([...dateColumns]);
    setIsEditing(true);
  };

  // Save Edit Changes
  const handleSave = () => {
    setRows(tempRows);
    setDateColumns(tempDateColumns);
    setIsEditing(false);
    onShowToast('Ledger changes saved successfully!');
  };

  // Cancel Edit Session
  const handleCancel = () => {
    setIsEditing(false);
    onShowToast('Edit cancelled.');
  };

  // Toggle Row Closed Status
  const handleToggleClosed = (rowId: string) => {
    if (!isEditing) return;
    const updated = tempRows.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          isClosed: !r.isClosed
        };
      }
      return r;
    });
    setTempRows(updated);
  };

  // Add new date column
  const handleAddColumn = () => {
    if (!isEditing) return;
    let newDate = '15-08'; // default fallback
    if (tempDateColumns.length > 0) {
      const lastDate = tempDateColumns[tempDateColumns.length - 1];
      const match = lastDate.match(/^(\d{2})-(\d{2})$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);

        // Add 7 days to the last date (since they are weekly columns)
        const d = new Date(2026, month - 1, day + 7);
        const nextDay = String(d.getDate()).padStart(2, '0');
        const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
        newDate = `${nextDay}-${nextMonth}`;
      } else {
        newDate = `వాయిదా ${tempDateColumns.length + 1}`;
      }
    }
    setTempDateColumns([...tempDateColumns, newDate]);
    onShowToast(`Added Installment column.`);
  };

  // Delete date column
  const handleDeleteColumn = (colIdx: number) => {
    if (!isEditing) return;
    const updatedCols = tempDateColumns.filter((_, idx) => idx !== colIdx);

    // Update payments for each row:
    // - Delete payment at colIdx
    // - Shift keys > colIdx to key - 1
    const updatedRows = tempRows.map(row => {
      const newPayments: { [key: number]: LedgerPayment } = {};
      Object.entries(row.payments || {}).forEach(([kStr, val]) => {
        const k = parseInt(kStr);
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
    onShowToast('Date column removed.');
  };

  // Focus reference coordinates
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);

  // Dynamically load Google Font for Telugu if not present
  useEffect(() => {
    const fontId = 'google-telugu-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&family=Noto+Serif+Telugu:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Initialize ledger rows & date columns from database records
  useEffect(() => {
    // Strictly start with exactly one date column
    const initialDates = ['08-08'];
    setDateColumns(initialDates);

    // Initialize active rows list with Telugu & English names
    const activeList: LedgerRowData[] = [];

    const sampleData: {
      date: string;
      nameTelugu: string;
      nameEnglish: string;
      item: string;
      amount: string;
      payments: { [key: number]: LedgerPayment };
    }[] = [
        {
          date: '03-08',
          nameTelugu: 'కృష్ణారావు',
          nameEnglish: 'Krishna Rao',
          item: 'బంగారు గాజులు',
          amount: '15000',
          payments: { 0: { date: '08-08', amount: '500' } }
        },
        {
          date: '05-08',
          nameTelugu: 'సత్యనారాయణ',
          nameEnglish: 'Satyanarayana',
          item: 'వెండి చైన్',
          amount: '8000',
          payments: { 0: { date: '10-08', amount: '200' } }
        },
        {
          date: '12-08',
          nameTelugu: 'పద్మావతి',
          nameEnglish: 'Padmavathi',
          item: 'బంగారు రింగు',
          amount: '25000',
          payments: { 0: { date: '08-08', amount: '1000' } }
        },
        {
          date: '18-08',
          nameTelugu: 'రామచంద్రుడు',
          nameEnglish: 'Ramachandrudu',
          item: 'నల్లపూసలు',
          amount: '12000',
          payments: { 0: { date: '09-08', amount: '300' } }
        },
        {
          date: '22-08',
          nameTelugu: 'వెంకటరమణ',
          nameEnglish: 'Venkataramana',
          item: 'వెండి గిన్నెలు',
          amount: '6000',
          payments: { 0: { date: '11-08', amount: '200' } }
        }
      ];

    sampleData.forEach((sample, index) => {
      activeList.push({
        id: `row-${index}-${Date.now()}-${Math.random()}`,
        date: sample.date,
        sNo: (index + 1).toString(),
        name: sample.nameTelugu,
        nameTelugu: sample.nameTelugu,
        nameEnglish: sample.nameEnglish,
        item: sample.item,
        amount: sample.amount,
        initialRemaining: sample.amount,
        payments: { ...sample.payments },
        isClosed: false
      });
    });

    // Match database records starts
    if (records && records.length > 0) {
      records.forEach((rec, index) => {
        const targetSNo = activeList.length + 1;
        const [, , dayStr] = rec.startDate.split('-');

        const rowPayments: { [key: number]: LedgerPayment } = {};
        if (rec.payments && rec.payments.length > 0) {
          rec.payments.forEach((pay, pIdx) => {
            const parts = pay.date ? pay.date.split('-') : [];
            let dayMonth = '';
            if (parts.length >= 3) {
              dayMonth = `${parts[2]}-${parts[1]}`;
            }
            rowPayments[pIdx] = {
              date: dayMonth || '08-08',
              amount: pay.amount ? pay.amount.toString() : ''
            };
          });
        }

        const recName = rec.name || '';
        let teName = '';
        let enName = '';
        if (isTeluguText(recName)) {
          teName = recName;
          enName = transliterateTeluguToEnglish(recName);
        } else {
          enName = recName;
          teName = transliterateEnglishToTelugu(recName);
        }

        activeList.push({
          id: `row-db-${rec.sNo}-${Date.now()}-${index}`,
          date: dayStr ? `${dayStr}-08` : '',
          sNo: targetSNo.toString(),
          name: teName || enName,
          nameTelugu: teName,
          nameEnglish: enName,
          item: `${rec.paymentProcess} Terms`,
          amount: rec.principalAmount.toString(),
          initialRemaining: rec.totalWithInterest.toString(),
          payments: rowPayments,
          isClosed: rec.isClosed || false
        });
      });
    }

    setRows(activeList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync back to parent records
  useEffect(() => {
    if (rows.length === 0) return;

    const updatedRecords: FinanceRecord[] = rows.map((row, index) => {
      const isDbRecord = row.id.startsWith('row-db-');
      const originalSNo = isDbRecord
        ? parseInt(row.id.split('-')[2])
        : index + 1;

      // Extract payments list
      const paymentsList = Object.entries(row.payments || {}).map(([colIdxStr, payVal]) => {
        const colIdx = parseInt(colIdxStr);
        const payObj: LedgerPayment = typeof payVal === 'object' && payVal !== null
          ? payVal
          : { date: dateColumns[colIdx] || '08-08', amount: String(payVal || '') };

        const amtNum = parseFloat((payObj.amount || '').replace(/,/g, '')) || 0;
        const dateStr = payObj.date || dateColumns[colIdx] || '08-08';
        const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
        const day = (parts[0] || '08').padStart(2, '0');
        const month = (parts[1] || '08').padStart(2, '0');

        return {
          id: `pay-${originalSNo}-${colIdx}`,
          date: `2026-${month}-${day}`, // format as YYYY-MM-DD
          amount: amtNum,
          paymentType: 'Cash' as const,
          collectedBy: userName || 'Admin'
        };
      }).filter(p => p.amount > 0);

      const principal = parseFloat(row.amount.replace(/,/g, '')) || 0;

      let target = principal;
      if (row.initialRemaining !== undefined && row.initialRemaining !== '') {
        target = parseFloat(row.initialRemaining.replace(/,/g, '')) || 0;
      }

      const interestRate = principal > 0 ? Math.round(((target - principal) / principal) * 100) : 0;

      return {
        sNo: originalSNo,
        id: isDbRecord ? `FIN-${5500 + originalSNo}` : `FIN-NEW-${index}`,
        name: row.nameTelugu || row.nameEnglish || row.name,
        referenceName: row.nameEnglish || '',
        phone: '',
        startDate: `2026-08-${row.date.split('-')[0] || '01'}`,
        endDate: '2026-11-01',
        principalAmount: principal,
        interestRate: interestRate,
        totalWithInterest: target,
        paymentProcess: 'Weekly' as const,
        payments: paymentsList,
        expectedDate: '2026-11-01',
        isClosed: row.isClosed || false
      };
    });

    setRecords(updatedRecords);
  }, [rows, dateColumns, setRecords, userName]);

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
          const defaultInitialRemaining = numVal > 0 ? Math.round(numVal * 1.2 * 1.05).toString() : '';
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

  // Add row inside table
  const handleAddRow = () => {
    if (!isEditing) return;
    const nextSNo = tempRows.length + 1;
    const newRow: LedgerRowData = {
      id: `row-${nextSNo}-${Date.now()}`,
      date: '',
      sNo: nextSNo.toString(),
      name: '',
      nameTelugu: '',
      nameEnglish: '',
      item: '',
      amount: '',
      payments: {},
      isClosed: false
    };
    setTempRows([...tempRows, newRow]);
  };

  // Delete row inside table
  const handleDeleteRow = (rowId: string) => {
    if (!isEditing) return;
    const updatedRows = tempRows.filter(r => r.id !== rowId).map((r, index) => ({
      ...r,
      sNo: (index + 1).toString()
    }));
    setTempRows(updatedRows);
    onShowToast('Person removed.');
  };

  // Print ledger handler
  const handlePrint = () => {
    window.print();
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
    const remaining = target - totalPaid;
    return { totalPaid, remaining, target, amount };
  };

  // Filtered rows matching Name (Telugu/English), S.No, or Date
  const filteredRows = currentRows.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (row.nameTelugu || '').toLowerCase().includes(term) ||
      (row.nameEnglish || '').toLowerCase().includes(term) ||
      (row.name || '').toLowerCase().includes(term) ||
      (row.sNo || '').toLowerCase().includes(term) ||
      (row.date || '').toLowerCase().includes(term) ||
      (row.item || '').toLowerCase().includes(term)
    );
  });

  // Export Finance Book to genuine Excel spreadsheet (.xlsx)
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredRows.length > 0 ? filteredRows : currentRows;
      if (dataToExport.length === 0) {
        onShowToast('No ledger records available to export.');
        return;
      }

      // 1. Build Header Matrix
      const headers: string[] = [
        'S.No (వ.సం.)',
        'Borrow Date (తేది)',
        'Telugu Name (ఆసామి పేరు - తెలుగు)',
        'English Name (పేరు - English)',
        'Product / Item (వస్తువు)',
        'Principal Amount (సొమ్ము ₹)',
      ];

      // Add dynamic installment headers
      currentDateColumns.forEach((dateHeader, idx) => {
        headers.push(`Installment ${idx + 1} (${dateHeader}) Date`);
        headers.push(`Installment ${idx + 1} (${dateHeader}) Amount (₹)`);
      });

      headers.push('Total Paid (మొత్తం వసూలు ₹)');
      headers.push('Remaining Balance (బాకీ సొమ్ము ₹)');
      headers.push('Status (ముగింపు)');

      // 2. Build Data Rows & Accumulate Column Sums
      let grandTotalPrincipal = 0;
      const installmentTotals: number[] = new Array(currentDateColumns.length).fill(0);
      let grandTotalPaid = 0;
      let grandTotalRemaining = 0;

      const rowsData: any[][] = [];

      dataToExport.forEach((row) => {
        const { totalPaid, remaining, amount } = getRowTotals(row);
        grandTotalPrincipal += amount;
        grandTotalPaid += totalPaid;
        grandTotalRemaining += remaining;

        const rowValues: any[] = [
          parseInt(row.sNo) || row.sNo,
          row.date || '',
          row.nameTelugu || row.name || '',
          row.nameEnglish || '',
          row.item || '',
          amount,
        ];

        // Fill installment date & amount
        currentDateColumns.forEach((_, colIdx) => {
          const pay = getPayment(row, colIdx);
          const payAmt = parseFloat((pay.amount || '').replace(/,/g, '')) || 0;
          installmentTotals[colIdx] += payAmt;
          rowValues.push(pay.date || '');
          rowValues.push(payAmt > 0 ? payAmt : (pay.amount ? pay.amount : ''));
        });

        rowValues.push(totalPaid);
        rowValues.push(remaining);
        rowValues.push(row.isClosed ? 'Closed' : 'Active');

        rowsData.push(rowValues);
      });

      // 3. Build Summary/Totals Row
      const totalsRow: any[] = [
        'TOTAL / మొత్తం',
        '',
        '',
        '',
        `${dataToExport.length} Borrowers`,
        grandTotalPrincipal,
      ];

      currentDateColumns.forEach((_, colIdx) => {
        totalsRow.push('');
        totalsRow.push(installmentTotals[colIdx]);
      });

      totalsRow.push(grandTotalPaid);
      totalsRow.push(grandTotalRemaining);
      totalsRow.push('');

      // 4. Combine into final sheet matrix
      const titleRow = ['KN FINANCE - FINANCE BOOK LEDGER (శాఖ లెడ్జర్ రికార్డులు)'];
      const subTitleRow = [
        `Generated: ${new Date().toLocaleDateString('en-IN')} | Operator: ${userName || 'Admin'} | Total Records: ${dataToExport.length}`
      ];
      const emptyRow: any[] = [];

      const fullMatrix = [
        titleRow,
        subTitleRow,
        emptyRow,
        headers,
        ...rowsData,
        emptyRow,
        totalsRow
      ];

      // 5. Create worksheet & calculate column widths
      const ws = XLSX.utils.aoa_to_sheet(fullMatrix);

      // Auto-fit column widths
      const colWidths = headers.map((h, colIndex) => {
        let maxLen = h.length;
        fullMatrix.forEach((r) => {
          if (r && r[colIndex] !== undefined && r[colIndex] !== null) {
            const cellLen = String(r[colIndex]).length;
            if (cellLen > maxLen) maxLen = cellLen;
          }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });
      ws['!cols'] = colWidths;

      // 6. Create Workbook & Download
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Finance Ledger');

      const dateStamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `KN_Finance_Book_Ledger_${dateStamp}.xlsx`);

      onShowToast(`Excel sheet exported successfully! (${dataToExport.length} records) 📊`);
    } catch (err) {
      console.error('Failed to export Excel file:', err);
      onShowToast('Error exporting Excel sheet. Please try again.');
    }
  };

  // Export current page/filtered records as clean CSV file
  const handleExportCSV = () => {
    try {
      const dataToExport = filteredRows.length > 0 ? filteredRows : currentRows;
      if (dataToExport.length === 0) {
        onShowToast('No ledger records available to export.');
        return;
      }

      // Headers
      const headers = [
        'S.No',
        'Borrow Date',
        'Telugu Name',
        'English Name',
        'Product/Item',
        'Principal Amount',
      ];

      currentDateColumns.forEach((col, idx) => {
        headers.push(`Installment ${idx + 1} (${col}) Date`);
        headers.push(`Installment ${idx + 1} (${col}) Amount`);
      });

      headers.push('Total Paid', 'Remaining Balance', 'Status');

      // Rows
      const csvLines: string[] = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
      ];

      dataToExport.forEach(row => {
        const { totalPaid, remaining, amount } = getRowTotals(row);
        const line = [
          `"${row.sNo}"`,
          `"${row.date}"`,
          `"${(row.nameTelugu || row.name || '').replace(/"/g, '""')}"`,
          `"${(row.nameEnglish || '').replace(/"/g, '""')}"`,
          `"${(row.item || '').replace(/"/g, '""')}"`,
          `"${amount}"`,
        ];

        currentDateColumns.forEach((_, colIdx) => {
          const pay = getPayment(row, colIdx);
          line.push(`"${pay.date || ''}"`);
          line.push(`"${pay.amount || ''}"`);
        });

        line.push(`"${totalPaid}"`);
        line.push(`"${remaining}"`);
        line.push(`"${row.isClosed ? 'Closed' : 'Active'}"`);

        csvLines.push(line.join(','));
      });

      // UTF-8 BOM for Telugu character rendering in Excel/CSV viewers
      const csvContent = '\uFEFF' + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `KN_Finance_Page_Data_${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast(`Exported page data as CSV successfully! (${dataToExport.length} records) 📁`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      onShowToast('Error exporting CSV file. Please try again.');
    }
  };

  // Cell keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, filteredRowIdx: number, colIndex: number) => {
    if (!isEditing) return;
    let targetRow = filteredRowIdx;
    let targetCol = colIndex;

    const maxCols = 6 + currentDateColumns.length; // 6 info cols + date cols + remaining col (0 to maxCols)

    switch (e.key) {
      case 'ArrowUp':
        targetRow = Math.max(0, filteredRowIdx - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        targetRow = Math.min(filteredRows.length - 1, filteredRowIdx + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (e.currentTarget.selectionStart === 0 || e.currentTarget.selectionStart === null) {
          targetCol = Math.max(0, colIndex - 1);
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (e.currentTarget.selectionStart === e.currentTarget.value.length || e.currentTarget.selectionStart === null) {
          targetCol = Math.min(maxCols, colIndex + 1);
          e.preventDefault();
        }
        break;
      case 'Enter':
        targetRow = Math.min(filteredRows.length - 1, filteredRowIdx + 1);
        e.preventDefault();
        break;
      default:
        return;
    }

    if (targetRow !== filteredRowIdx || targetCol !== colIndex) {
      const el = document.querySelector(`input[data-row="${targetRow}"][data-col="${targetCol}"]`) as HTMLInputElement | null;
      if (el) {
        el.focus();
        setTimeout(() => el.select(), 0);
      }
    }
  };

  // Dynamic Print Styles & Column Width Percentages for Guaranteed 100% Page Fit
  const colCount = currentDateColumns.length;
  const isManyCols = colCount > 6;
  const isVeryManyCols = colCount > 10;
  const isExtremeCols = colCount > 15;

  const printFontSizeClass = isExtremeCols
    ? 'text-[6.5px]'
    : isVeryManyCols
      ? 'text-[7.5px]'
      : isManyCols
        ? 'text-[8.5px]'
        : 'text-[10px]';

  const printHeaderFontClass = isExtremeCols
    ? 'text-[7px]'
    : isVeryManyCols
      ? 'text-[8px]'
      : isManyCols
        ? 'text-[9px]'
        : 'text-[10.5px]';

  const printCellPadding = isExtremeCols
    ? 'px-0.5 py-0.5'
    : isVeryManyCols
      ? 'px-1 py-0.5'
      : isManyCols
        ? 'px-1 py-1'
        : 'px-1.5 py-1.5';

  // Base Column Width Percentages (Total will always equal 100% exactly)
  const sNoPct = isVeryManyCols ? 2.5 : 3.0;
  const datePct = isVeryManyCols ? 4.0 : 4.5;
  const teNamePct = isVeryManyCols ? 9.0 : isManyCols ? 11.0 : 13.5;
  const enNamePct = isVeryManyCols ? 8.5 : isManyCols ? 10.0 : 12.5;
  const itemPct = isVeryManyCols ? 7.0 : isManyCols ? 8.0 : 9.5;
  const amountPct = isVeryManyCols ? 6.0 : isManyCols ? 7.0 : 8.5;
  const totalPaidPct = isVeryManyCols ? 6.5 : isManyCols ? 7.5 : 9.0;
  const remainingPct = isVeryManyCols ? 6.5 : isManyCols ? 7.5 : 9.0;
  const statusPct = isVeryManyCols ? 4.0 : isManyCols ? 4.5 : 5.5;

  const fixedTotalPct = sNoPct + datePct + teNamePct + enNamePct + itemPct + amountPct + totalPaidPct + remainingPct + statusPct;
  const installmentColPct = colCount > 0 ? (100 - fixedTotalPct) / colCount : 0;

  return (
    <div className="relative space-y-6">

      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .telugu-font {
          font-family: 'Noto Serif Telugu', 'Noto Sans Telugu', serif;
        }
        
        .desk-bg {
          background-color: #0f172a;
          background-image: 
          radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.06) 0%, transparent 80%),
          radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
          linear-gradient(to right, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
          background-size: auto, auto, 50px 50px, 50px 50px;
        }

        .paper-grain {
          background-color: #faf8f5;
          position: relative;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E");
        }

        .left-page-curl {
          background: linear-gradient(to right, #ebdcb9 0%, #faf8f5 4%, #faf8f5 96%, #e6dfcf 100%);
          border-top-left-radius: 16px 120px;
          border-bottom-left-radius: 16px 120px;
          box-shadow: inset 12px 0 20px -12px rgba(0,0,0,0.15), inset -5px 0 10px -5px rgba(0,0,0,0.05);
        }

        .right-page-curl {
          background: linear-gradient(to left, #ebdcb9 0%, #faf8f5 4%, #faf8f5 96%, #e6dfcf 100%);
          border-top-right-radius: 16px 120px;
          border-bottom-right-radius: 16px 120px;
          box-shadow: inset -12px 0 20px -12px rgba(0,0,0,0.15), inset 5px 0 10px -5px rgba(0,0,0,0.05);
        }

        .book-binding-gutter {
          background: linear-gradient(to right, 
            rgba(15, 23, 42, 0.25) 0%, 
            rgba(120, 90, 40, 0.15) 30%, 
            rgba(212, 175, 55, 0.25) 46%, 
            rgba(15, 23, 42, 0.6) 50%, 
            rgba(212, 175, 55, 0.25) 54%, 
            rgba(120, 90, 40, 0.15) 70%, 
            rgba(15, 23, 42, 0.25) 100%
          );
          z-index: 20;
        }

        .book-stacked-shadow {
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.3), 
            0 8px 0 -4px #faf8f5, 
            0 8px 4px -3px rgba(0,0,0,0.3), 
            0 16px 0 -8px #f5f2eb, 
            0 16px 4px -7px rgba(0,0,0,0.3),
            0 24px 40px rgba(0,0,0,0.55);
        }

        .ledger-cell-border {
          border: 1px solid #d4c5a9 !important;
        }

        .double-header-border {
          border-bottom: 4px double #b45309 !important;
        }

        .ledger-cell-input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          height: 100%;
          color: #1e293b;
          font-weight: 500;
          font-size: 13px;
          transition: background-color 0.15s ease;
        }

        .ledger-cell-input:focus {
          background-color: rgba(217, 119, 6, 0.08);
        }

        .ledger-cell-input:disabled {
          color: #1e293b;
          cursor: default;
          opacity: 1;
          -webkit-text-fill-color: #1e293b;
        }

        .closed-row-input {
          text-decoration: line-through !important;
          text-decoration-color: #ef4444 !important;
          color: #94a3b8 !important;
          opacity: 0.65;
          -webkit-text-fill-color: #94a3b8 !important;
        }

        .scrollbar-book {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        .scrollbar-book::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scrollbar-book::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .scrollbar-book::-webkit-scrollbar-thumb {
          background: #d97706;
          border-radius: 4px;
        }

        .book-spine-stitches {
          border-left: 2px dashed rgba(234, 24, 66, 0.5) !important;
          width: 0px;
          height: 92%;
        }

        @media print {
          body, html, #root, #root > div, main {
            background: #fff !important;
            color: #000 !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            width: 100% !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          aside, nav, header, .no-print, button, select, input, .dashboard-sidebar, .dashboard-navbar {
            display: none !important;
          }

          .screen-only-book {
            display: none !important;
          }

          .print-only-ledger {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            page-break-inside: auto;
          }

          .print-table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }

          .print-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .print-table th, .print-table td {
            border: 1px solid #475569 !important;
            color: #000 !important;
            overflow: hidden !important;
            word-break: break-word !important;
          }

          .print-table th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }

          @page {
            size: landscape;
            margin: 0.4cm;
          }
        }
      `}} />

      {/* 1. External Control Panel above the book (Hidden in print) */}
      <div className="no-print flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md text-slate-200 p-4 rounded-xl border border-slate-800 shadow-xl">

        {/* Search filter input */}
        <div className="relative w-full xl:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="పేరు (తెలుగు / English) లేదా నెంబర్ ద్వారా వెతకండి..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Action Controls - Single Row */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 overflow-x-auto pb-1 sm:pb-0">
          {!isEditing ? (
            <>
              {/* 1. Edit Ledger Button */}
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-amber-500/60 whitespace-nowrap"
                title="Edit ledger entries and columns"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-100" />
                <span>Edit Ledger</span>
              </button>

              {/* 2. Excel Sheet Button */}
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-emerald-500/50 whitespace-nowrap"
                title="Export complete book ledger data to Excel spreadsheet (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Excel Sheet</span>
              </button>

              {/* 3. Export Page Data Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-sky-500/50 whitespace-nowrap"
                title="Export current page data as CSV"
              >
                <Download className="w-3.5 h-3.5 text-sky-200" />
                <span>Export Page Data</span>
              </button>

              {/* 4. Print Ledger Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-indigo-600 to-slate-800 hover:from-indigo-700 hover:to-slate-900 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-indigo-500/50 whitespace-nowrap"
                title="Print official finance ledger format"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-200" />
                <span>ప్రింట్ (Print Ledger)</span>
              </button>
            </>
          ) : (
            <>
              {/* Save Changes Button */}
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-teal-700 whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5 text-emerald-200" />
                <span>Save Changes</span>
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 text-xs bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-red-700 whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5 text-red-200" />
                <span>Cancel</span>
              </button>

              {/* Add Column */}
              <button
                onClick={handleAddColumn}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-amber-700 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-amber-200" />
                <span>Add Date Column</span>
              </button>

              {/* Add Row */}
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold shadow-md border border-teal-700 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-200" />
                <span>Add Person Row</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Outer Desk Frame containing the Open Book Spread */}
      <div className="screen-only-book print:hidden">
        <div className="desk-bg flex-1 p-2 md:p-6 lg:p-10 rounded-2xl flex items-start justify-start overflow-x-auto scrollbar-book">

        {/* Book Spread Inner Content */}
        <div
          className="book-spread book-stacked-shadow paper-grain flex flex-row select-none relative overflow-hidden transition-all duration-300 mx-auto"
          style={{ width: `${bookSpreadWidth}px`, minWidth: `${bookSpreadWidth}px` }}
        >


          {/* ========================================================
              LEFT PAGE SPREAD (S.No, Borrow Date, Telugu Name, English Name, Product, Amount, Installments)
             ======================================================== */}
          <div
            className="left-page-curl paper-grain pt-4 pb-6 pl-4 pr-0 relative z-10 flex flex-col items-end"
            style={{ width: `${leftPageWidth}px` }}
          >

            <table className="ledger-table w-full table-fixed border-collapse select-text telugu-font">
              <thead className="bg-[#b45309]/5">
                {/* Headers Row */}
                <tr className="double-header-border text-slate-900 font-bold text-center h-[54px] select-none text-[11px] leading-tight">
                  <th className="ledger-cell-border w-[38px] select-none font-bold align-middle">
                    వ.సం.<br /><span className="text-[9px] text-slate-500 font-sans font-bold">S.No.</span>
                  </th>
                  <th className="ledger-cell-border w-[70px] select-none font-bold align-middle">
                    తేది<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Borrow Date</span>
                  </th>
                  {/* Separate Telugu Name Column */}
                  <th className="ledger-cell-border w-[130px] select-none font-bold align-middle">
                    ఆసామి పేరు (తెలుగు)<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Telugu Name</span>
                  </th>
                  {/* Separate English Name Column */}
                  <th className="ledger-cell-border w-[130px] select-none font-bold align-middle">
                    పేరు (English)<br /><span className="text-[9px] text-slate-500 font-sans font-bold">English Name</span>
                  </th>
                  <th className="ledger-cell-border w-[90px] select-none font-bold align-middle">
                    వస్తువు<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Product</span>
                  </th>
                  <th className="ledger-cell-border w-[75px] select-none font-bold align-middle">
                    సొమ్ము<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Amount</span>
                  </th>
                  {/* Left side dynamic installment columns */}
                  {Array.from({ length: leftPageCount }).map((_, dIdx) => (
                    <th key={dIdx} className={`ledger-cell-border w-[88px] p-0 align-middle ${dIdx === leftPageCount - 1 ? 'border-r-0' : ''}`}>
                      <div className="relative flex flex-col items-center justify-center h-full px-1 py-1 select-none">
                        <span className="text-[10px] text-amber-950 font-bold leading-tight">
                          వాయిదా {dIdx + 1}
                        </span>

                        <span className="text-[8.5px] text-amber-800/80 font-sans font-bold tracking-tight">
                          తేది | సొమ్ము
                        </span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(dIdx)}
                            className="absolute -top-1.5 right-0.5 text-[10px] text-red-500 hover:text-red-700 bg-white/95 rounded-full w-4 h-4 flex items-center justify-center shadow border border-red-200 no-print"
                            title="Delete Column"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr key={row.id} className={`h-[48px] hover:bg-slate-500/5 transition-colors ${row.isClosed ? 'bg-slate-100/55 opacity-90' : ''}`}>
                    {/* SNo cell */}
                    <td className="ledger-cell-border p-0 text-center font-sans">
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={row.sNo}
                        data-row={rIdx}
                        data-col={1}
                        onChange={(e) => handleCellChange(row.id, 'sNo', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rIdx, 1)}
                        onFocus={() => setActiveCell({ row: rIdx, col: 1 })}
                        className={`ledger-cell-input text-center font-bold text-slate-800 ${row.isClosed ? 'closed-row-input' : ''}`}
                      />
                    </td>

                    {/* Borrow Date cell */}
                    <td className="ledger-cell-border p-0 text-center font-sans">
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={row.date}
                        data-row={rIdx}
                        data-col={0}
                        onChange={(e) => handleCellChange(row.id, 'date', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rIdx, 0)}
                        onFocus={() => setActiveCell({ row: rIdx, col: 0 })}
                        className={`ledger-cell-input text-center ${row.isClosed ? 'closed-row-input' : ''}`}
                        placeholder="DD-MM"
                      />
                    </td>

                    {/* Separate Telugu Name cell */}
                    <td className="ledger-cell-border p-0 text-left telugu-font">
                      <div className="flex items-center w-full h-full relative">
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded no-print ml-1 flex-shrink-0"
                            title="Delete Person"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={row.nameTelugu || ''}
                          data-row={rIdx}
                          data-col={2}
                          onChange={(e) => handleNameChange(row.id, 'telugu', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rIdx, 2)}
                          onFocus={() => setActiveCell({ row: rIdx, col: 2 })}
                          className={`ledger-cell-input text-left px-2 font-semibold ${row.isClosed ? 'closed-row-input' : ''}`}
                          placeholder="తెలుగు పేరు"
                        />
                      </div>
                    </td>

                    {/* Separate English Name cell */}
                    <td className="ledger-cell-border p-0 text-left font-sans">
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={row.nameEnglish || ''}
                        data-row={rIdx}
                        data-col={3}
                        onChange={(e) => handleNameChange(row.id, 'english', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rIdx, 3)}
                        onFocus={() => setActiveCell({ row: rIdx, col: 3 })}
                        className={`ledger-cell-input text-left px-2 text-xs font-semibold text-slate-700 ${row.isClosed ? 'closed-row-input' : ''}`}
                        placeholder="English Name"
                      />
                    </td>

                    {/* Item Details cell */}
                    <td className="ledger-cell-border p-0 text-left">
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={row.item}
                        data-row={rIdx}
                        data-col={4}
                        onChange={(e) => handleCellChange(row.id, 'item', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rIdx, 4)}
                        onFocus={() => setActiveCell({ row: rIdx, col: 4 })}
                        className={`ledger-cell-input text-left px-2 text-xs text-slate-600 ${row.isClosed ? 'closed-row-input' : ''}`}
                        placeholder=""
                      />
                    </td>

                    {/* Amount cell */}
                    <td className="ledger-cell-border p-0 text-right font-sans">
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={row.amount}
                        data-row={rIdx}
                        data-col={5}
                        onChange={(e) => handleCellChange(row.id, 'amount', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rIdx, 5)}
                        onFocus={() => setActiveCell({ row: rIdx, col: 5 })}
                        className={`ledger-cell-input text-right px-1.5 font-bold text-[#166534] ${row.isClosed ? 'closed-row-input' : ''}`}
                        placeholder=""
                      />
                    </td>

                    {/* Date + Amount Installment cells index 0 to leftPageCount - 1 */}
                    {Array.from({ length: leftPageCount }).map((_, dIdx) => {
                      const pay = getPayment(row, dIdx);
                      return (
                        <td key={dIdx} className={`ledger-cell-border p-0 text-center font-sans bg-amber-50/10 ${dIdx === leftPageCount - 1 ? 'border-r-0' : ''}`}>
                          {isEditing ? (
                            <div className="flex flex-col h-full w-full justify-center">
                              {/* Top Date Input */}
                              <input
                                type="text"
                                value={pay.date}
                                placeholder="DD-MM"
                                onChange={(e) => handlePaymentChange(row.id, dIdx, 'date', e.target.value)}
                                className="w-full text-center text-[10px] font-semibold text-amber-900 bg-amber-50/40 border-b border-amber-200/60 focus:bg-amber-100/60 outline-none py-0.5 leading-tight placeholder-slate-400/60"
                                title="Payment Date (DD-MM)"
                              />
                              {/* Bottom Amount Input */}
                              <input
                                type="text"
                                value={pay.amount}
                                placeholder="₹ సొమ్ము"
                                onChange={(e) => handlePaymentChange(row.id, dIdx, 'amount', e.target.value)}
                                className="w-full text-center text-[11px] font-bold text-slate-800 bg-transparent focus:bg-amber-100/60 outline-none py-0.5 leading-tight placeholder-slate-400/60"
                                title="Payment Amount"
                              />
                            </div>
                          ) : (
                            <div className={`flex flex-col items-center justify-center h-full py-0.5 leading-tight select-text ${row.isClosed ? 'closed-row-input' : ''}`}>
                              {pay.amount || pay.date ? (
                                <>
                                  <span className="text-[10px] text-amber-900/80 font-bold font-sans tracking-tight">
                                    {pay.date || '—'}
                                  </span>
                                  <span className="text-[12px] font-bold text-[#166534] font-sans">
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
                  </tr>
                ))}

                {/* Bottom Add Person Button Row */}
                {isEditing && (
                  <tr className="no-print h-[38px] bg-[#b45309]/5">
                    <td colSpan={6 + leftPageCount} className="ledger-cell-border border-r-0 p-1.5 text-center">
                      <button
                        onClick={handleAddRow}
                        className="px-4 py-1.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 border border-teal-800 text-white rounded-lg font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] leading-none"
                      >
                        ➕ Add Person Row
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================
              RIGHT PAGE SPREAD (Continuation of Installment Columns, Totals)
             ======================================================== */}
          <div
            className="right-page-curl paper-grain pt-4 pb-6 pl-0 pr-4 relative z-10 flex flex-col items-start overflow-x-auto scrollbar-book"
            style={{ width: `${rightPageWidth}px` }}
          >

            <table className="ledger-table w-full table-fixed border-collapse select-text">
              <thead className="bg-[#b45309]/5">
                {/* Headers Row */}
                <tr className="double-header-border text-slate-900 font-bold text-center h-[54px] select-none text-[11px] leading-tight">
                  {/* Right side dynamic installment columns */}
                  {Array.from({ length: rightPageCount }).map((_, i) => {
                    const dIdx = i + leftPageCount;
                    return (
                      <th key={dIdx} className={`ledger-cell-border w-[88px] p-0 align-middle ${i === 0 ? 'border-l-0' : ''}`}>
                        <div className="relative flex flex-col items-center justify-center h-full px-1 py-1 select-none">
                          <span className="text-[10px] text-amber-950 font-bold leading-tight">
                            వాయిదా {dIdx + 1}
                          </span>
                          <span className="text-[8.5px] text-amber-800/80 font-sans font-bold tracking-tight">
                            తేది | సొమ్ము
                          </span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(dIdx)}
                              className="absolute -top-1.5 right-0.5 text-[10px] text-red-500 hover:text-red-700 bg-white/95 rounded-full w-4 h-4 flex items-center justify-center shadow border border-red-200 no-print"
                              title="Delete Column"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Summary columns */}
                  <th className="ledger-cell-border w-[100px] select-none font-bold align-middle">
                    మొత్తం వసూలు<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Total Paid</span>
                  </th>
                  <th className="ledger-cell-border w-[100px] select-none font-bold align-middle">
                    బాకీ సొమ్ము<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Remaining</span>
                  </th>
                  <th className="ledger-cell-border w-[80px] select-none font-bold align-middle">
                    ముగింపు<br /><span className="text-[9px] text-slate-500 font-sans font-bold">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => {
                  const { totalPaid, target, amount } = getRowTotals(row);
                  return (
                    <tr key={row.id} className={`h-[48px] hover:bg-slate-500/5 transition-colors ${row.isClosed ? 'bg-slate-100/55 opacity-90' : ''}`}>

                      {/* Date + Amount Installment cells index leftPageCount to end */}
                      {Array.from({ length: rightPageCount }).map((_, i) => {
                        const dIdx = i + leftPageCount;
                        const pay = getPayment(row, dIdx);
                        return (
                          <td key={dIdx} className={`ledger-cell-border p-0 text-center font-sans bg-amber-50/10 ${i === 0 ? 'border-l-0' : ''}`}>
                            {isEditing ? (
                              <div className="flex flex-col h-full w-full justify-center">
                                {/* Top Date Input */}
                                <input
                                  type="text"
                                  value={pay.date}
                                  placeholder="DD-MM"
                                  onChange={(e) => handlePaymentChange(row.id, dIdx, 'date', e.target.value)}
                                  className="w-full text-center text-[10px] font-semibold text-amber-900 bg-amber-50/40 border-b border-amber-200/60 focus:bg-amber-100/60 outline-none py-0.5 leading-tight placeholder-slate-400/60"
                                  title="Payment Date (DD-MM)"
                                />
                                {/* Bottom Amount Input */}
                                <input
                                  type="text"
                                  value={pay.amount}
                                  placeholder="₹ సొమ్ము"
                                  onChange={(e) => handlePaymentChange(row.id, dIdx, 'amount', e.target.value)}
                                  className="w-full text-center text-[11px] font-bold text-slate-800 bg-transparent focus:bg-amber-100/60 outline-none py-0.5 leading-tight placeholder-slate-400/60"
                                  title="Payment Amount"
                                />
                              </div>
                            ) : (
                              <div className={`flex flex-col items-center justify-center h-full py-0.5 leading-tight select-text ${row.isClosed ? 'closed-row-input' : ''}`}>
                                {pay.amount || pay.date ? (
                                  <>
                                    <span className="text-[10px] text-amber-900/80 font-bold font-sans tracking-tight">
                                      {pay.date || '—'}
                                    </span>
                                    <span className="text-[12px] font-bold text-[#166534] font-sans">
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

                      {/* Total Paid Column */}
                      <td className={`ledger-cell-border p-1 text-center font-sans font-extrabold text-[#059669] bg-emerald-50/20 ${row.isClosed ? 'line-through text-slate-400 opacity-60' : ''}`}>
                        {row.amount ? totalPaid || '0' : ''}
                      </td>

                      {/* Remaining Balance Column */}
                      <td className={`ledger-cell-border p-0 text-center font-sans transition-colors ${(target - totalPaid) <= 0 && totalPaid > 0
                        ? 'bg-emerald-100/40 text-emerald-800 font-extrabold'
                        : 'bg-amber-50/10'
                        }`}>
                        <div className="relative flex items-center justify-center h-full w-full">
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={
                              activeCell?.row === rIdx && activeCell?.col === 6 + currentDateColumns.length
                                ? (row.initialRemaining !== undefined ? row.initialRemaining : (row.amount ? row.amount : ''))
                                : (row.amount ? (target - totalPaid).toString() : '')
                            }
                            data-row={rIdx}
                            data-col={6 + currentDateColumns.length}
                            onChange={(e) => handleCellChange(row.id, 'initialRemaining', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rIdx, 6 + currentDateColumns.length)}
                            onFocus={() => setActiveCell({ row: rIdx, col: 6 + currentDateColumns.length })}
                            onBlur={() => {
                              // Small timeout so click on "+5%" badge registers before activeCell resets to null
                              setTimeout(() => setActiveCell(null), 150);
                            }}
                            className={`ledger-cell-input text-center text-xs font-extrabold ${(activeCell?.row === rIdx && activeCell?.col === 6 + currentDateColumns.length) ? 'pr-8' : ''
                              } ${(target - totalPaid) <= 0 && totalPaid > 0
                                ? 'text-emerald-700 font-extrabold'
                                : 'text-amber-900'
                              } ${row.isClosed ? 'closed-row-input' : ''}`}
                            placeholder={row.amount ? (amount - totalPaid).toString() : ''}
                          />
                          {isEditing && activeCell?.row === rIdx && activeCell?.col === 6 + currentDateColumns.length && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const currentVal = parseFloat(row.initialRemaining || row.amount || '0') || 0;
                                const newVal = Math.round(currentVal * 1.05);
                                handleCellChange(row.id, 'initialRemaining', newVal.toString());
                              }}
                              className="absolute right-1 px-1 py-0.5 text-[9px] bg-amber-600 text-white rounded hover:bg-amber-700 font-sans font-bold no-print"
                              title="Add 5% Interest"
                            >
                              +5%
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Column (Closed Action) */}
                      <td className="ledger-cell-border p-1 text-center font-sans">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleToggleClosed(row.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded shadow transition-all ${row.isClosed
                                ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                              }`}
                          >
                            {row.isClosed ? 'Reopen' : 'Close'}
                          </button>
                        ) : (
                          <span
                            className={`inline-block py-0.5 px-2 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${row.isClosed
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                          >
                            {row.isClosed ? 'Closed' : 'Active'}
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}

                {/* Bottom Add Column Button Row */}
                {isEditing && (
                  <tr className="no-print h-[38px] bg-[#b45309]/5">
                    <td colSpan={rightPageCount + 3} className="ledger-cell-border border-l-0 p-1.5 text-center">
                      <button
                        onClick={handleAddColumn}
                        className="px-4 py-1.5 text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border border-amber-800 text-white rounded-lg font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] leading-none"
                      >
                        ➕ Add Date Column
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


        </div>
      </div>
      </div>

      {/* 3. Dedicated High-Definition Print Ledger Layout (Guaranteed 100% Page Fit) */}
      <div className="print-only-ledger hidden print:block p-2 bg-white text-black font-sans">
        
        {/* Print Header */}
        <div className="border-b-2 border-slate-900 pb-2 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold tracking-wide uppercase text-slate-900">
                KN FINANCE (శ్రీ లక్ష్మీ గణపతి ఫైనాన్స్)
              </h1>
              <p className="text-[11px] font-bold text-slate-700">
                Finance Book Ledger Register • శాఖ లెడ్జర్ రికార్డు రిజిస్టర్
              </p>
            </div>
            <div className="text-right text-[9px] text-slate-600 font-mono">
              <p className="font-bold">Branch #104 (NY Central)</p>
              <p>Printed on: {new Date().toLocaleString('en-IN')}</p>
              <p>Operator: {userName || 'Admin'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[9px] bg-slate-100 px-2 py-1 rounded border border-slate-300 font-bold">
            <span>Total Accounts: {filteredRows.length}</span>
            <span>Active: {filteredRows.filter(r => !r.isClosed).length}</span>
            <span>Closed: {filteredRows.filter(r => r.isClosed).length}</span>
            <span>Installment Columns: {colCount}</span>
            <span>Filter: {searchTerm || 'All Records'}</span>
          </div>
        </div>

        {/* Unified Full Table with Guaranteed 100% Page Fit */}
        <table className={`print-table w-full table-fixed border-collapse ${printFontSizeClass}`}>
          <colgroup>
            <col style={{ width: `${sNoPct}%` }} />
            <col style={{ width: `${datePct}%` }} />
            <col style={{ width: `${teNamePct}%` }} />
            <col style={{ width: `${enNamePct}%` }} />
            <col style={{ width: `${itemPct}%` }} />
            <col style={{ width: `${amountPct}%` }} />
            {currentDateColumns.map((_, cIdx) => (
              <col key={cIdx} style={{ width: `${installmentColPct}%` }} />
            ))}
            <col style={{ width: `${totalPaidPct}%` }} />
            <col style={{ width: `${remainingPct}%` }} />
            <col style={{ width: `${statusPct}%` }} />
          </colgroup>

          <thead>
            <tr className={`bg-slate-200 text-slate-900 font-bold text-center ${printHeaderFontClass}`}>
              <th className={`border border-slate-700 ${printCellPadding} align-middle`}>
                వ.సం.<br /><span className="text-[7.5px] font-normal font-sans">S.No</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} align-middle`}>
                తేది<br /><span className="text-[7.5px] font-normal font-sans">Date</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} text-left align-middle`}>
                ఆసామి పేరు (తెలుగు)<br /><span className="text-[7.5px] font-normal font-sans">Telugu Name</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} text-left align-middle`}>
                పేరు (English)<br /><span className="text-[7.5px] font-normal font-sans">English Name</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} text-left align-middle`}>
                వస్తువు<br /><span className="text-[7.5px] font-normal font-sans">Product</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} text-right align-middle`}>
                సొమ్ము<br /><span className="text-[7.5px] font-normal font-sans">Amount ₹</span>
              </th>
              {currentDateColumns.map((cDate, cIdx) => (
                <th key={cIdx} className={`border border-slate-700 ${printCellPadding} text-center align-middle`}>
                  {colCount > 8 ? `వా.${cIdx + 1}` : `వాయిదా ${cIdx + 1}`}<br />
                  <span className="text-[7.5px] font-mono block leading-none">{cDate}</span>
                </th>
              ))}
              <th className={`border border-slate-700 ${printCellPadding} text-right align-middle`}>
                మొత్తం వసూలు<br /><span className="text-[7.5px] font-normal font-sans">Paid ₹</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} text-right align-middle`}>
                బాకీ సొమ్ము<br /><span className="text-[7.5px] font-normal font-sans">Remaining ₹</span>
              </th>
              <th className={`border border-slate-700 ${printCellPadding} text-center align-middle`}>
                స్థితి<br /><span className="text-[7.5px] font-normal font-sans">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rIdx) => {
              const { totalPaid, remaining, amount } = getRowTotals(row);
              return (
                <tr key={row.id} className={`border-b border-slate-400 ${row.isClosed ? 'bg-slate-50 line-through text-slate-500' : ''}`}>
                  <td className={`border border-slate-600 ${printCellPadding} text-center font-bold`}>{row.sNo || rIdx + 1}</td>
                  <td className={`border border-slate-600 ${printCellPadding} text-center font-mono`}>{row.date || '—'}</td>
                  <td className={`border border-slate-600 ${printCellPadding} font-semibold telugu-font truncate`}>{row.nameTelugu || row.name || '—'}</td>
                  <td className={`border border-slate-600 ${printCellPadding} font-medium truncate`}>{row.nameEnglish || '—'}</td>
                  <td className={`border border-slate-600 ${printCellPadding} truncate`}>{row.item || '—'}</td>
                  <td className={`border border-slate-600 ${printCellPadding} text-right font-bold font-mono`}>₹{amount ? amount.toLocaleString('en-IN') : '0'}</td>
                  {currentDateColumns.map((_, cIdx) => {
                    const pay = getPayment(row, cIdx);
                    return (
                      <td key={cIdx} className={`border border-slate-600 ${printCellPadding} text-center font-mono`}>
                        {pay.amount ? (
                          <div className="leading-none">
                            <div className="text-[7px] text-slate-500">{pay.date || ''}</div>
                            <div className="font-bold">₹{pay.amount}</div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`border border-slate-600 ${printCellPadding} text-right font-bold font-mono`}>₹{totalPaid.toLocaleString('en-IN')}</td>
                  <td className={`border border-slate-600 ${printCellPadding} text-right font-bold font-mono ${remaining <= 0 && totalPaid > 0 ? 'text-slate-800' : ''}`}>
                    ₹{remaining.toLocaleString('en-IN')}
                  </td>
                  <td className={`border border-slate-600 ${printCellPadding} text-center font-bold text-[8px] uppercase`}>
                    {row.isClosed ? 'CLSD' : 'ACT'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {(() => {
              let totalPrincipal = 0;
              let totalPaidAll = 0;
              let totalRemainingAll = 0;
              const colSums: number[] = new Array(currentDateColumns.length).fill(0);

              filteredRows.forEach(row => {
                const { totalPaid, remaining, amount } = getRowTotals(row);
                totalPrincipal += amount;
                totalPaidAll += totalPaid;
                totalRemainingAll += remaining;
                currentDateColumns.forEach((_, colIdx) => {
                  const pay = getPayment(row, colIdx);
                  const payAmt = parseFloat((pay.amount || '').replace(/,/g, '')) || 0;
                  colSums[colIdx] += payAmt;
                });
              });

              return (
                <tr className="bg-slate-200 font-extrabold text-slate-900 border-t-2 border-slate-800">
                  <td colSpan={5} className={`border border-slate-700 ${printCellPadding} text-center uppercase tracking-wider font-bold`}>
                    మొత్తం (TOTAL)
                  </td>
                  <td className={`border border-slate-700 ${printCellPadding} text-right font-mono font-extrabold`}>
                    ₹{totalPrincipal.toLocaleString('en-IN')}
                  </td>
                  {colSums.map((sum, sIdx) => (
                    <td key={sIdx} className={`border border-slate-700 ${printCellPadding} text-center font-mono font-bold`}>
                      {sum > 0 ? `₹${sum.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                  ))}
                  <td className={`border border-slate-700 ${printCellPadding} text-right font-mono font-extrabold`}>
                    ₹{totalPaidAll.toLocaleString('en-IN')}
                  </td>
                  <td className={`border border-slate-700 ${printCellPadding} text-right font-mono font-extrabold`}>
                    ₹{totalRemainingAll.toLocaleString('en-IN')}
                  </td>
                  <td className={`border border-slate-700 ${printCellPadding} text-center font-bold text-[8px]`}>
                    {filteredRows.length} R
                  </td>
                </tr>
              );
            })()}
          </tfoot>
        </table>

        {/* Signatures & Audit Footer */}
        <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-[10px] text-center text-slate-700 font-bold">
          <div>
            <div className="border-b border-slate-400 pb-6 mb-1"></div>
            <span>Prepared By / Accountant</span>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-6 mb-1"></div>
            <span>Cashier / Field Verifier</span>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-6 mb-1"></div>
            <span>Branch Manager / Authorized Signatory</span>
          </div>
        </div>
      </div>



    </div>
  );
};

