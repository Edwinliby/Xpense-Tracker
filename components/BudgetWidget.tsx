import { useThemeColor } from '@/hooks/useThemeColor';
import { Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

interface BudgetWidgetProps {
    spent: number;
    budget: number;
    currencySymbol: string;
    viewMode: 'monthly' | 'yearly';
    onPress?: () => void;
    monthsCount?: number; // For yearly view context
}

export const BudgetWidget: React.FC<BudgetWidgetProps> = ({
    spent,
    budget,
    currencySymbol,
    viewMode,
    onPress,
    monthsCount = 12,
}) => {
    const Colors = useThemeColor();

    // Logic for colors and state
    const isOverBudget = spent > budget;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;

    // Determine status color
    const statusColor = useMemo(() => {
        if (isOverBudget) return Colors.danger; // Red if over
        if (percentage > 90) return '#FF6B6B'; // Soft red/orange if warning
        if (percentage > 75) return '#FFB302'; // Yellow/Orange
        return Colors.success; // Green
    }, [percentage, isOverBudget, Colors]);

    // Chart Data
    const pieData = useMemo(() => {
        if (budget === 0) {
            return [{ value: 100, color: Colors.surfaceHighlight }];
        }

        let filled = 0;
        let empty = 0;

        if (isOverBudget) {
            filled = 100;
            empty = 0;
        } else {
            filled = percentage;
            empty = 100 - percentage;
        }

        return [
            {
                value: filled,
                color: statusColor,
                gradientCenterColor: statusColor,
                focused: true,
            },
            {
                value: empty,
                color: Colors.surfaceHighlight,
                gradientCenterColor: Colors.surfaceHighlight,
            },
        ];
    }, [budget, percentage, isOverBudget, statusColor, Colors]);

    // Helper text
    const periodLabel = viewMode === 'monthly' ? 'Monthly' : 'Yearly';
    const subtitle = viewMode === 'yearly' && monthsCount < 12
        ? `(${monthsCount} months active)`
        : '';

    if (budget === 0) {
        // Empty State
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[styles.container, styles.emptyContainer, { backgroundColor: Colors.surface, borderWidth: .5, borderColor: Colors.border }]}
            >
                <View style={[styles.iconCircle, { backgroundColor: Colors.surfaceHighlight }]}>
                    <Wallet size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.emptyTitle, { color: Colors.text }]}>No Budget Set</Text>
                    <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
                        Tap to set up a {periodLabel.toLowerCase()} budget
                    </Text>
                </View>
                <View style={{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Geist-Bold' }}>Set Up</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.surface, shadowColor: Colors.border, borderWidth: .5, borderColor: Colors.border }]}>

            {/* Header Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View>
                    <Text style={[styles.headerLabel, { color: Colors.textSecondary }]}>
                        {periodLabel} Budget {subtitle}
                    </Text>
                    <Text style={[styles.budgetTotal, { color: Colors.text }]}>
                        {currencySymbol}{budget.toLocaleString()}
                    </Text>
                </View>

                {/* Status Badge */}
                <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                        {isOverBudget ? 'Over Budget' : `${(100 - percentage).toFixed(0)}% Left`}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                {/* Donut Chart */}
                <View>
                    <PieChart
                        data={pieData}
                        donut
                        radius={36}
                        innerRadius={28}
                        backgroundColor={Colors.surface}
                        centerLabelComponent={() => {
                            return (
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 13, color: Colors.text, fontFamily: 'Geist-Bold' }}>
                                        {percentage > 999 ? '>999' : percentage.toFixed(0)}%
                                    </Text>
                                </View>
                            );
                        }}
                    />
                </View>

                {/* Detailed Stats */}
                <View style={{ flex: 1, gap: 8 }}>

                    {/* Row 1: Spent */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.dot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Spent</Text>
                        </View>
                        <Text style={[styles.statValue, { color: Colors.text }]}>
                            {currencySymbol}{spent.toLocaleString()}
                        </Text>
                    </View>

                    {/* Row 2: Remaining / Over */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.dot, { backgroundColor: isOverBudget ? Colors.danger : Colors.surfaceHighlight }]} />
                            <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
                                {isOverBudget ? 'Over by' : 'Remaining'}
                            </Text>
                        </View>
                        <Text style={[styles.statValue, { color: isOverBudget ? Colors.danger : Colors.text }]}>
                            {currencySymbol}{Math.abs(remaining).toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Recommended spend (only if healthy and monthly) */}
            {!isOverBudget && viewMode === 'monthly' && (
                <View style={[styles.footerMessage, { backgroundColor: Colors.surfaceHighlight }]}>
                    <Text style={{ color: Colors.textSecondary, fontSize: 11, fontFamily: 'Geist-Medium' }}>
                        💡 You can spend <Text style={{ color: Colors.text }}>{currencySymbol}{((remaining) / (30)).toFixed(0)}</Text> daily to stay on track.
                    </Text>
                </View>
            )}

            {isOverBudget && (
                <View style={[styles.footerMessage, { backgroundColor: Colors.danger + '10' }]}>
                    <Text style={{ color: Colors.danger, fontSize: 11, fontFamily: 'Geist-Medium' }}>
                        ⚠️ You&apos;ve exceeded your budget. Review your expenses.
                    </Text>
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 20,
    },
    emptyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        fontFamily: 'Geist-Regular',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        marginBottom: 4,
    },
    budgetTotal: {
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Geist-Bold',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    },
    statValue: {
        fontSize: 13,
        fontFamily: 'Geist-SemiBold',
    },
    footerMessage: {
        marginTop: 16,
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
