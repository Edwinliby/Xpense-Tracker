import { CategoryPieChartWidget } from '@/components/analytics/CategoryPieChartWidget';
import { DayOfWeekWidget } from '@/components/analytics/DayOfWeekWidget';
import { FinancialHealthWidget } from '@/components/analytics/FinancialHealthWidget';
import { FinancialKPIsWidget } from '@/components/analytics/FinancialKPIsWidget';
import { MonthComparisonWidget } from '@/components/analytics/MonthComparisonWidget';
import { QuickInsightsWidget } from '@/components/analytics/QuickInsightsWidget';
import { SpendingTrendsWidget } from '@/components/analytics/SpendingTrendsWidget';
import { TopCategoriesWidget } from '@/components/analytics/TopCategoriesWidget';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {

    const Styles = useStyles();
    const Colors = useThemeColor();
    const [refreshing, setRefreshing] = useState(false);


    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    return (
        <SafeAreaView style={Styles.container}>
            <View style={[Styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }]}>
                <View>
                    <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 28, letterSpacing: -1 }]}>Analytics</Text>
                    <Text style={{ fontFamily: 'Geist-Medium', fontSize: 14, color: Colors.textSecondary, marginTop: -2 }}>
                        {format(new Date(), 'MMMM yyyy')}
                    </Text>
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
                {/* Financial Health Score */}
                <FinancialHealthWidget />

                {/* Quick Insights */}
                <QuickInsightsWidget />

                {/* Financial KPIs */}
                <FinancialKPIsWidget />

                {/* Month Comparison */}
                <MonthComparisonWidget />

                {/* Spending Trends */}
                <SpendingTrendsWidget />

                {/* Day of Week */}
                <DayOfWeekWidget />

                {/* Category Pie Chart */}
                <CategoryPieChartWidget />

                {/* Top Categories */}
                <TopCategoriesWidget />

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
