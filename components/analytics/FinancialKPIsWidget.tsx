import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, getDate, isWithinInterval, startOfMonth } from 'date-fns';
import { Activity, Banknote, PiggyBank, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const FinancialKPIsWidget: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const Colors = useThemeColor();

    const { transactions, budget, income, currencySymbol } = useExpense();

    const kpis = useMemo(() => {
        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);
        const currentDay = getDate(targetDate);

        const monthExpenses = transactions.filter(
            t => t.type === 'expense' &&
                isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }) &&
                !t.excludeFromBudget &&
                !(t.isLent && t.isPaidBack)
        );

        const monthIncome = transactions.filter(
            t => t.type === 'income' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
        );

        const totalExpenses = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = monthIncome.reduce((sum, t) => sum + t.amount, 0);

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
        const burnRate = currentDay > 0 ? totalExpenses / currentDay : 0;
        const transactionCount = monthExpenses.length;
        const budgetRemaining = (budget > 0 ? budget : income) - totalExpenses;

        return [
            {
                label: 'Savings',
                value: `${savingsRate.toFixed(1)}%`,
                icon: PiggyBank,
                color: savingsRate >= 20 ? Colors.success : savingsRate >= 10 ? Colors.warning : Colors.danger,
            },
            {
                label: 'Daily Avg',
                value: `${currencySymbol}${burnRate.toFixed(0)}`,
                icon: Activity,
                color: Colors.primary,
            },
            {
                label: 'Transactions',
                value: String(transactionCount),
                icon: Banknote,
                color: Colors.text,
            },
            {
                label: 'Remaining',
                value: `${currencySymbol}${budgetRemaining.toFixed(0)}`,
                icon: Target,
                color: budgetRemaining >= 0 ? Colors.success : Colors.danger,
            },
        ];
    }, [transactions, budget, income, currencySymbol, Colors, targetDate]);

    return (
        <View style={styles.grid}>
            {kpis.map((kpi, index) => (
                <View
                    key={index}
                    style={[
                        styles.cardContainer,
                        {
                            backgroundColor: Colors.surface,
                            borderColor: Colors.border
                        }
                    ]}
                >
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: kpi.color + '15' }]}>
                            {React.createElement(kpi.icon, { size: 16, color: kpi.color })}
                        </View>
                        <View>
                            <Text style={[styles.value, { color: Colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                                {kpi.value}
                            </Text>
                            <Text style={[styles.label, { color: Colors.textSecondary }]} numberOfLines={1}>
                                {kpi.label}
                            </Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 8,
    },
    cardContainer: {
        width: '48%',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 0.5,
    },
    cardContent: {
        flex: 1,
        padding: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'flex-start',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    value: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    label: {
        fontSize: 10,
        fontFamily: 'Geist-Medium',
        opacity: 0.7,
        letterSpacing: 0.2,
    },
});
