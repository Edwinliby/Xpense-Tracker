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
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Quick Insights</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {insights.map((item) => (
                    <View key={item.id} style={[styles.cardContainer, Styles.shadow, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
                        <LinearGradient
                            colors={item.bgGradient as [string, string]}
                            style={styles.cardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                {React.createElement(item.icon, { size: 20, color: item.color })}
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        marginHorizontal: 20,
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 4, // Space for shadow
    },
    cardContainer: {
        width: 160,
        height: 170,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 11,
        opacity: 0.8,
    },
});
