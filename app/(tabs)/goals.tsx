import AddGoalModal from '@/components/goals/AddGoalModal';
import GoalCard from '@/components/goals/GoalCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { SavingsGoal, useExpense } from '@/store/expenseStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {goals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="rocket-outline" size={64} color={Colors.tabIconDefault} />
                        <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>No goals yet. Start saving today!</Text>
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtext: {
        fontSize: 12,
        marginTop: 4,
        marginBottom: 4,
        maxWidth: 250,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for tab bar
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    createButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    completedSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
});
