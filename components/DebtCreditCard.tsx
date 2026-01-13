import { useThemeColor } from '@/hooks/useThemeColor';
import { Transaction } from '@/store/expenseStore';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DebtCreditCardProps {
    type: 'owed' | 'debt';
    amount: number;
    transactions: Transaction[];
    onSettle: (id: string) => void;
    currencySymbol: string;
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        borderWidth: .5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerLeft: {
        gap: 4,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
    },
    totalValue: {
        fontSize: 20,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    list: {
        gap: 0, // handling gap with padding/borders
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'Geist-Bold',
        fontSize: 16,
    },
    name: {
        fontFamily: 'Geist-SemiBold',
        fontSize: 14,
        marginBottom: 2,
    },
    date: {
        fontSize: 11,
        fontFamily: 'Geist-Regular',
    },
    amountText: {
        fontFamily: 'Geist-Bold',
        fontSize: 14,
        marginRight: 8
    },
    settleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    settleText: {
        fontSize: 11,
        fontFamily: 'Geist-Bold',
    },
});

export const DebtCreditCard: React.FC<DebtCreditCardProps> = ({
    type,
    amount,
    transactions,
    onSettle,
    currencySymbol,
}) => {

    const Colors = useThemeColor();

    const [isExpanded, setIsExpanded] = useState(false);

    const isOwed = type === 'owed';
    const accentColor = isOwed ? Colors.success : Colors.danger;
    const title = isOwed ? 'Owed to You' : 'Outstanding Debt';
    const subtitle = isOwed ? 'Friends owe you' : 'You owe friends';

    if (amount <= 0) return null;

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
                shadowColor: Colors.shadow,
            }
        ]}>
            <TouchableOpacity
                style={[styles.header, { marginBottom: isExpanded ? 20 : 0 }]}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 3, height: 14, backgroundColor: accentColor, borderRadius: 2 }} />
                        <Text style={[styles.title, { color: Colors.text }]}>{title}</Text>
                    </View>
                    <Text style={[styles.subtitle, { color: Colors.textSecondary, paddingLeft: 9 }]}>{subtitle}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.totalValue, { color: accentColor }]}>
                        {currencySymbol}{amount.toLocaleString()}
                    </Text>
                    {isExpanded ? (
                        <ChevronUp size={20} color={accentColor} />
                    ) : (
                        <ChevronDown size={20} color={accentColor} />
                    )}
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.list}>
                    {transactions.map((t, index) => {
                        const isLast = index === transactions.length - 1;
                        return (
                            <View key={t.id} style={[
                                styles.row,
                                {
                                    borderBottomColor: isLast ? 'transparent' : Colors.borderLight,
                                    paddingBottom: isLast ? 0 : 12,
                                    paddingTop: index === 0 ? 0 : 12
                                }
                            ]}>
                                <View style={styles.info}>
                                    <View style={[
                                        styles.avatar,
                                        { backgroundColor: isOwed ? Colors.success + '15' : Colors.danger + '15' }
                                    ]}>
                                        <Text style={[styles.avatarText, { color: accentColor }]}>
                                            {(isOwed ? t.lentTo : t.paidBy)?.[0]?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.name, { color: Colors.text }]}>{isOwed ? t.lentTo : t.paidBy}</Text>
                                        <Text style={[styles.date, { color: Colors.textSecondary }]}>{format(new Date(t.date), 'MMM d')}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.amountText, { color: Colors.text }]}>
                                        {currencySymbol}{t.amount.toLocaleString()}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.settleBtn, { borderColor: Colors.border, backgroundColor: Colors.surfaceHighlight }]}
                                        onPress={() => onSettle(t.id)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={[styles.settleText, { color: Colors.text }]}>
                                            {isOwed ? 'Settle' : 'Pay'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};