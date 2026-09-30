export type EmployeeTab = 
  | 'overview' 
  | 'day_wise_collect' 
  | 'ledger_book' 
  | 'expenses_summary' 
  | 'customers';

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  village: string;
  assignedOperationalArea: string;
  status: 'Active' | 'Inactive';
}

export interface BorrowerPayment {
  id: string;
  date: string;
  amount: number;
  paymentType: 'Cash' | 'UPI' | 'Card';
  collectedBy: string;
  receiptNo?: string;
  remarks?: string;
}

export interface AssignedBorrower {
  id: string;
  _id?: string;
  sNo: number | string;
  borrowDate: string;
  date?: string;
  nameTelugu: string;
  nameEnglish: string;
  phone: string;
  altPhone?: string;
  village: string;
  assignedOperationalArea?: string;
  productItem: string;
  item?: string;
  principalAmount: number;
  initialRemaining: number;
  remainingBalance: number;
  totalPaid: number;
  interestRate?: number;
  isClosed: boolean;
  startDate?: string;
  closedDate?: string;
  createdAt?: string;
  payments?: { [key: number]: { date: string; amount: string | number } } | BorrowerPayment[];
}

export interface CollectionRecord {
  id: string;
  receiptNo: string;
  borrowerId: string;
  borrowerNameTelugu: string;
  borrowerNameEnglish: string;
  borrowerPhone: string;
  village: string;
  amount: number;
  paymentType: 'Cash' | 'UPI' | 'Card';
  date: string; // YYYY-MM-DD
  time: string;
  collectedBy: string;
  notes?: string;
}

export interface DailyExpense {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'Fuel/Petrol' | 'Food & Tea' | 'Travel/Vehicle' | 'Mobile Recharge' | 'Stationery' | 'Miscellaneous';
  amount: number;
  description: string;
  paidBy: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface DaySummaryData {
  date: string;
  totalCollection: number;
  totalExpenses: number;
  remainingCash: number;
  newCustomersCount: number;
  closedAccountsCount: number;
  collectionsCount: number;
}
