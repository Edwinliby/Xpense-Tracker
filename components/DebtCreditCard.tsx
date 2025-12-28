import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Transaction } from '@/store/expenseStore';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DebtCreditCardProps {
    type: 'owed' | 'debt';
    amount: number;
    transactions: Transaction[];
    onSettle: (id: string) => void;
    currencySymbol: string;
}

export const DebtCreditCard: React.FC<DebtCreditCardProps> = ({
    type,
    amount,
    transactions,
    onSettle,
    currencySymbol,
}) => {
    const Styles = useStyles();
    const Colors = useThemeColor();

    const isOwed = type === 'owed';
    const gradientColors = isOwed
        ? [Colors.success, Colors.successLight]
        : [Colors.danger, Colors.dangerLight];
    const shadowColor = isOwed ? Colors.success : Colors.danger;
    const title = isOwed ? 'Owed by Friends' : 'Debts';
    const label = isOwed ? 'Total Owed to You' : 'Total You Owe';

    if (amount <= 0) return null;

    return (
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>{title}</Text>
            <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, Styles.shadow, { shadowColor }]}
            >
                <View style={styles.header}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.totalValue}>{currencySymbol}{amount.toLocaleString()}</Text>
                </View>

                <View style={styles.list}>
                    {transactions.map((t) => (
                        <View key={t.id} style={styles.row}>
                            <View style={styles.info}>
                                <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Text style={styles.avatarText}>
                                        {(isOwed ? t.lentTo : t.paidBy)?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.name}>{isOwed ? t.lentTo : t.paidBy}</Text>
                                    <Text style={styles.date}>{format(new Date(t.date), 'MMM d')}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={styles.amountText}>{currencySymbol}{t.amount.toLocaleString()}</Text>
                                <TouchableOpacity
                                    style={styles.settleBtn}
                                    onPress={() => onSettle(t.id)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={[styles.settleText, { color: isOwed ? Colors.success : Colors.danger }]}>
                                        {isOwed ? 'Settle' : 'Repay'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    ))}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
        marginLeft: 20,
        marginBottom: 12,
    },
    card: {
        marginHorizontal: 16,
        borderRadius: 24,
        padding: 20,
        // Make it pop a bit more with border
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
        paddingBottom: 16,
    },
    label: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontFamily: 'Geist-Medium',
        letterSpacing: 0.2,
    },
    totalValue: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    list: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)', // Lighter, more glass-like
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 14, // Squircle-ish
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        color: '#FFF',
        fontFamily: 'Geist-Bold',
        fontSize: 16,
    },
    name: {
        color: '#FFF',
        fontFamily: 'Geist-SemiBold',
        fontSize: 14,
        marginBottom: 2,
    },
    date: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontFamily: 'Geist-Regular',
    },
    amountText: {
        color: '#FFF',
        fontFamily: 'Geist-Bold',
        fontSize: 15,
        marginRight: 4
    },
    settleBtn: {
        backgroundColor: '#FFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    settleText: {
        fontSize: 11,
        fontFamily: 'Geist-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
