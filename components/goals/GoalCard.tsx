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
            style={[styles.card, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: goal.color }]}>
                    <Ionicons name={goal.icon as any} size={24} color="white" />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.name, { color: Colors.text }]} numberOfLines={1}>{goal.name}</Text>
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
                {goal.isCompleted && (
                    <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
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
        borderRadius: 24,
        padding: 20,
        marginVertical: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    priorityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 11,
        fontFamily: 'Geist-Bold',
    },
    target: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        opacity: 0.8,
    },
    completedBadge: {
        marginLeft: 12,
    },
    progressContainer: {
        marginTop: 4,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'flex-end',
    },
    currentAmount: {
        fontSize: 22,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    percentage: {
        fontSize: 15,
        fontFamily: 'Geist-Medium',
        marginBottom: 2,
    },
    progressBarBackground: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    remainingText: {
        fontSize: 13,
        fontFamily: 'Geist-Regular',
        marginTop: 10,
        textAlign: 'right',
        opacity: 0.8,
    },

});

export default GoalCard;
