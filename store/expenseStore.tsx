import { useAuth } from '@/context/AuthContext';
import { fetchExchangeRate } from '@/lib/currency';
import { fromSupabaseAchievement, fromSupabaseCategory, fromSupabaseTransaction, supabase, toSupabaseAchievement, toSupabaseCategory, toSupabaseTransaction } from '@/lib/supabase';
import { Achievement, ACHIEVEMENTS } from '@/types/achievements';
import { Category, Transaction, TransactionType } from '@/types/expense';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addMonths } from 'date-fns';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

export type { Category, Transaction, TransactionType };

interface ExpenseContextType {
    transactions: Transaction[];
    trash: Transaction[];
    categories: Category[];
    budget: number;
    income: number;
    incomeStartDate: string | null;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    editTransaction: (id: string, updatedTransaction: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void; // Soft delete
    restoreTransaction: (id: string) => void;
    permanentDeleteTransaction: (id: string) => void;
    emptyTrash: () => void;
    restoreAllTrash: () => void;
    addCategory: (name: string, icon: string, color: string) => void;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
    deleteCategory: (id: string) => void;
    setBudget: (amount: number) => void;
    setIncome: (amount: number) => void;
    setIncomeStartDate: (date: string | null) => void;
    loading: boolean;
    currency: string;
    setCurrency: (currency: string) => Promise<void>;
    currencySymbol: string;
    resetCategories: () => void;
    achievements: Achievement[];
    dismissedWarnings: Record<string, boolean>;
    dismissBudgetWarning: (monthKey: string) => void;
    newlyUnlockedAchievement: Achievement | null;

    clearNewlyUnlockedAchievement: () => void;
    isOffline: boolean;
}

interface SyncAction {
    type: 'ADD_TRANSACTION' | 'UPDATE_TRANSACTION' | 'DELETE_TRANSACTION' | 'RESTORE_TRANSACTION' | 'PERMANENT_DELETE_TRANSACTION' | 'ADD_CATEGORY' | 'UPDATE_CATEGORY' | 'DELETE_CATEGORY' | 'SET_BUDGET' | 'SET_INCOME' | 'SET_INCOME_START_DATE' | 'SET_CURRENCY' | 'DISMISS_WARNING' | 'UPDATE_ACHIEVEMENTS';
    payload: any;
    id: string; // Unique ID for the action
    timestamp: number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpense = () => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpense must be used within an ExpenseProvider');
    }
    return context;
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const defaultCategories: Category[] = [
        { id: '1', name: 'Food', icon: 'Utensils', color: '#FF6B9D', isPredefined: true },
        { id: '2', name: 'Transport', icon: 'Car', color: '#4FACFE', isPredefined: true },
        { id: '3', name: 'Shopping', icon: 'ShoppingBag', color: '#A8EDEA', isPredefined: true },
        { id: '4', name: 'Bills', icon: 'FileText', color: '#FFA07A', isPredefined: true },
        { id: '5', name: 'Entertainment', icon: 'Gamepad2', color: '#C471F5', isPredefined: true },
        { id: '6', name: 'Health', icon: 'Heart', color: '#FF6B6B', isPredefined: true },
        { id: '7', name: 'Education', icon: 'BookOpen', color: '#34D399', isPredefined: true },
        { id: '8', name: 'Other', icon: 'MoreHorizontal', color: '#FBBF24', isPredefined: true },
    ];

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [trash, setTrash] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>(defaultCategories);
    const [budget, setBudgetState] = useState(0);
    const [income, setIncomeState] = useState(0);
    const [incomeStartDate, setIncomeStartDateState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrencyState] = useState('USD');
    const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
    const [dismissedWarnings, setDismissedWarnings] = useState<Record<string, boolean>>({});

    const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [syncQueue, setSyncQueue] = useState<SyncAction[]>([]);

    const { user } = useAuth();

    const getCurrencySymbol = (code: string) => {
        switch (code) {
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'JPY': return '¥';
            case 'CAD': return 'C$';
            case 'AUD': return 'A$';
            case 'INR': return '₹';
            default: return '$';
        }
    };
    const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

    // Auto‑delete trash items older than 3 minutes
    const trashRef = useRef(trash);
    trashRef.current = trash;
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const threeMinutes = 3 * 60 * 1000;
            const toDelete = trashRef.current.filter(t => t.deletedAt && now - new Date(t.deletedAt).getTime() > threeMinutes);
            if (toDelete.length) {
                const newTrash = trashRef.current.filter(t => !toDelete.includes(t));
                setTrash(newTrash);
                saveData('trash', newTrash);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const saveData = async (key: string, value: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Failed to save ${key}`, e);
        }
    };

    const addToQueue = async (action: Omit<SyncAction, 'id' | 'timestamp'>) => {
        const newAction: SyncAction = {
            ...action,
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            timestamp: Date.now()
        };
        setSyncQueue(prev => {
            const updated = [...prev, newAction];
            saveData('syncQueue', updated);
            return updated;
        });
    };

    const processQueue = useCallback(async () => {
        if (!user || syncQueue.length === 0) return;

        console.log('Processing sync queue...', syncQueue.length);
        const queueCopy = [...syncQueue];
        const remainingQueue: SyncAction[] = [];

        for (const action of queueCopy) {
            let error: any = null;
            try {
                switch (action.type) {
                    case 'ADD_TRANSACTION':
                        ({ error } = await supabase.from('transactions').insert({ ...toSupabaseTransaction(action.payload), user_id: user.id }));
                        break;
                    case 'UPDATE_TRANSACTION':
                        ({ error } = await supabase.from('transactions').update({ ...toSupabaseTransaction(action.payload), user_id: user.id }).eq('id', action.payload.id));
                        break;
                    case 'DELETE_TRANSACTION': // Soft delete
                        ({ error } = await supabase.from('transactions').update({ deleted_at: action.payload.deletedAt, user_id: user.id }).eq('id', action.payload.id));
                        break;
                    case 'RESTORE_TRANSACTION':
                        ({ error } = await supabase.from('transactions').update({ deleted_at: null, user_id: user.id }).eq('id', action.payload));
                        break;
                    case 'PERMANENT_DELETE_TRANSACTION':
                        ({ error } = await supabase.from('transactions').delete().eq('id', action.payload).eq('user_id', user.id));
                        break;
                    case 'ADD_CATEGORY':
                        ({ error } = await supabase.from('categories').insert({ ...toSupabaseCategory(action.payload), user_id: user.id }));
                        break;
                    case 'UPDATE_CATEGORY':
                        ({ error } = await supabase.from('categories').update({ ...toSupabaseCategory(action.payload), user_id: user.id }).eq('id', action.payload.id));
                        break;
                    case 'DELETE_CATEGORY':
                        ({ error } = await supabase.from('categories').delete().eq('id', action.payload).eq('user_id', user.id));
                        break;
                    case 'SET_BUDGET':
                        ({ error } = await supabase.from('user_settings').upsert({ key: 'budget', value: action.payload.toString(), user_id: user.id }));
                        break;
                    case 'SET_INCOME':
                        ({ error } = await supabase.from('user_settings').upsert({ key: 'income', value: action.payload.toString(), user_id: user.id }));
                        break;
                    case 'SET_INCOME_START_DATE':
                        if (action.payload) {
                            ({ error } = await supabase.from('user_settings').upsert({ key: 'incomeStartDate', value: action.payload, user_id: user.id }));
                        } else {
                            ({ error } = await supabase.from('user_settings').delete().eq('key', 'incomeStartDate').eq('user_id', user.id));
                        }
                        break;
                    case 'SET_CURRENCY':
                        // This corresponds to the complex setCurrency logic, but effectively we just need to update settings + transactions
                        // For simplicity in queue, we assume the bulk update happened locally and we just push settings.
                        // Realistically, bulk update of transactions should be separate actions or a specific bulk action.
                        // For now, let's just update the setting key. The transaction updates might need to be queued individually if done offline?
                        // Actually, setCurrency makes many updates. If offline, we might just queue the setting change, but the transactions would need to be updated too.
                        // Handled by: re-queuing all transaction updates? Or a special 'BULK_UPDATE_CURRENCY' action?
                        // Let's stick to setting update for now, acknowledging limitation.
                        ({ error } = await supabase.from('user_settings').upsert({ key: 'currency', value: action.payload, user_id: user.id }));
                        break;
                    case 'DISMISS_WARNING':
                        ({ error } = await supabase.from('user_settings').upsert({ key: 'dismissedWarnings', value: JSON.stringify(action.payload), user_id: user.id }));
                        break;
                    case 'UPDATE_ACHIEVEMENTS':
                        ({ error } = await supabase.from('achievements').upsert(
                            action.payload.map((a: Achievement) => ({ ...toSupabaseAchievement(a), user_id: user.id }))
                        ));
                        break;
                }
            } catch (e: any) {
                console.error('Queue processing error', e);
                error = e;
            }

            if (error) {
                console.error(`Failed to process action ${action.type}`, error);
                remainingQueue.push(action); // Keep in queue if failed
            }
        }

        setSyncQueue(remainingQueue);
        saveData('syncQueue', remainingQueue);
    }, [user, syncQueue]);

    // Network Listener
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const offline = state.isConnected === false;
            setIsOffline(offline);
            if (!offline) {
                processQueue();
            }
        });
        return () => unsubscribe();
    }, [processQueue]);

    const checkAchievements = useCallback((allTransactions: Transaction[]) => {
        setAchievements(prev => {
            let updated = [...prev];
            let hasChanges = false;

            // Check each achievement
            ACHIEVEMENTS.forEach(achievement => {
                const existing = updated.find(a => a.id === achievement.id);
                if (existing?.unlockedAt) return; // Already unlocked

                let progress = 0;
                let shouldUnlock = false;

                switch (achievement.id) {
                    case 'first_transaction':
                        progress = allTransactions.length > 0 ? 1 : 0;
                        shouldUnlock = progress >= 1;
                        break;
                    case 'category_explorer':
                        progress = new Set(allTransactions.map(t => t.category)).size;
                        shouldUnlock = progress >= 5;
                        break;
                    case 'receipt_keeper':
                        progress = allTransactions.filter(t => t.receiptImage).length;
                        shouldUnlock = progress >= 10;
                        break;
                    case 'organized':
                        progress = allTransactions.length;
                        shouldUnlock = progress >= 50;
                        break;
                    case 'century_club':
                        progress = allTransactions.length;
                        shouldUnlock = progress >= 100;
                        break;
                }

                if (shouldUnlock) {
                    const index = updated.findIndex(a => a.id === achievement.id);
                    if (index !== -1) {
                        updated[index] = { ...updated[index], unlockedAt: new Date().toISOString(), progress };
                        setNewlyUnlockedAchievement(updated[index]);
                        hasChanges = true;
                    }
                } else if (progress > 0) {
                    const index = updated.findIndex(a => a.id === achievement.id);
                    if (index !== -1 && updated[index].progress !== progress) {
                        updated[index] = { ...updated[index], progress };
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                const toSync = updated.filter(a => {
                    const old = prev.find(p => p.id === a.id);
                    return !old || old.progress !== a.progress || old.unlockedAt !== a.unlockedAt;
                });

                saveData('achievements', updated);
                if (user) {
                    if (isOffline) {
                        addToQueue({ type: 'UPDATE_ACHIEVEMENTS', payload: toSync });
                    } else {
                        supabase.from('achievements').upsert(
                            toSync.map(a => ({ ...toSupabaseAchievement(a), user_id: user.id }))
                        ).then(({ error }) => {
                            if (error) {
                                console.error('Supabase update achievements error', error);
                                addToQueue({ type: 'UPDATE_ACHIEVEMENTS', payload: toSync });
                            }
                        });
                    }
                }
            }
            return hasChanges ? updated : prev;
        });
    }, []);

    const checkBudgetAndNotify = useCallback(async (currentTransactions: Transaction[], currentBudget: number, currentIncome: number) => {
        if (currentBudget === 0) return;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

        // Check if we already notified for this month/level
        const notifiedKey = `notified-${monthKey}`;
        const notifiedLevel = await AsyncStorage.getItem(notifiedKey);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const spent = currentTransactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
            .filter(t => !(t.isLent && t.isPaidBack))
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / currentBudget) * 100;
        let newLevel: 'warning' | 'danger' | null = null;
        let title = '';
        let body = '';

        if (percentage >= 100) {
            newLevel = 'danger';
            title = 'Budget Exceeded!';
            body = `You've exceeded your budget of ${currencySymbol}${currentBudget}.`;
        } else if (percentage >= 90) {
            newLevel = 'warning';
            title = 'Budget Alert';
            body = `You've used ${Math.round(percentage)}% of your budget. Less than 10% remaining.`;
        }

        if (newLevel && newLevel !== notifiedLevel) {
            // Notification logic removed
            await AsyncStorage.setItem(notifiedKey, newLevel);
        } else if (!newLevel && notifiedLevel) {
            // Reset if we are back to safe zone (e.g. deleted transaction)
            await AsyncStorage.removeItem(notifiedKey);
        }
    }, [currencySymbol]);

    const processRecurringTransactions = useCallback(async (currentTransactions: Transaction[]) => {
        const now = new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(now.getFullYear() + 1);

        const recurring = currentTransactions.filter(t => t.isRecurring && t.nextOccurrence);
        console.log(`[Recurring] Processing ${recurring.length} recurring candidates from ${currentTransactions.length} total.`);
        let hasChanges = false;
        let updatedTransactions = [...currentTransactions];

        for (const t of recurring) {
            if (!t.nextOccurrence) continue;
            let nextDate = new Date(t.nextOccurrence);

            // While next occurrence is within the next year
            while (nextDate <= oneYearFromNow) {
                hasChanges = true;
                console.log(`[Recurring] Generating transaction for ${t.description} on ${nextDate.toISOString()}`);
                console.log(`[Recurring] Parent ID: ${t.id}, Next Date: ${nextDate.toISOString()}`);

                // 1. Create new transaction instance
                const newTx: Transaction = {
                    ...t,
                    id: Date.now().toString() + Math.random().toString().slice(2, 5), // Ensure unique ID
                    date: nextDate.toISOString(),
                    isRecurring: false, // Instance is not recurring itself
                    recurrenceInterval: undefined,
                    nextOccurrence: undefined,
                    originalAmount: undefined, // Reset if needed
                    parentId: t.id, // Link to parent
                };
                updatedTransactions = [newTx, ...updatedTransactions];

                // 2. Update next occurrence for the original transaction
                // Use date-fns addMonths to handle end-of-month edge cases correctly
                nextDate = addMonths(nextDate, 1);
            }

            // Update the original transaction with the new nextOccurrence
            if (hasChanges) {
                updatedTransactions = updatedTransactions.map(tx => {
                    if (tx.id === t.id) {
                        return { ...tx, nextOccurrence: nextDate.toISOString() };
                    }
                    return tx;
                });
            }
        }

        if (hasChanges) {
            setTransactions(updatedTransactions);
            saveData('transactions', updatedTransactions);
            checkAchievements(updatedTransactions);

            if (user) {
                // Identify new and modified
                const newOnes = updatedTransactions.filter(tx => !currentTransactions.find(old => old.id === tx.id));
                const modifiedOnes = updatedTransactions.filter(tx => {
                    const old = currentTransactions.find(o => o.id === tx.id);
                    return old && old.nextOccurrence !== tx.nextOccurrence;
                });

                const toSync = [...newOnes, ...modifiedOnes];
                if (toSync.length > 0) {
                    const { error } = await supabase.from('transactions').upsert(
                        toSync.map(t => ({ ...toSupabaseTransaction(t), user_id: user.id }))
                    );
                    if (error) console.error('Supabase recurring sync error', error);
                }
            }
        }
    }, [user, checkAchievements]);

    const loadData = async () => {
        try {
            const storedTransactions = await AsyncStorage.getItem('transactions');
            const storedTrash = await AsyncStorage.getItem('trash');
            const storedCategories = await AsyncStorage.getItem('categories');
            const storedBudget = await AsyncStorage.getItem('budget');
            const storedIncome = await AsyncStorage.getItem('income');
            const storedIncomeStartDate = await AsyncStorage.getItem('incomeStartDate');
            const storedCurrency = await AsyncStorage.getItem('currency');
            const storedAchievements = await AsyncStorage.getItem('achievements');

            const storedDismissedWarnings = await AsyncStorage.getItem('dismissedWarnings');
            const storedQueue = await AsyncStorage.getItem('syncQueue');

            let currentQueue: SyncAction[] = [];
            if (storedQueue) {
                currentQueue = JSON.parse(storedQueue);
                setSyncQueue(currentQueue);
            }

            if (storedTransactions) {
                const parsed = JSON.parse(storedTransactions);
                setTransactions(parsed);
                // Process recurring transactions from local storage too
                processRecurringTransactions(parsed);
            }
            if (storedTrash) setTrash(JSON.parse(storedTrash));
            if (storedCategories) setCategories(JSON.parse(storedCategories));
            if (storedBudget) setBudgetState(parseFloat(storedBudget));
            if (storedIncome) setIncomeState(parseFloat(storedIncome));
            if (storedIncomeStartDate) setIncomeStartDateState(storedIncomeStartDate);
            if (storedCurrency) setCurrencyState(storedCurrency);
            if (storedAchievements) setAchievements(JSON.parse(storedAchievements));
            if (storedDismissedWarnings) setDismissedWarnings(JSON.parse(storedDismissedWarnings));

            if (user) {
                // Sync with Supabase
                const { data: remoteTransactions, error: txError } = await supabase.from('transactions').select('*').eq('user_id', user.id);
                if (remoteTransactions && !txError) {
                    const parsed = remoteTransactions.map(fromSupabaseTransaction);
                    let active = parsed.filter(t => !t.deletedAt);
                    const trashed = parsed.filter(t => t.deletedAt);

                    // Merge pending transactions from queue (Optimistic UI)
                    // This prevents items from disappearing if they exist locally but haven't synced yet
                    if (currentQueue.length > 0) {
                        const pendingAdds = currentQueue
                            .filter(a => a.type === 'ADD_TRANSACTION')
                            .map(a => a.payload as Transaction);

                        // Add only if not already in remote list
                        const uniquePending = pendingAdds.filter(p => !active.some(r => r.id === p.id));
                        active = [...uniquePending, ...active];
                    }

                    setTransactions(active);
                    setTrash(trashed);
                    saveData('transactions', active);
                    saveData('trash', trashed);

                    // Process recurring transactions after loading
                    processRecurringTransactions(active);
                }

                const { data: remoteCategories, error: catError } = await supabase.from('categories').select('*').eq('user_id', user.id);
                if (remoteCategories && !catError) {
                    const parsed = remoteCategories.map(fromSupabaseCategory);
                    if (parsed.length > 0) {
                        setCategories(parsed);
                        saveData('categories', parsed);
                    } else {
                        // Push defaults if remote is empty
                        const { error } = await supabase.from('categories').upsert(categories.map(c => ({ ...toSupabaseCategory(c), user_id: user.id })));
                        if (error) console.error('Failed to push default categories', error);
                    }
                }

                const { data: settings, error: settingsError } = await supabase.from('user_settings').select('*').eq('user_id', user.id);
                if (settings && !settingsError) {
                    settings.forEach(s => {
                        if (s.key === 'budget') { setBudgetState(parseFloat(s.value)); saveData('budget', s.value); }
                        if (s.key === 'income') { setIncomeState(parseFloat(s.value)); saveData('income', s.value); }
                        if (s.key === 'incomeStartDate') { setIncomeStartDateState(s.value); saveData('incomeStartDate', s.value); }
                        if (s.key === 'currency') { setCurrencyState(s.value); saveData('currency', s.value); }
                        if (s.key === 'dismissedWarnings') {
                            try {
                                const parsed = JSON.parse(s.value);
                                setDismissedWarnings(parsed);
                                saveData('dismissedWarnings', parsed);
                            } catch (e) {
                                console.error('Failed to parse dismissedWarnings from Supabase', e);
                            }
                        }
                    });
                }

                const { data: remoteAchievements, error: achError } = await supabase.from('achievements').select('*').eq('user_id', user.id);
                if (remoteAchievements && !achError) {
                    const parsedRemote = remoteAchievements.map(fromSupabaseAchievement);
                    setAchievements(prev => {
                        const merged = prev.map(local => {
                            const remote = parsedRemote.find(r => r.id === local.id);
                            if (remote) {
                                return { ...local, ...remote };
                            }
                            return local;
                        });
                        saveData('achievements', merged);
                        return merged;
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    // Trigger queue processing when user becomes available or queue changes (and we are online)
    useEffect(() => {
        if (user && !isOffline && syncQueue.length > 0) {
            processQueue();
        }
    }, [user, isOffline]); // syncQueue in deps might cause loops if processQueue updates it, but processQueue handles that.


    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction: Transaction = { ...transaction, id: Date.now().toString(), deletedAt: null };
        const updated = [newTransaction, ...transactions];

        setTransactions(updated);
        saveData('transactions', updated);
        checkAchievements(updated);
        checkBudgetAndNotify(updated, budget, income);

        // Trigger recurring processing
        if (newTransaction.isRecurring) {
            console.log('[Add] Triggering recurring processing for new transaction');
            processRecurringTransactions(updated);
        }

        if (user) {
            if (isOffline) {
                addToQueue({ type: 'ADD_TRANSACTION', payload: newTransaction });
            } else {
                const { error } = await supabase.from('transactions').insert({ ...toSupabaseTransaction(newTransaction), user_id: user.id });
                if (error) {
                    console.error('Supabase add error', error);
                    addToQueue({ type: 'ADD_TRANSACTION', payload: newTransaction });
                }
            }
        }
    }, [transactions, checkAchievements, user, processRecurringTransactions, checkBudgetAndNotify, budget, income, isOffline]);

    const editTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
        let updatedTransaction: Transaction | undefined;
        let futureUpdates: Transaction[] = [];

        // 1. Update the target transaction
        const updated = transactions.map(t => {
            if (t.id === id) {
                updatedTransaction = { ...t, ...updates };
                return updatedTransaction;
            }
            return t;
        });

        // 2. If it's a recurring transaction, update future instances
        let finalUpdated = updated;
        if (updatedTransaction?.isRecurring) {
            const now = new Date();
            futureUpdates = updated.filter(t => t.parentId === id && new Date(t.date) > now);

            if (futureUpdates.length > 0) {
                // Apply relevant updates to future instances (exclude id, date, etc.)
                const { id: _id, date: _date, isRecurring: _isRecurring, nextOccurrence: _nextOccurrence, parentId: _parentId, ...propUpdates } = updates;

                finalUpdated = updated.map(t => {
                    if (t.parentId === id && new Date(t.date) > now) {
                        return { ...t, ...propUpdates };
                    }
                    return t;
                });
            }
        }

        setTransactions(finalUpdated);
        saveData('transactions', finalUpdated);
        checkAchievements(finalUpdated);
        checkBudgetAndNotify(finalUpdated, budget, income);

        if (updatedTransaction && user) {
            if (isOffline) {
                addToQueue({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
                // Future updates
                if (futureUpdates.length > 0) {
                    const { id: _id, date: _date, isRecurring: _isRecurring, nextOccurrence: _nextOccurrence, parentId: _parentId, ...propUpdates } = updates;
                    futureUpdates.forEach(futureTx => {
                        addToQueue({ type: 'UPDATE_TRANSACTION', payload: { ...futureTx, ...propUpdates } });
                    });
                }
            } else {
                const { error } = await supabase.from('transactions').update({ ...toSupabaseTransaction(updatedTransaction), user_id: user.id }).eq('id', id);
                if (error) {
                    console.error('Supabase update error', error);
                    addToQueue({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
                }

                // Sync future updates
                if (futureUpdates.length > 0) {
                    const { id: _id, date: _date, isRecurring: _isRecurring, nextOccurrence: _nextOccurrence, parentId: _parentId, ...propUpdates } = updates;
                    for (const futureTx of futureUpdates) {
                        const { error: futureError } = await supabase.from('transactions').update({ ...toSupabaseTransaction({ ...futureTx, ...propUpdates }), user_id: user.id }).eq('id', futureTx.id);
                        if (futureError) {
                            console.error('Supabase future update error', futureError);
                            addToQueue({ type: 'UPDATE_TRANSACTION', payload: { ...futureTx, ...propUpdates } });
                        }
                    }
                }
            }
        }
    }, [transactions, checkAchievements, user, checkBudgetAndNotify, budget, income, isOffline]);

    const deleteTransaction = useCallback(async (id: string) => {
        let deletedTransaction: Transaction | undefined;
        let futureDeletions: Transaction[] = [];

        setTransactions(prev => {
            const toDelete = prev.find(t => t.id === id);
            if (!toDelete) return prev;

            // 1. Soft delete the target
            deletedTransaction = { ...toDelete, deletedAt: new Date().toISOString() };

            // 2. If recurring, find future instances to delete
            let updated = prev.filter(t => t.id !== id);

            if (toDelete.isRecurring) {
                const now = new Date();
                futureDeletions = prev.filter(t => t.parentId === id && new Date(t.date) > now);
                updated = updated.filter(t => !(t.parentId === id && new Date(t.date) > now));
            }

            saveData('transactions', updated);
            checkBudgetAndNotify(updated, budget, income);

            setTrash(prevTrash => {
                const newTrashItems = [deletedTransaction!, ...futureDeletions.map(t => ({ ...t, deletedAt: new Date().toISOString() }))];
                const newTrash = [...newTrashItems, ...prevTrash];
                saveData('trash', newTrash);
                return newTrash;
            });
            return updated;
        });

        if (deletedTransaction && user) {
            if (isOffline) {
                addToQueue({ type: 'DELETE_TRANSACTION', payload: deletedTransaction }); // Soft delete, needs deletedAt and ID
                futureDeletions.forEach(futureTx => {
                    addToQueue({ type: 'DELETE_TRANSACTION', payload: { ...futureTx, deletedAt: new Date().toISOString() } });
                });
            } else {
                const { error } = await supabase.from('transactions').update({ deleted_at: deletedTransaction.deletedAt, user_id: user.id }).eq('id', id);
                if (error) {
                    console.error('Supabase delete error', error);
                    addToQueue({ type: 'DELETE_TRANSACTION', payload: deletedTransaction });
                }

                if (futureDeletions.length > 0) {
                    for (const futureTx of futureDeletions) {
                        const { error: futureError } = await supabase.from('transactions').update({ deleted_at: new Date().toISOString(), user_id: user.id }).eq('id', futureTx.id);
                        if (futureError) {
                            console.error('Supabase future delete error', futureError);
                            addToQueue({ type: 'DELETE_TRANSACTION', payload: { ...futureTx, deletedAt: new Date().toISOString() } });
                        }
                    }
                }
            }
        }
    }, [user, checkBudgetAndNotify, budget, income, isOffline]);

    const restoreTransaction = useCallback(async (id: string) => {
        let restoredTransaction: Transaction | undefined;
        setTrash(prev => {
            const toRestore = prev.find(t => t.id === id);
            if (!toRestore) return prev;
            const newTrash = prev.filter(t => t.id !== id);
            saveData('trash', newTrash);
            restoredTransaction = { ...toRestore, deletedAt: null };
            setTransactions(prevTrans => {
                const newTrans = [restoredTransaction!, ...prevTrans];
                saveData('transactions', newTrans);
                checkBudgetAndNotify(newTrans, budget, income);
                return newTrans;
            });
            return newTrash;
        });

        if (restoredTransaction && user) {
            if (isOffline) {
                addToQueue({ type: 'RESTORE_TRANSACTION', payload: id }); // Special handling for ID payload
            } else {
                const { error } = await supabase.from('transactions').update({ deleted_at: null, user_id: user.id }).eq('id', id);
                if (error) {
                    console.error('Supabase restore error', error);
                    addToQueue({ type: 'RESTORE_TRANSACTION', payload: id });
                }
            }
        }
    }, [user, checkBudgetAndNotify, budget, income, isOffline]);

    const permanentDeleteTransaction = useCallback(async (id: string) => {
        setTrash(prev => {
            const newTrash = prev.filter(t => t.id !== id);
            saveData('trash', newTrash);
            return newTrash;
        });
        if (user) {
            if (isOffline) {
                addToQueue({ type: 'PERMANENT_DELETE_TRANSACTION', payload: id });
            } else {
                const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
                if (error) {
                    console.error('Supabase permanent delete error', error);
                    addToQueue({ type: 'PERMANENT_DELETE_TRANSACTION', payload: id });
                }
            }
        }
    }, [user, isOffline]);

    const emptyTrash = useCallback(async () => {
        setTrash([]);
        saveData('trash', []);
        if (user) {
            // Delete all transactions that have a deleted_at timestamp
            const { error } = await supabase.from('transactions').delete().not('deleted_at', 'is', null).eq('user_id', user.id);
            if (error) console.error('Supabase empty trash error', error);
        }
    }, [user]);

    const restoreAllTrash = useCallback(async () => {
        setTrash(prevTrash => {
            if (prevTrash.length === 0) return prevTrash;

            const restoredTransactions = prevTrash.map(t => ({ ...t, deletedAt: null }));

            setTransactions(prevTrans => {
                const newTrans = [...restoredTransactions, ...prevTrans];
                saveData('transactions', newTrans);
                checkBudgetAndNotify(newTrans, budget, income);
                return newTrans;
            });

            saveData('trash', []);
            return [];
        });

        if (user) {
            const { error } = await supabase.from('transactions').update({ deleted_at: null }).not('deleted_at', 'is', null).eq('user_id', user.id);
            if (error) console.error('Supabase restore all error', error);
        }
    }, [user, checkBudgetAndNotify, budget, income]);

    const addCategory = useCallback(async (name: string, icon: string, color: string) => {
        const newCat: Category = { id: Date.now().toString(), name, icon, color, isPredefined: false };
        setCategories(prev => {
            const updated = [...prev, newCat];
            saveData('categories', updated);
            return updated;
        });
        if (user) {
            if (isOffline) {
                addToQueue({ type: 'ADD_CATEGORY', payload: newCat });
            } else {
                const { error } = await supabase.from('categories').insert({ ...toSupabaseCategory(newCat), user_id: user.id });
                if (error) {
                    console.error('Supabase add category error', error);
                    addToQueue({ type: 'ADD_CATEGORY', payload: newCat });
                }
            }
        }
    }, [user, isOffline]);

    const updateCategory = useCallback(async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
        let updatedCat: Category | undefined;
        setCategories(prev => {
            const updated = prev.map(c => {
                if (c.id === id) {
                    updatedCat = { ...c, ...updates };
                    return updatedCat;
                }
                return c;
            });
            saveData('categories', updated);
            return updated;
        });
        if (updatedCat && user) {
            if (isOffline) {
                addToQueue({ type: 'UPDATE_CATEGORY', payload: updatedCat });
            } else {
                const { error } = await supabase.from('categories').update({ ...toSupabaseCategory(updatedCat), user_id: user.id }).eq('id', id);
                if (error) {
                    console.error('Supabase update category error', error);
                    addToQueue({ type: 'UPDATE_CATEGORY', payload: updatedCat });
                }
            }
        }
    }, [user, isOffline]);

    const deleteCategory = useCallback(async (id: string) => {
        setCategories(prev => {
            const cat = prev.find(c => c.id === id);
            if (cat?.isPredefined) {
                return prev;
            }
            const updated = prev.filter(c => c.id !== id);
            saveData('categories', updated);
            return updated;
        });
        const cat = categories.find(c => c.id === id);
        if (cat && !cat.isPredefined && user) {
            if (isOffline) {
                addToQueue({ type: 'DELETE_CATEGORY', payload: id });
            } else {
                const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
                if (error) {
                    console.error('Supabase delete category error', error);
                    addToQueue({ type: 'DELETE_CATEGORY', payload: id });
                }
            }
        }
    }, [categories, user, isOffline]);

    const setBudget = useCallback((amount: number) => {
        setBudgetState(amount);
        AsyncStorage.setItem('budget', amount.toString());
        if (user) {
            if (isOffline) {
                addToQueue({ type: 'SET_BUDGET', payload: amount });
            } else {
                supabase.from('user_settings').upsert({ key: 'budget', value: amount.toString(), user_id: user.id }).then(({ error }) => {
                    if (error) {
                        console.error('Supabase set budget error', error);
                        addToQueue({ type: 'SET_BUDGET', payload: amount });
                    }
                });
            }
        }
    }, [user, isOffline]);

    const setIncome = useCallback((amount: number) => {
        setIncomeState(amount);
        AsyncStorage.setItem('income', amount.toString());
        if (user) {
            if (isOffline) {
                addToQueue({ type: 'SET_INCOME', payload: amount });
            } else {
                supabase.from('user_settings').upsert({ key: 'income', value: amount.toString(), user_id: user.id }).then(({ error }) => {
                    if (error) {
                        console.error('Supabase set income error', error);
                        addToQueue({ type: 'SET_INCOME', payload: amount });
                    }
                });
            }
        }
    }, [user, isOffline]);

    const setIncomeStartDate = useCallback((date: string | null) => {
        setIncomeStartDateState(date);
        if (date) {
            AsyncStorage.setItem('incomeStartDate', date);
            if (user) {
                if (isOffline) {
                    addToQueue({ type: 'SET_INCOME_START_DATE', payload: date });
                } else {
                    supabase.from('user_settings').upsert({ key: 'incomeStartDate', value: date, user_id: user.id }).then(({ error }) => {
                        if (error) {
                            console.error('Supabase set incomeStartDate error', error);
                            addToQueue({ type: 'SET_INCOME_START_DATE', payload: date });
                        }
                    });
                }
            }
        } else {
            AsyncStorage.removeItem('incomeStartDate');
            if (user) {
                if (isOffline) {
                    addToQueue({ type: 'SET_INCOME_START_DATE', payload: null });
                } else {
                    supabase.from('user_settings').delete().eq('key', 'incomeStartDate').eq('user_id', user.id).then(({ error }) => {
                        if (error) {
                            console.error('Supabase delete incomeStartDate error', error);
                            addToQueue({ type: 'SET_INCOME_START_DATE', payload: null });
                        }
                    });
                }
            }
        }
    }, [user, isOffline]);

    const setCurrency = useCallback(async (cur: string) => {
        if (cur === currency) return;

        setLoading(true);
        try {
            const rate = await fetchExchangeRate(currency, cur);
            console.log(`Swapping currency: ${currency} -> ${cur}, Rate: ${rate}`);
            console.log(`Old Budget: ${budget}, Expected New: ${budget * rate}`);

            if (!rate || isNaN(rate)) {
                throw new Error('Invalid exchange rate');
            }

            // Convert budget and income
            const newBudget = Math.round(budget * rate);
            const newIncome = Math.round(income * rate);

            console.log(`New Budget: ${newBudget}`);

            setBudgetState(newBudget);
            setIncomeState(newIncome);
            saveData('budget', newBudget);
            saveData('income', newIncome);

            // Convert transactions
            const newTransactions = transactions.map(t => ({
                ...t,
                amount: Math.round(t.amount * rate),
                currency: cur
            }));
            setTransactions(newTransactions);
            saveData('transactions', newTransactions);

            // Convert trash
            const newTrash = trash.map(t => ({
                ...t,
                amount: Math.round(t.amount * rate),
                currency: cur
            }));
            setTrash(newTrash);
            saveData('trash', newTrash);

            setCurrencyState(cur);
            saveData('currency', cur);

            if (user) {
                // Update settings
                await supabase.from('user_settings').upsert([
                    { key: 'currency', value: cur, user_id: user.id },
                    { key: 'budget', value: newBudget.toString(), user_id: user.id },
                    { key: 'income', value: newIncome.toString(), user_id: user.id }
                ]);

                // Update transactions in Supabase
                // Note: This might be heavy for many transactions. 
                // Ideally, we'd do this in a batch or backend function, but for now we'll do client-side loop or batch upsert.
                // Batch upsert is better.
                const { error: txError } = await supabase.from('transactions').upsert(
                    newTransactions.map(t => ({ ...toSupabaseTransaction(t), user_id: user.id }))
                );
                if (txError) console.error('Supabase update transactions currency error', txError);
            }
        } catch (error) {
            console.error('Failed to change currency', error);
            if (isOffline) {
                // If offline, queue the currency change setting
                addToQueue({ type: 'SET_CURRENCY', payload: cur });
            } else {
                Alert.alert('Error', 'Failed to update currency. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [currency, budget, income, transactions, trash, user, isOffline]);

    const resetCategories = useCallback(() => {
        setCategories(defaultCategories);
        saveData('categories', defaultCategories);
    }, []);

    const dismissBudgetWarning = useCallback((monthKey: string) => {
        setDismissedWarnings(prev => {
            const updated = { ...prev, [monthKey]: true };
            saveData('dismissedWarnings', updated);
            if (user) {
                if (isOffline) {
                    addToQueue({ type: 'DISMISS_WARNING', payload: updated });
                } else {
                    supabase.from('user_settings').upsert({
                        key: 'dismissedWarnings',
                        value: JSON.stringify(updated),
                        user_id: user.id
                    }).then(({ error }) => {
                        if (error) {
                            console.error('Supabase dismiss warning error', error);
                            addToQueue({ type: 'DISMISS_WARNING', payload: updated });
                        }
                    });
                }
            }
            return updated;
        });
    }, [user, isOffline]);

    const clearNewlyUnlockedAchievement = useCallback(() => {
        setNewlyUnlockedAchievement(null);
    }, []);




    return (
        <ExpenseContext.Provider
            value={{
                transactions,
                trash,
                categories,
                budget,
                income,
                incomeStartDate,
                addTransaction,
                editTransaction,
                deleteTransaction,
                restoreTransaction,
                permanentDeleteTransaction,
                emptyTrash,
                restoreAllTrash,
                addCategory,
                updateCategory,
                deleteCategory,
                setBudget,
                setIncome,
                setIncomeStartDate,
                loading,
                currency,
                setCurrency,
                currencySymbol,
                resetCategories,
                achievements,
                dismissedWarnings,
                dismissBudgetWarning,
                newlyUnlockedAchievement,
                clearNewlyUnlockedAchievement,
                isOffline,
            }}
        >
            {children}
        </ExpenseContext.Provider>
    );
};
