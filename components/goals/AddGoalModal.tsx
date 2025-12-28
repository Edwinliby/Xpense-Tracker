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
                            {initialGoal ? 'Edit Goal' : 'New Goal'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: Colors.surfaceHighlight }]}>
                            <Ionicons name="close" size={20} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>NAME</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: Colors.surfaceHighlight, color: Colors.text, borderColor: Colors.surfaceHighlight }]}
                                placeholder="e.g. Dream Vacation"
                                placeholderTextColor={Colors.tabIconDefault}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: Colors.textSecondary }]}>TARGET AMOUNT</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: Colors.surfaceHighlight, color: Colors.text, borderColor: Colors.surfaceHighlight }]}
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.tabIconDefault}
                                    keyboardType="numeric"
                                    value={targetAmount}
                                    onChangeText={setTargetAmount}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 0.8 }]}>
                                <Text style={[styles.label, { color: Colors.textSecondary }]}>PRIORITY</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: Colors.surfaceHighlight, color: Colors.text, borderColor: Colors.surfaceHighlight }]}
                                    placeholder="Top"
                                    placeholderTextColor={Colors.tabIconDefault}
                                    keyboardType="numeric"
                                    value={priority}
                                    onChangeText={setPriority}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>COLOR TAG</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
                                {COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.selectedOption
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark" size={18} color="white" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>ICON</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                                {ICONS.map(icon => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconOption,
                                            { backgroundColor: Colors.surfaceHighlight },
                                            selectedIcon === icon && { backgroundColor: selectedColor, transform: [{ scale: 1.1 }] }
                                        ]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <Ionicons name={icon as any} size={24} color={selectedIcon === icon ? 'white' : Colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: selectedColor, shadowColor: selectedColor }]}
                            onPress={handleSave}
                            activeOpacity={0.8}
                        >
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        padding: 24,
        paddingTop: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        marginBottom: 10,
        fontFamily: 'Geist-Bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    input: {
        borderRadius: 16,
        padding: 18,
        fontSize: 17,
        fontFamily: 'Geist-Medium',
        borderWidth: 1,
    },
    colorScroll: {
        paddingVertical: 4,
        paddingRight: 20
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedOption: {
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
    },
    iconScroll: {
        paddingVertical: 4,
        paddingRight: 20
    },
    iconOption: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    saveButton: {
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 17,
        fontFamily: 'Geist-Bold',
    },
    deleteButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    deleteButtonText: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
    },
});

export default AddGoalModal;
