import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SectionHeader, Separator, SettingsCard, SettingsItem } from '@/components/SettingsComponents';
import { UserLevelWidget } from '@/components/UserLevelWidget';
import { useStyles } from '@/constants/Styles';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { debounce } from 'lodash';
import * as Icons from 'lucide-react-native';
import {
    Calendar,
    Monitor,
    Moon,
    Sun,
    TrendingUp
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { theme, setTheme } = useTheme();
    const {
        budget,
        income,
        incomeStartDate,
        setBudget,
        setIncome,
        incomeDuration,
        setIncomeDuration,
        setIncomeStartDate,
        currency,
        setCurrency,
        currencySymbol,
        achievements,
        categories,
        accounts,
        trash,
        username,
        trackingMode,
        setTrackingMode,
    } = useExpense();

    const [budgetInput, setBudgetInput] = useState('');
    const [incomeInput, setIncomeInput] = useState('');
    const [incomeDurationInput, setIncomeDurationInput] = useState('');
    const [, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        setBudgetInput(budget.toString());
        setIncomeInput(income.toString());
        setIncomeDurationInput(incomeDuration.toString());
    }, [budget, income, incomeDuration]);

    const debouncedSaveBudget = React.useMemo(
        () => debounce((value: string) => {
            const parsed = value.trim() === '' ? 0 : parseFloat(value);
            if (!isNaN(parsed)) {
                setIsSaving(true);
                setBudget(parsed);
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000),
        [setBudget]
    );

    const debouncedSaveIncome = React.useMemo(
        () => debounce((value: string) => {
            const parsed = value.trim() === '' ? 0 : parseFloat(value);
            if (!isNaN(parsed)) {
                setIsSaving(true);
                setIncome(parsed);
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000),
        [setIncome]
    );

    const debouncedSaveIncomeDuration = React.useMemo(
        () => debounce((value: string) => {
            const parsed = value.trim() === '' ? 12 : parseInt(value);
            if (!isNaN(parsed)) {
                setIsSaving(true);
                setIncomeDuration(parsed);
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000),
        [setIncomeDuration]
    );

    const handleBudgetChange = (text: string) => {
        setBudgetInput(text);
        debouncedSaveBudget(text);
    };

    const handleIncomeChange = (text: string) => {
        setIncomeInput(text);
        debouncedSaveIncome(text);
    };

    const handleIncomeDurationChange = (text: string) => {
        setIncomeDurationInput(text);
        debouncedSaveIncomeDuration(text);
    };



    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            setIncomeStartDate(`${year}-${month}`);
        }
    };

    const { signOut } = useAuth();

    const handleSignOut = () => {
        showAlert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); } }
            ]
        );
    };





    return (
        <SafeAreaView style={[Styles.container, { backgroundColor: Colors.background }]}>
            <View style={styles.header}>
                <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 32, letterSpacing: -0.5 }]}>Settings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}>
                {/* Section: Financial Profile (HERO) */}
                <UserLevelWidget achievements={achievements} onPress={() => router.push('/achievements')} variant="compact" username={username} />

                <SectionHeader title="Financial Profile" />
                <SettingsCard noPadding>
                    {/* 1. Net Worth Tracking Toggle */}
                    <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ gap: 4, flex: 1 }}>
                            <Text style={{ color: Colors.text, fontSize: 16, fontFamily: 'Geist-SemiBold' }}>Track Net Worth</Text>
                            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Switch between total balance or budget tracking</Text>
                        </View>
                        <Switch
                            value={trackingMode === 'account_balance'}
                            onValueChange={(val) => setTrackingMode(val ? 'account_balance' : 'monthly_budget')}
                            trackColor={{ false: Colors.surfaceHighlight, true: Colors.primary }}
                            thumbColor={Colors.surface}
                        />
                    </View>

                    <Separator />

                    {/* 2. Monthly Cash Flow Inputs */}
                    <View style={{ padding: 16, gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={14} color={Colors.primary} />
                            <Text style={{ fontSize: 12, color: Colors.primary, fontFamily: 'Geist-Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Monthly Targets
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            {/* Income */}
                            <View style={{ flex: 1, gap: 8 }}>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: 'Geist-Medium' }}>Income</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}>
                                    <Text style={{ fontSize: 16, color: Colors.textSecondary, fontFamily: 'Geist-Medium', marginRight: 4 }}>{currencySymbol}</Text>
                                    <Input
                                        value={incomeInput}
                                        onChangeText={handleIncomeChange}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        containerStyle={{ marginBottom: 0, flex: 1 }}
                                        style={{ backgroundColor: 'transparent', borderWidth: 0, height: 24, padding: 0 }}
                                        inputStyle={{ color: Colors.text, fontSize: 18, fontFamily: 'Geist-Bold', paddingVertical: 0, height: '100%' }}
                                        placeholderTextColor={Colors.textSecondary}
                                    />
                                </View>
                            </View>

                            {/* Budget */}
                            <View style={{ flex: 1, gap: 8 }}>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: 'Geist-Medium' }}>Budget</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}>
                                    <Text style={{ fontSize: 16, color: Colors.textSecondary, fontFamily: 'Geist-Medium', marginRight: 4 }}>{currencySymbol}</Text>
                                    <Input
                                        value={budgetInput}
                                        onChangeText={handleBudgetChange}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        containerStyle={{ marginBottom: 0, flex: 1 }}
                                        style={{ backgroundColor: 'transparent', borderWidth: 0, height: 24, padding: 0 }}
                                        inputStyle={{ color: Colors.text, fontSize: 18, fontFamily: 'Geist-Bold', paddingVertical: 0, height: '100%' }}
                                        placeholderTextColor={Colors.textSecondary}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Config Row */}
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                            <View style={{ flex: 1, gap: 8 }}>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: 'Geist-Medium' }}>Duration (Months)</Text>
                                <Input
                                    value={incomeDurationInput}
                                    onChangeText={handleIncomeDurationChange}
                                    keyboardType="numeric"
                                    placeholder="12"
                                    containerStyle={{ marginBottom: 0 }}
                                    style={{ backgroundColor: Colors.surfaceHighlight, borderWidth: 0, height: 36, borderRadius: 8, paddingHorizontal: 12 }}
                                    inputStyle={{ fontSize: 14, fontFamily: 'Geist-SemiBold', paddingVertical: 0, height: '100%' }}
                                />
                            </View>
                            <View style={{ flex: 1, gap: 8 }}>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: 'Geist-Medium' }}>Start Date</Text>
                                <TouchableOpacity
                                    onPress={() => Platform.OS !== 'web' && setShowDatePicker(true)}
                                    style={{
                                        backgroundColor: Colors.surfaceHighlight,
                                        height: 36,
                                        borderRadius: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 12,
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Text style={{ color: Colors.text, fontSize: 13, fontFamily: 'Geist-SemiBold' }}>
                                        {incomeStartDate || 'Select Date'}
                                    </Text>
                                    <Calendar size={14} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {trackingMode === 'account_balance' && (
                        <>
                            <Separator />
                            <SettingsItem
                                icon="Wallet"
                                title="Manage Accounts"
                                subtitle={`${accounts.length} accounts linked`}
                                onPress={() => router.push('/accounts')}
                            />
                        </>
                    )}
                </SettingsCard>

                {/* Section: Preferences */}
                <SectionHeader title="Preferences" />
                <SettingsCard noPadding>
                    <SettingsItem
                        icon="User"
                        title="Account Info"
                        onPress={() => router.push('/account-info')}
                    />
                    <Separator />
                    <SettingsItem
                        icon="Palette"
                        title="Theme"
                        rightElement={
                            <View style={{ flexDirection: 'row', backgroundColor: Colors.surfaceHighlight, padding: 4, borderRadius: 12, gap: 4 }}>
                                {(['light', 'dark', 'system'] as const).map((t) => {
                                    const isActive = theme === t;
                                    const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
                                    return (
                                        <TouchableOpacity
                                            key={t}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                backgroundColor: isActive ? Colors.background : 'transparent',
                                                shadowColor: '#000',
                                                shadowOpacity: isActive ? 0.05 : 0,
                                                shadowRadius: 2,
                                            }}
                                            onPress={() => setTheme(t)}
                                        >
                                            <Icon size={16} color={isActive ? Colors.text : Colors.textSecondary} />
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        }
                    />

                    <SettingsItem
                        icon="CircleDollarSign"
                        title="Currency"
                        rightElement={
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4, gap: 6 }} style={{ maxWidth: 160 }}>
                                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'].map((curr) => (
                                    <TouchableOpacity
                                        key={curr}
                                        onPress={() => setCurrency(curr)}
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 8,
                                            backgroundColor: currency === curr ? Colors.primary + '20' : Colors.surfaceHighlight,
                                            borderWidth: 1,
                                            borderColor: currency === curr ? Colors.primary : 'transparent',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontFamily: 'Geist-SemiBold', color: currency === curr ? Colors.primary : Colors.textSecondary }}>{curr}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        }
                    />
                </SettingsCard>

                {/* Section: Data & Privacy */}
                <SectionHeader title="Data & Privacy" />
                <SettingsCard noPadding>
                    <SettingsItem
                        icon="LayoutGrid"
                        title="Manage Categories"
                        subtitle={`${categories.length} categories`}
                        onPress={() => router.push('/categories')}
                    />
                    <Separator />
                    <SettingsItem
                        icon="History"
                        title="Transactions History"
                        subtitle="View all your past transactions"
                        onPress={() => router.push('/transactions-history')}
                    />
                    <Separator />
                    <SettingsItem
                        icon="Download"
                        title="Export Data"
                        subtitle="Select format and export data"
                        onPress={() => router.push('/export')}
                    /><Separator />
                    <SettingsItem
                        icon="Trash2"
                        title="Trash Bin"
                        subtitle={`${trash.length} items`}
                        onPress={() => router.push('/trash')}
                    />
                </SettingsCard>

                <View style={{ marginTop: 24, gap: 12 }}>
                    <Button
                        title="Sign Out"
                        onPress={handleSignOut}
                        variant="secondary"
                        icon={<Icons.LogOut size={16} color={Colors.text} />}
                        style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}
                    />

                </View>

                {Platform.OS !== 'web' && showDatePicker && (
                    <DateTimePicker
                        value={incomeStartDate ? new Date(incomeStartDate + '-01') : new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        themeVariant={theme === 'dark' ? 'dark' : 'light'}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    categoryPillText: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Geist-Bold',
    },
    label: {
        fontSize: 13,
        fontFamily: 'Geist-SemiBold',
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    iconPreview: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorPreview: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#fff',
    },
    pickerButtonText: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 32,
    },
});


