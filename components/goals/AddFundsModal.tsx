import { useAlert } from '@/context/AlertContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AddFundsModalProps {
    visible: boolean;
    onClose: () => void;
    goalId: string | null;
    goalName: string;
    currentAmount: number;
    targetAmount: number;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ visible, onClose, goalId, goalName, currentAmount, targetAmount }) => {
    const { updateGoal, currencySymbol, transactions, income } = useExpense();
    const Colors = useThemeColor();
    const { showAlert } = useAlert();
    const [amount, setAmount] = useState('');

    // Calculate remaining monthly income
    const remainingIncome = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthlyExpenses = transactions
            .filter(t =>
                t.type === 'expense' &&
                !t.deletedAt &&
                new Date(t.date) >= startOfMonth &&
                new Date(t.date) <= endOfMonth
            )
            .reduce((sum, t) => sum + t.amount, 0);

        return Math.max(0, income - monthlyExpenses);
    }, [transactions, income]);

    const handleSave = () => {
        if (!amount || !goalId) return;

        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) {
            showAlert('Error', 'Please enter a valid amount');
            return;
        }

        const newAmount = currentAmount + value;
        if (newAmount > targetAmount) {
            showAlert('Whoops', `You only need ${currencySymbol}${(targetAmount - currentAmount).toFixed(2)} to reach your goal!`);
            return;
        }

        updateGoal(goalId, {
            currentAmount: newAmount,
            isCompleted: newAmount >= targetAmount
        });

        if (newAmount >= targetAmount) {
            showAlert('Congratulations! 🎉', `You've reached your goal for ${goalName}!`);
        }

        setAmount('');
        onClose();
    };

    const handleAutoFill = () => {
        if (remainingIncome <= 0) {
            showAlert('No Savings Available', 'Your expenses exceed your income for this month.');
            return;
        }
        // Cap the auto-fill at the remaining amount needed for the goal
        const remainingGoal = targetAmount - currentAmount;
        const fillAmount = Math.min(remainingIncome, remainingGoal);
        setAmount(fillAmount.toFixed(2));
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Colors.text }]}>Add Funds to {goalName}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>How much would you like to add?</Text>

                    <View style={[styles.inputContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                        <Text style={[styles.currency, { color: Colors.text }]}>{currencySymbol}</Text>
                        <TextInput
                            style={[styles.input, { color: Colors.text }]}
                            placeholder="0.00"
                            placeholderTextColor={Colors.tabIconDefault}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>

                    {/* Auto-Calculate Button */}
                    <TouchableOpacity style={[styles.autoButton, { borderColor: Colors.primary }]} onPress={handleAutoFill}>
                        <Ionicons name="sparkles" size={16} color={Colors.primary} />
                        <Text style={[styles.autoButtonText, { color: Colors.primary }]}>
                            Auto-Fill from Remaining Income ({currencySymbol}{remainingIncome.toLocaleString()})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.saveButton, { backgroundColor: Colors.primary }]} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Add Funds</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    currency: {
        fontSize: 24,
        fontWeight: '600',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        paddingVertical: 16,
    },
    autoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        gap: 8,
    },
    autoButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddFundsModal;
