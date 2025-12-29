import { CategoryPieChartWidget } from '@/components/analytics/CategoryPieChartWidget';
import { DayOfWeekWidget } from '@/components/analytics/DayOfWeekWidget';
import { FinancialHealthWidget } from '@/components/analytics/FinancialHealthWidget';
import { FinancialKPIsWidget } from '@/components/analytics/FinancialKPIsWidget';
import { MonthComparisonWidget } from '@/components/analytics/MonthComparisonWidget';
import { QuickInsightsWidget } from '@/components/analytics/QuickInsightsWidget';
import { SpendingTrendsWidget } from '@/components/analytics/SpendingTrendsWidget';
import { TopCategoriesWidget } from '@/components/analytics/TopCategoriesWidget';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { generateHTML } from '@/lib/pdf_html_generator';
import { useExpense } from '@/store/expenseStore';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Download } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {

    const Styles = useStyles();
    const Colors = useThemeColor();
    const [refreshing, setRefreshing] = useState(false);
    const { transactions, categories, currencySymbol, budget, income } = useExpense();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const handleExportPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const html = generateHTML({
                transactions,
                categories,
                currencySymbol,
                budget,
                income,
                userName: 'Valued User'
            });

            // 1. Generate PDF
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            // 2. Prepare Target File Name
            const timestamp = format(new Date(), 'MMM_yyyy');
            const cleanTimestamp = timestamp.replace(/[^a-z0-9]/gi, '_'); // Sanitize just in case
            const fileName = `Xpense_Report_${cleanTimestamp}.pdf`;

            try {
                // 3. Selection of Directory
                // Attempt to use documentDirectory (persistent), fallback to cacheDirectory
                const fsAny = FileSystem as any;
                const docDir = fsAny.documentDirectory;
                const cacheDir = fsAny.cacheDirectory;

                const targetDir = docDir || cacheDir;

                if (!targetDir) {
                    throw new Error('No writable directory (doc or cache) available on device.');
                }

                // Ensure trailing slash
                const finalDir = targetDir.endsWith('/') ? targetDir : targetDir + '/';
                const newUri = finalDir + fileName;

                // 4. Cleanup Existing (if any)
                const fileInfo = await FileSystem.getInfoAsync(newUri);
                if (fileInfo.exists) {
                    try {
                        await FileSystem.deleteAsync(newUri, { idempotent: true });
                    } catch (delErr: any) {
                        // Log but continue - maybe we can overwrite
                        console.warn('Delete failed', delErr);
                    }
                }

                // 5. Copy Operation
                // We use copyAsync as it is generally safer across partitions than moveAsync
                await FileSystem.copyAsync({
                    from: uri,
                    to: newUri
                });

                // 6. Share
                await Sharing.shareAsync(newUri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ${fileName}`
                });

            } catch {
                // Fallback: Share original raw file so user gets data at least
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Financial Report (Fallback)'
                });
            }

        } catch (error: any) {
            Alert.alert('Generation Error', `Print Logic Failed: ${error.message}`);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <SafeAreaView style={Styles.container}>
            <View style={[Styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }]}>
                <View>
                    <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 28, letterSpacing: -1 }]}>Analytics</Text>
                    <Text style={{ fontFamily: 'Geist-Medium', fontSize: 14, color: Colors.textSecondary, marginTop: -2 }}>
                        {format(new Date(), 'MMMM yyyy')}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>


                    <TouchableOpacity
                        style={[styles.exportButton, { backgroundColor: Colors.surfaceHighlight, borderColor: Colors.border }]}
                        onPress={handleExportPDF}
                        disabled={isGeneratingPdf}
                        activeOpacity={0.7}
                    >
                        {isGeneratingPdf ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Download size={22} color={Colors.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Financial Health Score */}
                <FinancialHealthWidget />

                {/* Quick Insights */}
                <QuickInsightsWidget />

                {/* Financial KPIs */}
                <FinancialKPIsWidget />

                {/* Month Comparison */}
                <MonthComparisonWidget />

                {/* Spending Trends */}
                <SpendingTrendsWidget />

                {/* Day of Week */}
                <DayOfWeekWidget />

                {/* Category Pie Chart */}
                <CategoryPieChartWidget />

                {/* Top Categories */}
                <TopCategoriesWidget />

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    exportButton: {
        padding: 10,
        borderRadius: 16,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        // Generic Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});
