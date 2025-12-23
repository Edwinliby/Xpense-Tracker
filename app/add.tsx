import { Button } from '@/components/Button';
import { ImageEditor } from '@/components/ImageEditor';
import { ImageViewer } from '@/components/ImageViewer';
import { Input } from '@/components/Input';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addMonths, format } from 'date-fns';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { Calendar, Camera, Image as ImageIcon, RotateCw, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddTransactionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { addTransaction, editTransaction, deleteTransaction, categories, currencySymbol } = useExpense();

    const isEditing = !!params.id;
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isFriendPayment, setIsFriendPayment] = useState(false);
    const [paidBy, setPaidBy] = useState('');
    const [isLent, setIsLent] = useState(false);
    const [lentTo, setLentTo] = useState('');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (isEditing && params.id) {
                const getParam = (p: string | string[] | undefined) => Array.isArray(p) ? p[0] : p || '';

                setAmount(getParam(params.amount));
                setDescription(getParam(params.description));
                setCategory(getParam(params.category));

                const typeParam = getParam(params.type);
                if (typeParam === 'income' || typeParam === 'expense') {
                    setType(typeParam);
                }

                const dateParam = getParam(params.date);
                if (dateParam) {
                    setDate(new Date(dateParam));
                }

                const receiptParam = getParam(params.receiptImage);
                if (receiptParam) {
                    setReceiptImage(receiptParam);
                }

                setIsFriendPayment(getParam(params.isFriendPayment) === 'true');
                setPaidBy(getParam(params.paidBy));
                setIsLent(getParam(params.isLent) === 'true');
                setLentTo(getParam(params.lentTo));
                setIsRecurring(getParam(params.isRecurring) === 'true');

            } else {
                setAmount('');
                setDescription('');
                setCategory('');
                setType('expense');
                setDate(new Date());
                setIsFriendPayment(false);
                setPaidBy('');
                setIsLent(false);
                setLentTo('');
                setReceiptImage(null);
                setIsRecurring(false);
            }
        }, [params.id, params.amount, params.description, params.category, params.type, params.date, params.receiptImage, params.isFriendPayment, params.paidBy, params.isLent, params.lentTo, params.isRecurring, isEditing])
    );

    const handleSave = useCallback(() => {
        const finalAmount = parseFloat(amount);

        if (!finalAmount) {
            Alert.alert('Error', 'Please enter an amount');
            return;
        }

        if (type === 'expense' && !category) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        if (isNaN(finalAmount)) {
            Alert.alert('Error', 'Invalid amount');
            return;
        }

        if (isNaN(date.getTime())) {
            Alert.alert('Error', 'Invalid date');
            return;
        }

        if (type === 'expense' && isFriendPayment && !paidBy.trim()) {
            Alert.alert('Error', "Please enter friend's name");
            return;
        }

        if (type === 'expense' && isLent && !lentTo.trim()) {
            Alert.alert('Error', "Please enter friend's name");
            return;
        }

        const transactionData = {
            amount: finalAmount,
            description,
            category: category || 'Income',
            type,
            date: date.toISOString(),
            isFriendPayment: type === 'expense' ? isFriendPayment : false,
            paidBy: type === 'expense' && isFriendPayment ? paidBy : undefined,
            isLent: type === 'expense' ? isLent : false,
            lentTo: type === 'expense' && isLent ? lentTo : undefined,
            receiptImage: receiptImage || undefined,
            isRecurring,
            recurrenceInterval: isRecurring ? 'monthly' as const : undefined,
            nextOccurrence: isRecurring ? addMonths(date, 1).toISOString() : undefined,
        };

        try {
            if (isEditing) {
                const id = Array.isArray(params.id) ? params.id[0] : params.id;
                editTransaction(id as string, transactionData);
            } else {
                addTransaction(transactionData);
            }
            router.back();
        } catch (error) {
            console.error("Failed to save transaction:", error);
            Alert.alert('Error', 'Failed to save transaction');
        }
    }, [amount, category, date, description, type, isEditing, params.id, editTransaction, addTransaction, router, isFriendPayment, paidBy, isLent, lentTo, receiptImage, isRecurring]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setReceiptImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera is required!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setReceiptImage(result.assets[0].uri);
        }
    };

    const handleDelete = useCallback(() => {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!id) {
            Alert.alert('Error', 'Transaction ID not found');
            return;
        }
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    deleteTransaction(id as string);
                    router.back();
                }
            }
        ]);
    }, [params.id, deleteTransaction, router]);

    const onChangeDate = useCallback((_event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    }, []);

    return (
        <SafeAreaView style={{ backgroundColor: Colors.background, flex: 1 }}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <X size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.text }]}>
                    {isEditing ? 'Edit Transaction' : 'New Transaction'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Amount Section */}
                <View style={styles.heroSection}>
                    <View style={styles.amountDisplay}>
                        <Text style={[styles.currencySymbol, { color: amount ? Colors.text : Colors.textSecondary }]}>
                            {currencySymbol}
                        </Text>
                        <Text style={[styles.heroText, { color: amount ? Colors.text : Colors.textSecondary }]}>
                            {amount || '0'}
                        </Text>
                        <View style={[styles.cursor, { backgroundColor: Colors.primary }]} />
                    </View>
                    <TextInput
                        value={amount}
                        onChangeText={(text) => {
                            // Simple validation to prevent multiple decimals
                            if (text.split('.').length > 2) return;
                            setAmount(text);
                        }}
                        keyboardType="numeric"
                        style={styles.hiddenInput}
                        autoFocus={!isEditing}
                    />
                </View>

                {/* Type Toggle */}
                <View style={[styles.segmentContainer, { backgroundColor: Colors.surfaceHighlight }]}>
                    {(['expense', 'income'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.segmentButton,
                                type === t && {
                                    backgroundColor: t === 'income' ? Colors.success : Colors.danger,
                                    shadowColor: t === 'income' ? Colors.success : Colors.danger,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 4
                                }
                            ]}
                            onPress={() => setType(t)}
                        >
                            <Text style={[
                                styles.segmentText,
                                { color: type === t ? '#fff' : Colors.textSecondary }
                            ]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Category Section */}
                <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Category</Text>
                <View style={styles.categoryContainer}>
                    {categories.map((cat) => {
                        const IconComponent = (Icons as any)[cat.icon];
                        const isSelected = category === cat.name;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: isSelected ? cat.color : Colors.surface,
                                        borderColor: isSelected ? cat.color : Colors.border,
                                        transform: [{ scale: isSelected ? 1.05 : 1 }]
                                    }
                                ]}
                                onPress={() => setCategory(cat.name)}
                            >
                                {IconComponent && (
                                    <IconComponent
                                        size={18}
                                        color={isSelected ? '#fff' : cat.color}
                                    />
                                )}
                                <Text style={[
                                    styles.categoryText,
                                    { color: isSelected ? '#fff' : Colors.text }
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Details Card */}
                <View style={[styles.card, { backgroundColor: Colors.surface }]}>
                    {/* Date */}
                    <View style={styles.cardRow}>
                        <View style={styles.cardIcon}>
                            <Calendar size={20} color={Colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardLabel, { color: Colors.textSecondary }]}>Date</Text>
                            {Platform.OS === 'web' ? (
                                <input
                                    type="date"
                                    value={date.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        const newDate = new Date(e.target.value);
                                        if (!isNaN(newDate.getTime())) setDate(newDate);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: Colors.text,
                                        fontSize: 16,
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        width: '100%',
                                        padding: 0,
                                    }}
                                />
                            ) : (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                    <Text style={[styles.cardValue, { color: Colors.text }]}>
                                        {format(date, 'MMMM d, yyyy')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {Platform.OS !== 'web' && showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onChangeDate}
                                themeVariant={Colors.background === '#FFFFFF' ? 'light' : 'dark'}
                            />
                        )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    {/* Description */}
                    <View style={styles.cardRow}>
                        <View style={styles.cardIcon}>
                            <Icons.FileText size={20} color={Colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Add a note..."
                                placeholderTextColor={Colors.textSecondary}
                                style={[
                                    styles.plainInput,
                                    {
                                        color: Colors.text,
                                        height: 48,
                                        width: '100%',
                                        textAlignVertical: 'center'
                                    }
                                ]}
                            />
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    {/* Receipt */}
                    <View style={[styles.cardRow, { alignItems: 'flex-start', paddingTop: 16 }]}>
                        <View style={[styles.cardIcon, { marginTop: 2 }]}>
                            <ImageIcon size={20} color={Colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardLabel, { color: Colors.textSecondary, marginBottom: 8 }]}>Receipt</Text>
                            {receiptImage ? (
                                <View style={styles.previewWrapper}>
                                    <TouchableOpacity onPress={() => setShowImageViewer(true)}>
                                        <Image source={{ uri: receiptImage }} style={styles.miniPreview} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.removeReceipt}
                                        onPress={() => Alert.alert('Remove', 'Delete receipt?', [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete', style: 'destructive', onPress: () => setReceiptImage(null) }
                                        ])}
                                    >
                                        <X size={12} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.receiptActions}>
                                    <TouchableOpacity style={[styles.actionChip, { backgroundColor: Colors.background }]} onPress={pickImage}>
                                        <ImageIcon size={14} color={Colors.text} />
                                        <Text style={[styles.actionChipText, { color: Colors.text }]}>Gallery</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionChip, { backgroundColor: Colors.background }]} onPress={takePhoto}>
                                        <Camera size={14} color={Colors.text} />
                                        <Text style={[styles.actionChipText, { color: Colors.text }]}>Camera</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Extras Section */}
                {type === 'expense' && (
                    <View style={{ marginTop: 24 }}>
                        <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>Options</Text>

                        {/* Repeat */}
                        <View style={[styles.optionRow, { backgroundColor: Colors.surface }]}>
                            <View style={styles.optionLeft}>
                                <RotateCw size={20} color={Colors.primary} />
                                <Text style={[styles.optionText, { color: Colors.text }]}>Repeat Monthly</Text>
                            </View>
                            <Switch
                                value={isRecurring}
                                onValueChange={setIsRecurring}
                                trackColor={{ false: Colors.border, true: Colors.primary }}
                            />
                        </View>

                        {/* Split/Debt Options */}
                        <View style={[styles.optionBlock, { backgroundColor: Colors.surface, marginTop: 12 }]}>
                            {/* Friend Paid */}
                            <View style={styles.optionRowNoBg}>
                                <View style={styles.optionLeft}>
                                    <Icons.Users size={20} color={Colors.danger} />
                                    <View>
                                        <Text style={[styles.optionText, { color: Colors.text }]}>Paid by Friend</Text>
                                        <Text style={[styles.optionSub, { color: Colors.textSecondary }]}>You owe them</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isFriendPayment}
                                    onValueChange={(val) => {
                                        setIsFriendPayment(val);
                                        if (val) setIsLent(false);
                                    }}
                                    trackColor={{ false: Colors.border, true: Colors.danger }}
                                />
                            </View>
                            {isFriendPayment && (
                                <Input
                                    placeholder="Friend's Name"
                                    value={paidBy}
                                    onChangeText={setPaidBy}
                                    style={{
                                        marginTop: 8,
                                        backgroundColor: Colors.background,
                                        borderWidth: 0
                                    }}
                                />
                            )}

                            <View style={[styles.divider, { backgroundColor: Colors.border, marginVertical: 12 }]} />

                            {/* Lent To */}
                            <View style={styles.optionRowNoBg}>
                                <View style={styles.optionLeft}>
                                    <Icons.HandCoins size={20} color={Colors.success} />
                                    <View>
                                        <Text style={[styles.optionText, { color: Colors.text }]}>Lent to Friend</Text>
                                        <Text style={[styles.optionSub, { color: Colors.textSecondary }]}>They owe you</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isLent}
                                    onValueChange={(val) => {
                                        setIsLent(val);
                                        if (val) setIsFriendPayment(false);
                                    }}
                                    trackColor={{ false: Colors.border, true: Colors.success }}
                                />
                            </View>
                            {isLent && (
                                <Input
                                    placeholder="Friend's Name"
                                    value={lentTo}
                                    onChangeText={setLentTo}
                                    style={{
                                        marginTop: 8,
                                        backgroundColor: Colors.background,
                                        borderWidth: 0
                                    }}
                                />
                            )}
                        </View>
                    </View>
                )}

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: Colors.background, borderTopColor: Colors.border }]}>
                {isEditing && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Trash2 size={20} color={Colors.danger} />
                    </TouchableOpacity>
                )}
                <Button
                    title={isEditing ? "Update Transaction" : "Save Transaction"}
                    onPress={handleSave}
                    style={{ flex: 1 }}
                    textStyle={{ fontSize: 16, fontWeight: 'bold' }}
                />
            </View>

            <ImageEditor
                visible={showImageEditor}
                imageUri={receiptImage}
                onSave={(editedUri) => {
                    setReceiptImage(editedUri);
                    setShowImageEditor(false);
                }}
                onCancel={() => setShowImageEditor(false)}
            />

            <ImageViewer
                visible={showImageViewer}
                imageUri={receiptImage}
                onClose={() => setShowImageViewer(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 30,
        height: 80, // Fixed height for the container
    },
    amountDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 36, // Slightly smaller than numbers
        fontWeight: '600',
        marginRight: 4,
    },
    heroText: {
        fontSize: 56,
        fontWeight: 'bold',
    },
    hiddenInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0, // Invisible but clickable
    },
    cursor: {
        width: 3,
        height: 50,
        borderRadius: 2,
        marginLeft: 4,
        opacity: 0.8,
    },
    segmentContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
        marginBottom: 30,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 30,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        gap: 8,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
    },
    card: {
        borderRadius: 20,
        padding: 6,
        marginBottom: 20,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 16,
    },
    cardIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginLeft: 64,
    },
    plainInput: {
        fontSize: 16,
        padding: 0,
    },
    previewWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
    },
    miniPreview: {
        width: '100%',
        height: '100%',
    },
    removeReceipt: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 4,
    },
    receiptActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    actionChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    optionBlock: {
        borderRadius: 16,
        padding: 8,
    },
    optionRowNoBg: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    optionSub: {
        fontSize: 12,
        marginTop: 2,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: 12,
    },
    deleteButton: {
        width: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
    },
    // Keep legacy styles just in case or for image editor
    dateButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
    dateText: { fontSize: 16 },
    receiptContainer: { marginBottom: 16 },
    friendPaymentContainer: { marginBottom: 16 },
    friendPaymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    friendPaymentLabel: { fontSize: 15, fontWeight: '600' },
    imageButtonsContainer: { flexDirection: 'row', gap: 12 },
    imageButton: { width: '100%', flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
    imageButtonText: { fontSize: 15, fontWeight: '500' },
    imagePreviewContainer: { position: 'relative', borderRadius: 16, overflow: 'hidden', height: 220 },
    receiptImage: { width: '100%', height: '100%' },
    imageActionsContainer: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 10 },
    imageActionButton: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 24 },
});
