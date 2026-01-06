import { CategoryPieChartWidget } from '@/components/analytics/CategoryPieChartWidget';
import { DayOfWeekWidget } from '@/components/analytics/DayOfWeekWidget';
import { FinancialHealthWidget } from '@/components/analytics/FinancialHealthWidget';
import { FinancialKPIsWidget } from '@/components/analytics/FinancialKPIsWidget';
import { LifetimeStatsWidget } from '@/components/analytics/LifetimeStatsWidget';
import { MonthComparisonWidget } from '@/components/analytics/MonthComparisonWidget';
import { QuickInsightsWidget } from '@/components/analytics/QuickInsightsWidget';
import { SpendingTrendsWidget } from '@/components/analytics/SpendingTrendsWidget';
import { TopCategoriesWidget } from '@/components/analytics/TopCategoriesWidget';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {

    const Styles = useStyles();
    const Colors = useThemeColor();
    const { transactions, isOffline } = useExpense();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Responsive calculations
    const containerWidth = Math.min(width, 1200);
    const availableGridWidth = isDesktop ? (containerWidth - 40) : width;
    const gap = 24;
    // Left Column Flex: 2, Right: 1. Total flex: 3.
    const leftColumnWidth = isDesktop ? ((availableGridWidth - gap) * (2 / 3)) : width;

    // Calculate available months from transactions
    const availableMonths = React.useMemo(() => {
        const months = new Set<string>();
        // Always include current month
        months.add(startOfMonth(new Date()).toISOString());

        transactions.forEach(t => {
            if (!t.excludeFromBudget) {
                months.add(startOfMonth(new Date(t.date)).toISOString());
            }
        });

        return Array.from(months)
            .map(d => new Date(d))
            .sort((a, b) => a.getTime() - b.getTime());
    }, [transactions]);

    // Navigation handlers
    const goToPreviousMonth = () => {
        const currentIndex = availableMonths.findIndex(d => d.getTime() === startOfMonth(selectedDate).getTime());
        if (currentIndex > 0) {
            setSelectedDate(availableMonths[currentIndex - 1]);
        }
    };

    const goToNextMonth = () => {
        const currentIndex = availableMonths.findIndex(d => d.getTime() === startOfMonth(selectedDate).getTime());
        if (currentIndex < availableMonths.length - 1) {
            setSelectedDate(availableMonths[currentIndex + 1]);
        }
    };

    const canGoBack = availableMonths.findIndex(d => d.getTime() === startOfMonth(selectedDate).getTime()) > 0;
    const canGoForward = availableMonths.findIndex(d => d.getTime() === startOfMonth(selectedDate).getTime()) < availableMonths.length - 1;

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Maybe reset to current month on refresh? 
        // setSelectedDate(new Date());
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    return (
        <SafeAreaView style={Styles.container}>
            <View style={[Styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }]}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 28, letterSpacing: -1 }]}>Analytics</Text>
                        {isOffline && (
                            <View style={{ backgroundColor: Colors.danger + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1, borderColor: Colors.danger + '40' }}>
                                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 10, color: Colors.danger }}>Offline</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Month Selector */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 6, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: Colors.border }}>
                    <TouchableOpacity
                        onPress={goToPreviousMonth}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={!canGoBack}
                        style={{ opacity: canGoBack ? 1 : 0.3 }}
                    >
                        <ChevronLeft size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 14, color: Colors.text, minWidth: 100, textAlign: 'center' }}>
                        {format(selectedDate, 'MMMM yyyy')}
                    </Text>
                    <TouchableOpacity
                        onPress={goToNextMonth}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={!canGoForward}
                        style={{ opacity: canGoForward ? 1 : 0.3 }}
                    >
                        <ChevronRight size={20} color={Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View style={isDesktop ? styles.desktopGrid : styles.mobileStack}>
                    {/* LEFT COLUMN (Desktop: Charts) */}
                    <View style={isDesktop ? styles.leftColumn : styles.column}>
                        {/* Spending Trends */}
                        <SpendingTrendsWidget targetDate={selectedDate} width={isDesktop ? leftColumnWidth - 48 : undefined} />

                        {/* Day of Week */}
                        <DayOfWeekWidget targetDate={selectedDate} width={isDesktop ? leftColumnWidth - 48 : undefined} />

                        {/* Category Pie Chart */}
                        <CategoryPieChartWidget targetDate={selectedDate} />
                    </View>

                    {/* RIGHT COLUMN (Desktop: KPIs & Lists) */}
                    <View style={isDesktop ? styles.rightColumn : styles.column}>
                        {/* Lifetime Stats */}
                        <LifetimeStatsWidget />

                        {/* Financial Health Score */}
                        <FinancialHealthWidget targetDate={selectedDate} />

                        {/* Quick Insights */}
                        <QuickInsightsWidget targetDate={selectedDate} />

                        {/* Financial KPIs */}
                        <FinancialKPIsWidget targetDate={selectedDate} />

                        {/* Month Comparison */}
                        <MonthComparisonWidget targetDate={selectedDate} />

                        {/* Top Categories */}
                        <TopCategoriesWidget targetDate={selectedDate} />
                    </View>
                </View>

                {/* Mobile: Original Order or specific order? 
                    On Mobile, the grid approach here splits them. 
                    If we want to preserve the EXACT original order on mobile, we'd need to conditionally render the whole tree.
                    Or, accepts that the order might slightly change (Charts first, then Stats).
                    The proposed grid puts Charts available in Left Column (top on mobile) and Stats in Right (bottom on mobile).
                    Actually, let's check styles.mobileStack = column.
                    So Left Column renders first, then Right Column.
                    This means Charts are now at the top, Stats at the bottom.
                    Original was mixed.
                    Let's accept this re-ordering as it's cleaner, or duplicate for mobile if strictly required.
                    Re-ordering is usually fine for "Improve UI".
                */}

                {!isDesktop && <View style={{ height: 100 }} />}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    desktopGrid: {
        flexDirection: 'row',
        gap: 2,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
    },
    mobileStack: {
        flexDirection: 'column-reverse',
    },
    leftColumn: {
        flex: 2,
        gap: 0,
    },
    rightColumn: {
        flex: 1.5,
        gap: 0,
    },
    column: {
        width: '100%',
    },
});
