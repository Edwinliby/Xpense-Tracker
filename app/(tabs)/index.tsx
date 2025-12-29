import { AchievementUnlockModal } from '@/components/AchievementUnlockModal';
import { DebtCreditCard } from '@/components/DebtCreditCard';
import { ExpenseCard } from '@/components/ExpenseCard';
import { HomeChart } from '@/components/HomeChart';
import { ProgressBar } from '@/components/ProgressBar';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { differenceInMonths, endOfMonth, format, getDaysInMonth, isWithinInterval, parseISO, startOfMonth, subMonths } from 'date-fns';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Search, Wallet } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function DashboardScreen() {
  const Styles = useStyles();
  const Colors = useThemeColor();
  const { transactions, budget, income, incomeStartDate, editTransaction, deleteTransaction, currencySymbol, newlyUnlockedAchievement, clearNewlyUnlockedAchievement } = useExpense();

  const now = useMemo(() => new Date(), []);

  // Determine the start date for the monthly view history
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
    const months = differenceInMonths(now, historyStartDate);
    return Math.max(months, 2); // Ensure at least 3 months (0 to 2) are shown
  }, [now, historyStartDate]);

  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // Initialize to the last index (current month) which corresponds to numberOfMonths
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(numberOfMonths);
  const [selectedBar, setSelectedBar] = useState<{ label: string; value: number; year: number } | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Update selectedBarIndex when numberOfMonths changes (e.g. new transactions or first load)
  // taking care not to reset user selection if they are browsing, unless it's out of bounds?
  // For now, simpler to snap to latest if the range expands significantly or on mount.
  // Using a ref to track if it's the first load could help, but simply syncing to end if unset or creating a new default is okay.
  useEffect(() => {
    // If the current index is out of sync (e.g. range grew), we might want to keep the "relative" month or reset to now.
    // Let's reset to "now" (end of array) to ensure they see the current month by default.
    setSelectedBarIndex(numberOfMonths);
  }, [numberOfMonths]);



  // --- Data Helpers ---
  const getSpentInInterval = useCallback((start: Date, end: Date, options?: { includeExcluded?: boolean }) => {
    return transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
      .filter(t => !(t.isLent && t.isPaidBack))
      .filter(t => options?.includeExcluded ? true : !t.excludeFromBudget)
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

  const getEffectiveSpent = useCallback((start: Date, end: Date, options?: { includeExcluded?: boolean }) => {
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
      return {
        value,
        label: format(monthStart, 'MMM'),
        year: monthStart.getFullYear(),
        frontColor: subtract === 0 ? Colors.primary : Colors.textSecondary,
        gradientColor: subtract === 0 ? Colors.primaryHighlight : Colors.surfaceHighlight,
      };
    });
  }, [now, numberOfMonths, getEffectiveSpent, Colors.primary, Colors.textSecondary, Colors.primaryHighlight, Colors.surfaceHighlight]);

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
  const yearlyData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));
      // Show ALL spending for the year in the chart
      const value = getEffectiveSpent(monthStart, monthEnd);
      data.push({
        value,
        date: format(monthStart, 'MMM'),
        label: format(monthStart, 'MMM'),
        dataPointText: value > 0 ? Math.round(value).toString() : '',
        textColor: Colors.text,
        textShiftY: -6,
        textShiftX: -4,
        textFontSize: 11,
      });
    }
    return data;
  }, [selectedYear, getEffectiveSpent, Colors.text]);



  const currentYearTotalSpent = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));

      // Show ALL spending for the year in total text
      total += getEffectiveSpent(monthStart, monthEnd, { includeExcluded: true });
    }
    return total;
  }, [selectedYear, getEffectiveSpent]);

  // NEW: Calculate spent ONLY for active budget months (for Budget Bar)
  const activeYearlyBudgetSpent = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));
      if (isAfterIncomeStart(monthStart)) {
        total += getEffectiveSpent(monthStart, monthEnd); // Excludes 'excluded' txns
      }
    }
    return total;
  }, [selectedYear, getEffectiveSpent, isAfterIncomeStart]);

  // NEW: Calculate total spent ONLY for active budget months (for Remaining amount)
  const activeYearlyTotalSpent = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(selectedYear, i, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, i, 1));
      if (isAfterIncomeStart(monthStart)) {
        total += getEffectiveSpent(monthStart, monthEnd, { includeExcluded: true }); // Includes 'excluded' txns
      }
    }
    return total;
  }, [selectedYear, getEffectiveSpent, isAfterIncomeStart]);

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
            <View style={[styles.pillContainer, { backgroundColor: Colors.surfaceHighlight }]}>
              <TouchableOpacity
                style={[styles.pillButton, viewMode === 'monthly' && { backgroundColor: Colors.primary }]}
                onPress={() => setViewMode('monthly')}
              >
                <Text style={[styles.pillText, { color: viewMode === 'monthly' ? '#FFF' : Colors.textSecondary }]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillButton, viewMode === 'yearly' && { backgroundColor: Colors.primary }]}
                onPress={() => setViewMode('yearly')}
              >
                <Text style={[styles.pillText, { color: viewMode === 'yearly' ? '#FFF' : Colors.textSecondary }]}>Year</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/search')}
              style={[styles.iconButton, { backgroundColor: Colors.surfaceHighlight }]}
            >
              <Search size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

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
              />
            </View>
          </View>
        </View>


        {/* --- Budget Progress Section --- */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          {(!incomeStartDate || (viewMode === 'monthly' && !isAfterIncomeStart(monthRange.start)) || (viewMode === 'yearly' && activeMonthsCount === 0)) && budget === 0 ? (
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[styles.budgetPlaceholder, { backgroundColor: Colors.surfaceHighlight }]}
            >
              <View style={[styles.placeholderIcon, { backgroundColor: Colors.surface }]}>
                <Wallet size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.placeholderTitle, { color: Colors.text }]}>Start Tracking Savings</Text>
                <Text style={[styles.placeholderText, { color: Colors.textSecondary }]}>Set a budget or income start date to unlock.</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.budgetCard, {
              backgroundColor: 'rgba(52, 199, 89, 0.08)',
              borderColor: 'rgba(52, 199, 89, 0.2)',
            }]}>
              <View style={styles.budgetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(52, 199, 89, 0.15)' }}>
                    <Wallet size={14} color={Colors.text} />
                  </View>
                  <Text style={[styles.budgetLabel, { color: Colors.textSecondary }]}>
                    {viewMode === 'monthly' ? (budget > 0 ? 'Monthly Budget' : 'Net Income') : (budget > 0 ? `Yearly Budget (${activeMonthsCount}mo)` : 'Yearly Income')}
                  </Text>
                </View>
                <Text style={[styles.budgetTotal, { color: Colors.text }]}>
                  {currencySymbol}
                  {viewMode === 'monthly'
                    ? (budget > 0 ? budget.toLocaleString() : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions).toLocaleString())
                    : (budget > 0 ? (budget * activeMonthsCount).toLocaleString() : annualIncome.toLocaleString())
                  }
                </Text>
              </View>

              <ProgressBar
                progress={
                  viewMode === 'monthly'
                    ? (budget > 0 ? Math.min(selectedMonthSpent / budget, 1) : Math.min(selectedMonthSpent / ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions || 1), 1))
                    : Math.min(activeYearlyBudgetSpent / (budget > 0 ? (budget * activeMonthsCount) : (annualIncome || 1)), 1)
                }
                gradientColors={(viewMode === 'monthly' ? (budget > 0 ? selectedMonthSpent > budget : selectedMonthSpent > ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions)) : (budget > 0 ? activeYearlyBudgetSpent > (budget * activeMonthsCount) : activeYearlyBudgetSpent > annualIncome)) ? [Colors.danger, '#FF6B6B'] : [Colors.success, '#34c759']}
                height={8}
                style={{ borderRadius: 4 }}
              />

              <View style={styles.budgetFooter}>
                <Text style={{ color: Colors.textSecondary, fontSize: 11, fontFamily: 'Geist-Medium' }}>
                  {Math.round((
                    viewMode === 'monthly'
                      ? (selectedMonthSpent / (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions || 1))) * 100
                      : (activeYearlyBudgetSpent / (budget > 0 ? (budget * activeMonthsCount) : (annualIncome || 1))) * 100
                  ))}% used
                </Text>

                {((viewMode === 'monthly' && selectedMonthSpent > (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions))) ||
                  (viewMode === 'yearly' && activeYearlyBudgetSpent > (budget > 0 ? (budget * activeMonthsCount) : annualIncome))) ? (
                  <Text style={{ color: Colors.danger, fontSize: 11, fontFamily: 'Geist-SemiBold' }}>
                    Over by {currencySymbol}
                    {(viewMode === 'monthly'
                      ? selectedMonthSpent - (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions))
                      : activeYearlyBudgetSpent - (budget > 0 ? (budget * activeMonthsCount) : annualIncome)
                    ).toFixed(0)}
                  </Text>
                ) : (
                  <Text style={{ color: Colors.text, fontSize: 11, fontFamily: 'Geist-SemiBold' }}>
                    {currencySymbol}
                    {(viewMode === 'monthly'
                      ? (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions)) - selectedMonthSpent
                      : (budget > 0 ? (budget * activeMonthsCount) : annualIncome) - activeYearlyBudgetSpent
                    ).toFixed(0)} left
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* --- Period Selector --- */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            onPress={() => viewMode === 'yearly' ? setSelectedYear(prev => prev - 1) : setSelectedBarIndex(prev => Math.max(prev - 1, 0))}
            style={[styles.chevronBtn, { backgroundColor: Colors.surfaceHighlight }]}
            disabled={viewMode === 'yearly' ? false : selectedBarIndex <= 0}
          >
            <ChevronLeft size={20} color={Colors.text} opacity={selectedBarIndex <= 0 && viewMode !== 'yearly' ? 0.3 : 1} />
          </TouchableOpacity>

          <Text style={[styles.periodText, { color: Colors.text }]}>
            {viewMode === 'yearly' ? selectedYear : (selectedBar ? `${selectedBar.label} ${selectedBar.year}` : 'Current Month')}
          </Text>

          <TouchableOpacity
            onPress={() => viewMode === 'yearly' ? setSelectedYear(prev => prev + 1) : setSelectedBarIndex(prev => Math.min(prev + 1, monthlyData.length - 1))}
            style={[styles.chevronBtn, { backgroundColor: Colors.surfaceHighlight }]}
            disabled={viewMode === 'yearly' ? selectedYear >= new Date().getFullYear() : selectedBarIndex >= monthlyData.length - 1}
          >
            <ChevronRight size={20} color={Colors.text} opacity={(selectedBarIndex >= monthlyData.length - 1 && viewMode !== 'yearly') || (selectedYear >= new Date().getFullYear() && viewMode === 'yearly') ? 0.3 : 1} />
          </TouchableOpacity>
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
