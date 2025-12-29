import AddGoalModal from '@/components/goals/AddGoalModal';
import GoalCard from '@/components/goals/GoalCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SavingsGoal, useExpense } from '@/store/expenseStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
    const { goals } = useExpense();
    const Colors = useThemeColor();
    // Sort goals by priority for display too
    const sortedGoals = useMemo(() => {
        return [...goals].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    }, [goals]);

    const activeGoals = sortedGoals.filter(g => !g.isCompleted);
    const completedGoals = sortedGoals.filter(g => g.isCompleted);

    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

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
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: Colors.text }]}>Savings Goals</Text>
                    <Text style={[styles.subtext, { color: Colors.textSecondary }]}>Funds are allocated from your remaining balance</Text>
                </View>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors.primary }]} onPress={() => setIsAddModalVisible(true)}>
                    <Ionicons name="add" size={26} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                            <Ionicons name="rocket-outline" size={48} color={Colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: Colors.text }]}>Start Saving</Text>
                        <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>Create a goal to track your progress and achieve your dreams.</Text>
                        <TouchableOpacity style={[styles.createButton, { backgroundColor: Colors.primary }]} onPress={() => setIsAddModalVisible(true)}>
                            <Text style={styles.createButtonText}>Create Goal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
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
                                <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Completed</Text>
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
                    </>
                )}
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
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Geist-Bold',
        letterSpacing: -1,
    },
    subtext: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        marginTop: 4,
        maxWidth: 260,
        lineHeight: 18,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for tab bar
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        fontSize: 15,
        fontFamily: 'Geist-Regular',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    createButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 20,
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
    completedSection: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 16,
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
