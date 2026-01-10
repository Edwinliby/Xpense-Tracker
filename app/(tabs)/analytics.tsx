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
import { RefreshControl, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {

    const Styles = useStyles();
    const Colors = useThemeColor();
    const { transactions, isOffline } = useExpense();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'categories'>('overview');

    // Responsive calculations
    const containerWidth = Math.min(width, 1200);

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
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Tab Button Component
    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => {
        const isActive = activeTab === id;
        return (
            <TouchableOpacity
                onPress={() => setActiveTab(id)}
                style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? Colors.surface : 'transparent',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isActive ? Colors.border : 'transparent',
                    shadowColor: isActive ? Colors.shadow : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.05 : 0,
                    shadowRadius: 4,
                    elevation: isActive ? 2 : 0,
                }}
            >
                <Text style={{
                    fontFamily: isActive ? 'Geist-Bold' : 'Geist-Medium',
                    color: isActive ? Colors.primary : Colors.textSecondary,
                    fontSize: 14,
                }}>{label}</Text>
            </TouchableOpacity>
        );
    };

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 6, paddingHorizontal: 8, borderRadius: 100, borderWidth: .5, borderColor: Colors.border }}>
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

            <LifetimeStatsWidget />

            {/* Tab Selector */}
            <View style={{
                flexDirection: 'row',
                backgroundColor: Colors.surfaceHighlight,
                marginHorizontal: 20,
                marginBottom: 4,
                padding: 4,
                borderRadius: 16,
                borderWidth: .5,
                borderColor: Colors.border,
                gap: 4
            }}>
                <TabButton id="overview" label="Overview" />
                <TabButton id="trends" label="Trends" />
                <TabButton id="categories" label="Categories" />
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
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            >
                {/* Content based on Tab */}

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <View style={{ gap: 24 }}>
                        <View style={{ gap: 24 }}>
                            {/* Health & KPIs */}
                            <FinancialHealthWidget targetDate={selectedDate} />
                            <QuickInsightsWidget targetDate={selectedDate} />
                            <FinancialKPIsWidget targetDate={selectedDate} />
                            <MonthComparisonWidget targetDate={selectedDate} />
                        </View>
                    </View>
                )}

                {/* TRENDS TAB */}
                {activeTab === 'trends' && (
                    <View style={{ gap: 24 }}>
                        <SpendingTrendsWidget targetDate={selectedDate} width={isDesktop ? containerWidth - 40 : undefined} />
                        <DayOfWeekWidget targetDate={selectedDate} width={isDesktop ? containerWidth - 40 : undefined} />
                    </View>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === 'categories' && (
                    <View style={{ gap: 24 }}>
                        <CategoryPieChartWidget targetDate={selectedDate} />
                        <TopCategoriesWidget targetDate={selectedDate} />
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}