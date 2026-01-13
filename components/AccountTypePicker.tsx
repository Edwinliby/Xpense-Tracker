import { useThemeColor } from '@/hooks/useThemeColor';
import * as Icons from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/* 
   We reuse Lucide icons for visual flair. 
   If a type matches a known key, we show that icon.
   Otherwise we show a generic one.
*/
const TYPE_ICONS: Record<string, any> = {
    'Bank': Icons.Landmark,
    'Cash': Icons.Banknote,
    'Mobile Money': Icons.Smartphone,
    'Other': Icons.MoreHorizontal,
    'Crypto': Icons.Bitcoin,
    'Investment': Icons.TrendingUp,
    'Savings': Icons.PiggyBank,
    'Credit Card': Icons.CreditCard,
};

interface AccountTypePickerProps {
    visible: boolean;
    currentType: string;
    existingTypes: string[]; // List of types already in use or defaults
    onSelect: (type: string) => void;
    onClose: () => void;
}

export const AccountTypePicker: React.FC<AccountTypePickerProps> = ({ visible, currentType, existingTypes, onSelect, onClose }) => {
    const Colors = useThemeColor();
    const [searchQuery, setSearchQuery] = useState('');

    // Combine defaults with passed existing types, ensuring uniqueness
    const allTypes = useMemo(() => {
        const defaults = ['Bank', 'Cash', 'Mobile Money', 'Other'];
        // Merge and dedupe
        return Array.from(new Set([...defaults, ...existingTypes])).sort();
    }, [existingTypes]);

    const filteredTypes = useMemo(() => {
        if (!searchQuery) return allTypes;
        return allTypes.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allTypes, searchQuery]);

    const renderItem = ({ item }: { item: string }) => {
        const isSelected = currentType === item;
        // Try to match icon by name, or default
        let IconComponent = TYPE_ICONS[item] || Icons.Hash;

        // Simple heuristic for icon matching if not exact
        if (!TYPE_ICONS[item]) {
            if (item.toLowerCase().includes('card')) IconComponent = Icons.CreditCard;
            else if (item.toLowerCase().includes('wallet')) IconComponent = Icons.Wallet;
            else if (item.toLowerCase().includes('save')) IconComponent = Icons.PiggyBank;
        }

        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    {
                        backgroundColor: isSelected ? Colors.primary : Colors.surface,
                        borderColor: isSelected ? Colors.primary : Colors.border,
                    }
                ]}
                onPress={() => {
                    onSelect(item);
                    onClose();
                    setSearchQuery('');
                }}
            >
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : Colors.surfaceHighlight }
                ]}>
                    <IconComponent size={20} color={isSelected ? '#FFF' : Colors.text} />
                </View>
                <Text style={[styles.itemText, { color: isSelected ? '#FFF' : Colors.text }]}>{item}</Text>
                {isSelected && <Icons.Check size={16} color="#FFF" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Colors.text }]}>Select Account Type</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icons.X size={20} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Icons.Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: Colors.surface, color: Colors.text }]}
                            placeholder="Search or add new..."
                            placeholderTextColor={Colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="words"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                                <Icons.XCircle size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filteredTypes}
                        renderItem={renderItem}
                        keyExtractor={item => item}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                                    No matches found.
                                </Text>
                            </View>
                        }
                        ListFooterComponent={
                            (searchQuery.trim().length > 0 && !allTypes.includes(searchQuery.trim())) ? (
                                <TouchableOpacity
                                    style={[styles.createFooterButton, { borderColor: Colors.primary }]}
                                    onPress={() => {
                                        onSelect(searchQuery.trim());
                                        onClose();
                                        setSearchQuery('');
                                    }}
                                >
                                    <Icons.Plus size={20} color={Colors.primary} />
                                    <Text style={[styles.createFooterText, { color: Colors.primary }]}>Create &quot;{searchQuery.trim()}&quot;</Text>
                                </TouchableOpacity>
                            ) : null
                        }
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        maxHeight: '70%',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 0, // Clean look
    },
    closeButton: {
        padding: 4, // Smaller touch area visually, but clear
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12, // Reduced margin
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 44, // Slightly smaller
        borderRadius: 12,
        paddingLeft: 40,
        paddingRight: 40,
        fontSize: 15,
        fontFamily: 'Geist-Regular',
    },
    clearSearch: {
        position: 'absolute',
        right: 12,
        zIndex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10, // Compact
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    itemText: {
        fontSize: 15,
        fontFamily: 'Geist-Medium',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'Geist-Regular',
    },
    // Removed duplicate createButton styles
    createFooterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 12,
        gap: 8,
    },
    createFooterText: {
        fontFamily: 'Geist-SemiBold',
        fontSize: 15,
    }
});
