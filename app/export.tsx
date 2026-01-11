import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    Code,
    Download as DownloadIcon,
    FileText,
    Info
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useAlert } from '@/context/AlertContext';
import { useTheme } from '@/context/ThemeContext';
import { useExpense } from '@/store/expenseStore';

export default function ExportScreen() {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { transactions } = useExpense();
    const { showAlert } = useAlert();
    const isDark = colorScheme === 'dark';
    const themeColors = isDark ? Colors.dark : Colors.light;

    const [exportStartMonth, setExportStartMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setExportStartMonth(format(selectedDate, 'yyyy-MM'));
        }
    };

    const handleExport = async (formatType: 'csv' | 'json' | 'pdf') => {
        try {
            // Filter transactions (same logic as before: date range + no trash)
            const filteredTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                const startMonthDate = new Date(exportStartMonth + '-01');
                return tDate >= startMonthDate && !t.deletedAt;
            });

            if (filteredTransactions.length === 0) {
                showAlert('No Data', 'There are no transactions in the selected date range.');
                return;
            }

            let fileUri = '';
            const fileName = `expense_tracker_export_${exportStartMonth}_${format(new Date(), 'yyyyMMdd')}`;

            if (formatType === 'pdf') {
                const html = `
                    <html>
                        <head>
                            <style>
                                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
                                h1 { text-align: center; color: #333; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f2f2f2; font-weight: bold; }
                                tr:nth-child(even) { background-color: #f9f9f9; }
                                .amount-income { color: #4ADE80; }
                                .amount-expense { color: #F87171; }
                            </style>
                        </head>
                        <body>
                            <h1>Transaction Report</h1>
                            <p>From: ${format(new Date(exportStartMonth + '-01'), 'MMMM yyyy')}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredTransactions.map(t => `
                                        <tr>
                                            <td>${format(new Date(t.date), 'yyyy-MM-dd')}</td>
                                            <td>${t.description}</td>
                                            <td>${t.category}</td>
                                            <td>${t.type}</td>
                                            <td class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                                                $${parseFloat(t.amount.toString()).toFixed(2)}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </body>
                    </html>
                `;

                const { uri } = await Print.printToFileAsync({ html });
                fileUri = uri;
            } else {
                let fileContent = '';
                if (formatType === 'csv') {
                    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Note'];
                    const csvRows = filteredTransactions.map(t => {
                        const dateOnly = t.date.split('T')[0];
                        return [
                            dateOnly,
                            `"${t.description.replace(/"/g, '""')}"`,
                            t.amount.toString(),
                            t.type,
                            t.category,
                            `"${(t.note || '').replace(/"/g, '""')}"`
                        ].join(',');
                    });
                    fileContent = [headers.join(','), ...csvRows].join('\n');
                } else {
                    // Format for JSON: clean up dates to YYYY-MM-DD for consistency
                    const jsonData = filteredTransactions.map(t => ({
                        ...t,
                        date: t.date.split('T')[0]
                    }));
                    fileContent = JSON.stringify(jsonData, null, 2);
                }

                if (Platform.OS === 'web') {
                    const blob = new Blob([fileContent], { type: formatType === 'csv' ? 'text/csv' : 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${fileName}.${formatType}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    return; // Web export handled
                }

                // Native file writing for CSV/JSON
                fileUri = `${(FileSystem as any).documentDirectory}${fileName}.${formatType}`;
                await (FileSystem as any).writeAsStringAsync(fileUri, fileContent, {
                    encoding: 'utf8',
                });
            }

            // Sharing / Saving (Common for PDF, CSV, JSON on native)
            if (Platform.OS !== 'web') {
                // For PDF, printToFileAsync gives a tmp uri.
                // For CSV/JSON, we wrote to documentDirectory.

                // If PDF, we might want to rename it for the user when using SAF or Sharing?
                // Current Sharing.shareAsync usually handles the name from the path.
                // For SAF, we need to read the file and write it to the new uri, or just use `copyAsync` if possible.
                // But `writeAsStringAsync` with `SAF` logic below expects content string.

                // Let's adapt the SAF block to handle binary/uri copy if it's PDF, 
                // BUT `writeAsStringAsync` is what we used before.

                try {
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri, {
                            mimeType: formatType === 'pdf' ? 'application/pdf' : (formatType === 'csv' ? 'text/csv' : 'application/json'),
                            UTI: formatType === 'pdf' ? 'com.adobe.pdf' : (formatType === 'csv' ? 'public.comma-separated-values-text' : 'public.json'),
                            dialogTitle: `Export ${formatType.toUpperCase()}`
                        });
                    } else {
                        showAlert('Error', 'Sharing is not available on this device.');
                    }
                } catch (shareError) {
                    // Fallback or specific handling
                    console.log("Share error", shareError);

                    // SAF Logic Reuse or Custom for PDF?
                    // The previous SAF logic read 'fileContent' var which isn't populated for PDF here in my new flow for PDF.
                    // I should normalize.

                    if (Platform.OS === 'android') {
                        try {
                            const permissions = await (FileSystem as any).StorageAccessFramework.requestDirectoryPermissionsAsync();
                            if (permissions.granted) {
                                const newFileUri = await (FileSystem as any).StorageAccessFramework.createFileAsync(
                                    permissions.directoryUri,
                                    fileName,
                                    formatType === 'pdf' ? 'application/pdf' : (formatType === 'csv' ? 'text/csv' : 'application/json')
                                );

                                // For PDF, we have a file at fileUri. We need to read it as base64 and write it? 
                                // Or read as string? PDF is binary.
                                const content = await (FileSystem as any).readAsStringAsync(fileUri, { encoding: (FileSystem as any).EncodingType.Base64 });
                                await (FileSystem as any).writeAsStringAsync(newFileUri, content, { encoding: (FileSystem as any).EncodingType.Base64 });

                                showAlert('Success', 'File exported successfully to selected folder.');
                                return;
                            }
                        } catch (safError) {
                            console.error('SAF Error:', safError);
                            throw safError;
                        }
                    }
                    throw shareError;
                }
            }
        } catch (error: any) {
            console.error('Export error details:', JSON.stringify(error, null, 2));
            const msg = error?.message || String(error);
            showAlert('Export Failed', `Error: ${msg.slice(0, 100)}`);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: themeColors.surface }]}
                >
                    <ChevronLeft size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Export Data</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Date Selection */}
                <View style={[styles.section, { backgroundColor: isDark ? Colors.dark.surface : '#FFF', borderColor: isDark ? Colors.dark.border : '#EEE' }]}>
                    <View style={styles.sectionHeader}>
                        <Calendar size={20} color={themeColors.primary} />
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Time Range</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={[styles.datePickerTrigger, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                    >
                        <View>
                            <Text style={[styles.dateLabel, { color: isDark ? '#9A9A9A' : '#666' }]}>Export from</Text>
                            <Text style={[styles.dateValue, { color: themeColors.text }]}>
                                {format(new Date(exportStartMonth + '-01'), 'MMMM yyyy')}
                            </Text>
                        </View>
                        <Text style={{ color: themeColors.primary, fontWeight: '600' }}>Change</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(exportStartMonth + '-01')}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                            onChange={onDateChange}
                        />
                    )}

                    <View style={styles.infoRow}>
                        <Info size={14} color={isDark ? '#9A9A9A' : '#666'} />
                        <Text style={[styles.infoText, { color: isDark ? '#9A9A9A' : '#666' }]}>
                            Transitions from this month onwards will be included.
                        </Text>
                    </View>
                </View>

                {/* Export Options */}
                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        onPress={() => handleExport('csv')}
                        style={[styles.exportCard, { backgroundColor: isDark ? Colors.dark.surface : '#FFF', borderColor: isDark ? Colors.dark.border : '#EEE' }]}
                    >
                        <View style={[styles.typeIcon, { backgroundColor: '#4ADE8020' }]}>
                            <FileText size={24} color="#4ADE80" />
                        </View>
                        <View style={styles.exportInfo}>
                            <Text style={[styles.exportTitle, { color: themeColors.text }]}>CSV Format</Text>
                            <Text style={[styles.exportDesc, { color: isDark ? '#9A9A9A' : '#666' }]}>Best for Excel and Sheets</Text>
                        </View>
                        <DownloadIcon size={20} color={isDark ? '#444' : '#CCC'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleExport('json')}
                        style={[styles.exportCard, { backgroundColor: isDark ? Colors.dark.surface : '#FFF', borderColor: isDark ? Colors.dark.border : '#EEE' }]}
                    >
                        <View style={[styles.typeIcon, { backgroundColor: '#60A5FA20' }]}>
                            <Code size={24} color="#60A5FA" />
                        </View>
                        <View style={styles.exportInfo}>
                            <Text style={[styles.exportTitle, { color: themeColors.text }]}>JSON Format</Text>
                            <Text style={[styles.exportDesc, { color: isDark ? '#9A9A9A' : '#666' }]}>Best for developers and backups</Text>
                        </View>
                        <DownloadIcon size={20} color={isDark ? '#444' : '#CCC'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleExport('pdf')}
                        style={[styles.exportCard, { backgroundColor: isDark ? Colors.dark.surface : '#FFF', borderColor: isDark ? Colors.dark.border : '#EEE' }]}
                    >
                        <View style={[styles.typeIcon, { backgroundColor: '#F8717120' }]}>
                            <FileText size={24} color="#F87171" />
                        </View>
                        <View style={styles.exportInfo}>
                            <Text style={[styles.exportTitle, { color: themeColors.text }]}>PDF Format</Text>
                            <Text style={[styles.exportDesc, { color: isDark ? '#9A9A9A' : '#666' }]}>Best for printing and sharing</Text>
                        </View>
                        <DownloadIcon size={20} color={isDark ? '#444' : '#CCC'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <CheckCircle2 size={16} color="#4ADE80" />
                    <Text style={[styles.footerText, { color: isDark ? '#9A9A9A' : '#666' }]}>
                        No trash data will be included in exports.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Geist-Bold',
    },
    scrollContent: {
        padding: 20,
    },
    introContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Geist-Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    introText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Geist-Regular',
        paddingHorizontal: 20,
    },
    section: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Geist-SemiBold',
    },
    datePickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    dateLabel: {
        fontSize: 12,
        fontFamily: 'Geist-Regular',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 17,
        fontWeight: 'bold',
        fontFamily: 'Geist-Bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
    },
    infoText: {
        fontSize: 12,
        fontFamily: 'Geist-Regular',
    },
    optionsContainer: {
        gap: 16,
    },
    exportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    typeIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    exportInfo: {
        flex: 1,
    },
    exportTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Geist-Bold',
        marginBottom: 2,
    },
    exportDesc: {
        fontSize: 13,
        fontFamily: 'Geist-Regular',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        gap: 8,
    },
    footerText: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    }
});
