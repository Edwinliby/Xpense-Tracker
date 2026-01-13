import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { eachDayOfInterval, endOfMonth, getDay, startOfMonth, subMonths } from 'date-fns';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export const WeeklySpendWidget = ({ targetDate }: { targetDate?: Date }) => {
    const Colors = useThemeColor();
    const { transactions, currencySymbol } = useExpense();

    // Calculations
    const { avgWeeklySpend, percentChange, barData } = useMemo(() => {
        const selectedDate = targetDate || new Date();

        // Ranges
        const startCurrent = startOfMonth(selectedDate);
        const endCurrent = endOfMonth(selectedDate);
        const startPrev = startOfMonth(subMonths(selectedDate, 1));
        const endPrev = endOfMonth(subMonths(selectedDate, 1));

        // Helper to calculate averages by day of week
        const calculateAverages = (start: Date, end: Date) => {
            const daysInMonth = eachDayOfInterval({ start, end });
            const dayCounts = Array(7).fill(0); // 0=Sun ... 6=Sat
            daysInMonth.forEach((d: Date) => dayCounts[getDay(d)]++);

            const dayTotals = Array(7).fill(0);

            // Sum transactions
            transactions.forEach(t => {
                const tDate = new Date(t.date);
                if (t.type === 'expense' && !t.excludeFromBudget && !(t.isLent && t.isPaidBack)) {
                    if (tDate >= start && tDate <= end) {
                        dayTotals[getDay(tDate)] += t.amount;
                    }
                }
            });

            // Calculate averages
            // If count is 0 (shouldn't happen in a month), avoid NaN
            const averages = dayTotals.map((total, idx) => dayCounts[idx] > 0 ? total / dayCounts[idx] : 0);
            const weeklyTotal = averages.reduce((a, b) => a + b, 0);

            return { averages, weeklyTotal };
        };

        const currentData = calculateAverages(startCurrent, endCurrent);
        const prevData = calculateAverages(startPrev, endPrev);

        // Percent Change (Avg vs Avg)
        let pct = 0;
        if (prevData.weeklyTotal > 0) {
            pct = ((currentData.weeklyTotal - prevData.weeklyTotal) / prevData.weeklyTotal) * 100;
        } else if (currentData.weeklyTotal > 0) {
            pct = 100;
        }

        // Format Bar Data (Mon -> Sun)
        // Indices: 1, 2, 3, 4, 5, 6, 0
        const order = [1, 2, 3, 4, 5, 6, 0];
        const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        const data = order.map((dayIdx, i) => {
            const val = currentData.averages[dayIdx];
            return {
                value: val,
                label: labels[i],
                frontColor: val > 0 ? Colors.primary : Colors.primaryDark,
                topLabelComponent: () => (
                    <Text style={{ color: Colors.textSecondary, fontSize: 9, fontFamily: 'Geist-Medium', marginBottom: 2 }}>
                        {val > 0 ? (val / 1000 >= 1 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)) : ''}
                    </Text>
                )
            };
        });

        return {
            avgWeeklySpend: currentData.weeklyTotal,
            percentChange: pct,
            barData: data
        };
    }, [transactions, targetDate, Colors]);

    const isIncrease = percentChange >= 0;

    return (
        <View style={[styles.container, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors.text }]}>Weekly Spend</Text>
            </View>

            <View style={styles.contentRow}>
                {/* Left Side: Stats */}
                <View style={styles.statsContainer}>
                    <Text style={[styles.amount, { color: Colors.text }]}>
                        {currencySymbol}{avgWeeklySpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>

                    <View style={styles.trendRow}>
                        {isIncrease ? (
                            <TrendingUp size={16} color={Colors.danger} />
                        ) : (
                            <TrendingDown size={16} color={Colors.success} />
                        )}
                        <Text style={[
                            styles.trendText,
                            { color: isIncrease ? Colors.danger : Colors.success }
                        ]}>
                            {Math.abs(percentChange).toFixed(1)}% {isIncrease ? 'Up' : 'Down'} vs Prev. Weekly Avg
                        </Text>
                    </View>
                </View>

                {/* Right Side: Chart */}
                <View style={styles.chartContainer}>
                    <BarChart
                        data={barData}
                        barWidth={10}
                        spacing={10}
                        roundedTop
                        roundedBottom
                        hideRules
                        hideYAxisText
                        yAxisThickness={0}
                        xAxisThickness={0}
                        xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10, fontFamily: 'Geist-Medium' }}
                        height={60}
                        width={140}
                        initialSpacing={10}
                        isAnimated
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 18,
        marginHorizontal: 20,
        borderWidth: .5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    statsContainer: {
        flex: 1,
    },
    amount: {
        fontSize: 28,
        fontFamily: 'Geist-Bold',
        marginBottom: 8,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendText: {
        fontSize: 10,
        fontFamily: 'Geist-Medium',
    },
    chartContainer: {
        top: 2,
        right: -5,
        height: 80,
        justifyContent: 'flex-end',
        paddingBottom: 0,
    }
});
