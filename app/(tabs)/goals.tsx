import AddGoalModal from '@/components/goals/AddGoalModal';
import GoalCard from '@/components/goals/GoalCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SavingsGoal, useExpense } from '@/store/expenseStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
    const { goals, currencySymbol } = useExpense();
    const Colors = useThemeColor();

    const sortedGoals = useMemo(() => {
        return [...goals].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    }, [goals]);

    const activeGoals = sortedGoals.filter(g => !g.isCompleted);
    const completedGoals = sortedGoals.filter(g => g.isCompleted);

    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const handleEdit = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setIsAddModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsAddModalVisible(false);
        setEditingGoal(null);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: Colors.text }]}>Savings Goals</Text>
                    <Text style={[styles.subtext, { color: Colors.textSecondary }]}>
                        {activeGoals.length} Active • {completedGoals.length} Completed
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: Colors.primary }]}
                    onPress={() => setIsAddModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Card */}
                {activeGoals.length > 0 && (
                    <LinearGradient
                        colors={[Colors.surface, Colors.surfaceHighlight]}
                        style={styles.summaryCard}
                    >
                        <View style={styles.summaryRow}>
                            <View>
                                <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>TOTAL SAVED</Text>
                                <Text style={[styles.summaryAmount, { color: Colors.text }]}>
                                    {currencySymbol}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.summaryLabel, { color: Colors.textSecondary, textAlign: 'right' }]}>TOTAL TARGET</Text>
                                <Text style={[styles.summaryAmount, { color: Colors.text, textAlign: 'right' }]}>
                                    {currencySymbol}{totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.totalProgressBarBg}>
                            <LinearGradient
                                colors={[Colors.primary, '#4c669f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.totalProgressBarFill, { width: `${Math.min(100, totalProgress)}%` }]}
                            />
                        </View>
                        <Text style={[styles.totalProgressText, { color: Colors.textSecondary }]}>
                            {totalProgress.toFixed(1)}% of total goals funded
                        </Text>
                    </LinearGradient>
                )}

                {goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                            <Ionicons name="flag-outline" size={48} color={Colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: Colors.text }]}>Start Your Journey</Text>
                        <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                            Set aside money for things that matter. Create your first savings goal today.
                        </Text>
                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: Colors.primary }]}
                            onPress={() => setIsAddModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.createButtonText}>Create Goal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {activeGoals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onPress={() => handleEdit(goal)}
                                onLongPress={() => handleEdit(goal)}
                            />
                        ))}

                        {completedGoals.length > 0 && (
                            <View style={styles.completedSection}>
                                <View style={styles.divider}>
                                    <View style={[styles.line, { backgroundColor: Colors.border }]} />
                                    <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>COMPLETED</Text>
                                    <View style={[styles.line, { backgroundColor: Colors.border }]} />
                                </View>
                                {completedGoals.map(goal => (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        onPress={() => handleEdit(goal)}
                                        onLongPress={() => handleEdit(goal)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <AddGoalModal
                visible={isAddModalVisible}
                onClose={handleCloseModal}
                initialGoal={editingGoal}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'Geist-Bold',
        letterSpacing: -1,
    },
    subtext: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
        marginTop: 4,
    },
    addButton: {
        width: 52,
        height: 52,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    content: {
        paddingHorizontal: 20,
    },
    summaryCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryLabel: {
        fontSize: 11,
        fontFamily: 'Geist-Bold',
        marginBottom: 6,
        letterSpacing: 1,
    },
    summaryAmount: {
        fontSize: 22,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    totalProgressBarBg: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    totalProgressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    totalProgressText: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
        textAlign: 'center',
    },
    listContainer: {
        gap: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Geist-Bold',
        letterSpacing: 1,
    },
    completedSection: {
        // marginTop handled by divider
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Geist-Regular',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    createButton: {
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: 'white',
        fontFamily: 'Geist-Bold',
        fontSize: 16,
    },
});
