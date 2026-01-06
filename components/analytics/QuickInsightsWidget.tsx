import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export const QuickInsightsWidget: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, budget, currencySymbol } = useExpense();

    const insights = useMemo(() => {
        const thisMonthStart = startOfMonth(targetDate);
        const thisMonthEnd = endOfMonth(targetDate);
        const lastMonth = subMonths(targetDate, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);

        const thisMonthSpent = transactions
            .filter(t =>
                t.type === 'expense' &&
                isWithinInterval(new Date(t.date), { start: thisMonthStart, end: thisMonthEnd }) &&
                !t.excludeFromBudget &&
                !(t.isLent && t.isPaidBack)
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthSpent = transactions
            .filter(t =>
                t.type === 'expense' &&
                isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }) &&
                !t.excludeFromBudget &&
                !(t.isLent && t.isPaidBack)
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const change = lastMonthSpent > 0 ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;
        const isIncrease = change > 0;

        const avgTransaction = transactions.length > 0
            ? transactions
                .filter(t => !t.excludeFromBudget && !(t.isLent && t.isPaidBack))
                .reduce((sum, t) => sum + t.amount, 0) / transactions.length
            : 0;

        const budgetUsed = budget > 0 ? (thisMonthSpent / budget) * 100 : 0;

        return [
            {
                id: 'trend',
                title: 'Monthly Trend',
                value: `${Math.abs(change).toFixed(1)}%`,
                subtitle: isIncrease ? 'Higher than last month' : 'Lower than last month',
                icon: isIncrease ? TrendingUp : TrendingDown,
                color: isIncrease ? Colors.danger : Colors.success,
                bgGradient: isIncrease ? [Colors.danger + '20', Colors.danger + '05'] : [Colors.success + '20', Colors.success + '05']
            },
            {
                id: 'budget',
                title: 'Budget Status',
                value: budget > 0 ? `${budgetUsed.toFixed(0)}%` : 'No Limit',
                subtitle: budget > 0
                    ? (budgetUsed < 100 ? 'Of budget used' : 'Over budget!')
                    : 'Set a budget to track',
                icon: budgetUsed >= 100 ? AlertCircle : CheckCircle2,
                color: budgetUsed >= 100 ? Colors.danger : (budgetUsed > 80 ? Colors.warning : Colors.success),
                bgGradient: budgetUsed >= 100
                    ? [Colors.danger + '20', Colors.danger + '05']
                    : (budgetUsed > 80 ? [Colors.warning + '20', Colors.warning + '05'] : [Colors.success + '20', Colors.success + '05'])
            },
            {
                id: 'avg',
                title: 'Average Spend',
                value: `${currencySymbol}${avgTransaction.toFixed(0)}`,
                subtitle: 'Per transaction',
                icon: Wallet,
                color: Colors.primary,
                bgGradient: [Colors.primary + '20', Colors.primary + '05']
            },
        ];
    }, [transactions, budget, currencySymbol, Colors, targetDate]);

    const scrollViewRef = React.useRef<ScrollView>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartX = React.useRef(0);
    const scrollStartX = React.useRef(0);

    // Web Drag Logic


    // To make this robust, we need to track scroll offset.
    const scrollOffset = React.useRef(0);
    const handleScroll = (event: any) => {
        scrollOffset.current = event.nativeEvent.contentOffset.x;
    };

    const onMouseMove = (e: any) => {
        if (!isDragging || Platform.OS !== 'web' || !scrollViewRef.current) return;
        const x = e.nativeEvent.pageX;
        const walk = (x - dragStartX.current) * 1.5; // Scroll-fast
        scrollViewRef.current.scrollTo({ x: scrollStartX.current - walk, animated: false });
    };

    const onMouseUp = () => {
        if (Platform.OS !== 'web') return;
        setIsDragging(false);
    };

    // We need to capture scroll start position on mouse down.
    // Modified onMouseDown:
    const handleMouseDown = (e: any) => {
        if (Platform.OS !== 'web') return;
        setIsDragging(true);
        dragStartX.current = e.nativeEvent.pageX;
        scrollStartX.current = scrollOffset.current;
    };


    return (
        <View style={styles.container}>
            <View
                // @ts-ignore - React Native Web supports these props but types might not
                onMouseDown={handleMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' } as any}

            >
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    style={{ userSelect: 'none' } as any} // Prevent text selection while dragging
                >
                    {insights.map((item) => (
                        <View
                            key={item.id}
                            style={[
                                styles.cardContainer,
                                Styles.shadow,
                                {
                                    backgroundColor: Colors.surface,
                                    shadowColor: Colors.shadow,
                                    borderColor: 'rgba(255,255,255,0.05)',
                                    borderWidth: 1
                                }
                            ]}
                        >
                            <LinearGradient
                                colors={item.bgGradient as [string, string]}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                    {React.createElement(item.icon, { size: 18, color: item.color })}
                                </View>
                                <View>
                                    <Text style={[styles.cardTitle, { color: Colors.textSecondary }]}>{item.title}</Text>
                                    <Text style={[styles.cardValue, { color: Colors.text }]}>{item.value}</Text>
                                    <Text style={[styles.cardSubtitle, { color: Colors.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24, // Reduced from 32
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12, // Reduced from 16
        paddingBottom: 4,
    },
    cardContainer: {
        width: 140, // Reduced from 170
        height: 150, // Reduced from 190
        borderRadius: 20, // Reduced from 24
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        padding: 14, // Reduced from 20
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 36, // Reduced from 48
        height: 36,
        borderRadius: 12, // Reduced from 20
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 10, // Reduced from 12
        fontFamily: 'Geist-SemiBold',
        marginBottom: 4, // Reduced from 6
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 20, // Reduced from 24
        fontFamily: 'Geist-Bold',
        marginBottom: 4, // Reduced from 6
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 10, // Reduced from 12
        fontFamily: 'Geist-Medium',
        opacity: 0.8,
    },
});
