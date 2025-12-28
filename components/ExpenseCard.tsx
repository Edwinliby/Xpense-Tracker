import { ImageViewer } from '@/components/ImageViewer';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Transaction, useExpense } from '@/store/expenseStore';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { Paperclip } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExpenseCardProps {
    transaction: Transaction;
}

const ExpenseCardComponent: React.FC<ExpenseCardProps> = ({ transaction }) => {
    const router = useRouter();
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { currencySymbol, categories } = useExpense();
    const { id, amount, category, date, type, description, currency, originalAmount, exchangeRate, receiptImage } = transaction;
    const [showImageViewer, setShowImageViewer] = useState(false);

    const handlePress = () => {
        router.push({
            pathname: '/add',
            params: {
                id,
                amount: amount.toString(),
                category,
                description,
                type,
                date,
                currency,
                originalAmount: originalAmount?.toString(),
                exchangeRate: exchangeRate?.toString(),
                receiptImage: receiptImage,
                isFriendPayment: transaction.isFriendPayment?.toString(),
                paidBy: transaction.paidBy,
                isLent: transaction.isLent?.toString(),
                lentTo: transaction.lentTo,
                isRecurring: transaction.isRecurring?.toString(),
                excludeFromBudget: transaction.excludeFromBudget?.toString(),
                latitude: transaction.latitude?.toString(),
                longitude: transaction.longitude?.toString(),
                locationName: transaction.locationName
            }
        });
    };

    const categoryData = useMemo(() => {
        return categories.find(c => c.name === category);
    }, [category, categories]);

    const icon = useMemo(() => {
        if (categoryData) {
            const IconComponent = (Icons as any)[categoryData.icon];
            if (IconComponent) {
                return <IconComponent size={20} color="#fff" />;
            }
        }
        const FallbackIcon = type === 'income' ? (Icons as any)['ArrowDownLeft'] : (Icons as any)['ArrowUpRight'];
        return <FallbackIcon size={20} color="#fff" />;
    }, [type, categoryData]);

    const iconColors = useMemo(() => {
        if (categoryData) return [categoryData.color, categoryData.color + 'CC'];
        if (type === 'income') return [Colors.success, Colors.successLight];
        return [Colors.danger, Colors.dangerLight];
    }, [type, categoryData, Colors.success, Colors.danger]);

    const amountColor = useMemo(() => {
        if (type === 'income') return Colors.success;
        return Colors.text;
    }, [type, Colors.success, Colors.text]);

    const formattedDate = useMemo(() => format(new Date(date), 'MMM d'), [date]);
    const mainTitle = description || category;

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            style={{ marginBottom: 12, paddingHorizontal: 20 }}
        >
            <View style={[
                Styles.card,
                styles.container,
                Styles.shadow,
                { backgroundColor: Colors.surface, shadowColor: Colors.shadow }
            ]}>
                <LinearGradient
                    colors={iconColors as [string, string]}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {icon}
                </LinearGradient>

                <View style={styles.details}>
                    <Text style={[styles.title, { color: Colors.text }]} numberOfLines={1}>
                        {mainTitle}
                    </Text>

                    <View style={styles.row}>
                        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                            {transaction.paidBy ? `Via ${transaction.paidBy} • ` : ''}
                            {description ? category : formattedDate}
                        </Text>

                        {receiptImage && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    setShowImageViewer(true);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.clipIcon}
                            >
                                <Paperclip size={12} color={Colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: amountColor }]}>
                        {type === 'income' ? '+' : '-'}{currencySymbol}{amount.toFixed(2)}
                    </Text>
                    {currency && currency !== 'USD' && originalAmount && (
                        <Text style={[styles.originalAmount, { color: Colors.textSecondary }]}>
                            {originalAmount.toFixed(2)} {currency}
                        </Text>
                    )}
                </View>
            </View>

            <ImageViewer
                visible={showImageViewer}
                imageUri={receiptImage || null}
                onClose={() => setShowImageViewer(false)}
            />
        </TouchableOpacity>
    );
};

export const ExpenseCard = React.memo(ExpenseCardComponent);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 22, // Slightly more rounded
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)', // Subtle border
    },
    iconContainer: {
        width: 48, // Slightly larger
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    details: {
        flex: 1,
        justifyContent: 'center',
        gap: 2,
    },
    title: {
        fontSize: 15,
        fontFamily: 'Geist-SemiBold', // Updated font
        letterSpacing: -0.2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'Geist-Regular', // Updated font
        opacity: 0.8
    },
    clipIcon: {
        marginLeft: 6,
        padding: 2,
    },
    amountContainer: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    amount: {
        fontSize: 16,
        fontFamily: 'Geist-Bold', // Updated font
        letterSpacing: -0.3,
    },
    originalAmount: {
        fontSize: 11,
        fontFamily: 'Geist-Medium',
        marginTop: 2,
        opacity: 0.6,
    },
});
