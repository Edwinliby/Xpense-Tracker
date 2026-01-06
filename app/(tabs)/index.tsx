import { AchievementUnlockModal } from '@/components/AchievementUnlockModal';
import { BudgetWidget } from '@/components/BudgetWidget';
import { DebtCreditCard } from '@/components/DebtCreditCard';
import { ExpenseCard } from '@/components/ExpenseCard';
import { HomeChart } from '@/components/HomeChart';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { differenceInMonths, endOfMonth, format, getDaysInMonth, isWithinInterval, parseISO, startOfMonth, subMonths } from 'date-fns';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Search, Wallet } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const Styles = useStyles();
  const Colors = useThemeColor();
  const { transactions, budget, income, incomeStartDate, editTransaction, deleteTransaction, currencySymbol, newlyUnlockedAchievement, clearNewlyUnlockedAchievement } = useExpense();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const now = useMemo(() => new Date(), []);

  // Determine the start date for the monthly view history
  const historyStartDate = useMemo(() => {
    let dates = transactions.map(t => new Date(t.date).getTime());
    if (incomeStartDate) {
      dates.push(parseISO(incomeStartDate).getTime());
    }

    if (dates.length > 0) {
      return new Date(Math.min(...dates));
    }

    // Default to 2 months ago if no data
    return subMonths(now, 2);
  }, [incomeStartDate, transactions, now]);

  // Calculate total months to display (from history start to now)
  const numberOfMonths = useMemo(() => {
    // We must compare start-of-months to ensure we don't undercount if historyStart is late in month (e.g. 30th) vs now (1st)
    const months = differenceInMonths(startOfMonth(now), startOfMonth(historyStartDate));
    return Math.max(months, 2); // Ensure at least 3 months (0 to 2) are shown
  }, [now, historyStartDate]);

  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // Initialize to the last index (current month) which corresponds to numberOfMonths
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(numberOfMonths);
  const [selectedBar, setSelectedBar] = useState<{ label: string; value: number; year: number } | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Update selectedBarIndex when numberOfMonths changes (e.g. new transactions or first load)
  // Instead of blindly resetting to "now", try to preserve the currently selected month/year.
  useEffect(() => {
    if (selectedBar) {
      const currentLabel = selectedBar.label;
      const currentYear = selectedBar.year;

      const targetDate = new Date(currentYear, ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(currentLabel), 1); // rough parse

      const monthsDiff = differenceInMonths(now, targetDate);
      if (monthsDiff >= 0 && monthsDiff <= numberOfMonths) {
        const newIndex = numberOfMonths - monthsDiff;
        if (newIndex !== selectedBarIndex) {
          setSelectedBarIndex(newIndex);
        }
        return;
      }
    }


    if (!selectedBar) {
      setSelectedBarIndex(numberOfMonths);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfMonths]);

  // --- Data Helpers ---
  const getSpentInInterval = useCallback((start: Date, end: Date, options?: { includeExcluded?: boolean; excludeRecurring?: boolean }) => {
    return transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
      .filter(t => !(t.isLent && t.isPaidBack))
      .filter(t => options?.includeExcluded ? true : !t.excludeFromBudget)
      .filter(t => options?.excludeRecurring ? (!t.isRecurring && !t.recurrenceInterval) : true)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  const getIncomeInInterval = useCallback((start: Date, end: Date) => {
    return transactions
      .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end }))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  // Helper to check if a date is after income start date
  const isAfterIncomeStart = useCallback((date: Date) => {
    if (!incomeStartDate) return true;
    const [startYear, startMonth] = incomeStartDate.split('-').map(Number);
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth() + 1; // 1-indexed

    if (dateYear > startYear) return true;
    if (dateYear === startYear && dateMonth >= startMonth) return true;
    return false;
  }, [incomeStartDate]);

  const getEffectiveSpent = useCallback((start: Date, end: Date, options?: { includeExcluded?: boolean; excludeRecurring?: boolean }) => {
    return getSpentInInterval(start, end, options);
  }, [getSpentInInterval]);

  // --- Monthly Data (Dynamic History) ---
  const monthlyData = useMemo(() => {
    // Generate array [numberOfMonths, numberOfMonths-1, ..., 0]
    const subtracts = Array.from({ length: numberOfMonths + 1 }, (_, i) => numberOfMonths - i);

    return subtracts.map((subtract) => {
      const date = subMonths(now, subtract);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const value = getEffectiveSpent(monthStart, monthEnd);

      // Smart Nav: Check for ANY activity (Expense OR Income), INCLUDING excluded ones.
      const totalSpentIncExcluded = getEffectiveSpent(monthStart, monthEnd, { includeExcluded: true });
      const incomeVal = getIncomeInInterval(monthStart, monthEnd);
      const hasActivity = totalSpentIncExcluded > 0 || incomeVal > 0;

      return {
        value,
        label: format(monthStart, 'MMM'),
        year: monthStart.getFullYear(),
        frontColor: subtract === 0 ? Colors.primary : Colors.textSecondary,
        gradientColor: subtract === 0 ? Colors.primaryHighlight : Colors.surfaceHighlight,
        hasActivity, // Used for smart navigation
      };
    });
  }, [now, numberOfMonths, getEffectiveSpent, getIncomeInInterval, Colors.primary, Colors.textSecondary, Colors.primaryHighlight, Colors.surfaceHighlight]);

  // Sync selectedBar with selectedBarIndex
  useEffect(() => {
    if (monthlyData && monthlyData[selectedBarIndex]) {
      setSelectedBar(monthlyData[selectedBarIndex]);
    }
  }, [monthlyData, selectedBarIndex]);

  // Determine month range for recent transactions
  const monthRange = useMemo(() => {
    if (selectedBar && viewMode === 'monthly') {
      // selectedBarIndex 0 = Oldest
      // selectedBarIndex = length-1 = Current (subtract 0)
      // We need to find the subtract value.
      // subtract = numberOfMonths - selectedBarIndex
      const subtract = numberOfMonths - selectedBarIndex;
      const date = subMonths(now, subtract);
      return { start: startOfMonth(date), end: endOfMonth(date) };
    }
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [selectedBar, selectedBarIndex, now, viewMode, numberOfMonths]);

  const recentTransactions = useMemo(() => {
    return transactions.filter(t =>
      isWithinInterval(new Date(t.date), { start: monthRange.start, end: monthRange.end })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, monthRange]);

  // --- Monthly Line Chart Data ---
  const getCumulativeDailyData = useCallback((monthStart: Date) => {
    const daysInMonth = getDaysInMonth(monthStart);
    const data = [];
    let cumulativeTotal = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDayStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), i);
      const currentDayEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), i, 23, 59, 59);

      // Filter transactions for this specific day
      const dailySpent = transactions
        .filter(t =>
          t.type === 'expense' &&
          isWithinInterval(new Date(t.date), { start: currentDayStart, end: currentDayEnd })
        )
        .filter(t => !(t.isLent && t.isPaidBack))
        .filter(t => !t.excludeFromBudget)
        .reduce((acc, curr) => acc + curr.amount, 0);

      cumulativeTotal += dailySpent;

      data.push({
        value: cumulativeTotal,
        date: i.toString(),
        label: i % 5 === 0 || i === 1 ? i.toString() : '',
        dataPointText: (i % 5 === 0 || i === daysInMonth) && cumulativeTotal > 0 ? cumulativeTotal.toFixed(0) : '',
        textColor: Colors.text,
        textShiftY: -6,
        textShiftX: -4,
        textFontSize: 10,
      });
    }
    return data;
  }, [transactions, Colors.text]);

  const currentMonthLineData = useMemo(() => getCumulativeDailyData(monthRange.start), [getCumulativeDailyData, monthRange]);

  const previousMonthLineData = useMemo(() => {
    const prevMonthStart = subMonths(monthRange.start, 1);
    return getCumulativeDailyData(prevMonthStart);
  }, [getCumulativeDailyData, monthRange]);

  const maxMonthlyValue = useMemo(() => {
    return Math.max(...currentMonthLineData.map(d => d.value), ...previousMonthLineData.map(d => d.value), 100);
  }, [currentMonthLineData, previousMonthLineData]);

  // --- Yearly Data ---
  const handleYearlyPointPress = useCallback((item: any) => {
    // item.date is "MMM" string. item.year (we need to pass year) is implicit from selectedYear.
    // We need to switch to MONTHLY view and select this month.

    // 1. Construct the date object for the clicked month
    const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(item.label);
    if (monthIndex === -1) return;

    const targetDate = new Date(selectedYear, monthIndex);

    // 2. Calculate the index for this date in the monthlyData array
    // monthlyData is built from 'now' backwards. 
    // index = numberOfMonths - differenceInMonths(now, targetDate)
    const diff = differenceInMonths(now, targetDate);

    // Check if within range
    if (diff >= 0 && diff <= numberOfMonths) {
      const newIndex = numberOfMonths - diff;

      // 3. Update State
      setSelectedBarIndex(newIndex);
      setViewMode('monthly');
    } else {
      // Optional: if user clicks a month that is outside "available history" (e.g. older than oldest tx), 
      // but we showed it in yearly view (with 0 value or similar)?
      // If it has a value, it SHOULD be in history.
      // The numberOfMonths should cover all effective spent.
    }
  }, [selectedYear, now, numberOfMonths]);

  const yearlyData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));

      // Check if this month is strictly in the future relative to current month
      const isFutureMonth = monthStart > endOfMonth(now);

      // Show spending for the year in the chart
      // If strictly future month, value is 0 (don't show projections)
      const value = isFutureMonth ? 0 : getEffectiveSpent(monthStart, monthEnd);
      data.push({
        value,
        date: format(monthStart, 'MMM'),
        label: format(monthStart, 'MMM'),
        dataPointText: value > 0 ? Math.round(value).toString() : '',
        textColor: Colors.text,
        textShiftY: -6,
        textShiftX: -4,
        textFontSize: 11,
        // Interaction
        onPress: () => handleYearlyPointPress({ label: format(monthStart, 'MMM'), value }),
        // Ensure point is visible/interactable if it has value (or logic in chart component handled globally)
      });
    }
    return data;
  }, [selectedYear, getEffectiveSpent, Colors.text, now, handleYearlyPointPress]);



  const currentYearTotalSpent = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));

      // Skip future months
      if (monthStart > endOfMonth(now)) continue;

      // Show ALL spending for the year in total text
      total += getEffectiveSpent(monthStart, monthEnd, { includeExcluded: true });
    }
    return total;
  }, [selectedYear, getEffectiveSpent, now]);

  // NEW: Calculate spent ONLY for active budget months (for Budget Bar)
  const activeYearlyBudgetSpent = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));

      // Skip future months
      if (monthStart > endOfMonth(now)) continue;

      if (isAfterIncomeStart(monthStart)) {
        total += getEffectiveSpent(monthStart, monthEnd); // Excludes 'excluded' txns
      }
    }
    return total;
  }, [selectedYear, getEffectiveSpent, isAfterIncomeStart, now]);

  // NEW: Calculate total spent ONLY for active budget months (for Remaining amount)
  const activeYearlyTotalSpent = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));

      // Skip future months
      if (monthStart > endOfMonth(now)) continue;

      if (isAfterIncomeStart(monthStart)) {
        total += getEffectiveSpent(monthStart, monthEnd, { includeExcluded: true }); // Includes 'excluded' txns
      }
    }
    return total;
  }, [selectedYear, getEffectiveSpent, isAfterIncomeStart, now]);

  const maxYearlyValue = useMemo(() => {
    return Math.max(...yearlyData.map(d => d.value), 100);
  }, [yearlyData]);

  const activeMonthsCount = useMemo(() => {
    let monthsWithIncome = 12;
    if (incomeStartDate) {
      const [startYear, startMonth] = incomeStartDate.split('-').map(Number);
      const startMonthIndex = startMonth - 1;

      if (startYear > selectedYear) {
        monthsWithIncome = 0;
      } else if (startYear === selectedYear) {
        const endMonthIndex = 11;
        monthsWithIncome = Math.max(0, endMonthIndex - startMonthIndex + 1);
      }
    }
    return monthsWithIncome;
  }, [incomeStartDate, selectedYear]);

  const annualIncome = useMemo(() => {
    return income * activeMonthsCount;
  }, [income, activeMonthsCount]);

  const currentYearSaved = useMemo(() => {
    const yearlyIncomeTransactions = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' &&
          date.getFullYear() === selectedYear &&
          isAfterIncomeStart(date);
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    return (annualIncome + yearlyIncomeTransactions) - activeYearlyTotalSpent;
  }, [annualIncome, activeYearlyTotalSpent, transactions, selectedYear, isAfterIncomeStart]);

  const selectedMonthSpent = useMemo(() =>
    getEffectiveSpent(monthRange.start, monthRange.end),
    [monthRange, getEffectiveSpent]
  );

  const selectedMonthTotalSpent = useMemo(() =>
    getEffectiveSpent(monthRange.start, monthRange.end, { includeExcluded: true }),
    [monthRange, getEffectiveSpent]
  );

  const selectedMonthIncomeTransactions = useMemo(() =>
    getIncomeInInterval(monthRange.start, monthRange.end),
    [monthRange, getIncomeInInterval]
  );



  const selectedMonthSaved = useMemo(() => {
    const monthlyStaticIncome = isAfterIncomeStart(monthRange.start) ? income : 0;
    const totalIncome = monthlyStaticIncome + selectedMonthIncomeTransactions;
    return totalIncome - selectedMonthTotalSpent;
  }, [income, selectedMonthTotalSpent, isAfterIncomeStart, monthRange, selectedMonthIncomeTransactions]);

  // --- Active Data Selection ---
  const chartData = useMemo(() => viewMode === 'yearly' ? yearlyData : monthlyData, [viewMode, yearlyData, monthlyData]);

  const displaySpent = useMemo(() => viewMode === 'yearly' ? currentYearTotalSpent : selectedMonthTotalSpent, [viewMode, currentYearTotalSpent, selectedMonthTotalSpent]);



  const displaySaved = useMemo(() => viewMode === 'yearly' ? currentYearSaved : selectedMonthSaved, [viewMode, currentYearSaved, selectedMonthSaved]);

  const chartWidth = useMemo(() => {
    if (isDesktop) {
      // Container max-width: 1200px. Left column is ~66% (flex 2 vs 1).
      // PaddingHorizontal (20) + Gap (24) + Inner Padding (20*2)
      // Approx calculation: Math.min(width, 1200) * 0.6 - paddings
      const containerWidth = Math.min(width, 1200);
      const availableGridWidth = containerWidth - 40; // minus desktopGrid paddingHorizontal
      const leftColumnWidth = (availableGridWidth - 24) * (2 / 3); // minus gap, flex ratio
      return leftColumnWidth - 40; // minus card padding (20*2)
    }
    return width - 40; // Mobile default
  }, [width, isDesktop]);

  return (
    <SafeAreaView style={[Styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* --- Header Section --- */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: Colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.title, { color: Colors.text }]}>
              {budget > 0 && budget < displaySpent ? 'Lavish Spender' : 'Economical Man'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={[styles.iconButton, { backgroundColor: Colors.surfaceHighlight }]}
            >
              <Search size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={isDesktop ? styles.desktopGrid : styles.mobileStack}>
          {/* LEFT COLUMN (Desktop) / TOP (Mobile) */}
          <View style={isDesktop ? styles.leftColumn : styles.column}>

            {/* --- Summary Cards Section --- */}
            <View style={styles.summarySection}>
              <View style={[styles.summaryCard, Styles.shadow, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <View>
                    <Text style={[styles.label, { color: Colors.textSecondary }]}>Total Spent</Text>
                    <Text style={[styles.amount, { color: Colors.text }]}>{currencySymbol}{displaySpent.toLocaleString()}</Text>
                  </View>
                  {/* Remaining / Saved */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.label, { color: Colors.textSecondary }]}>Remaining</Text>
                    {(viewMode === 'monthly' || activeMonthsCount > 0) ? (
                      (income > 0 && (viewMode === 'monthly' ? isAfterIncomeStart(monthRange.start) : true)) ? (
                        <>
                          <Text style={[styles.amount, { color: displaySaved >= 0 ? Colors.success : Colors.danger }]}>
                            {displaySaved > 0 ? '+' : ''}{currencySymbol}{displaySaved.toLocaleString()}
                          </Text>
                          {viewMode === 'yearly' && (
                            <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2, opacity: 0.8 }}>
                              {activeMonthsCount} Month{activeMonthsCount !== 1 ? 's' : ''} • {currencySymbol}{(displaySaved + activeYearlyTotalSpent).toLocaleString()}
                            </Text>
                          )}
                        </>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.amount, { color: Colors.text, fontSize: 28, lineHeight: 34 }]}>∞</Text>
                          <Text style={{ color: Colors.textSecondary, fontSize: 10, marginLeft: 4, transform: [{ translateY: 4 }] }}>No Limit</Text>
                        </View>
                      )
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.amount, { color: Colors.text, fontSize: 28, lineHeight: 34 }]}>∞</Text>
                        <Text style={{ color: Colors.textSecondary, fontSize: 10, marginLeft: 4, transform: [{ translateY: 4 }] }}>No Limit</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Chart Area */}
                <View style={styles.chartWrapper}>
                  <HomeChart
                    data={viewMode === 'monthly' ? currentMonthLineData : chartData}
                    data2={viewMode === 'monthly' ? previousMonthLineData : undefined}
                    viewMode={viewMode}
                    maxValue={viewMode === 'monthly' ? maxMonthlyValue : maxYearlyValue}
                    currencySymbol={currencySymbol}
                    width={chartWidth}
                  />
                </View>
              </View>
            </View>


            {/* --- Budget Widget Section --- */}
            <BudgetWidget
              spent={viewMode === 'monthly' ? selectedMonthSpent : activeYearlyBudgetSpent}
              budget={viewMode === 'monthly'
                ? (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions))
                : (budget > 0 ? (budget * activeMonthsCount) : annualIncome)
              }
              currencySymbol={currencySymbol}
              viewMode={viewMode}
              monthsCount={activeMonthsCount}
              onPress={() => router.push('/settings')}
            />
          </View>

          {/* RIGHT COLUMN (Desktop) / BOTTOM (Mobile) */}
          <View style={isDesktop ? styles.rightColumn : styles.column}>

            {/* --- Period Selector --- */}
            {/* On Desktop, this might arguably be better in the Left Column above charts? 
                But for now let's place it top of Right Column or stick with mobile flow.
                Actually, putting it above the chart in Left Column makes more semantic sense for the chart.
                But let's stick to simple first: Right Column top. */}
            <View style={{ marginBottom: 24, marginHorizontal: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.surface,
                borderRadius: 20,
                padding: 6,
                borderWidth: 1,
                borderColor: Colors.border,
              }}>
                {/* View Mode Toggle (Left) */}
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: Colors.surfaceHighlight,
                  borderRadius: 14,
                  padding: 2
                }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: viewMode === 'monthly' ? Colors.background : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: viewMode === 'monthly' ? 0.1 : 0,
                      shadowRadius: 2,
                      borderWidth: 1,
                      borderColor: viewMode === 'monthly' ? 'rgba(0,0,0,0.05)' : 'transparent',
                    }}
                    onPress={() => setViewMode('monthly')}
                  >
                    <Text style={{
                      fontFamily: 'Geist-SemiBold',
                      fontSize: 13,
                      color: viewMode === 'monthly' ? Colors.text : Colors.textSecondary
                    }}>Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: viewMode === 'yearly' ? Colors.background : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: viewMode === 'yearly' ? 0.1 : 0,
                      shadowRadius: 2,
                      borderWidth: 1,
                      borderColor: viewMode === 'yearly' ? 'rgba(0,0,0,0.05)' : 'transparent',
                    }}
                    onPress={() => setViewMode('yearly')}
                  >
                    <Text style={{
                      fontFamily: 'Geist-SemiBold',
                      fontSize: 13,
                      color: viewMode === 'yearly' ? Colors.text : Colors.textSecondary
                    }}>Year</Text>
                  </TouchableOpacity>
                </View>

                {/* Date Navigator (Right) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 6 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (viewMode === 'yearly') {
                        setSelectedYear(prev => prev - 1);
                      } else {
                        // Smart Navigation: Go to previous ACTIVE month
                        let newIndex = selectedBarIndex - 1;
                        while (newIndex >= 0) {
                          if (monthlyData[newIndex].hasActivity || newIndex === 0) {
                            // Found active month OR reached the very beginning (always show oldest)
                            setSelectedBarIndex(newIndex);
                            break;
                          }
                          newIndex--;
                        }
                        if (newIndex < 0 && selectedBarIndex > 0) {
                          setSelectedBarIndex(0);
                        }
                      }
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: Colors.surfaceHighlight,
                    }}
                    disabled={viewMode === 'yearly' ? false : selectedBarIndex <= 0}
                  >
                    <ChevronLeft size={18} color={Colors.text} opacity={selectedBarIndex <= 0 && viewMode !== 'yearly' ? 0.3 : 1} />
                  </TouchableOpacity>

                  <View style={{ minWidth: 100, alignItems: 'center' }}>
                    <Text style={{
                      fontFamily: 'Geist-Bold',
                      fontSize: 14,
                      color: Colors.text
                    }}>
                      {viewMode === 'yearly' ? selectedYear : (selectedBar ? `${selectedBar.label} ${selectedBar.year}` : 'Current Month')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (viewMode === 'yearly') {
                        setSelectedYear(prev => prev + 1);
                      } else {
                        // Smart Navigation: Go to next ACTIVE month
                        let newIndex = selectedBarIndex + 1;
                        const maxIndex = monthlyData.length - 1;
                        while (newIndex <= maxIndex) {
                          if (monthlyData[newIndex].hasActivity || newIndex === maxIndex) {
                            // Found active month OR reached current/latest month (always show current)
                            setSelectedBarIndex(newIndex);
                            break;
                          }
                          newIndex++;
                        }
                      }
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: Colors.surfaceHighlight,
                    }}
                    disabled={viewMode === 'yearly' ? selectedYear >= new Date().getFullYear() : selectedBarIndex >= monthlyData.length - 1}
                  >
                    <ChevronRight size={18} color={Colors.text} opacity={(selectedBarIndex >= monthlyData.length - 1 && viewMode !== 'yearly') || (selectedYear >= new Date().getFullYear() && viewMode === 'yearly') ? 0.3 : 1} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* --- Owed Sections --- */}
            {(() => {
              const lentTransactions = transactions.filter(t => t.isLent && !t.isPaidBack);
              const totalLent = lentTransactions.reduce((acc, t) => acc + t.amount, 0);

              const owedTransactions = transactions.filter(t => t.isFriendPayment && !t.isPaidBack);
              const totalOwed = owedTransactions.reduce((acc, t) => acc + t.amount, 0);

              return (
                <View style={{ gap: 16, marginBottom: 24 }}>
                  {totalLent > 0 && (
                    <DebtCreditCard
                      type="owed"
                      amount={totalLent}
                      transactions={lentTransactions}
                      onSettle={(id) => deleteTransaction(id)}
                      currencySymbol={currencySymbol}
                    />
                  )}
                  {totalOwed > 0 && (
                    <DebtCreditCard
                      type="debt"
                      amount={totalOwed}
                      transactions={owedTransactions}
                      onSettle={(id) => editTransaction(id, { isPaidBack: true })}
                      currencySymbol={currencySymbol}
                    />
                  )}
                </View>
              );
            })()}

            {/* --- Recent Transactions --- */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: Colors.text }]}>Recent Activity</Text>
                {recentTransactions.length > 5 && (
                  <TouchableOpacity onPress={() => setShowAllTransactions(!showAllTransactions)}>
                    <Text style={[styles.seeAll, { color: Colors.primary }]}>{showAllTransactions ? 'Show Less' : 'See All'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.transactionsList}>
                {(() => {
                  const groupedTransactions = recentTransactions.slice(0, showAllTransactions ? undefined : 5).reduce((groups, t) => {
                    const date = new Date(t.date);
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    let key = format(date, 'MMMM d, yyyy');
                    if (date.toDateString() === today.toDateString()) {
                      key = 'Today';
                    } else if (date.toDateString() === yesterday.toDateString()) {
                      key = 'Yesterday';
                    }

                    if (!groups[key]) {
                      groups[key] = [];
                    }
                    groups[key].push(t);
                    return groups;
                  }, {} as Record<string, typeof recentTransactions>);

                  return Object.entries(groupedTransactions).map(([date, txs]) => (
                    <View key={date} style={{ marginBottom: 24 }}>
                      <Text style={{
                        fontSize: 12,
                        fontFamily: 'Geist-SemiBold',
                        color: Colors.textSecondary,
                        marginBottom: 12,
                        marginLeft: 20,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        opacity: 0.7
                      }}>
                        {date}
                      </Text>
                      {txs.map(t => (
                        <ExpenseCard key={t.id} transaction={t} />
                      ))}
                    </View>
                  ));
                })()}
                {recentTransactions.length === 0 && (
                  <View style={[styles.emptyState, { backgroundColor: Colors.surface, marginHorizontal: 20 }]}>
                    <View style={[styles.emptyIcon, { backgroundColor: Colors.surfaceHighlight }]}>
                      <Wallet size={24} color={Colors.textSecondary} />
                    </View>
                    <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>No transactions in this period</Text>
                  </View>
                )}
              </View>
            </View>

          </View>
        </View>

      </ScrollView>

      <AchievementUnlockModal
        visible={!!newlyUnlockedAchievement}
        achievement={newlyUnlockedAchievement}
        onClose={clearNewlyUnlockedAchievement}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  desktopGrid: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  mobileStack: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 2,
    gap: 0,
  },
  rightColumn: {
    flex: 1,
    gap: 0,
  },
  column: {
    width: '100%',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    marginBottom: 2,
    marginTop: 4,
    fontFamily: 'Geist-Regular',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    letterSpacing: -0.5,
  },
  pillContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  pillButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pillText: {
    fontFamily: 'Geist-Medium',
    fontSize: 12,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    marginBottom: 4,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    letterSpacing: -0.5,
  },
  chartWrapper: {
    marginTop: 10,
    marginLeft: -10,
    alignItems: 'center'
  },
  budgetPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontFamily: 'Geist-SemiBold',
    fontSize: 14,
    marginBottom: 2
  },
  placeholderText: {
    fontFamily: 'Geist-Regular',
    fontSize: 12,
  },
  budgetCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center'
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    opacity: 0.8
  },
  budgetTotal: {
    fontSize: 14,
    fontFamily: 'Geist-Bold',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center'
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 30,
  },
  chevronBtn: {
    padding: 12,
    borderRadius: 14,
  },
  periodText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Geist-Bold',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Geist-SemiBold',
  },
  transactionsList: {
    gap: 4,
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  budgetContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetRemaining: {
    fontSize: 12,
    fontFamily: 'Geist-SemiBold',
    marginTop: 8,
    textAlign: 'right',
  },
  bottomSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  miniChevronButton: {
    padding: 4,
    borderRadius: 12,
  },
  miniDisplay: {
    paddingHorizontal: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  miniDisplayText: {
    fontSize: 12,
    fontFamily: 'Geist-SemiBold',
  },
  totalOwedCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
  },
  totalOwedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalOwedLabel: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
    color: 'rgba(255,255,255,0.9)',
  },
  totalOwedValue: {
    fontSize: 24,
    fontFamily: 'Geist-Black',
    color: '#FFF',
    marginTop: 4
  },
  owedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  owedBadgeText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Geist-Bold',
  },
  friendCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 1,
  },
  friendCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    marginBottom: 2,
  },
  friendDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendDescription: {
    fontSize: 12,
  },
  friendRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  friendAmount: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    marginBottom: 6,
  },
  payBackButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  payBackText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Geist-Bold',
  },
});
