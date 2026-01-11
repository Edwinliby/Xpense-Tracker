import { Input } from '@/components/Input';
import { WebDatePicker } from '@/components/WebDatePicker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Stack, router } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionsHistory() {
    const Colors = useThemeColor();
    const { transactions, categories } = useExpense();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Grouping Logic
    const groupedData = useMemo(() => {
        // 1. Filter
        const filtered = transactions.filter(t => {
            if (t.deletedAt) return false;

            if (filterDate) {
                const tDate = new Date(t.date);
                if (
                    tDate.getMonth() !== filterDate.getMonth() ||
                    tDate.getFullYear() !== filterDate.getFullYear()
                ) {
                    return false;
                }
            }

            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                (t.note?.toLowerCase() || '').includes(q) ||
                t.category?.toLowerCase().includes(q)
            );
        });

        // 2. Sort Descending
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 3. Group by Month
        const groups: Record<string, typeof transactions> = {};

        filtered.forEach(t => {
            const date = new Date(t.date);
            const key = format(date, 'MMMM yyyy'); // e.g., "September 2025"
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        // 4. Transform to Array with Totals
        return Object.keys(groups).map(key => {
            const txs = groups[key];
            const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            return {
                title: key,
                data: txs,
                totalIncome: income,
                totalExpense: expense
            };
        });
    }, [transactions, searchQuery, filterDate]);



    const formatCurrency = (amount: number) => {
        // Simple formatter, can be replaced with the global one if available
        return amount.toLocaleString('en-US');
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: Colors.surface }]}
                >
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.text }]}>Transactions history</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search & Filter Bar */}
            <View style={styles.searchSection}>
                <View style={[styles.searchContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search"
                        placeholderTextColor={Colors.textSecondary}
                        containerStyle={{ marginBottom: 0, flex: 1 }}
                        style={{ borderWidth: 0, backgroundColor: 'transparent', height: 40, padding: 0 }}
                        inputStyle={{ fontSize: 16, fontFamily: 'Geist-Regular', height: '100%', paddingVertical: 0 }}
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {filterDate && (
                        <TouchableOpacity
                            onPress={() => setFilterDate(null)}
                            style={[styles.filterButton, { backgroundColor: Colors.danger + '20' }]}
                        >
                            <Icons.X size={20} color={Colors.danger} />
                        </TouchableOpacity>
                    )}

                    <View style={[styles.filterButton, { backgroundColor: filterDate ? Colors.primary : Colors.surfaceHighlight }]}>
                        {Platform.OS === 'web' ? (
                            <>
                                <View style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', zIndex: 10 }}>
                                    <WebDatePicker value={filterDate || new Date()} onChange={setFilterDate} />
                                </View>
                                <Icons.Calendar size={20} color={filterDate ? '#fff' : Colors.text} />
                            </>
                        ) : (
                            <TouchableOpacity
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Icons.Calendar size={20} color={filterDate ? '#fff' : Colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {
                Platform.OS !== 'web' && showDatePicker && (
                    <DateTimePicker
                        value={filterDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event: any, selectedDate?: Date) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                                setFilterDate(selectedDate);
                            }
                        }}
                    />
                )
            }

            {/* List */}
            <FlatList
                data={groupedData}
                keyExtractor={(item) => item.title}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: group }) => (
                    <View style={styles.groupContainer}>
                        {/* Group Header */}
                        <View style={styles.groupHeader}>
                            <Text style={[styles.groupTitle, { color: Colors.text }]}>{group.title}</Text>
                            <View style={styles.groupSummary}>
                                {group.totalIncome > 0 && (
                                    <View style={styles.summaryBadge}>
                                        <View style={[styles.iconBox, { backgroundColor: '#00C853' }]}>
                                            <ArrowDownRight size={12} color="#fff" />
                                        </View>
                                        <Text style={[styles.summaryText, { color: '#00C853' }]}>
                                            {formatCurrency(group.totalIncome)}
                                        </Text>
                                    </View>
                                )}
                                {group.totalExpense > 0 && (
                                    <View style={styles.summaryBadge}>
                                        <View style={[styles.iconBox, { backgroundColor: '#FF3D00' }]}>
                                            <ArrowUpRight size={12} color="#fff" />
                                        </View>
                                        <Text style={[styles.summaryText, { color: '#FF3D00' }]}>
                                            {formatCurrency(group.totalExpense)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Transactions Card */}
                        <View style={[styles.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                            {group.data.map((item, index) => {
                                const categoryObj = categories.find(c => c.name === item.category);
                                return (
                                    <View key={item.id}>
                                        <TouchableOpacity style={styles.itemRow} onPress={() => { /* Navigate to detail? */ }}>
                                            {/* Icon */}
                                            <View style={[styles.itemIcon, { backgroundColor: (categoryObj?.color || Colors.primary) + '20' }]}>
                                                {(() => {
                                                    const IconComponent = categoryObj?.icon ? (Icons as any)[categoryObj.icon] : Icons.HelpCircle;
                                                    return <IconComponent size={20} color={categoryObj?.color || Colors.primary} />;
                                                })()}
                                            </View>

                                            {/* Content */}
                                            <View style={styles.itemContent}>
                                                <Text style={[styles.itemTitle, { color: Colors.text }]} numberOfLines={1}>{item.note || item.category}</Text>
                                                <Text style={[styles.itemSubtitle, { color: Colors.textSecondary }]} numberOfLines={1}>{item.category || 'Uncategorized'}</Text>
                                            </View>

                                            {/* Right Side */}
                                            <View style={styles.itemRight}>
                                                <Text style={[
                                                    styles.amountText,
                                                    { color: item.type === 'income' ? '#00C853' : '#FF3D00' }
                                                ]}>
                                                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                                </Text>
                                                <Text style={[styles.dateText, { color: Colors.textSecondary }]}>
                                                    {format(new Date(item.date), 'd MMM, h:mma')}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        {index < group.data.length - 1 && (
                                            <View style={[styles.separator, { backgroundColor: Colors.border }]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Geist-Bold',
    },
    searchSection: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 12,
        marginTop: 14,
        marginBottom: 24,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupContainer: {
        marginBottom: 28,
        paddingHorizontal: 20,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    groupTitle: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
    },
    groupSummary: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: {
        fontSize: 12,
        fontFamily: 'Geist-SemiBold',
    },
    card: {
        borderRadius: 20,
        padding: 8,
        borderWidth: .5,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 12,
        fontFamily: 'Geist-Regular',
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 15,
        fontFamily: 'Geist-Bold',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 11,
        fontFamily: 'Geist-Regular',
        opacity: 0.7,
    },
    separator: {
        height: 1,
        marginLeft: 64, // Align with text
        opacity: 0.5,
    },
});
