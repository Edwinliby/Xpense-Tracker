import { useThemeColor } from '@/hooks/useThemeColor';
import { SavingsGoal, useExpense } from '@/store/expenseStore';
import { Ionicons } from '@expo/vector-icons';
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
    // Debug logging


    const progress = Math.min(Math.max(0, goal.currentAmount / goal.targetAmount), 1);
    const progressPercent = Math.round(progress * 100);
    const remaining = goal.targetAmount - goal.currentAmount;

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: Colors.surface }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: goal.color }]}>
                    <Ionicons name={goal.icon as any} size={24} color="white" />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.name, { color: Colors.text }]}>{goal.name}</Text>
                    <View style={styles.priorityRow}>
                        {goal.priority !== undefined && goal.priority < 999 && (
                            <View style={[styles.priorityBadge, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Text style={[styles.priorityText, { color: Colors.textSecondary }]}>#{goal.priority}</Text>
                            </View>
                        )}
                        <Text style={[styles.target, { color: Colors.textSecondary }]}>
                            Target: {currencySymbol}{goal.targetAmount.toLocaleString()}
                        </Text>
                    </View>
                </View>
                {/* Removed Add Funds Button */}
                {goal.isCompleted && (
                    <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    </View>
                )}
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressTextRow}>
                    <Text style={[styles.currentAmount, { color: Colors.text }]}>{currencySymbol}{goal.currentAmount.toLocaleString()}</Text>
                    <Text style={[styles.percentage, { color: Colors.textSecondary }]}>{progressPercent}%</Text>
                </View>

                {/* Custom Progress Bar */}
                <View style={[styles.progressBarBackground, { backgroundColor: Colors.surfaceHighlight }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${progressPercent}%`,
                                backgroundColor: goal.color || Colors.primary
                            }
                        ]}
                    />
                </View>

                <Text style={[styles.remainingText, { color: Colors.textSecondary }]}>
                    {remaining > 0 ? `${currencySymbol}${remaining.toLocaleString()} left to save` : 'Goal Reached!'}
                </Text>
            </View>


        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    priorityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    target: {
        fontSize: 14,
    },
    completedBadge: {
        marginLeft: 8,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'flex-end',
    },
    currentAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    percentage: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    remainingText: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'right',
    },

});

export default GoalCard;
