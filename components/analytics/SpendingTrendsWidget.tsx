import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart, lineDataItem } from 'react-native-gifted-charts';

export const SpendingTrendsWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, currencySymbol } = useExpense();
    const [lastSixMonths, setLastSixMonths] = useState<any[]>([]);

    const trendsData = useMemo(() => {
        const months: lineDataItem[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const spent = transactions
                .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
                .reduce((sum, t) => sum + t.amount, 0);

            months.push({
                value: spent,
                label: format(date, 'MMM'),
                dataPointText: spent.toFixed(0),
                labelTextStyle: { color: Colors.textSecondary, fontSize: 10 },
            });
        }
        return months;
    }, [transactions, Colors]);

    const maxValue = Math.max(...trendsData.map(d => d.value || 0), 1);
    const avgSpending = trendsData.reduce((sum, d) => sum + (d.value || 0), 0) / trendsData.length;

    // Calculate responsive width
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth; // Extra padding

    return (
        <View style={[styles.container, Styles.shadow, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: Colors.text }]}>Spending Trends</Text>
                    <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Last 6 Months</Text>
                </View>
                <View style={styles.statContainer}>
                    <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Avg.</Text>
                    <Text style={[styles.statValue, { color: Colors.text }]}>{currencySymbol}{avgSpending.toFixed(0)}</Text>
                </View>
            </View>

            <View style={styles.chartWrapper}>
                <LineChart
                    data={trendsData}
                    height={180}
                    width={chartWidth}
                    spacing={chartWidth / 7}
                    initialSpacing={20}
                    endSpacing={20}
                    color={Colors.primary}
                    thickness={3}
                    startFillColor={Colors.primary}
                    endFillColor={Colors.surface}
                    startOpacity={0.4}
                    endOpacity={0.0}
                    curved
                    areaChart
                    hideDataPoints={false}
                    dataPointsColor={Colors.surface}
                    dataPointsRadius={6}
                    dataPointsShape='circle'
                    zIndex1={10}
                    focusedDataPointShape='circle'
                    focusedDataPointWidth={12}
                    focusedDataPointHeight={12}
                    focusedDataPointColor={Colors.primary}
                    focusedDataPointRadius={6}

                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    hideYAxisText
                    xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '500' }}

                    pointerConfig={{
                        pointerStripHeight: 160,
                        pointerStripColor: Colors.textSecondary,
                        pointerStripWidth: 2,
                        pointerColor: Colors.surface,
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 90,
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View
                                    style={{
                                        height: 40,
                                        width: 80,
                                        backgroundColor: Colors.text,
                                        opacity: 0.9,
                                        borderRadius: 12,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <Text style={{ color: Colors.surface, fontSize: 13, fontWeight: 'bold' }}>
                                        {currencySymbol}{items[0]?.value.toFixed(0)}
                                    </Text>
                                </View>
                            );
                        },
                    }}
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
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
    },
    statContainer: {
        alignItems: 'flex-end',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 2,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    chartWrapper: {
        alignItems: 'center',
        marginLeft: -10, // Slight offset to correct visual padding
    },
});
