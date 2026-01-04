import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const MonthComparisonWidget: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, currencySymbol } = useExpense();

    const comparison = useMemo(() => {
        const thisMonthStart = startOfMonth(targetDate);
        const thisMonthEnd = endOfMonth(targetDate);
        const lastMonth = subMonths(targetDate, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);

        const thisMonthSpent = transactions
            .filter(t =>
                t.type === 'expense' &&
                isWithinInterval(new Date(t.date), { start: thisMonthStart, end: thisMonthEnd }) &&
                !t.excludeFromBudget &&
                !(t.isLent && t.isPaidBack)
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthSpent = transactions
            .filter(t =>
                t.type === 'expense' &&
                isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }) &&
                !t.excludeFromBudget &&
                !(t.isLent && t.isPaidBack)
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const difference = thisMonthSpent - lastMonthSpent;
        const percentChange = lastMonthSpent > 0 ? (difference / lastMonthSpent) * 100 : 0;

        return {
            thisMonth: thisMonthSpent,
            lastMonth: lastMonthSpent,
            thisMonthName: format(targetDate, 'MMMM'),
            lastMonthName: format(lastMonth, 'MMMM'),
            difference,
            percentChange,
            isIncrease: difference > 0,
            isEqual: Math.abs(difference) < 1,
        };
    }, [transactions, targetDate]);

    return (
        <View style={[
            styles.container,
            Styles.shadow,
            {
                backgroundColor: Colors.surface,
                shadowColor: Colors.shadow,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)'
            }
        ]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors.text }]}>Month Comparison</Text>

                <View style={[
                    styles.badge,
                    { backgroundColor: comparison.isIncrease ? Colors.danger + '15' : Colors.success + '15' }
                ]}>
                    {comparison.isIncrease ?
                        <TrendingUp size={14} color={Colors.danger} /> :
                        <TrendingDown size={14} color={Colors.success} style={{ marginTop: 2 }} />
                    }
                    <Text style={[
                        styles.badgeText,
                        { color: comparison.isIncrease ? Colors.danger : Colors.success }
                    ]}>
                        {Math.abs(comparison.percentChange).toFixed(1)}%
                    </Text>
                </View>
            </View>

            <View style={styles.comparisonContainer}>
                {/* Last Month */}
                <View style={styles.side}>
                    <Text style={[styles.label, { color: Colors.textSecondary }]}>{comparison.lastMonthName}</Text>
                    <Text style={[styles.amount, { color: Colors.text }]}>{currencySymbol}{comparison.lastMonth.toFixed(0)}</Text>
                </View>

                {/* Divider/Arrow */}
                <View style={styles.divider}>
                    <ArrowRight size={24} color={Colors.textSecondary} />
                </View>

                {/* This Month */}
                <View style={styles.side}>
                    <Text style={[styles.label, { color: Colors.textSecondary }]}>{comparison.thisMonthName}</Text>
                    <Text style={[styles.amount, { color: Colors.text }]}>{currencySymbol}{comparison.thisMonth.toFixed(0)}</Text>
                </View>
            </View>

            {/* Visual Bar */}
            <View style={styles.barContainer}>
                <View style={[styles.barBase, { backgroundColor: Colors.surfaceHighlight }]}>
                    <LinearGradient
                        colors={comparison.isIncrease ? [Colors.danger, Colors.dangerLight] : [Colors.success, Colors.successLight]}
                        style={[
                            styles.barFill,
                            {
                                width: '100%',
                                transform: [{ scaleX: Math.min(comparison.thisMonth / (Math.max(comparison.thisMonth, comparison.lastMonth) || 1), 1) }]
                            }
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                </View>
            </View>

            <Text style={[styles.insight, { color: Colors.textSecondary }]}>
                {comparison.isIncrease
                    ? `You've spent ${currencySymbol}${Math.abs(comparison.difference).toFixed(0)} more than last month.`
                    : `You've saved ${currencySymbol}${Math.abs(comparison.difference).toFixed(0)} compared to last month!`
                }
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 17,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Geist-Bold',
    },
    comparisonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    side: {
        flex: 1,
    },
    divider: {
        paddingHorizontal: 16,
        opacity: 0.5,
    },
    label: {
        fontSize: 13,
        marginBottom: 6,
        fontFamily: 'Geist-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    amount: {
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    barContainer: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 12,
    },
    barBase: {
        flex: 1,
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    insight: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'Geist-Regular',
        opacity: 0.8
    },
});
