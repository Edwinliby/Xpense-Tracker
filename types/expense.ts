export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  type: TransactionType;
  deletedAt?: string | null; // For trash
  isFriendPayment?: boolean;
  isPaidBack?: boolean;
  paidBy?: string;
  isLent?: boolean; // Money lent to a friend (you paid, they owe you)
  lentTo?: string; // Name of the friend you lent to
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  receiptImage?: string;
  isRecurring?: boolean;
  recurrenceInterval?: "monthly";
  nextOccurrence?: string; // ISO string
  parentId?: string;
  excludeFromBudget?: boolean;
  note?: string;
  accountId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isPredefined?: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  deadline?: string;
  isCompleted: boolean;
  priority: number; // Lower number = Higher priority
  year: number; // The year this goal belongs to
  startMonth: number; // 0-11 (Jan-Dec)
}

export type TrackingMode = "monthly_budget" | "account_balance";

export type AccountType = string;

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // Current calculated balance
  initialBalance: number; // Starting balance
  currency: string;
  color: string;
  icon: string;
}
