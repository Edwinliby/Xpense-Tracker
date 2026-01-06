import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { SavingsGoal } from '@/types/expense';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    initialGoal?: SavingsGoal | null;
}

const COLORS = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
const ICONS = ['airplane', 'car', 'home', 'desktop', 'gift', 'school', 'medkit', 'bicycle', 'camera', 'game-controller', 'phone-portrait', 'cart', 'shirt', 'watch', 'fast-food', 'heart'];

const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, onClose, initialGoal }) => {
    const { addGoal, updateGoal, deleteGoal, currencySymbol } = useExpense();
    const Colors = useThemeColor();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [priority, setPriority] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

    useEffect(() => {
        if (visible) {
            if (initialGoal) {
                setName(initialGoal.name);
                setTargetAmount(initialGoal.targetAmount.toString());
                setPriority(initialGoal.priority ? initialGoal.priority.toString() : '');
                setYear(initialGoal.year ? initialGoal.year.toString() : new Date().getFullYear().toString());
                setStartMonth(initialGoal.startMonth !== undefined ? initialGoal.startMonth : 0);
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

        const yearNum = parseInt(year);
        const finalPrio = priority.trim() === '' ? undefined : parseInt(priority);

        if (initialGoal) {
            updateGoal(initialGoal.id, {
                name,
                targetAmount: target,
                color: selectedColor,
                icon: selectedIcon,
                priority: finalPrio !== undefined ? finalPrio : (initialGoal.priority || 0),
                year: yearNum,
                startMonth
            });
        } else {
            addGoal({
                name,
                targetAmount: target,
                color: selectedColor,
                icon: selectedIcon,
                priority: finalPrio !== undefined ? finalPrio : 0,
                year: yearNum,
                startMonth
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
        setYear(new Date().getFullYear().toString());
        setStartMonth(new Date().getMonth());
        setSelectedColor(COLORS[0]);
        setSelectedIcon(ICONS[0]);
    };

    const { width } = useWindowDimensions();
    const isDesktop = width >= 768; // Standard tablet/desktop breakpoint

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={[
                styles.modalOverlay,
                isDesktop && { alignItems: 'center', justifyContent: 'center' }
            ]}>
                <View style={[
                    styles.modalContent,
                    { backgroundColor: Colors.surface },
                    isDesktop && {
                        width: '100%',
                        maxWidth: 500,
                        height: 'auto',
                        maxHeight: '90%',
                        borderRadius: 32, // Match top radius for full roundness
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10,
                    }
                ]}>

                    <View style={[styles.handle, { backgroundColor: Colors.textQuaternary }]} />

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
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>GOAL NAME</Text>
                            <View style={[styles.inputContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Ionicons name="pricetag" size={18} color={selectedColor} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.input, { color: Colors.text }]}
                                    placeholder="e.g. Dream Vacation"
                                    placeholderTextColor={Colors.tabIconDefault}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>TARGET AMOUNT</Text>
                            <View style={[styles.inputContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Text style={{ fontSize: 18, color: selectedColor, marginRight: 8, fontFamily: 'Geist-Medium' }}>{currencySymbol}</Text>
                                <TextInput
                                    style={[styles.input, { color: Colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.tabIconDefault}
                                    keyboardType="numeric"
                                    value={targetAmount}
                                    onChangeText={setTargetAmount}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors.textSecondary }]}>PRIORITY</Text>
                            <View style={[styles.inputContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Ionicons name="list" size={18} color={selectedColor} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.input, { color: Colors.text }]}
                                    placeholder="Goal Priority (e.g. 1)"
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

                        <TouchableOpacity onPress={handleSave} activeOpacity={0.9} style={{ marginTop: 24 }}>
                            <LinearGradient
                                colors={[selectedColor, selectedColor]} // Could add subtle gradient here later
                                style={[styles.saveButton, { shadowColor: selectedColor }]}
                            >
                                <Text style={styles.saveButtonText}>
                                    {initialGoal ? 'Save Changes' : 'Create Goal'}
                                </Text>
                            </LinearGradient>
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
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        padding: 24,
        paddingTop: 16, // Reduced top padding to accommodate handle
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
        opacity: 0.3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 50,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        marginBottom: 10,
        fontFamily: 'Geist-Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 20,
        height: 60, // Taller inputs
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontFamily: 'Geist-Medium',
    },
    colorScroll: {
        paddingVertical: 4,
        paddingRight: 20
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedOption: {
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5
    },
    iconScroll: {
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    iconOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    saveButton: {
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Geist-Bold',
        letterSpacing: 0.5,
    },
    deleteButton: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 16,
    },
    deleteButtonText: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
    },
});

export default AddGoalModal;
