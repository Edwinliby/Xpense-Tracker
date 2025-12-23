import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, isWithinInterval, startOfMonth } from 'date-fns';
import * as Icons from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const TopCategoriesWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, categories, currencySymbol } = useExpense();

    const topCategoriesData = useMemo(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const currentMonthExpenses = transactions.filter(
            t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })
        );

        const totalSpending = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

        const categoryTotals: Record<string, number> = {};
        currentMonthExpenses.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        return Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([catId, amount]) => {
                const category = categories.find(c => c.name === catId);
                const percent = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
                return {
                    id: catId,
                    name: category?.name || 'Unknown',
                    amount,
                    percent,
                    color: category?.color || Colors.textSecondary,
                    icon: category?.icon || 'help-circle-outline',
                };
            });
    }, [transactions, categories]);

    if (topCategoriesData.length === 0) return null;

    return (
        <View style={[styles.container, Styles.shadow, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
            <Text style={[styles.title, { color: Colors.text }]}>Top Categories</Text>

            <View style={styles.list}>
                {topCategoriesData.map((item, index) => (
                    <View key={item.id} style={styles.row}>
                        <View style={styles.rowHeader}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                                    {(() => {
                                        const IconComponent = (Icons as any)[item.icon];
                                        return IconComponent ? <IconComponent size={16} color={item.color} /> : null;
                                    })()}
                                </View>
                                <Text style={[styles.catName, { color: Colors.text }]}>{item.name}</Text>
                            </View>
                            <View style={styles.rowRight}>
                                <Text style={[styles.amount, { color: Colors.text }]}>
                                    {currencySymbol}{item.amount.toFixed(0)}
                                </Text>
                                <Text style={[styles.percent, { color: Colors.textSecondary }]}>
                                    {item.percent.toFixed(1)}%
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={[styles.progressBarBase, { backgroundColor: Colors.surfaceHighlight }]}>
                            <View style={[styles.progressBarFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                        </View>
                    </View>
                ))}
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
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    list: {
        gap: 20,
    },
    row: {
        gap: 8,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    catName: {
        fontSize: 14,
        fontWeight: '600',
    },
    rowRight: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 14,
        fontWeight: '700',
    },
    percent: {
        fontSize: 11,
    },
    progressBarBase: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});
