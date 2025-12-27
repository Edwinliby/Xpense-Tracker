import { useThemeColor } from '@/hooks/useThemeColor';
import { SavingsGoal, useExpense } from '@/store/expenseStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    initialGoal?: SavingsGoal | null; // If provided, we are editing
}

const COLORS = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
const ICONS = ['airplane', 'car', 'home', 'desktop', 'gift', 'school', 'medkit', 'bicycle', 'camera', 'game-controller', 'phone-portrait', 'cart', 'shirt', 'watch', 'fast-food', 'heart'];

const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, onClose, initialGoal }) => {
    const { addGoal, updateGoal, deleteGoal } = useExpense();
    const Colors = useThemeColor();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [priority, setPriority] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

    useEffect(() => {
        if (visible) {
            if (initialGoal) {
                setName(initialGoal.name);
                setTargetAmount(initialGoal.targetAmount.toString());
                setPriority(initialGoal.priority ? initialGoal.priority.toString() : '');
                setSelectedColor(initialGoal.color);
                setSelectedIcon(initialGoal.icon);
            } else {
                resetForm();
            }
        }
    }, [visible, initialGoal]);

    const handleSave = () => {
        if (!name || !targetAmount) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const target = parseFloat(targetAmount);
        if (isNaN(target) || target <= 0) {
            Alert.alert('Error', 'Please enter a valid target amount');
            return;
        }

        const prio = parseInt(priority) || 0;
        const finalPrio = priority.trim() === '' ? undefined : parseInt(priority);

        if (initialGoal) {
            updateGoal(initialGoal.id, {
                name,
                targetAmount: target,
                color: selectedColor,
                icon: selectedIcon,
                priority: finalPrio !== undefined ? finalPrio : (initialGoal.priority || 0), // Fix type error: fallback to 0 or initial
            });
        } else {
            addGoal({
                name,
                targetAmount: target,
                color: selectedColor,
                icon: selectedIcon,
                priority: finalPrio !== undefined ? finalPrio : 0, // Should fallback to length+1 in store if 0/undefined? Store handles it if undefined.
            });
        }

        onClose();
    };

    const handleDelete = () => {
        if (!initialGoal) return;
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete "${initialGoal.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteGoal(initialGoal.id);
                        onClose();
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setName('');
        setTargetAmount('');
        setPriority('');
        setSelectedColor(COLORS[0]);
        setSelectedIcon(ICONS[0]);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                    {/* ... header ... */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Colors.text }]}>
                            {initialGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>Goal Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: Colors.surfaceHighlight, color: Colors.text }]}
                                placeholder="e.g. New Laptop"
                                placeholderTextColor={Colors.tabIconDefault}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: Colors.textSecondary }]}>Target Amount</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: Colors.surfaceHighlight, color: Colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.tabIconDefault}
                                    keyboardType="numeric"
                                    value={targetAmount}
                                    onChangeText={setTargetAmount}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: Colors.textSecondary }]}>Priority (1, 2...)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: Colors.surfaceHighlight, color: Colors.text }]}
                                    placeholder="Auto"
                                    placeholderTextColor={Colors.tabIconDefault}
                                    keyboardType="numeric"
                                    value={priority}
                                    onChangeText={setPriority}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
                                {COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && [styles.selectedOption, { borderColor: Colors.text }]]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && <Ionicons name="checkmark" size={16} color="white" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>Icon</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                                {ICONS.map(icon => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[styles.iconOption, { backgroundColor: Colors.surfaceHighlight }, selectedIcon === icon && { backgroundColor: selectedColor }]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <Ionicons name={icon as any} size={24} color={selectedIcon === icon ? 'white' : Colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: selectedColor }]} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>
                                {initialGoal ? 'Save Changes' : 'Create Goal'}
                            </Text>
                        </TouchableOpacity>

                        {initialGoal && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <Text style={[styles.deleteButtonText, { color: Colors.danger }]}>Delete Goal</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    colorScroll: {
        paddingVertical: 4,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedOption: {
        borderWidth: 2,
    },
    iconScroll: {
        paddingVertical: 4,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    saveButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddGoalModal;
