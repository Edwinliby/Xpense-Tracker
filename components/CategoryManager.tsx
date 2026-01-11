import { Button } from '@/components/Button';
import { ColorPicker } from '@/components/ColorPicker';
import { IconPicker } from '@/components/IconPicker';
import { Input } from '@/components/Input';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import * as Icons from 'lucide-react-native';
import { Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const CategoryManager = () => {
    const Colors = useThemeColor();
    const { categories, addCategory, deleteCategory } = useExpense();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Circle');
    const [selectedColor, setSelectedColor] = useState('#FF6B6B');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }
        addCategory(newCategoryName, selectedIcon, selectedColor);
        setNewCategoryName('');
        setSelectedIcon('Circle');
        setSelectedColor('#FF6B6B');
        setShowAddModal(false);
    };

    const handleDeleteCategory = (id: string, name: string) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${name}"? Transactions will not be deleted but may lose their category association.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
            ]
        );
    };

    const renderIcon = (iconName: string, color: string, size = 24) => {
        const IconComponent = (Icons as any)[iconName] || Icons.Circle;
        return <IconComponent size={size} color={color} />;
    };

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
                        onPress={() => !cat.isPredefined && handleDeleteCategory(cat.id, cat.name)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: cat.color + '15' }]}>
                            {renderIcon(cat.icon, cat.color, 24)}
                        </View>
                        <Text style={[styles.categoryName, { color: Colors.text }]} numberOfLines={1}>{cat.name}</Text>

                        {!cat.isPredefined && (
                            <View style={[styles.dleteBadge, { backgroundColor: Colors.surfaceHighlight }]}>
                                <X size={10} color={Colors.textSecondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                {/* Add New Button */}
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: Colors.surface, borderColor: Colors.border, borderStyle: 'dashed' }]}
                    onPress={() => setShowAddModal(true)}
                >
                    <View style={[styles.iconContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                        <Plus size={24} color={Colors.textSecondary} />
                    </View>
                    <Text style={[styles.categoryName, { color: Colors.textSecondary }]}>Add New</Text>
                </TouchableOpacity>
            </View>

            {/* Add Category Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.text }]}>New Category</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ padding: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 20 }}>
                                <X size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Category Name"
                            placeholder="e.g., Entertainment"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                        />

                        <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 20, marginBottom: 12 }]}>Icon & Color</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.pickerButton, { flex: 1, backgroundColor: Colors.background, borderColor: Colors.border }]}
                                onPress={() => setShowIconPicker(true)}
                            >
                                <View style={[styles.iconPreview, { backgroundColor: selectedColor + '20' }]}>
                                    {renderIcon(selectedIcon, selectedColor, 20)}
                                </View>
                                <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Select Icon</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pickerButton, { flex: 1, backgroundColor: Colors.background, borderColor: Colors.border }]}
                                onPress={() => setShowColorPicker(true)}
                            >
                                <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                                <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Select Color</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Add Category"
                                onPress={handleAddCategory}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <IconPicker
                visible={showIconPicker}
                selectedIcon={selectedIcon}
                onSelect={setSelectedIcon}
                onClose={() => setShowIconPicker(false)}
            />

            <ColorPicker
                visible={showColorPicker}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
                onClose={() => setShowColorPicker(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '30%', // Approx 3 columns
        flexGrow: 1,
        aspectRatio: 1,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
        textAlign: 'center',
    },
    dleteBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Geist-Bold',
    },
    label: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    pickerButtonText: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
    },
    iconPreview: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPreview: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
    },
});
