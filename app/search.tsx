
import { ExpenseCard } from '@/components/ExpenseCard';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Calendar, Filter, Search as SearchIcon, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { transactions, categories, trash } = useExpense();

    const [searchQuery, setSearchQuery] = useState('');
    const [noteQuery, setNoteQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [showFilters, setShowFilters] = useState(false);

    // DateTimePicker states
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const filteredTransactions = useMemo(() => {
        const trashIds = new Set(trash.map(t => t.id));

        const results = transactions.filter(t => {
            // Paranoid filtering: Check ALL possible deletion indicators
            if (t.deletedAt) return false;
            if ((t as any).deleted_at) return false; // Check for leaked snake_case
            if (trashIds.has(t.id)) return false; // Check against trash bin

            // Hide future transactions (specifically auto-generated recurring ones)
            // The search should focus on history/current state
            if (new Date(t.date) > new Date()) return false;

            const matchesQuery = !searchQuery ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.amount.toString().includes(searchQuery);

            const matchesNote = !noteQuery || t.description?.toLowerCase().includes(noteQuery.toLowerCase());
            const matchesCategory = !selectedCategory || t.category === selectedCategory;

            const txDate = new Date(t.date);
            const matchesStart = !dateRange.start || txDate >= dateRange.start;
            // Set end date to end of day for inclusive comparison
            const endOfDay = dateRange.end ? new Date(dateRange.end) : null;
            if (endOfDay) endOfDay.setHours(23, 59, 59, 999);
            const matchesEnd = !endOfDay || txDate <= endOfDay;

            return matchesQuery && matchesNote && matchesCategory && matchesStart && matchesEnd;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return results;
    }, [transactions, trash, searchQuery, noteQuery, selectedCategory, dateRange]);

    const activeFiltersCount = (selectedCategory ? 1 : 0) + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0) + (noteQuery ? 1 : 0);

    const clearFilters = () => {
        setSelectedCategory(null);
        setNoteQuery('');
        setDateRange({ start: null, end: null });
        setShowFilters(false);
    };

    return (
        <SafeAreaView style={[Styles.container, { backgroundColor: Colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={[styles.searchBar, { backgroundColor: Colors.surfaceHighlight }]}>
                    <SearchIcon size={20} color={Colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: Colors.text }]}
                        placeholder="Search transactions..."
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, activeFiltersCount > 0 && { backgroundColor: Colors.primary + '20' }]}
                    onPress={() => setShowFilters(true)}
                >
                    <Filter size={24} color={activeFiltersCount > 0 ? Colors.primary : Colors.text} />
                    {activeFiltersCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                            <Text style={styles.badgeText}>{activeFiltersCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Content */}
            <FlatList
                data={filteredTransactions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <ExpenseCard transaction={item} />}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <SearchIcon size={48} color={Colors.textSecondary + '40'} />
                        <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                            {searchQuery || activeFiltersCount > 0 ? 'No matches found' : 'Search your transaction history'}
                        </Text>
                    </View>
                }
            />

            {/* Filter Modal */}
            <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.text }]}>Filters</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.filterScroll}>
                            {/* Note Filter */}
                            <Text style={[styles.filterLabel, { color: Colors.textSecondary }]}>Note Contains</Text>
                            <View style={[styles.searchBar, { backgroundColor: Colors.background, marginBottom: 24, height: 48, paddingHorizontal: 16 }]}>
                                <TextInput
                                    style={[styles.searchInput, { color: Colors.text }]}
                                    placeholder="Enter note..."
                                    placeholderTextColor={Colors.textSecondary}
                                    value={noteQuery}
                                    onChangeText={setNoteQuery}
                                />
                                {noteQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setNoteQuery('')}>
                                        <X size={16} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Date Range */}
                            <Text style={[styles.filterLabel, { color: Colors.textSecondary }]}>Date Range</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity
                                    style={[styles.dateButton, { borderColor: Colors.border, backgroundColor: Colors.background }]}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Calendar size={18} color={Colors.textSecondary} />
                                    <Text style={[styles.dateText, { color: dateRange.start ? Colors.text : Colors.textSecondary }]}>
                                        {dateRange.start ? format(dateRange.start, 'MMM d, yyyy') : 'Start Date'}
                                    </Text>
                                    {dateRange.start && (
                                        <TouchableOpacity onPress={() => setDateRange(prev => ({ ...prev, start: null }))}>
                                            <X size={14} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.dateButton, { borderColor: Colors.border, backgroundColor: Colors.background }]}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Calendar size={18} color={Colors.textSecondary} />
                                    <Text style={[styles.dateText, { color: dateRange.end ? Colors.text : Colors.textSecondary }]}>
                                        {dateRange.end ? format(dateRange.end, 'MMM d, yyyy') : 'End Date'}
                                    </Text>
                                    {dateRange.end && (
                                        <TouchableOpacity onPress={() => setDateRange(prev => ({ ...prev, end: null }))}>
                                            <X size={14} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Categories */}
                            <Text style={[styles.filterLabel, { color: Colors.textSecondary, marginTop: 24 }]}>Category</Text>
                            <View style={styles.chipsContainer}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: selectedCategory === cat.name ? Colors.primary : Colors.surfaceHighlight,
                                                borderColor: selectedCategory === cat.name ? Colors.primary : 'transparent'
                                            }
                                        ]}
                                        onPress={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: selectedCategory === cat.name ? '#FFF' : Colors.text }
                                        ]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.footerButton, { borderColor: Colors.border }]} onPress={clearFilters}>
                                <Text style={{ color: Colors.text }}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.footerButton, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                                onPress={() => setShowFilters(false)}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Pickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={dateRange.start || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) setDateRange(prev => ({ ...prev, start: date }));
                    }}
                />
            )}
            {showEndDatePicker && (
                <DateTimePicker
                    value={dateRange.end || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) setDateRange(prev => ({ ...prev, end: date }));
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    filterButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF', // Or background color
    },
    badgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '70%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterScroll: {
        paddingBottom: 24,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        flex: 1,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerButton: {
        flex: 1,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
    },
});
