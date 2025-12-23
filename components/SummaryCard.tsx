import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SummaryCardProps {
    title: string;
    amount: number;
    type?: 'neutral' | 'success' | 'danger' | 'warning';
    icon?: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, type = 'neutral', icon }) => {
    const Colors = useThemeColor();

    const getColor = () => {
        if (type === 'success') return Colors.success;
        if (type === 'danger') return Colors.danger;
        if (type === 'warning') return Colors.warning;
        return Colors.text;
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: Colors.textSecondary }]}>{title}</Text>
                {icon}
            </View>
            <Text style={[styles.amount, { color: getColor() }]}>
                ${amount.toFixed(2)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 16,
        flex: 1,
        margin: 4,
        borderWidth: 1,
        minWidth: '45%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
