
import { AccountTypePicker } from '@/components/AccountTypePicker';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAlert } from '@/context/AlertContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Banknote, Check, ChevronDown, CreditCard, Landmark, Trash2, Wallet, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREDEFINED_COLORS = ['#FF6B6B', '#4FACFE', '#34D399', '#FBBF24', '#C471F5', '#FF9F43', '#10B981', '#6366F1', '#EC4899'];

const ICONS = [
    { name: 'Landmark', component: Landmark },
    { name: 'Banknote', component: Banknote },
    { name: 'Wallet', component: Wallet },
    { name: 'CreditCard', component: CreditCard },
];

export default function ManageAccountScreen() {
    const router = useRouter();
    const Colors = useThemeColor();
    const params = useLocalSearchParams();
    const { addAccount, updateAccount, deleteAccount, currency: globalCurrency, currencySymbol, accounts } = useExpense();
    const { showAlert } = useAlert();

    const isEditing = !!params.id;
    const initialData = {
        name: params.name as string || '',
        type: (params.type as string) || 'Bank',
        initialBalance: params.initialBalance ? String(params.initialBalance) : '',
        color: params.color as string || PREDEFINED_COLORS[0],
        icon: params.icon as string || 'Landmark',
    };

    const [name, setName] = useState(initialData.name);
    const [type, setType] = useState<string>(initialData.type);
    const [initialBalance, setInitialBalance] = useState(initialData.initialBalance);
    const [color, setColor] = useState(initialData.color);
    const [selectedIcon, setSelectedIcon] = useState(initialData.icon);

    const [showTypePicker, setShowTypePicker] = useState(false);

    // Derive existing types for the picker
    const existingTypes = useMemo(() => {
        return accounts.map(a => a.type);
    }, [accounts]);

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('Error', 'Please enter an account name');
            return;
        }

        const balance = parseFloat(initialBalance);
        if (isNaN(balance)) {
            showAlert('Error', 'Please enter a valid balance');
            return;
        }

        const accountData = {
            name,
            type,
            initialBalance: balance,
            color,
            icon: selectedIcon,
            currency: globalCurrency, // Defaulting to global currency
        };

        try {
            if (isEditing && typeof params.id === 'string') {
                await updateAccount(params.id, accountData);
            } else {
                await addAccount(accountData);
            }
            router.back();
        } catch (error) {
            console.error("Failed to save account:", error);
            showAlert('Error', 'Failed to save account');
        }
    };

    const handleDelete = () => {
        if (!isEditing || typeof params.id !== 'string') return;

        showAlert('Delete Account', 'Are you sure? This will not delete transactions linked to this account, but they may become unlinked.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteAccount(params.id as string);
                    router.back();
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <X size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.text }]}>
                    {isEditing ? 'Edit Account' : 'New Account'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Balance Input (Hero Styling) */}
                <View style={styles.balanceSection}>
                    <Text style={[styles.label, { color: Colors.textSecondary }]}>Initial Balance</Text>
                    <View style={styles.balanceInputContainer}>
                        <Text style={[styles.currencyPrefix, { color: Colors.text }]}>{currencySymbol}</Text>
                        <TextInput
                            value={initialBalance}
                            onChangeText={(text) => {
                                // Validate decimals
                                if (text.split('.').length > 2) return;
                                setInitialBalance(text);
                            }}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textSecondary}
                            style={[styles.balanceInput, { color: Colors.text }]}
                            autoFocus={!isEditing}
                        />
                    </View>
                </View>

                {/* Account Name */}
                <Input
                    label="Account Name"
                    placeholder="e.g. Chase Checking"
                    value={name}
                    onChangeText={setName}
                    containerStyle={{ marginBottom: 24 }}
                />

                {/* Account Type */}
                <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Account Type</Text>
                <TouchableOpacity
                    style={[
                        styles.pickerTrigger,
                        { backgroundColor: Colors.surface, borderColor: Colors.border }
                    ]}
                    onPress={() => setShowTypePicker(true)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.pickerIcon, { backgroundColor: Colors.surfaceHighlight }]}>
                            {/* Show an icon based on the current type if possible, or generic */}
                            <Landmark size={20} color={Colors.text} />
                        </View>
                        <Text style={[styles.pickerText, { color: type ? Colors.text : Colors.textSecondary }]}>
                            {type || 'Select Account Type'}
                        </Text>
                    </View>
                    <ChevronDown size={16} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Color Picker */}
                <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {PREDEFINED_COLORS.map((c) => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => setColor(c)}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: c }
                            ]}
                        >
                            {color === c && <Check size={16} color="#FFF" />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Icon Picker (Simple Row for now, could be grid) */}
                <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Icon</Text>
                <View style={styles.iconRow}>
                    {ICONS.map((item) => (
                        <TouchableOpacity
                            key={item.name}
                            onPress={() => setSelectedIcon(item.name)}
                            style={[
                                styles.iconButton,
                                {
                                    backgroundColor: selectedIcon === item.name ? Colors.primary : Colors.surface,
                                    borderColor: selectedIcon === item.name ? Colors.primary : Colors.border
                                }
                            ]}
                        >
                            <item.component size={24} color={selectedIcon === item.name ? '#FFF' : Colors.text} />
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: Colors.border, backgroundColor: Colors.background }]}>
                {isEditing && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Trash2 size={24} color={Colors.danger} />
                    </TouchableOpacity>
                )}
                <Button
                    title={isEditing ? "Update Account" : "Create Account"}
                    onPress={handleSave}
                    style={{ flex: 1, marginLeft: isEditing ? 12 : 0 }}
                />
            </View>

            <AccountTypePicker
                visible={showTypePicker}
                currentType={type}
                existingTypes={existingTypes}
                onSelect={setType}
                onClose={() => setShowTypePicker(false)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        height: 56,
    },
    pickerIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerText: {
        fontSize: 16,
        fontFamily: 'Geist-Medium',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    balanceSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
        marginBottom: 8,
    },
    balanceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencyPrefix: {
        fontSize: 32,
        fontFamily: 'Geist-SemiBold',
        marginRight: 4,
    },
    balanceInput: {
        fontSize: 48,
        fontFamily: 'Geist-Bold',
        minWidth: 100,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 12,
        marginTop: 8,
    },
    horizontalScroll: {
        marginBottom: 24,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    iconButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
    },
    deleteButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
});
