export interface Employee {
  id: string;
  _id?: string;
  employeeId?: string;
  name: string;
  fullName?: string;
  age: number;
  phone: string;
  altPhone?: string;
  aadharCard: string;
  gmail: string;
  email?: string;
  panCard: string;
  village: string;
  assignedArea: string;
  assignedOperationalArea?: string;
  referenceName?: string;
  relationshipToReference?: string;
  references?: string;
  joiningDate: string; // YYYY-MM-DD
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRow {
  id: string;
  date: string;
  amount: number;
  paymentType: 'Cash' | 'UPI' | 'Card';
  collectedBy: string; // Name of employee or admin who collected
  remarks?: string;
}

export interface FinanceRecord {
  sNo: number;
  id: string;
  name: string;
  nameTelugu?: string;
  nameEnglish?: string;
  referenceName?: string;
  phone?: string;
  startDate: string;
  endDate?: string;
  principalAmount: number;
  interestRate: number; // e.g. weekly or monthly percentage
  totalWithInterest: number; // calculated principal + interest
  paymentProcess: 'Daily' | 'Weekly' | 'Monthly';
  payments: PaymentRow[];
  expectedDate?: string;
  isClosed?: boolean;
}

export interface LedgerPayment {
  date: string;
  amount: string | number;
  paymentType?: 'Cash' | 'UPI' | 'Card';
}

export interface LedgerRowData {
  id: string;
  _id?: string;
  date: string; // Borrow Date
  borrowDate?: string;
  sNo: string | number;
  name: string; // primary display name
  nameTelugu: string; // Telugu script name
  nameEnglish: string; // English script name
  item: string;
  productItem?: string;
  amount: string | number;
  principalAmount?: number;
  payments: { [key: number]: LedgerPayment };
  initialRemaining?: string | number;
  remaining?: string | number;
  remainingBalance?: number;
  totalPaid?: number;
  interestRate?: number;
  isClosed?: boolean;
}

export interface LedgerColumnItem {
  id?: string;
  columnIndex: number;
  headerDate: string;
  labelTelugu?: string;
}

export interface LedgerBookMeta {
  id: string;
  branchId?: string;
  title?: string;
  academicYear?: string;
  isActive?: boolean;
  version?: number;
}

export interface AssignedBorrower {
  id: string;
  _id?: string;
  sNo?: number;
  borrowDate?: string;
  date?: string;
  nameTelugu: string;
  nameEnglish?: string;
  productItem?: string;
  item?: string;
  principalAmount: number;
  initialRemaining?: number;
  remainingBalance?: number;
  totalPaid?: number;
  interestRate?: number;
  isClosed?: boolean;
  assignedOperationalArea?: string;
  payments?: { [key: string]: { date?: string; amount?: number; paymentType?: string } };
}

export interface CollectionRecordPayload {
  borrowerId: string;
  amount: number;
  paymentDate: string;
  paymentType: 'Cash' | 'UPI' | 'Card';
}

