import { useThemeColor } from '@/hooks/useThemeColor';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorPickerProps {
    visible: boolean;
    selectedColor: string;
    onSelect: (color: string) => void;
    onClose: () => void;
}

const COLORS = [
    { name: 'Red', value: '#FF6B6B' },
    { name: 'Teal', value: '#4ECDC4' },
    { name: 'Mint', value: '#95E1D3' },
    { name: 'Pink', value: '#F38181' },
    { name: 'Purple', value: '#AA96DA' },
    { name: 'Light Pink', value: '#FCBAD3' },
    { name: 'Green', value: '#A8E6CF' },
    { name: 'Yellow', value: '#FFD93D' },
    { name: 'Orange', value: '#FFA07A' },
    { name: 'Blue', value: '#87CEEB' },
    { name: 'Coral', value: '#FF7F50' },
    { name: 'Lavender', value: '#E6E6FA' },
    { name: 'Peach', value: '#FFDAB9' },
    { name: 'Lime', value: '#C7EA46' },
    { name: 'Sky', value: '#00CED1' },
    { name: 'Rose', value: '#FFB6C1' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ visible, selectedColor, onSelect, onClose }) => {
    const Colors = useThemeColor();

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: Colors.text }]}>Select Color</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.closeButton, { color: Colors.primary }]}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.colorGrid}>
                            {COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color.value}
                                    style={styles.colorItem}
                                    onPress={() => {
                                        onSelect(color.value);
                                        onClose();
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: color.value },
                                            selectedColor === color.value && styles.selectedColor
                                        ]}
                                    >
                                        {selectedColor === color.value && (
                                            <Check size={24} color="#FFFFFF" strokeWidth={3} />
                                        )}
                                    </View>
                                    <Text style={[styles.colorName, { color: Colors.text }]}>{color.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 20,
    },
    colorItem: {
        alignItems: 'center',
        width: '22%',
    },
    colorCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    colorName: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
});
