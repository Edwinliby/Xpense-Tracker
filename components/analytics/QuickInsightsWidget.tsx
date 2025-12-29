import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const QuickInsightsWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, budget, currencySymbol } = useExpense();

    const insights = useMemo(() => {
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonth = subMonths(now, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);

        const thisMonthSpent = transactions
            .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: thisMonthStart, end: thisMonthEnd }))
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthSpent = transactions
            .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }))
            .reduce((sum, t) => sum + t.amount, 0);

        const change = lastMonthSpent > 0 ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;
        const isIncrease = change > 0;

        const avgTransaction = transactions.length > 0
            ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
            : 0;

        const budgetUsed = budget > 0 ? (thisMonthSpent / budget) * 100 : 0;

        return [
            {
                id: 'trend',
                title: 'Monthly Trend',
                value: `${Math.abs(change).toFixed(1)}%`,
                subtitle: isIncrease ? 'Higher than last month' : 'Lower than last month',
                icon: isIncrease ? TrendingUp : TrendingDown,
                color: isIncrease ? Colors.danger : Colors.success,
                bgGradient: isIncrease ? [Colors.danger + '20', Colors.danger + '05'] : [Colors.success + '20', Colors.success + '05']
            },
            {
                id: 'budget',
                title: 'Budget Status',
                value: budget > 0 ? `${budgetUsed.toFixed(0)}%` : 'No Limit',
                subtitle: budget > 0
                    ? (budgetUsed < 100 ? 'Of budget used' : 'Over budget!')
                    : 'Set a budget to track',
                icon: budgetUsed >= 100 ? AlertCircle : CheckCircle2,
                color: budgetUsed >= 100 ? Colors.danger : (budgetUsed > 80 ? Colors.warning : Colors.success),
                bgGradient: budgetUsed >= 100
                    ? [Colors.danger + '20', Colors.danger + '05']
                    : (budgetUsed > 80 ? [Colors.warning + '20', Colors.warning + '05'] : [Colors.success + '20', Colors.success + '05'])
            },
            {
                id: 'avg',
                title: 'Average Spend',
                value: `${currencySymbol}${avgTransaction.toFixed(0)}`,
                subtitle: 'Per transaction',
                icon: Wallet,
                color: Colors.primary,
                bgGradient: [Colors.primary + '20', Colors.primary + '05']
            },
        ];
    }, [transactions, budget, currencySymbol, Colors]);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {insights.map((item) => (
                    <View
                        key={item.id}
                        style={[
                            styles.cardContainer,
                            Styles.shadow,
                            {
                                backgroundColor: Colors.surface,
                                shadowColor: Colors.shadow,
                                borderColor: 'rgba(255,255,255,0.05)',
                                borderWidth: 1
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={item.bgGradient as [string, string]}
                            style={styles.cardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                {React.createElement(item.icon, { size: 24, color: item.color })}
                            </View>
                            <View>
                                <Text style={[styles.cardTitle, { color: Colors.textSecondary }]}>{item.title}</Text>
                                <Text style={[styles.cardValue, { color: Colors.text }]}>{item.value}</Text>
                                <Text style={[styles.cardSubtitle, { color: Colors.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>
                            </View>
                        </LinearGradient>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    scrollContent: {
        paddingHorizontal: 22,
        gap: 16,
        paddingBottom: 8, // Space for shadow
    },
    cardContainer: {
        width: 170,
        height: 190,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 12,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
        opacity: 0.8,
    },
});
