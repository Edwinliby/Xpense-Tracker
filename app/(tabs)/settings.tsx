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
            const parsed = parseFloat(value);
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
            const parsed = parseFloat(value);
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

    const renderIcon = (iconName: string, color: string, size: number = 20) => {
        const IconComponent = (Icons as any)[iconName];
        if (!IconComponent) return null;
        return <IconComponent size={size} color={color} />;
    };

    return (
        <SafeAreaView style={Styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={[Styles.title, { marginHorizontal: 20 }]}>Settings</Text>

                {/* Financial Settings Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>FINANCIALS</Text>
                    <View style={[Styles.card, styles.cardContainer]}>

                        {/* Budget & Income */}
                        <View style={styles.inputRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Monthly Income"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={incomeInput}
                                    onChangeText={handleIncomeChange}
                                    prefix={currencySymbol}
                                />
                            </View>
                        </View>
                        <View style={{ height: 16 }} />
                        <View style={styles.inputRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Monthly Budget"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={budgetInput}
                                    onChangeText={handleBudgetChange}
                                    prefix={currencySymbol}
                                />
                            </View>
                        </View>

                        {/* Income Start Date */}
                        <View style={styles.divider} />
                        <Text style={[styles.label, { color: Colors.textSecondary }]}>Income Start Month</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.dateButton, { borderColor: Colors.border, backgroundColor: Colors.background }]}
                        >
                            <Calendar size={20} color={Colors.text} />
                            <Text style={{ flex: 1, color: incomeStartDate ? Colors.text : Colors.textSecondary, fontSize: 16 }}>
                                {incomeStartDate || "Select Date (YYYY-MM)"}
                            </Text>
                            {incomeStartDate && (
                                <TouchableOpacity onPress={() => setIncomeStartDate(null)} style={{ padding: 4 }}>
                                    <X size={16} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={incomeStartDate ? new Date(incomeStartDate + '-01') : new Date()}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                themeVariant={theme === 'dark' ? 'dark' : 'light'}
                            />
                        )}

                        {/* Currency */}
                        <View style={styles.divider} />
                        <Text style={[styles.label, { color: Colors.textSecondary }]}>Currency</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color={Colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 12 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'].map((curr) => (
                                    <TouchableOpacity
                                        key={curr}
                                        onPress={() => setCurrency(curr)}
                                        style={[
                                            styles.currencyChip,
                                            {
                                                backgroundColor: currency === curr ? Colors.primary : Colors.surfaceHighlight,
                                                borderColor: currency === curr ? Colors.primary : 'transparent'
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.currencyText,
                                            { color: currency === curr ? '#fff' : Colors.text }
                                        ]}>{curr}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>


                {/* Appearance Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>APPEARANCE</Text>
                    <View style={[Styles.card, styles.themeContainer]}>
                        {['light', 'dark', 'system'].map((t) => {
                            const isActive = theme === t;
                            const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
                            return (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.themeButton, isActive && { backgroundColor: Colors.primary }]}
                                    onPress={() => setTheme(t as any)}
                                >
                                    <Icon size={24} color={isActive ? '#fff' : Colors.text} />
                                    <Text style={[styles.themeText, { color: isActive ? '#fff' : Colors.text }]}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                {/* Categories Section */}
                <View style={styles.sectionContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={[styles.sectionTitle, { color: Colors.textSecondary, marginBottom: 0 }]}>CATEGORIES</Text>
                        <TouchableOpacity onPress={() => setShowAddCategory(true)}>
                            <Text style={{ color: Colors.primary, fontWeight: '600' }}>+ Add New</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[Styles.card, { padding: 16 }]}>
                        <View style={styles.categoryChipsContainer}>
                            {categories.map((cat) => (
                                <View key={cat.id} style={[styles.categoryChip, { backgroundColor: cat.color + '15', borderColor: cat.color }]}>
                                    {renderIcon(cat.icon, cat.color, 14)}
                                    <Text style={[styles.categoryChipText, { color: Colors.text }]}>
                                        {cat.name}
                                    </Text>
                                    {!cat.isPredefined && (
                                        <TouchableOpacity
                                            key={`${cat.id}-delete`}
                                            onPress={() => handleDeleteCategory(cat.id, cat.name)}
                                            style={styles.chipDeleteButton}
                                        >
                                            <X size={14} color={cat.color} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Data & Account Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>DATA & ACCOUNT</Text>
                    <View style={[Styles.card, { overflow: 'hidden', padding: 0 }]}>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: Colors.border, borderBottomWidth: 1 }]}
                            onPress={handleExport}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Download size={20} color={Colors.text} />
                            </View>
                            <Text style={[styles.menuItemText, { color: Colors.text }]}>Export Data (CSV)</Text>
                            <Icons.ChevronRight size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: Colors.border, borderBottomWidth: 1 }]}
                            onPress={() => router.push('/trash')}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: Colors.surfaceHighlight }]}>
                                <Trash2 size={20} color={Colors.text} />
                            </View>
                            <Text style={[styles.menuItemText, { color: Colors.text }]}>Trash Bin</Text>
                            <Icons.ChevronRight size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleSignOut}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                                <Icons.LogOut size={20} color={Colors.danger} />
                            </View>
                            <Text style={[styles.menuItemText, { color: Colors.danger }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Add Category Modal */}
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
    sectionContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
        opacity: 0.7,
    },
    cardContainer: {
        padding: 16,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
        marginVertical: 16,
    },
    themeContainer: {
        flexDirection: 'row',
        padding: 8,
        gap: 8,
    },
    themeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    themeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
        marginTop: 8,
    },
    helpText: {
        fontSize: 11,
        marginTop: 4,
        marginBottom: 8,
        lineHeight: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    currencyChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    currencyText: {
        fontSize: 13,
        fontWeight: '600',
    },
    categoryChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    chipDeleteButton: {
        padding: 2,
    },
    addCategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    addCategoryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },

    // Modal Styles
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
