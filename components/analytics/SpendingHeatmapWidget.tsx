
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';



export const SpendingHeatmapWidget = () => {
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { transactions, currencySymbol } = useExpense();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // 1. Aggregate Spending by Date
    const dailySpending = useMemo(() => {
        const map: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.type === 'expense' && !t.deletedAt) {
                const dateKey = t.date.split('T')[0]; // simple YYYY-MM-DD
                map[dateKey] = (map[dateKey] || 0) + t.amount;
            }
        });
        return map;
    }, [transactions]);

    // 2. Calculate Intensity with Premium Colors
    const markedDates = useMemo(() => {
        const spends = Object.values(dailySpending);
        if (spends.length === 0) return {};

        const maxSpend = Math.max(...spends);
        const minSpend = Math.min(...spends);
        const range = maxSpend - minSpend || 1;

        const marks: any = {};

        Object.entries(dailySpending).forEach(([date, amount]) => {
            const intensity = (amount - minSpend) / range;

            // Premium monochromatic scale (or subtle heat)
            let backgroundColor = Colors.surfaceHighlight;
            let textColor = Colors.textSecondary;

            if (intensity > 0.8) {
                backgroundColor = '#FF453A'; // Vibrant Red (Very High)
                textColor = '#FFFFFF';
            } else if (intensity > 0.6) {
                backgroundColor = '#FF9F0A'; // Orange (High)
                textColor = '#FFFFFF';
            } else if (intensity > 0.4) {
                backgroundColor = '#FFD60A'; // Yellow (Med)
                textColor = '#000000';
            } else if (intensity > 0.1) {
                backgroundColor = '#32D74B'; // Green (Low)
                textColor = '#FFFFFF';
            } else {
                backgroundColor = Colors.surfaceHighlight; // Very low/Zero
                textColor = Colors.textSecondary;
            }

            marks[date] = {
                customStyles: {
                    container: {
                        backgroundColor,
                        borderRadius: 6, // Softer squares
                        elevation: 0,
                    },
                    text: {
                        color: textColor,
                        fontWeight: '600'
                    }
                }
            };
        });

        // Selected State should override
        if (selectedDate) {
            marks[selectedDate] = {
                ...(marks[selectedDate] || {}),
                customStyles: {
                    container: {
                        backgroundColor: Colors.primary,
                        borderRadius: 12, // Circle for selected
                        elevation: 4,
                        borderWidth: 2,
                        borderColor: Colors.background
                    },
                    text: { color: '#FFFFFF', fontWeight: 'bold' }
                }
            };
        }

        return marks;
    }, [dailySpending, selectedDate, Colors]);

    const selectedDayAmount = selectedDate ? dailySpending[selectedDate] || 0 : 0;

    return (
        <View style={[styles.container, Styles.shadow, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: Colors.text }]}>Spending Intensity</Text>
                    <Text style={styles.subHeader}>Daily transaction volume</Text>
                </View>
                {selectedDate && (
                    <View style={[styles.amountBadge, { backgroundColor: Colors.surfaceHighlight }]}>
                        <Text style={[styles.amountText, { color: Colors.text }]}>
                            {format(new Date(selectedDate), 'MMM d')}
                        </Text>
                        <Text style={[styles.amountValue, { color: Colors.primary }]}>
                            {currencySymbol}{selectedDayAmount.toFixed(0)}
                        </Text>
                    </View>
                )}
            </View>

            <Calendar
                theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: Colors.textSecondary,
                    selectedDayBackgroundColor: Colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: Colors.primary,
                    dayTextColor: Colors.text,
                    textDisabledColor: Colors.textSecondary + '40', // 25% opacity
                    monthTextColor: Colors.text,
                    textMonthFontFamily: 'Geist-Bold',
                    textDayFontFamily: 'Geist-Regular',
                    textDayHeaderFontFamily: 'Geist-Medium',
                    arrowColor: Colors.primary,
                    textDayFontSize: 12,
                    textMonthFontSize: 16,
                    'stylesheet.calendar.header': {
                        week: {
                            marginTop: 5,
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                        }
                    }
                }}
                markingType={'custom'}
                markedDates={markedDates}
                onDayPress={(day: { dateString: string }) => {
                    setSelectedDate(day.dateString);
                }}
                enableSwipeMonths={true}
                hideExtraDays={true}
            />

            <View style={styles.legendContainer}>
                <Text style={[styles.legendLabel, { color: Colors.textSecondary }]}>Less</Text>
                <View style={styles.legendGradient}>
                    {[Colors.surfaceHighlight, '#32D74B', '#FFD60A', '#FF9F0A', '#FF453A'].map((c, i) => (
                        <View key={i} style={[styles.legendDot, { backgroundColor: c }]} />
                    ))}
                </View>
                <Text style={[styles.legendLabel, { color: Colors.textSecondary }]}>More</Text>
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
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'Geist-Bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    subHeader: {
        fontSize: 13,
        color: '#8E8E93',
        fontFamily: 'Geist-Regular',
    },
    amountBadge: {
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    amountText: {
        fontSize: 11,
        fontFamily: 'Geist-Medium',
        opacity: 0.7
    },
    amountValue: {
        fontSize: 14,
        fontFamily: 'Geist-Bold',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 12,
        paddingRight: 8,
        gap: 8,
    },
    legendGradient: {
        flexDirection: 'row',
        gap: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },
    legendLabel: {
        fontSize: 10,
        fontFamily: 'Geist-Medium',
    }
});
