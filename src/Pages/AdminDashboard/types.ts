export interface Employee {
  id: string;
  name: string;
  age: number;
  phone: string;
  altPhone: string;
  aadharCard: string;
  gmail: string;
  panCard: string;
  village: string;
  assignedArea: string;
  referenceName: string;
  relationshipToReference: string;
  joiningDate: string; // YYYY-MM-DD
  status: 'Active' | 'Inactive';
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
  referenceName: string;
  phone: string;
  startDate: string;
  endDate: string;
  principalAmount: number;
  interestRate: number; // e.g. weekly or monthly percentage
  totalWithInterest: number; // calculated principal + interest
  paymentProcess: 'Daily' | 'Weekly' | 'Monthly';
  payments: PaymentRow[];
  expectedDate: string;
  isClosed?: boolean;
}
