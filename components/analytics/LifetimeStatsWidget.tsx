import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { differenceInMonths, endOfMonth, startOfMonth } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { PiggyBank, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const LifetimeStatsWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, income, incomeStartDate, currencySymbol } = useExpense();

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);

        // --- 1. Global Lifetime Spend (ALL Time) ---
        // User requested "include every spends mentioned in transactions"
        const allTimeSpend = transactions
            .filter(t =>
                t.type === 'expense' &&
                !(t.isLent && t.isPaidBack) &&
                new Date(t.date) <= currentMonthEnd
            )
            .reduce((sum, t) => sum + t.amount, 0);


        // --- 2. Lifetime Saved (Since Tracking Started) ---
        // User requested "for the saved show only upto the current months from the income is entered"

        let trackingStartDate = currentMonthStart;

        // Find oldest transaction date for fallback
        const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const oldestTxDate = sortedTx.length > 0 ? startOfMonth(new Date(sortedTx[0].date)) : currentMonthStart;

        if (incomeStartDate) {
            const parts = incomeStartDate.split('-');
            if (parts.length >= 2) {
                trackingStartDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            } else {
                trackingStartDate = oldestTxDate;
            }
        } else {
            trackingStartDate = oldestTxDate;
        }

        // Calculate Months Active for Income Calculation
        // Ensure we don't count future months if start date is in future (though unlikely)
        const dateForMonths = now < trackingStartDate ? trackingStartDate : now;
        const monthsActive = differenceInMonths(dateForMonths, trackingStartDate) + 1;

        // Income during tracking period
        let trackingPeriodIncome = income * Math.max(1, monthsActive);

        // Add Income Transactions during tracking period
        const extraIncome = transactions
            .filter(t =>
                t.type === 'income' &&
                new Date(t.date) >= trackingStartDate &&
                new Date(t.date) <= currentMonthEnd
            )
            .reduce((sum, t) => sum + t.amount, 0);

        trackingPeriodIncome += extraIncome;

        // Expenses during tracking period
        const trackingPeriodSpend = transactions
            .filter(t =>
                t.type === 'expense' &&
                !(t.isLent && t.isPaidBack) &&
                new Date(t.date) >= trackingStartDate &&
                new Date(t.date) <= currentMonthEnd
            )
            .reduce((sum, t) => sum + t.amount, 0);

        // Saved = Income (during period) - Spend (during period)
        const lifetimeSaved = trackingPeriodIncome - trackingPeriodSpend;

        return {
            spend: allTimeSpend,
            remaining: lifetimeSaved
        };
    }, [transactions, income, incomeStartDate]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.surface, Colors.surfaceHighlight]} // Subtle gradient for the pill
                style={[styles.banner, Styles.shadow, { shadowColor: Colors.shadow, borderColor: Colors.border }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {/* Spend Section */}
                <View style={styles.section}>
                    <View style={styles.headerRow}>
                        <Wallet size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[styles.label, { color: Colors.textSecondary }]}>Lifetime Spend</Text>
                    </View>
                    <Text style={[styles.value, { color: Colors.text }]}>
                        {currencySymbol}{stats.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>

                {/* Vertical Divider */}
                <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                {/* Saved Section */}
                <View style={styles.section}>
                    <View style={styles.headerRow}>
                        <PiggyBank size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[styles.label, { color: Colors.textSecondary }]}>Lifetime Saved</Text>
                    </View>
                    <Text style={[styles.value, { color: Colors.primary }]}>
                        {currencySymbol}{stats.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 24,
        paddingHorizontal: 20, // Align with other widgets
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    section: {
        flex: 1,
        alignItems: 'center', // Center content in each half
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        opacity: 0.8,
    },
    divider: {
        width: 1,
        height: '80%',
        marginHorizontal: 16,
    },
    label: {
        fontSize: 11,
        fontFamily: 'Geist-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 20,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    }
});
