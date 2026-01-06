import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, isWithinInterval, startOfMonth } from 'date-fns';
import * as Icons from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const TopCategoriesWidget: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, categories, currencySymbol } = useExpense();

    const topCategoriesData = useMemo(() => {
        const start = startOfMonth(targetDate);
        const end = endOfMonth(targetDate);

        const currentMonthExpenses = transactions.filter(
            t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }) && !t.excludeFromBudget && !(t.isLent && t.isPaidBack)
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
    }, [transactions, categories, Colors.textSecondary, targetDate]);

    if (topCategoriesData.length === 0) return null;

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
            <Text style={[styles.title, { color: Colors.text }]}>Top Categories</Text>

            <View style={styles.list}>
                {topCategoriesData.map((item, index) => (
                    <View key={item.id} style={styles.row}>
                        <View style={styles.rowHeader}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                                    {(() => {
                                        const IconComponent = (Icons as any)[item.icon];
                                        return IconComponent ? <IconComponent size={18} color={item.color} /> : null;
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
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 24,
    },
    title: {
        fontSize: 17,
        fontFamily: 'Geist-Bold',
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    list: {
        gap: 20,
    },
    row: {
        gap: 10,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    catName: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
    },
    rowRight: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 14,
        fontFamily: 'Geist-Bold',
    },
    percent: {
        fontSize: 11,
        fontFamily: 'Geist-Medium',
        opacity: 0.7
    },
    progressBarBase: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});
