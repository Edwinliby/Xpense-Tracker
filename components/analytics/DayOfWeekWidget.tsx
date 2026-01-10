
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, getDay, isWithinInterval, startOfMonth } from 'date-fns';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export const DayOfWeekWidget: React.FC<{ targetDate: Date, width?: number }> = ({ targetDate, width }) => {
    const Colors = useThemeColor();

    const { transactions, currencySymbol } = useExpense();

    const { barData, maxVal } = useMemo(() => {
        const start = startOfMonth(targetDate);
        const end = endOfMonth(targetDate);

        const currentMonthExpenses = transactions.filter(
            t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }) && !t.excludeFromBudget && !(t.isLent && t.isPaidBack)
        );

        const dayTotals = new Array(7).fill(0); // 0 = Sunday, 6 = Saturday

        // This calculates AVERAGE spending per day of week (e.g. average Monday spending)
        // To do that, we need to know how many of each day occurred so far in the month or just sum total?
        // Let's stick to Total per day of week for simplicity as per common analytics
        currentMonthExpenses.forEach(t => {
            const day = getDay(new Date(t.date));
            dayTotals[day] += t.amount;
        });

        const maxValue = Math.max(...dayTotals);
        const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        const data = dayTotals.map((amount, index) => {
            const isWeekend = index === 0 || index === 6;
            return {
                value: amount,
                label: labels[index],
                frontColor: isWeekend ? Colors.warning : Colors.primary,
                gradientColor: isWeekend ? Colors.warning + '99' : Colors.primary + '99',
                spacing: 20,
                labelTextStyle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' as const },
                topLabelComponent: () => (
                    amount > 0 ?
                        <Text style={{ color: Colors.textSecondary, fontSize: 10, marginBottom: 4, width: 40, textAlign: 'center' }}>
                            {currencySymbol}{amount.toFixed(0)}
                        </Text> : null
                ),
            };
        });

        return { barData: data, maxVal: maxValue };
    }, [transactions, Colors, currencySymbol, targetDate]);

    const { width: screenWidth } = useWindowDimensions();
    const chartWidth = width ? (width - 48) : (screenWidth - 80); // 48 = padding 24*2, 80 was existing approximation

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: Colors.surface,
                shadowColor: Colors.shadow,
                borderWidth: .5,
                borderColor: Colors.border
            }
        ]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors.text }]}>Spending by Day</Text>
                <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Total this Month</Text>
            </View>

            <View style={styles.chartContainer}>
                <BarChart
                    data={barData}
                    height={150}
                    width={chartWidth}
                    barWidth={24}
                    spacing={16}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    hideYAxisText
                    noOfSections={3}
                    maxValue={maxVal * 1.2} // Add some headroom
                    showGradient
                    gradientColor={Colors.primary}
                />
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 17,
        fontFamily: 'Geist-Bold',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        opacity: 0.7
    },
    chartContainer: {
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'Geist-Medium',
    },
    statValue: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
    },
});
