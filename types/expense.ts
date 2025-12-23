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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isPredefined?: boolean;
}
