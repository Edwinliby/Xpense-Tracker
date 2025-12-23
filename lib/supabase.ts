import { Category, Transaction } from "@/types/expense";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const toSupabaseTransaction = (t: Transaction) => ({
  id: t.id,
  amount: t.amount,
  category: t.category,
  description: t.description,
  date: t.date,
  type: t.type,
  deleted_at: t.deletedAt,
  is_friend_payment: t.isFriendPayment,
  is_paid_back: t.isPaidBack,
  paid_by: t.paidBy,
  is_lent: t.isLent,
  lent_to: t.lentTo,
  currency: t.currency,
  original_amount: t.originalAmount,
  exchange_rate: t.exchangeRate,
  receipt_image: t.receiptImage,
  is_recurring: t.isRecurring,
  recurrence_interval: t.recurrenceInterval,
  next_occurrence: t.nextOccurrence,
  parent_id: t.parentId,
});

export const fromSupabaseTransaction = (t: any): Transaction => ({
  id: t.id,
  amount: t.amount,
  category: t.category,
  description: t.description,
  date: t.date,
  type: t.type,
  deletedAt: t.deleted_at,
  isFriendPayment: t.is_friend_payment,
  isPaidBack: t.is_paid_back,
  paidBy: t.paid_by,
  isLent: t.is_lent,
  lentTo: t.lent_to,
  currency: t.currency,
  originalAmount: t.original_amount,
  exchangeRate: t.exchange_rate,
  receiptImage: t.receipt_image,
  isRecurring: t.is_recurring,
  recurrenceInterval: t.recurrence_interval,
  nextOccurrence: t.next_occurrence,
  parentId: t.parent_id,
});

export const toSupabaseCategory = (c: Category) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  color: c.color,
  is_predefined: c.isPredefined,
});

export const fromSupabaseCategory = (c: any): Category => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  color: c.color,
  isPredefined: c.is_predefined,
});

export const toSupabaseAchievement = (a: {
  id: string;
  unlockedAt?: string;
  progress?: number;
}) => ({
  id: a.id,
  unlocked_at: a.unlockedAt,
  progress: a.progress,
});

export const fromSupabaseAchievement = (a: any) => ({
  id: a.id,
  unlockedAt: a.unlocked_at,
  progress: a.progress,
});
