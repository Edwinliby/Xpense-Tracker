import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, startOfMonth } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const FinancialHealthWidget: React.FC = () => {
    const Colors = useThemeColor();
    const Styles = useStyles();
    const { transactions, budget, income } = useExpense();

    const { score, level, color, tip, isGood } = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const currentMonthTx = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= monthStart && date <= monthEnd;
        });

        const monthExpenses = currentMonthTx
            .filter(t => t.type === 'expense' && !t.excludeFromBudget)
            .reduce((sum, t) => sum + t.amount, 0);

        const monthIncome = currentMonthTx
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const effectiveIncome = Math.max(monthIncome, income);

        // 1. Savings Rate
        let savingsScore = 0;
        let savingsRate = 0;
        if (effectiveIncome > 0) {
            savingsRate = (effectiveIncome - monthExpenses) / effectiveIncome;
            if (savingsRate >= 0.2) savingsScore = 40;
            else if (savingsRate > 0) savingsScore = (savingsRate / 0.2) * 40;
        }

        // 2. Budget Adherence
        let budgetScore = 40;
        if (budget > 0) {
            const budgetUsedPct = monthExpenses / budget;
            if (budgetUsedPct > 1) budgetScore = 0;
            else if (budgetUsedPct > 0.9) budgetScore = 20;
            else budgetScore = 40;
        } else {
            budgetScore = 20;
            if (effectiveIncome > 0 && monthExpenses < effectiveIncome) budgetScore = 40;
        }

        // 3. Cash Flow
        let cashFlowScore = 0;
        if (effectiveIncome > monthExpenses) cashFlowScore = 20;

        const totalScore = Math.min(100, Math.round(savingsScore + budgetScore + cashFlowScore));

        let lvl = 'Needs Focus';
        let col = Colors.danger;
        let advice = 'Review spending.';
        let good = false;

        if (totalScore >= 80) {
            lvl = 'Excellent';
            col = Colors.success;
            advice = 'Crushing it!';
            good = true;
        } else if (totalScore >= 60) {
            lvl = 'Good';
            col = '#34D399';
            advice = 'Doing well.';
            good = true;
        } else if (totalScore >= 40) {
            lvl = 'Fair';
            col = Colors.warning;
            advice = 'Save more.';
        }

        if (budgetScore < 20 && budget > 0) advice = 'Over budget.';
        else if (savingsRate < 0.05 && effectiveIncome > 0 && totalScore < 80) advice = 'Save small amounts.';

        return { score: totalScore, level: lvl, color: col, tip: advice, isGood: good };
    }, [transactions, budget, income, Colors]);

    // Animation
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(score / 100, {
            duration: 1500,
            easing: Easing.out(Easing.exp),
        });
    }, [score, progress]);

    // Compact Config
    const size = 70; // Smaller chart
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const animatedCircleProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference - progress.value * circumference,
        };
    });

    return (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.container}>
            <LinearGradient
                colors={isGood ? [Colors.surface, Colors.surfaceHighlight] : [Colors.surface, Colors.surface]}
                style={[styles.card, Styles.shadow, { borderColor: isGood ? color + '40' : 'rgba(255,255,255,0.05)' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.row}>
                    {/* Left: Compact Chart */}
                    <View style={styles.chartWrapper}>
                        <Svg width={size} height={size}>
                            <Defs>
                                <SvgGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor={color} stopOpacity="1" />
                                    <Stop offset="1" stopColor={color} stopOpacity="0.7" />
                                </SvgGradient>
                            </Defs>
                            <Circle
                                stroke={Colors.surfaceHighlight}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                strokeWidth={strokeWidth}
                                strokeOpacity={0.8}
                            />
                            <AnimatedCircle
                                stroke="url(#scoreGrad)"
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeLinecap="round"
                                rotation="-90"
                                origin={`${size / 2}, ${size / 2}`}
                                animatedProps={animatedCircleProps}
                            />
                        </Svg>
                        <View style={styles.absoluteCenter}>
                            <Text style={[styles.scoreNumber, { color: Colors.text }]}>{score}</Text>
                        </View>
                    </View>

                    {/* Right: Info */}
                    <View style={styles.infoCol}>
                        <View style={styles.headerRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.title, { color: Colors.text }]}>Financial Health</Text>
                                {isGood && <Sparkles size={14} color={color} />}
                            </View>
                            <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                                <Text style={[styles.badgeText, { color: color }]}>{level}</Text>
                            </View>
                        </View>

                        <Text style={[styles.tipText, { color: Colors.textSecondary }]} numberOfLines={2}>
                            {tip}
                        </Text>
                    </View>
                </View>

            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 20,
        padding: 16, // Reduced padding
        borderWidth: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    chartWrapper: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    absoluteCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 20,
        fontFamily: 'Geist-Bold',
        letterSpacing: -1,
    },
    infoCol: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 15,
        fontFamily: 'Geist-Bold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Geist-Bold',
        textTransform: 'uppercase',
    },
    tipText: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        lineHeight: 18,
    },
});
