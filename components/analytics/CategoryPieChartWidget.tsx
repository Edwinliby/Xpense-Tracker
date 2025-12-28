import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, isWithinInterval, startOfMonth } from 'date-fns';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

export const CategoryPieChartWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, categories, currencySymbol } = useExpense();

    const { pieData, totalSpending, topCategories } = useMemo(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const currentMonthExpenses = transactions.filter(
            t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })
        );

        const total = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

        const categoryTotals: Record<string, number> = {};
        currentMonthExpenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        // Get top 4 categories and group "Others"
        const sortedCats = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);

        const top4 = sortedCats.slice(0, 4);
        const others = sortedCats.slice(4).reduce((sum, [, val]) => sum + val, 0);

        const finalCats = others > 0 ? [...top4, ['Others', others]] : top4;

        const data = finalCats.map(([catId, amount], index) => {
            const category = categories.find(c => c.name === catId);
            // Dynamic colors or fallback
            const color = category?.color || [Colors.primary, Colors.danger, Colors.warning, Colors.success, Colors.textSecondary][index % 5];

            return {
                value: Number(amount),
                color: color,
                gradientCenterColor: color,
                text: String(category?.name || catId), // Should just be for legend, not on chart
                catName: category?.name || (catId === 'Others' ? 'Others' : 'Unknown'),
            };
        });

        return {
            pieData: data,
            totalSpending: total,
            topCategories: data
        };
    }, [transactions, categories, Colors]);

    if (totalSpending === 0) {
        return (
            <View style={[
                styles.container,
                Styles.shadow,
                {
                    backgroundColor: Colors.surface,
                    shadowColor: Colors.shadow,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 250,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.05)'
                }
            ]}>
                <Text style={{ color: Colors.textSecondary, fontFamily: 'Geist-Medium' }}>No expense data for this month</Text>
            </View>
        );
    }

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
            <Text style={[styles.title, { color: Colors.text }]}>Expense Breakdown</Text>

            <View style={styles.contentContainer}>
                <View style={styles.chartContainer}>
                    <PieChart
                        data={pieData}
                        donut
                        radius={80}
                        innerRadius={60}
                        innerCircleColor={Colors.surface}
                        centerLabelComponent={() => {
                            return (
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 22, color: Colors.text, fontFamily: 'Geist-Bold' }}>
                                        {currencySymbol}{totalSpending >= 1000 ? (totalSpending / 1000).toFixed(1) + 'k' : totalSpending.toFixed(0)}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: Colors.textSecondary, fontFamily: 'Geist-Medium' }}>Total</Text>
                                </View>
                            );
                        }}
                    />
                </View>

                <View style={styles.legendContainer}>
                    {topCategories.map((item: any, index: number) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: item.color }]} />
                            <Text style={[styles.legendText, { color: Colors.textSecondary }]} numberOfLines={1}>
                                {item.catName}
                            </Text>
                            <Text style={[styles.legendValue, { color: Colors.text }]}>
                                {Math.round((item.value / totalSpending) * 100)}%
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
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
    title: {
        fontSize: 17,
        fontFamily: 'Geist-Bold',
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chartContainer: {
        alignItems: 'center',
    },
    legendContainer: {
        flex: 1,
        paddingLeft: 24,
        gap: 14,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 4,
        marginRight: 10,
    },
    legendText: {
        fontSize: 13,
        flex: 1,
        marginRight: 8,
        fontFamily: 'Geist-Medium',
    },
    legendValue: {
        fontSize: 14,
        fontFamily: 'Geist-Bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
});
