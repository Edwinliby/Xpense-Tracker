import { useThemeColor } from '@/hooks/useThemeColor';
import { Category } from '@/store/expenseStore';
import * as Icons from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CategoryPickerProps {
    visible: boolean;
    categories: Category[];
    selectedCategory: string;
    onSelect: (categoryName: string) => void;
    onClose: () => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ visible, categories, selectedCategory, onSelect, onClose }) => {
    const Colors = useThemeColor();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const renderCategory = ({ item }: { item: Category }) => {
        const IconComponent = (Icons as any)[item.icon];
        const isSelected = selectedCategory === item.name;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryItem,
                    {
                        backgroundColor: isSelected ? item.color : Colors.surface,
                        borderColor: isSelected ? item.color : Colors.border,
                    }
                ]}
                onPress={() => {
                    onSelect(item.name);
                    onClose();
                    setSearchQuery(''); // Reset search on close
                }}
            >
                <View style={[
                    styles.iconContainer,
                    {
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : item.color + '20', // 20 = 12% opacity roughly
                    }
                ]}>
                    {IconComponent && (
                        <IconComponent
                            size={24}
                            color={isSelected ? '#fff' : item.color}
                        />
                    )}
                </View>
                <Text
                    numberOfLines={1}
                    style={[
                        styles.categoryName,
                        { color: isSelected ? '#fff' : Colors.text }
                    ]}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icons.X size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: Colors.text }]}>Select Category</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.searchContainer}>
                    <Icons.Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { backgroundColor: Colors.surface, color: Colors.text }]}
                        placeholder="Search categories..."
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="sentences"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                            <Icons.XCircle size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filteredCategories}
                    renderItem={renderCategory}
                    keyExtractor={item => item.id}
                    numColumns={4}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>No categories found</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        paddingLeft: 44,
        paddingRight: 40,
        fontSize: 16,
        fontFamily: 'Geist-Regular',
    },
    clearSearch: {
        position: 'absolute',
        right: 12,
        zIndex: 1,
    },
    grid: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    categoryItem: {
        flex: 1,
        maxWidth: '22%', // roughly 1/4 with gap
        minWidth: '22%',
        aspectRatio: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
        textAlign: 'center',
        paddingHorizontal: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Geist-Regular',
    },
});
