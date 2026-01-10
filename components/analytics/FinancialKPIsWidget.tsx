import { LinearGradient } from 'expo-linear-gradient';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, getDate, isWithinInterval, startOfMonth } from 'date-fns';
import { Activity, Banknote, PiggyBank, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const FinancialKPIsWidget: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const Colors = useThemeColor();
    const Styles = useStyles();
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
                bgGradient: savingsRate >= 20 ? [Colors.success + '20', Colors.success + '05'] : savingsRate >= 10 ? [Colors.warning + '20', Colors.warning + '05'] : [Colors.danger + '20', Colors.danger + '05'],
            },
            {
                label: 'Daily Avg',
                value: `${currencySymbol}${burnRate.toFixed(0)}`,
                icon: Activity,
                color: Colors.primary,
                bgGradient: [Colors.primary + '20', Colors.primary + '05'],
            },
            {
                label: 'Transactions',
                value: String(transactionCount),
                icon: Banknote,
                color: Colors.text,
                bgGradient: [Colors.textSecondary + '20', Colors.textSecondary + '05'],
            },
            {
                label: 'Remaining',
                value: `${currencySymbol}${budgetRemaining.toFixed(0)}`,
                icon: Target,
                color: budgetRemaining >= 0 ? Colors.success : Colors.danger,
                bgGradient: budgetRemaining >= 0 ? [Colors.success + '20', Colors.success + '05'] : [Colors.danger + '20', Colors.danger + '05'],
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
                        Styles.shadow,
                        {
                            backgroundColor: Colors.surface,
                            shadowColor: Colors.shadow,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.05)'
                        }
                    ]}
                >
                    <LinearGradient
                        colors={kpi.bgGradient as [string, string]}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: kpi.color + '15' }]}>
                            {React.createElement(kpi.icon, { size: 18, color: kpi.color })}
                        </View>
                        <View>
                            <Text style={[styles.value, { color: kpi.color }]} numberOfLines={1} adjustsFontSizeToFit>
                                {kpi.value}
                            </Text>
                            <Text style={[styles.label, { color: Colors.textSecondary }]} numberOfLines={1}>
                                {kpi.label}
                            </Text>
                        </View>
                    </LinearGradient>
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
        gap: 12,
    },
    cardContainer: {
        width: '48%',
        borderRadius: 18,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        padding: 16,
        paddingVertical: 12, // slightly tighter vertical padding
        flexDirection: 'row', // Keeping row alignment as per user pref
        alignItems: 'center',
        gap: 12,
        justifyContent: 'flex-start', // Ensure content is aligned start
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center', // Center vertically in row
    },
    value: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    label: {
        fontSize: 11,
        fontFamily: 'Geist-Medium',
        opacity: 0.7,
        letterSpacing: 0.2,
    },
});
