import { useThemeColor } from '@/hooks/useThemeColor';
import { formatCurrency } from '@/lib/currency';
import { Account } from '@/types/expense';
import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AccountCardProps {
    account: Account;
    onPress?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onPress }) => {
    const Colors = useThemeColor();

    const getIcon = () => {
        switch (account.type) {
            case 'Bank': return <Landmark size={24} color="#FFF" />;
            case 'Cash': return <Banknote size={24} color="#FFF" />;
            case 'Mobile Money': return <Wallet size={24} color="#FFF" />;
            default: return <CreditCard size={24} color="#FFF" />;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: Colors.surface, borderWidth: .5, borderColor: Colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: account.color }]}>
                {getIcon()}
            </View>

            <View style={styles.details}>
                <Text style={[styles.name, { color: Colors.text }]}>{account.name}</Text>
                <Text style={[styles.type, { color: Colors.textSecondary }]}>{account.type}</Text>
            </View>

            <View style={styles.balanceContainer}>
                <Text style={[styles.balance, { color: Colors.text }]}>
                    {formatCurrency(account.balance, account.currency)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 4,
    },
    type: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
    }
});
