import { AccountCard } from '@/components/AccountCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { Account } from '@/types/expense';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Wallet } from 'lucide-react-native';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountsPage() {
    const router = useRouter();
    const Colors = useThemeColor();
    const { accounts } = useExpense();

    const handleEdit = (account: Account) => {
        router.push({
            pathname: '/manage-account',
            params: {
                id: account.id,
                name: account.name,
                type: account.type,
                initialBalance: account.initialBalance,
                color: account.color,
                icon: account.icon,
            }
        });
    };

    const handleAdd = () => {
        router.push('/manage-account');
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    // Assuming currency is consistent or taking from first account/store. 
    // Ideally useExpense provides a formatted total or global currency.
    // For now, grabbing currency from first account or default.
    const currencySymbol = accounts.length > 0 ? accounts[0].currency : '$';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: Colors.surface }]}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: Colors.text }]}>Accounts & Wallets</Text>
                <TouchableOpacity onPress={handleAdd} style={[styles.addButton, { backgroundColor: Colors.surface }]}>
                    <Plus size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Total Balance Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: Colors.primary }]}>
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryIcon}>
                            <Wallet size={24} color="rgba(255,255,255,0.8)" />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Total Balance</Text>
                            <Text style={styles.summaryValue}>
                                {currencySymbol} {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.summaryPattern} />
                </View>

                {/* Account List */}
                <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Your Accounts</Text>

                <View style={styles.listContainer}>
                    {accounts.map(acc => (
                        <TouchableOpacity key={acc.id} onPress={() => handleEdit(acc)} activeOpacity={0.7}>
                            <AccountCard account={acc} onPress={() => handleEdit(acc)} />
                        </TouchableOpacity>
                    ))}

                    {accounts.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: Colors.textSecondary }]}>
                                No accounts yet. Tap + to add one.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 16 : 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
        marginRight: -4,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    summaryCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    summaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        zIndex: 2,
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontFamily: 'Geist-Medium',
        marginBottom: 4,
    },
    summaryValue: {
        color: '#FFF',
        fontSize: 28,
        fontFamily: 'Geist-Bold',
    },
    summaryPattern: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 16,
        marginLeft: 4,
    },
    listContainer: {
        gap: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: 'Geist-Medium',
    },
});

