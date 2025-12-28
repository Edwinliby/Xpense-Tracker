import { Button } from '@/components/Button';
import { ColorPicker } from '@/components/ColorPicker';
import { IconPicker } from '@/components/IconPicker';
import { Input } from '@/components/Input';
import { useStyles } from '@/constants/Styles';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { debounce } from 'lodash';
import * as Icons from 'lucide-react-native';
import { Calendar, Download, Monitor, Moon, Sun, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        setIncomeStartDate,
        currency,
        setCurrency,
        currencySymbol,
        categories,
        addCategory,
        deleteCategory,
        transactions,
        loading,
        purgeData,
    } = useExpense();

    const [budgetInput, setBudgetInput] = useState('');
    const [incomeInput, setIncomeInput] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('MoreHorizontal');
    const [selectedColor, setSelectedColor] = useState('#FFD93D');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setBudgetInput(budget.toString());
        setIncomeInput(income.toString());
    }, [budget, income]);

    const debouncedSaveBudget = useCallback(
        debounce((value: string) => {
            const parsed = value.trim() === '' ? 0 : parseFloat(value);
            if (!isNaN(parsed)) {
                setIsSaving(true);
                setBudget(parsed);
                // Simulate a quick save indication or just rely on the fact it's saved
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000),
        [setBudget]
    );

    const debouncedSaveIncome = useCallback(
        debounce((value: string) => {
            const parsed = value.trim() === '' ? 0 : parseFloat(value);
            if (!isNaN(parsed)) {
                setIsSaving(true);
                setIncome(parsed);
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000),
        [setIncome]
    );

    const handleBudgetChange = (text: string) => {
        setBudgetInput(text);
        debouncedSaveBudget(text);
    };

    const handleIncomeChange = (text: string) => {
        setIncomeInput(text);
        debouncedSaveIncome(text);
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
            Alert.alert('Error', 'Please enter a category name');
            return;
        }
        addCategory(newCategoryName.trim(), selectedIcon, selectedColor);
        setNewCategoryName('');
        setSelectedIcon('MoreHorizontal');
        setSelectedColor('#FFD93D');
        setShowAddCategory(false);
        Alert.alert('Success', 'Category added successfully');
    };

    const handleDeleteCategory = (categoryId: string, categoryName: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (category?.isPredefined) {
            Alert.alert(
                'Cannot Delete',
                'Predefined categories cannot be deleted.',
                [{ text: 'OK' }]
            );
            return;
        }

        const hasTransactions = transactions.some(t => t.category === categoryName);
        if (hasTransactions) {
            Alert.alert(
                'Cannot Delete',
                `The category "${categoryName}" has associated transactions. Please delete or reassign those transactions first.`,
                [{ text: 'OK' }]
            );
            return;
        }
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${categoryName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteCategory(categoryId)
                }
            ]
        );
    };

    const handleExport = async () => {
        try {
            const csvHeader = 'Date,Type,Category,Amount,Description,Paid By,Friend Payment\n';
            const csvRows = transactions.map(t => {
                const cleanDesc = t.description.replace(/,/g, ' '); // Simple escape
                return `${t.date},${t.type},${t.category},${t.amount},${cleanDesc},${t.paidBy || ''},${t.isFriendPayment ? 'Yes' : 'No'}`;
            }).join('\n');

            const csvContent = csvHeader + csvRows;
            const fileUri = (FileSystem as any).documentDirectory + 'transactions.csv';

            await FileSystem.writeAsStringAsync(fileUri, csvContent, {
                encoding: 'utf8',
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const { signOut } = useAuth();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    const handleResetData = () => {
        Alert.alert(
            'Reset App Data',
            'This will permanently delete ALL transactions, categories, and settings. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                        await purgeData();
                        Alert.alert('Success', 'App data has been reset.');
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
                <Text style={[Styles.title, { marginBottom: 4, fontFamily: 'Geist-Bold', fontSize: 28, letterSpacing: -1 }]}>Settings</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 13, marginBottom: 16 }}>Manage your preferences and data</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Section: Profile & Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PREFERENCES</Text>

                    {/* Theme Selector */}
                    <View style={styles.card}>
                        <View style={styles.rowItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemTitle, { color: Colors.text }]}>App Theme</Text>
                                <Text style={[styles.itemSubtitle, { color: Colors.textSecondary }]}>Select your preferred look</Text>
                            </View>
                            <View style={styles.themeToggleContainer}>
                                {['light', 'dark', 'system'].map((t) => {
                                    const isActive = theme === t;
                                    const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
                                    return (
                                        <TouchableOpacity
                                            key={t}
                                            style={[styles.themeOption, isActive && { backgroundColor: Colors.surfaceHighlight, borderColor: Colors.border }]}
                                            onPress={() => setTheme(t as any)}
                                        >
                                            <Icon size={18} color={isActive ? Colors.text : Colors.textSecondary} />
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>

                        <View style={styles.separator} />

                        {/* Currency Selector */}
                        <View style={styles.rowItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemTitle, { color: Colors.text }]}>Currency</Text>
                                <Text style={[styles.itemSubtitle, { color: Colors.textSecondary }]}>Symbol used across the app</Text>
                            </View>
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ maxWidth: '50%' }}>
                                    {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'].map((curr) => (
                                        <TouchableOpacity
                                            key={curr}
                                            onPress={() => setCurrency(curr)}
                                            style={[
                                                styles.currencyOption,
                                                {
                                                    backgroundColor: currency === curr ? Colors.primary : 'transparent',
                                                    borderColor: currency === curr ? Colors.primary : Colors.border
                                                }
                                            ]}
                                        >
                                            <Text style={[
                                                styles.currencyOptionText,
                                                { color: currency === curr ? '#fff' : Colors.textSecondary }
                                            ]}>{curr}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </View>

                {/* Section: Financials */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>FINANCIAL GOALS</Text>
                    <View style={styles.card}>
                        {/* Income & Budget Inputs */}
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Monthly Income"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={incomeInput}
                                    onChangeText={handleIncomeChange}
                                    prefix={currencySymbol}
                                    style={{ backgroundColor: Colors.background }}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Monthly Budget"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={budgetInput}
                                    onChangeText={handleBudgetChange}
                                    prefix={currencySymbol}
                                    style={{ backgroundColor: Colors.background }}
                                />
                            </View>
                        </View>

                        <View style={{ height: 16 }} />

                        {/* Income Start Date Picker */}
                        <View style={[styles.pickerContainer, { backgroundColor: Colors.background, borderColor: Colors.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemTitle, { color: Colors.text, fontSize: 13, marginBottom: 4 }]}>Tracking Start Date</Text>
                                <Text style={{ color: incomeStartDate ? Colors.text : Colors.textSecondary, fontSize: 15, fontWeight: '500' }}>
                                    {incomeStartDate || "Not set (Select Date)"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                style={{ padding: 8, backgroundColor: Colors.surfaceHighlight, borderRadius: 8 }}
                            >
                                <Calendar size={20} color={Colors.text} />
                            </TouchableOpacity>
                            {incomeStartDate && (
                                <TouchableOpacity onPress={() => setIncomeStartDate(null)} style={{ marginLeft: 8, padding: 4 }}>
                                    <X size={16} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={incomeStartDate ? new Date(incomeStartDate + '-01') : new Date()}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                themeVariant={theme === 'dark' ? 'dark' : 'light'}
                            />
                        )}
                    </View>
                </View>

                {/* Section: Categories */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                        <Text style={styles.sectionHeader}>CATEGORIES</Text>
                        <TouchableOpacity onPress={() => setShowAddCategory(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Icons.Plus size={14} color={Colors.primary} />
                            <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>Add New</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <View key={cat.id} style={[styles.categoryPill, { backgroundColor: cat.color + '10', borderColor: cat.color + '40' }]}>
                                    {renderIcon(cat.icon, cat.color, 14)}
                                    <Text style={[styles.categoryPillText, { color: Colors.text }]}>{cat.name}</Text>
                                    {!cat.isPredefined && (
                                        <TouchableOpacity
                                            onPress={() => handleDeleteCategory(cat.id, cat.name)}
                                            style={styles.deleteCategoryBtn}
                                        >
                                            <X size={12} color={cat.color} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Section: Data & Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>DATA MANAGEMENT</Text>
                    <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>

                        <TouchableOpacity style={styles.menuRow} onPress={handleExport}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Download size={18} color={Colors.text} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuText, { color: Colors.text }]}>Export Data</Text>
                                <Text style={styles.menuSubtext}>Download as CSV</Text>
                            </View>
                            <Icons.ChevronRight size={18} color={Colors.textSecondary} opacity={0.5} />
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/trash')}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Trash2 size={18} color={Colors.text} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuText, { color: Colors.text }]}>Trash Bin</Text>
                                <Text style={styles.menuSubtext}>Restore deleted items</Text>
                            </View>
                            <Icons.ChevronRight size={18} color={Colors.textSecondary} opacity={0.5} />
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuRow} onPress={handleResetData}>
                            <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                                <Icons.RefreshCw size={18} color={Colors.danger} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuText, { color: Colors.danger }]}>Reset App Data</Text>
                                <Text style={styles.menuSubtext}>Clear all transactions & settings</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuRow} onPress={handleSignOut}>
                            <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                                <Icons.LogOut size={18} color={Colors.danger} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuText, { color: Colors.danger }]}>Sign Out</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Keeping existing Modals and Pickers as is */}
            <Modal visible={showAddCategory} animationType="slide" transparent onRequestClose={() => setShowAddCategory(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.text }]}>Add New Category</Text>
                            <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Input
                            label="Category Name"
                            placeholder="e.g., Groceries"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                        />

                        <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>Icon</Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, { backgroundColor: Colors.background, borderColor: Colors.border }]}
                            onPress={() => setShowIconPicker(true)}
                        >
                            <View style={[styles.iconPreview, { backgroundColor: selectedColor + '20' }]}>
                                {renderIcon(selectedIcon, selectedColor, 24)}
                            </View>
                            <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Select Icon</Text>
                        </TouchableOpacity>

                        <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>Color</Text>
                        <TouchableOpacity
                            style={[styles.pickerButton, { backgroundColor: Colors.background, borderColor: Colors.border }]}
                            onPress={() => setShowColorPicker(true)}
                        >
                            <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                            <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Select Color</Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                onPress={() => setShowAddCategory(false)}
                                variant="secondary"
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <Button
                                title="Add Category"
                                onPress={handleAddCategory}
                                style={{ flex: 1, marginLeft: 8 }}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        fontSize: 12,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 10,
        letterSpacing: 0.8,
        opacity: 0.5,
        marginLeft: 4,
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.05)', // Fallback if theme color not applied directly
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    itemTitle: {
        fontSize: 15,
        fontFamily: 'Geist-SemiBold',
    },
    itemSubtitle: {
        fontSize: 12,
        marginTop: 2,
        fontFamily: 'Geist-Medium',
    },
    themeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(150,150,150,0.1)',
        padding: 3,
        borderRadius: 10,
    },
    themeOption: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currencyOption: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    currencyOptionText: {
        fontSize: 12, // Keep small
        fontFamily: 'Geist-SemiBold',
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
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
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    categoryPillText: {
        fontSize: 12,
        fontFamily: 'Geist-Medium',
    },
    deleteCategoryBtn: {
        padding: 2,
        marginLeft: 2,
        opacity: 0.7,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        fontSize: 15,
        fontFamily: 'Geist-SemiBold',
    },
    menuSubtext: {
        fontSize: 12,
        color: '#888',
        marginTop: 1,
        fontFamily: 'Geist-Medium',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },

    // Keeping existing Modal styles for now
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    iconPreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    pickerButtonText: {
        fontSize: 15,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 24,
    },
});
