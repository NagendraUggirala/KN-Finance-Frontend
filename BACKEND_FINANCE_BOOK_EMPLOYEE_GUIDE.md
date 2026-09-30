# KN Finance — Backend Implementation Guide for Employee Ledger Book

This document provides complete instructions and code snippets to enable the **Finance Book / Ledger Book** API endpoints in your backend (`KN Backend`) and allow **Employees** to read, edit, and save ledger records.

---

## 1. Authentication & Role Permissions

Currently, your backend checks tokens for Admin or Super Admin on `/api/v1/finance-book/*`.  
To give employees edit & view access to the Ledger Book, ensure your authentication/authorization middleware permits both **Admin** and **Employee** roles.

### Middleware Example (`middleware/auth.js` or `middleware/authMiddleware.ts`):

```javascript
// Allow Admin, Super Admin, and Employee roles
const allowAdminAndEmployee = (req, res, next) => {
  const user = req.user; // populated by your JWT verify middleware
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Token missing.' });
  }

  const role = (user.role || '').toLowerCase();
  if (['admin', 'superadmin', 'employee', 'staff'].includes(role)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Only Admins and Field Employees can access the Finance Book.'
  });
};

module.exports = { allowAdminAndEmployee };
```

---

## 2. API Routes Overview

Mount these routes under `/api/v1/finance-book`:

| Method | Endpoint | Description | Permitted Roles |
|---|---|---|---|
| `GET` | `/api/v1/finance-book/active` | Get active ledger, installment columns, borrower rows, and totals | Admin, SuperAdmin, Employee |
| `POST` | `/api/v1/finance-book/batch-save` | Atomically save all rows, columns, and payment entries | Admin, SuperAdmin, Employee |
| `PATCH` | `/api/v1/finance-book/rows/:id/status` | Toggle account status (Active / Closed) | Admin, SuperAdmin, Employee |
| `POST` | `/api/v1/finance-book/columns` | Add next weekly installment column | Admin, SuperAdmin, Employee |
| `DELETE` | `/api/v1/finance-book/columns/:index` | Delete an installment column by index | Admin, SuperAdmin, Employee |
| `POST` | `/api/v1/finance-book/rows` | Add a single borrower row | Admin, SuperAdmin, Employee |
| `DELETE` | `/api/v1/finance-book/rows/:id` | Delete a single borrower row | Admin, SuperAdmin, Employee |

---

## 3. Database Schema (MongoDB / Mongoose Example)

### `models/FinanceBook.js`:
```javascript
const mongoose = require('mongoose');

const PaymentItemSchema = new mongoose.Schema({
  date: { type: String, default: '' },      // e.g. "08-08" or "YYYY-MM-DD"
  amount: { type: Number, default: 0 },
  paymentType: { type: String, default: 'Cash' }
}, { _id: false });

const LedgerRowSchema = new mongoose.Schema({
  sNo: { type: Number, required: true },
  date: { type: String, default: '03-08' },  // Borrow Date
  nameTelugu: { type: String, required: true },
  nameEnglish: { type: String, default: '' },
  item: { type: String, default: 'Weekly Terms' },
  amount: { type: Number, default: 0 },     // Principal amount
  initialRemaining: { type: Number, default: 0 },
  interestRate: { type: Number, default: 5 },
  isClosed: { type: Boolean, default: false },
  payments: {
    type: Map,
    of: PaymentItemSchema,
    default: {}
  }
}, { timestamps: true });

const FinanceBookSchema = new mongoose.Schema({
  branchId: { type: String, default: 'KN-CENTRAL' },
  title: { type: String, default: 'KN Finance Official Ledger Book' },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  dateColumns: {
    type: [String],
    default: ['08-08', '15-08', '22-08', '29-08']
  },
  rows: [LedgerRowSchema]
}, { timestamps: true });

module.exports = mongoose.model('FinanceBook', FinanceBookSchema);
```

---

## 4. Controller Implementation (`controllers/financeBookController.js`)

```javascript
const FinanceBook = require('../models/FinanceBook');

// 1. GET /api/v1/finance-book/active
exports.getActiveFinanceBook = async (req, res) => {
  try {
    let book = await FinanceBook.findOne({ isActive: true });
    
    // Create initial book if none exists
    if (!book) {
      book = await FinanceBook.create({
        isActive: true,
        version: 1,
        dateColumns: ['08-08', '15-08', '22-08', '29-08'],
        rows: []
      });
    }

    // Calculate totals
    let principalAmount = 0;
    let totalPaid = 0;
    let remainingBalance = 0;

    const formattedRows = book.rows.map((row) => {
      let rowPaid = 0;
      if (row.payments) {
        row.payments.forEach((p) => {
          rowPaid += Number(p.amount) || 0;
        });
      }
      const target = Number(row.initialRemaining) || Number(row.amount) || 0;
      const rowRemaining = Math.max(0, target - rowPaid);

      principalAmount += Number(row.amount) || 0;
      totalPaid += rowPaid;
      remainingBalance += rowRemaining;

      return {
        id: row._id.toString(),
        sNo: row.sNo,
        date: row.date,
        nameTelugu: row.nameTelugu,
        nameEnglish: row.nameEnglish,
        item: row.item,
        amount: row.amount,
        initialRemaining: row.initialRemaining,
        remainingBalance: rowRemaining,
        totalPaid: rowPaid,
        interestRate: row.interestRate,
        isClosed: row.isClosed,
        payments: Object.fromEntries(row.payments || new Map())
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        ledgerBook: {
          id: book._id.toString(),
          title: book.title,
          version: book.version,
          isActive: book.isActive
        },
        dateColumns: book.dateColumns,
        rows: formattedRows,
        totals: {
          principalAmount,
          totalPaid,
          remainingBalance
        }
      }
    });
  } catch (error) {
    console.error('getActiveFinanceBook error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. POST /api/v1/finance-book/batch-save
exports.batchSaveFinanceBook = async (req, res) => {
  try {
    const { ledgerBookId, version, dateColumns, rows } = req.body;

    let book = null;
    if (ledgerBookId) {
      book = await FinanceBook.findById(ledgerBookId);
    }
    if (!book) {
      book = await FinanceBook.findOne({ isActive: true });
    }
    if (!book) {
      book = new FinanceBook({ isActive: true });
    }

    if (dateColumns && Array.isArray(dateColumns)) {
      book.dateColumns = dateColumns;
    }

    if (rows && Array.isArray(rows)) {
      book.rows = rows.map((r, idx) => ({
        sNo: r.sNo || idx + 1,
        date: r.date || '03-08',
        nameTelugu: r.nameTelugu,
        nameEnglish: r.nameEnglish || '',
        item: r.item || 'Weekly Terms',
        amount: Number(r.amount) || 0,
        initialRemaining: Number(r.initialRemaining) || Number(r.amount) || 0,
        interestRate: Number(r.interestRate) || 5,
        isClosed: Boolean(r.isClosed),
        payments: r.payments || {}
      }));
    }

    book.version = (book.version || 1) + 1;
    await book.save();

    return res.status(200).json({
      success: true,
      message: 'Ledger book saved successfully',
      data: {
        id: book._id,
        version: book.version
      }
    });
  } catch (error) {
    console.error('batchSaveFinanceBook error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. PATCH /api/v1/finance-book/rows/:id/status
exports.updateBorrowerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isClosed } = req.body;

    const book = await FinanceBook.findOne({ 'rows._id': id });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Row not found' });
    }

    const row = book.rows.id(id);
    if (row) {
      row.isClosed = Boolean(isClosed);
      await book.save();
    }

    return res.status(200).json({
      success: true,
      message: `Account marked as ${isClosed ? 'Closed' : 'Active'}`
    });
  } catch (error) {
    console.error('updateBorrowerStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 5. Mounting the Route in Express (`app.js` or `server.js`)

```javascript
const express = require('express');
const router = express.Router();
const { verifyToken, allowAdminAndEmployee } = require('./middleware/auth');
const financeBookController = require('./controllers/financeBookController');

// All finance book routes accessible by Admin & Employee
router.use(verifyToken, allowAdminAndEmployee);

router.get('/active', financeBookController.getActiveFinanceBook);
router.post('/batch-save', financeBookController.batchSaveFinanceBook);
router.patch('/rows/:id/status', financeBookController.updateBorrowerStatus);

app.use('/api/v1/finance-book', router);
```
