import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { SavingsGoal } from '@/types/expense';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GoalCardProps {
    goal: SavingsGoal;
    onPress: () => void;
    onLongPress?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, onLongPress }) => {
    const { currencySymbol } = useExpense();
    const Colors = useThemeColor();

    const progress = Math.min(Math.max(0, goal.currentAmount / goal.targetAmount), 1);
    const progressPercent = Math.round(progress * 100);
    const remaining = goal.targetAmount - goal.currentAmount;

    // Helper to dim color for background tint
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.9}
            style={[styles.container, {
                shadowColor: goal.color,
                backgroundColor: Colors.surface,
            }]}
        >
            <View style={styles.cardContent}>
                {/* Header: Icon & Priority */}
                <View style={styles.headerRow}>
                    <View style={[styles.iconBox, { backgroundColor: hexToRgba(goal.color, 0.15) }]}>
                        <Ionicons name={goal.icon as any} size={24} color={goal.color} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.goalName, { color: Colors.text }]} numberOfLines={1}>
                                {goal.name}
                            </Text>
                            {/* Completion Badge or Priority */}
                            {goal.isCompleted ? (
                                <View style={[styles.badge, { backgroundColor: Colors.success }]}>
                                    <Ionicons name="checkmark" size={10} color="white" />
                                    <Text style={styles.badgeText}>Done</Text>
                                </View>
                            ) : (
                                goal.priority !== undefined && goal.priority < 999 && (
                                    <View style={[styles.badge, { backgroundColor: Colors.surfaceHighlight }]}>
                                        <Text style={[styles.badgeText, { color: Colors.textSecondary, fontSize: 10 }]}>#{goal.priority}</Text>
                                    </View>
                                )
                            )}
                        </View>
                        <Text style={[styles.targetText, { color: Colors.textSecondary }]}>
                            Target: {currencySymbol}{goal.targetAmount.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                    <View style={styles.progressLabels}>
                        <Text style={[styles.savedAmount, { color: Colors.text }]}>
                            {currencySymbol}{goal.currentAmount.toLocaleString()}
                        </Text>
                        <Text style={[styles.percentText, { color: goal.color }]}>
                            {progressPercent}%
                        </Text>
                    </View>

                    <View style={[styles.progressBarBase, { backgroundColor: Colors.surfaceHighlight }]}>
                        <LinearGradient
                            colors={[goal.color, hexToRgba(goal.color, 0.8)]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                        />
                    </View>

                    <Text style={[styles.remainingText, { color: Colors.textSecondary }]}>
                        {goal.isCompleted
                            ? 'You did it!'
                            : `${currencySymbol}${remaining.toLocaleString()} more to go`}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        marginVertical: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6, // Android shadow
    },
    cardContent: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalName: {
        fontSize: 17,
        fontFamily: 'Geist-Bold',
        marginBottom: 2,
    },
    targetText: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        marginTop: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontFamily: 'Geist-Bold',
        textTransform: 'uppercase',
    },
    progressSection: {
        gap: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    savedAmount: {
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    percentText: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
    },
    progressBarBase: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    remainingText: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
        textAlign: 'right',
        marginTop: 4,
    },
});

export default GoalCard;
