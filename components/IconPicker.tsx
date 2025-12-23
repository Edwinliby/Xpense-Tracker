import { useThemeColor } from '@/hooks/useThemeColor';
import * as Icons from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface IconPickerProps {
    visible: boolean;
    selectedIcon: string;
    onSelect: (icon: string) => void;
    onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ visible, selectedIcon, onSelect, onClose }) => {
    const Colors = useThemeColor();
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamically get all icon names, filtering out non-icon exports
    const allIcons = useMemo(() => {
        return Object.keys(Icons).filter(key => {
            // Filter out internal components/functions and ensure it's likely an icon
            return key !== 'createLucideIcon' && key !== 'Icon' && key !== 'icons' && /^[A-Z]/.test(key);
        });
    }, []);

    const filteredIcons = useMemo(() => {
        if (!searchQuery) return allIcons;
        return allIcons.filter(icon =>
            icon.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allIcons, searchQuery]);

    const renderIcon = (iconName: string) => {
        const IconComponent = (Icons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent size={24} color={Colors.text} />;
    };

    const renderItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.iconButton,
                { backgroundColor: Colors.background, borderColor: Colors.border },
                selectedIcon === item && { backgroundColor: Colors.primary, borderColor: Colors.primary }
            ]}
            onPress={() => {
                onSelect(item);
                onClose();
            }}
        >
            <View style={{ opacity: selectedIcon === item ? 1 : 0.7 }}>
                {renderIcon(item)}
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: Colors.text }]}>Select Icon</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icons.X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.searchInput, { backgroundColor: Colors.background, color: Colors.text, borderColor: Colors.border }]}
                        placeholder="Search icons..."
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />

                    <FlatList
                        data={filteredIcons}
                        renderItem={renderItem}
                        keyExtractor={item => item}
                        numColumns={5}
                        columnWrapperStyle={styles.iconRow}
                        contentContainerStyle={styles.iconGrid}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={20}
                        maxToRenderPerBatch={20}
                        windowSize={5}
                    />
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
        height: '80%', // Fixed height for FlatList
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    searchInput: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        fontSize: 16,
    },
    iconGrid: {
        paddingBottom: 20,
    },
    iconRow: {
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    iconButton: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
