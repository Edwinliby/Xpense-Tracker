import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Transaction, useExpense } from '@/store/expenseStore';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { ArrowLeft, RefreshCcw, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrashScreen() {
    const router = useRouter();
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { trash, restoreTransaction, permanentDeleteTransaction, emptyTrash, restoreAllTrash, categories, currencySymbol } = useExpense();

    const handleRestore = (id: string) => {
        Alert.alert('Restore', 'Restore this transaction?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Restore', onPress: () => restoreTransaction(id) }
        ]);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Permanently', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => permanentDeleteTransaction(id) }
        ]);
    };

    const handleEmptyTrash = () => {
        Alert.alert('Empty Trash', 'Are you sure you want to permanently delete all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Empty Trash', style: 'destructive', onPress: emptyTrash }
        ]);
    };

    const handleRestoreAll = () => {
        Alert.alert('Restore All', 'Are you sure you want to restore all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Restore All', onPress: restoreAllTrash }
        ]);
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const categoryData = categories.find(c => c.name === item.category);
        const IconComponent = categoryData ? (Icons as any)[categoryData.icon] : (item.type === 'income' ? Icons.ArrowDownLeft : Icons.ArrowUpRight);
        const iconColor = categoryData ? categoryData.color : (item.type === 'income' ? Colors.success : Colors.danger);

        return (
            <View style={[styles.card, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
                <View style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                        {IconComponent && <IconComponent size={20} color={iconColor} />}
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.category, { color: Colors.text }]}>{item.category || 'Transaction'}</Text>
                        <Text style={[styles.description, { color: Colors.textSecondary }]}>
                            {item.description || format(new Date(item.date), 'MMM dd')}
                        </Text>
                    </View>
                    <View style={styles.rightContent}>
                        <Text style={[styles.amount, { color: item.type === 'income' ? Colors.success : Colors.text }]}>
                            {item.type === 'income' ? '+' : '-'}{currencySymbol}{item.amount.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.actionFooter, { borderTopColor: Colors.border }]}>
                    <View style={[styles.deleteInfo, { backgroundColor: Colors.surfaceHighlight }]}>
                        <Icons.Clock size={12} color={Colors.textSecondary} />
                        <Text style={[styles.deleteTime, { color: Colors.textSecondary }]}>
                            Deleted {format(new Date(item.deletedAt!), 'HH:mm')}
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => handleRestore(item.id)}
                            style={[styles.actionButton, { backgroundColor: Colors.success + '15' }]}
                        >
                            <RefreshCcw size={16} color={Colors.success} />
                            <Text style={[styles.actionText, { color: Colors.success }]}>Restore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={[styles.actionButton, { backgroundColor: Colors.danger + '15' }]}
                        >
                            <Trash2 size={16} color={Colors.danger} />
                            <Text style={[styles.actionText, { color: Colors.danger }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[Styles.container, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: Colors.surface }]}>
                    <ArrowLeft size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.text }]}>Bin</Text>

                {trash.length > 0 ? (
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleRestoreAll} style={[styles.headerIconBtn, { backgroundColor: Colors.surface }]}>
                            <RefreshCcw size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEmptyTrash} style={[styles.headerIconBtn, { backgroundColor: Colors.surface }]}>
                            <Trash2 size={18} color={Colors.danger} />
                        </TouchableOpacity>
                    </View>
                ) : <View style={{ width: 80 }} />}
            </View>

            {/* Warning Banner */}
            {trash.length > 0 && (
                <View style={[styles.warningBanner, { backgroundColor: Colors.surfaceHighlight }]}>
                    <Icons.AlertCircle size={14} color={Colors.textSecondary} />
                    <Text style={[styles.warningText, { color: Colors.textSecondary }]}>
                        Items are permanently deleted after 3 minutes.
                    </Text>
                </View>
            )}

            <FlatList
                data={trash}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: Colors.surfaceHighlight }]}>
                            <Trash2 size={40} color={Colors.textSecondary} />
                        </View>
                        <Text style={[styles.emptyText, { color: Colors.text }]}>Bin is Empty</Text>
                        <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>
                            Items you delete will show up here.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
        position: 'absolute',
        left: '50%',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 12,
    },
    warningText: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
    },
    card: {
        borderRadius: 20,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    category: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
    },
    actionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    deleteInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    deleteTime: {
        fontSize: 10,
        fontFamily: 'Geist-Medium',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    actionText: {
        fontSize: 12,
        fontFamily: 'Geist-SemiBold',
        marginLeft: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontFamily: 'Geist-Bold',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'Geist-Regular',
    },
});
