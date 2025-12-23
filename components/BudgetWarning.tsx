import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, getDate, getDaysInMonth, isWithinInterval, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { AlertTriangle, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const BudgetWarning: React.FC = () => {
    const Colors = useThemeColor();
    const router = useRouter();
    const { transactions, budget, currencySymbol, dismissedWarnings, dismissBudgetWarning } = useExpense();

    const warningData = useMemo(() => {
        if (budget === 0) return null;

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

        // Check if warning is dismissed for this month
        if (dismissedWarnings?.[monthKey]) return null;

        const spent = transactions
            .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (spent / budget) * 100;
        const remaining = budget - spent;
        const daysInMonth = getDaysInMonth(now);
        const currentDay = getDate(now);
        const daysRemaining = daysInMonth - currentDay;

        let level: 'warning' | 'alert' | 'danger' | null = null;
        let message = '';
        let color = '';

        if (percentage >= 100) {
            level = 'danger';
            message = `You've exceeded your budget by ${currencySymbol}${Math.abs(remaining).toFixed(0)}`;
            color = Colors.danger;
        } else if (percentage >= 90) {
            level = 'alert';
            message = `You've used ${Math.round(percentage)}% of your budget. ${currencySymbol}${remaining.toFixed(0)} left`;
            color = Colors.warning;
        } else if (percentage >= 80) {
            level = 'warning';
            message = `You've used ${Math.round(percentage)}% of your budget. ${daysRemaining} days remaining`;
            color = '#FFA500'; // Orange
        }

        if (!level) return null;

        return { level, message, color, monthKey, percentage };
    }, [transactions, budget, currencySymbol, dismissedWarnings, Colors]);

    if (!warningData) return null;

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: warningData.color + '15', borderColor: warningData.color }]}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: warningData.color }]}>
                    <AlertTriangle size={20} color="#fff" />
                </View>
                <Text style={[styles.message, { color: Colors.text }]} numberOfLines={2}>
                    {warningData.message}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.dismissButton}
                onPress={(e) => {
                    e.stopPropagation();
                    dismissBudgetWarning(warningData.monthKey);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    message: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    dismissButton: {
        padding: 4,
    },
});
