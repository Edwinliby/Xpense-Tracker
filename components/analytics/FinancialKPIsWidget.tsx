import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, getDate, isWithinInterval, startOfMonth } from 'date-fns';
import { Activity, Banknote, PiggyBank, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const FinancialKPIsWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, budget, income, currencySymbol } = useExpense();

    const kpis = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const currentDay = getDate(now);

        const monthExpenses = transactions.filter(
            t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
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
                label: 'Savings Rate',
                value: `${savingsRate.toFixed(1)}%`,
                icon: PiggyBank,
                color: savingsRate >= 20 ? Colors.success : savingsRate >= 10 ? Colors.warning : Colors.danger,
                bg: savingsRate >= 20 ? Colors.success : savingsRate >= 10 ? Colors.warning : Colors.danger,
            },
            {
                label: 'Daily Avg',
                value: `${currencySymbol}${burnRate.toFixed(0)}`,
                icon: Activity,
                color: Colors.primary,
                bg: Colors.primary,
            },
            {
                label: 'Transactions',
                value: String(transactionCount),
                icon: Banknote,
                color: Colors.text,
                bg: Colors.textSecondary,
            },
            {
                label: budget > 0 ? 'Remaining Budget' : 'Remaining Income',
                value: `${currencySymbol}${budgetRemaining.toFixed(0)}`,
                icon: Target,
                color: budgetRemaining >= 0 ? Colors.success : Colors.danger,
                bg: budgetRemaining >= 0 ? Colors.success : Colors.danger,
            },
        ];
    }, [transactions, budget, income, currencySymbol, Colors]);

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Financial Snapshot</Text>

            <View style={styles.grid}>
                {kpis.map((kpi, index) => (
                    <View
                        key={index}
                        style={[
                            styles.card,
                            Styles.shadow,
                            {
                                backgroundColor: Colors.surface,
                                shadowColor: Colors.shadow,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.05)'
                            }
                        ]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: kpi.bg + '15' }]}>
                            {React.createElement(kpi.icon, { size: 24, color: kpi.color })}
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
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 17,
        fontFamily: 'Geist-Bold',
        marginBottom: 20,
        marginHorizontal: 24,
        letterSpacing: 0.2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 16,
    },
    card: {
        width: '47%', // Approx half with gap
        flexGrow: 1, // Fill remaining space
        padding: 20,
        borderRadius: 24,
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 140,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    value: {
        fontSize: 22,
        fontFamily: 'Geist-Bold',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    label: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
