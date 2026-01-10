import { Button } from '@/components/Button';
import { ColorPicker } from '@/components/ColorPicker';
import { IconPicker } from '@/components/IconPicker';
import { Input } from '@/components/Input';
import { SectionHeader, Separator, SettingsCard, SettingsHeroCard, SettingsItem } from '@/components/SettingsComponents';
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
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        categories,
        addCategory,
        deleteCategory,
        transactions,
        trash,
        purgeData,
    } = useExpense();

    const [budgetInput, setBudgetInput] = useState('');
    const [incomeInput, setIncomeInput] = useState('');
    const [incomeDurationInput, setIncomeDurationInput] = useState('');
    const [, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('MoreHorizontal');
    const [selectedColor, setSelectedColor] = useState('#FFD93D');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
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

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            showAlert('Error', 'Please enter a category name');
            return;
        }
        addCategory(newCategoryName.trim(), selectedIcon, selectedColor);
        setNewCategoryName('');
        setSelectedIcon('MoreHorizontal');
        setSelectedColor('#FFD93D');
        setShowAddCategory(false);
        showAlert('Success', 'Category added successfully');
    };

    const handleDeleteCategory = (categoryId: string, categoryName: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (category?.isPredefined) {
            showAlert('Cannot Delete', 'Predefined categories cannot be deleted.', [{ text: 'OK' }]);
            return;
        }

        const hasTransactions = transactions.some(t => t.category === categoryName);
        if (hasTransactions) {
            showAlert('Cannot Delete', `The category "${categoryName}" has associated transactions. Please delete or reassign them first.`, [{ text: 'OK' }]);
            return;
        }
        showAlert(
            'Delete Category',
            `Are you sure you want to delete "${categoryName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(categoryId) }
            ]
        );
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

    const handleResetData = () => {
        showAlert(
            'Reset App Data',
            'This will permanently delete ALL transactions, categories, and settings. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                        await purgeData();
                        showAlert('Success', 'App data has been reset.');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        showAlert(
            'Delete Account',
            'Are you sure you want to delete your account? This will permanently remove all your data associated with this account.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => {
                        // Small delay to allow previous alert to close before showing the next one
                        setTimeout(() => {
                            showAlert(
                                'Final Warning',
                                'This action CANNOT be undone. All your transactions, goals, and history will be lost forever. Are you absolutely sure?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Yes, Delete Account',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await purgeData(true);
                                                try { await signOut(); } catch { /* ignore */ }
                                                router.replace('/auth/login');
                                            } catch (error) {
                                                console.error("Error deleting account:", error);
                                                showAlert("Error", "Failed to delete account data. Please try again.");
                                            }
                                        }
                                    }
                                ]
                            );
                        }, 500);
                    }
                }
            ]
        );
    };

    const renderIcon = (iconName: string, color: string, size: number = 20) => {
        const IconComponent = (Icons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent size={size} color={color} />;
    };

    return (
        <SafeAreaView style={[Styles.container, { backgroundColor: Colors.background }]}>
            <View style={styles.header}>
                <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 32, letterSpacing: -0.5 }]}>Settings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
                {/* Section: Financial Profile (HERO) */}
                <SectionHeader title="Financial Profile" />
                <SettingsHeroCard>
                    <View style={{ gap: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Geist-Medium', marginBottom: 4 }} numberOfLines={1} adjustsFontSizeToFit>Monthly Income</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Geist-Bold', marginRight: 4 }}>{currencySymbol}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Input
                                            value={incomeInput}
                                            onChangeText={handleIncomeChange}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            containerStyle={{ marginBottom: 0 }}
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.15)',
                                                borderWidth: 0,
                                                height: 44,
                                                width: '100%',
                                                padding: 0,
                                                paddingHorizontal: 12,
                                            }}
                                            inputStyle={{
                                                color: '#fff',
                                                fontSize: 24,
                                                fontFamily: 'Geist-Bold',
                                                paddingVertical: 0,
                                                height: '100%',
                                            }}
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                        />
                                    </View>
                                </View>
                            </View>
                            <View style={{ height: 40, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Geist-Medium', marginBottom: 4 }} numberOfLines={1} adjustsFontSizeToFit>Monthly Budget</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Geist-Bold', marginRight: 4 }}>{currencySymbol}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Input
                                            value={budgetInput}
                                            onChangeText={handleBudgetChange}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            containerStyle={{ marginBottom: 0 }}
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.15)',
                                                borderWidth: 0,
                                                height: 44,
                                                width: '100%',
                                                padding: 0,
                                                paddingHorizontal: 12,
                                            }}
                                            inputStyle={{
                                                color: '#fff',
                                                fontSize: 24,
                                                fontFamily: 'Geist-Bold',
                                                paddingVertical: 0,
                                                height: '100%',
                                            }}
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Geist-Medium', marginBottom: 6 }}>Income Duration</Text>
                                <Input
                                    value={incomeDurationInput}
                                    onChangeText={handleIncomeDurationChange}
                                    keyboardType="numeric"
                                    placeholder="12"
                                    containerStyle={{ marginBottom: 0 }}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 0,
                                        height: 36
                                    }}
                                    inputStyle={{
                                        color: '#fff',
                                        fontSize: 14,
                                        paddingVertical: 0,
                                        height: '100%',
                                    }}
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Geist-Medium', marginBottom: 6 }}>Start Date</Text>
                                <TouchableOpacity
                                    onPress={() => Platform.OS !== 'web' && setShowDatePicker(true)}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        height: 36,
                                        borderRadius: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 12,
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Geist-Medium' }}>
                                        {incomeStartDate || 'Select'}
                                    </Text>
                                    <Calendar size={14} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </SettingsHeroCard>

                {/* Section: Preferences */}
                <SectionHeader title="Preferences" />
                <SettingsCard noPadding>
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
                    <Separator />
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

                {/* Section: Categories */}
                <SectionHeader title="Categories" actionLabel="Add New" onAction={() => setShowAddCategory(true)} />
                <SettingsCard>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categoryPill, { backgroundColor: cat.color + '15', borderColor: cat.color + '30' }]}
                                onPress={() => !cat.isPredefined && handleDeleteCategory(cat.id, cat.name)}
                            >
                                {renderIcon(cat.icon, cat.color, 16)}
                                <Text style={[styles.categoryPillText, { color: Colors.text }]}>{cat.name}</Text>
                                {!cat.isPredefined && (
                                    <View style={{ backgroundColor: cat.color + '20', borderRadius: 10, padding: 2 }}>
                                        <X size={10} color={cat.color} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </SettingsCard>

                {/* Section: Data & Privacy */}
                <SectionHeader title="Data & Privacy" />
                <SettingsCard noPadding>
                    <SettingsItem
                        icon="Download"
                        title="Export Data"
                        // subtitle="CSV or JSON formats"
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
                    <Button
                        title="Reset Data"
                        onPress={handleResetData}
                        variant="secondary"
                        style={{ backgroundColor: Colors.danger + '10', borderColor: Colors.danger + '20', borderWidth: 1 }}
                        textStyle={{ color: Colors.danger }}
                    />
                    <Button
                        title="Delete Account"
                        onPress={handleDeleteAccount}
                        variant="secondary"
                        style={{ backgroundColor: Colors.danger + '10', borderColor: Colors.danger + '20', borderWidth: 1 }}
                        textStyle={{ color: Colors.danger }}
                    />
                </View>

            </ScrollView>

            <Modal visible={showAddCategory} animationType="slide" transparent onRequestClose={() => setShowAddCategory(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.text }]}>New Category</Text>
                            <TouchableOpacity onPress={() => setShowAddCategory(false)} style={{ padding: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 20 }}>
                                <X size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Category Name"
                            placeholder="e.g., Entertainment"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                        />

                        <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 20, marginBottom: 12 }]}>Icon & Color</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.pickerButton, { flex: 1, backgroundColor: Colors.background, borderColor: Colors.border }]}
                                onPress={() => setShowIconPicker(true)}
                            >
                                <View style={[styles.iconPreview, { backgroundColor: selectedColor + '20' }]}>
                                    {renderIcon(selectedIcon, selectedColor, 20)}
                                </View>
                                <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Select Icon</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pickerButton, { flex: 1, backgroundColor: Colors.background, borderColor: Colors.border }]}
                                onPress={() => setShowColorPicker(true)}
                            >
                                <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                                <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Select Color</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Add Category"
                                onPress={handleAddCategory}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <IconPicker
                visible={showIconPicker}
                selectedIcon={selectedIcon}
                onSelect={setSelectedIcon}
                onClose={() => setShowIconPicker(false)}
            />

            <ColorPicker
                visible={showColorPicker}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
                onClose={() => setShowColorPicker(false)}
            />
            {Platform.OS !== 'web' && showDatePicker && (
                <DateTimePicker
                    value={incomeStartDate ? new Date(incomeStartDate + '-01') : new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    themeVariant={theme === 'dark' ? 'dark' : 'light'}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
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
