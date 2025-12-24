import { AchievementUnlockModal } from '@/components/AchievementUnlockModal';
import { DebtCreditCard } from '@/components/DebtCreditCard';
import { ExpenseCard } from '@/components/ExpenseCard';
import { HomeChart } from '@/components/HomeChart';
import { ProgressBar } from '@/components/ProgressBar';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { endOfMonth, format, getDaysInMonth, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { AlertCircle, ChevronLeft, ChevronRight, Wallet } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const Styles = useStyles();
  const Colors = useThemeColor();
  const { transactions, budget, income, incomeStartDate, editTransaction, deleteTransaction, currencySymbol, newlyUnlockedAchievement, clearNewlyUnlockedAchievement } = useExpense();
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(2);
  const [selectedBar, setSelectedBar] = useState<{ label: string; value: number } | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const now = useMemo(() => new Date(), []);

  // --- Data Helpers ---
  const getSpentInInterval = useCallback((start: Date, end: Date) => {
    return transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
      .filter(t => !(t.isLent && t.isPaidBack))
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

  const getEffectiveSpent = useCallback((start: Date, end: Date) => {
    if (!isAfterIncomeStart(start)) return 0;
    return getSpentInInterval(start, end);
  }, [isAfterIncomeStart, getSpentInInterval]);

  // --- Monthly Data (Last 3 Months) ---
  const monthlyData = useMemo(() => [2, 1, 0].map((subtract) => {
    const date = subMonths(now, subtract);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const value = getEffectiveSpent(monthStart, monthEnd);
    return {
      value,
      label: format(monthStart, 'MMM'),
      frontColor: subtract === 0 ? Colors.primary : Colors.textSecondary,
      gradientColor: subtract === 0 ? Colors.primaryHighlight : Colors.surfaceHighlight,
    };
  }), [now, getEffectiveSpent, Colors.primary, Colors.textSecondary, Colors.primaryHighlight, Colors.surfaceHighlight]);

  // Sync selectedBar with selectedBarIndex
  useEffect(() => {
    if (monthlyData && monthlyData[selectedBarIndex]) {
      setSelectedBar(monthlyData[selectedBarIndex]);
    }
  }, [monthlyData, selectedBarIndex]);

  // Determine month range for recent transactions
  const monthRange = useMemo(() => {
    if (selectedBar && viewMode === 'monthly') {
      const subtract = 2 - selectedBarIndex;
      const date = subMonths(now, subtract);
      return { start: startOfMonth(date), end: endOfMonth(date) };
    }
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [selectedBar, selectedBarIndex, now, viewMode]);

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
  }, [transactions]);

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
      if (isAfterIncomeStart(monthStart)) {
        const monthEnd = endOfMonth(new Date(selectedYear, i, 1));
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
    }
    return data;
  }, [selectedYear, getEffectiveSpent, isAfterIncomeStart, Colors.text]);

  const currentYearSpent = useMemo(() =>
    yearlyData.reduce((acc, item) => acc + item.value, 0),
    [yearlyData]
  );

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
      .filter(t => t.type === 'income' && new Date(t.date).getFullYear() === selectedYear)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return (annualIncome + yearlyIncomeTransactions) - currentYearSpent;
  }, [annualIncome, currentYearSpent, transactions, selectedYear]);

  const selectedMonthSpent = useMemo(() =>
    getEffectiveSpent(monthRange.start, monthRange.end),
    [monthRange, getEffectiveSpent]
  );

  const selectedMonthIncomeTransactions = useMemo(() =>
    getIncomeInInterval(monthRange.start, monthRange.end),
    [monthRange, getIncomeInInterval]
  );

  const remainingBudget = useMemo(() => {
    if (budget > 0) return budget - selectedMonthSpent;
    const monthlyStaticIncome = isAfterIncomeStart(monthRange.start) ? income : 0;
    return (monthlyStaticIncome + selectedMonthIncomeTransactions) - selectedMonthSpent;
  }, [budget, income, selectedMonthSpent, isAfterIncomeStart, monthRange, selectedMonthIncomeTransactions]);

  const selectedMonthSaved = useMemo(() => {
    const monthlyStaticIncome = isAfterIncomeStart(monthRange.start) ? income : 0;
    const totalIncome = monthlyStaticIncome + selectedMonthIncomeTransactions;
    return totalIncome - selectedMonthSpent;
  }, [income, selectedMonthSpent, isAfterIncomeStart, monthRange, selectedMonthIncomeTransactions]);

  // --- Active Data Selection ---
  const chartData = useMemo(() => viewMode === 'yearly' ? yearlyData : monthlyData, [viewMode, yearlyData, monthlyData]);

  const displaySpent = useMemo(() => viewMode === 'yearly' ? currentYearSpent : selectedMonthSpent, [viewMode, currentYearSpent, selectedMonthSpent]);

  const displayLabel = useMemo(() => {
    if (viewMode === 'yearly') return `Spent in ${selectedYear}`;
    if (selectedBar) return `Spent in ${selectedBar.label}`;
    return 'Spent This Month';
  }, [viewMode, selectedYear, selectedBar]);

  const displaySaved = useMemo(() => viewMode === 'yearly' ? currentYearSaved : selectedMonthSaved, [viewMode, currentYearSaved, selectedMonthSaved]);

  return (
    <SafeAreaView style={Styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.background }]}>
          <View>
            <Text style={[styles.greeting, { color: Colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.title, { color: Colors.text }]}>
              {
                budget > 0 && budget < displaySpent ? 'Lavish Spender' : 'Economical Man'
              }
            </Text>
          </View>

          <View style={[styles.toggleContainer, { backgroundColor: Colors.surfaceHighlight }]}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'monthly' && { backgroundColor: Colors.primary }]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.toggleText, { color: viewMode === 'monthly' ? '#FFF' : Colors.textSecondary }]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'yearly' && { backgroundColor: Colors.primary }]}
              onPress={() => setViewMode('yearly')}
            >
              <Text style={[styles.toggleText, { color: viewMode === 'yearly' ? '#FFF' : Colors.textSecondary }]}>Year</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, Styles.shadow, { backgroundColor: Colors.surface, shadowColor: Colors.shadow }]}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View>
              <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Total Spent</Text>
              <Text style={[styles.statValue, { color: Colors.text }]}>{currencySymbol}{displaySpent.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: displaySaved >= 0 ? Colors.success : Colors.danger }]}>
                {displaySaved > 0 ? '+' : ''}{currencySymbol}{displaySaved.toLocaleString()}
              </Text>
              {viewMode === 'yearly' && (
                <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2, opacity: 0.8 }}>
                  {activeMonthsCount} Month{activeMonthsCount !== 1 ? 's' : ''} • {currencySymbol}{(displaySaved + displaySpent).toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <HomeChart
              data={viewMode === 'monthly' ? currentMonthLineData : chartData}
              data2={viewMode === 'monthly' ? previousMonthLineData : undefined}
              viewMode={viewMode}
              maxValue={viewMode === 'monthly' ? maxMonthlyValue : maxYearlyValue}
              currencySymbol={currencySymbol}
            />
          </View>

          {/* Budget Bar */}
          <View style={[styles.budgetWrapper, { backgroundColor: Colors.surfaceHighlight }]}>
            <View style={styles.budgetHeaders}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Wallet size={14} color={Colors.textSecondary} />
                <Text style={[styles.budgetLabel, { color: Colors.textSecondary }]}>
                  {viewMode === 'monthly' ? (budget > 0 ? 'Monthly Budget' : 'Income') : (budget > 0 ? `Yearly Budget (${activeMonthsCount} Month${activeMonthsCount !== 1 ? 's' : ''})` : 'Yearly Income')}
                </Text>
              </View>
              <Text style={[styles.budgetTotal, { color: Colors.text }]}>
                {currencySymbol}
                {viewMode === 'monthly'
                  ? (budget > 0 ? budget.toFixed(0) : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions).toFixed(0))
                  : (budget > 0 ? (budget * activeMonthsCount).toFixed(0) : annualIncome.toFixed(0))
                }
              </Text>
            </View>
            <ProgressBar
              progress={
                viewMode === 'monthly'
                  ? (budget > 0 ? Math.min(selectedMonthSpent / budget, 1) : Math.min(selectedMonthSpent / ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions || 1), 1))
                  : Math.min(currentYearSpent / (budget > 0 ? (budget * activeMonthsCount) : (annualIncome || 1)), 1)
              }
              color={(viewMode === 'monthly' ? (budget > 0 ? selectedMonthSpent > budget : selectedMonthSpent > ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions)) : (budget > 0 ? currentYearSpent > (budget * activeMonthsCount) : currentYearSpent > annualIncome)) ? Colors.danger : Colors.primary}
              height={6}
              style={{ borderRadius: 3 }}
            />
            {((viewMode === 'monthly' && selectedMonthSpent > (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions))) ||
              (viewMode === 'yearly' && currentYearSpent > (budget > 0 ? (budget * activeMonthsCount) : annualIncome))) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                  <AlertCircle size={12} color={Colors.danger} />
                  <Text style={{ color: Colors.danger, fontSize: 11, fontWeight: '600' }}>
                    Over budget by {currencySymbol}
                    {(viewMode === 'monthly'
                      ? selectedMonthSpent - (budget > 0 ? budget : ((isAfterIncomeStart(monthRange.start) ? income : 0) + selectedMonthIncomeTransactions))
                      : currentYearSpent - (budget > 0 ? (budget * activeMonthsCount) : annualIncome)
                    ).toFixed(0)}
                  </Text>
                </View>
              )}
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              onPress={() => viewMode === 'yearly' ? setSelectedYear(prev => prev - 1) : setSelectedBarIndex(prev => Math.max(prev - 1, 0))}
              style={[styles.chevronBtn, { backgroundColor: Colors.surfaceHighlight }]}
              disabled={viewMode === 'yearly' ? false : selectedBarIndex <= 0}
            >
              <ChevronLeft size={20} color={Colors.text} opacity={selectedBarIndex <= 0 && viewMode !== 'yearly' ? 0.3 : 1} />
            </TouchableOpacity>

            <Text style={[styles.periodText, { color: Colors.text }]}>
              {viewMode === 'yearly' ? selectedYear : (selectedBar ? `${selectedBar.label} ${now.getFullYear()}` : 'Current Month')}
            </Text>

            <TouchableOpacity
              onPress={() => viewMode === 'yearly' ? setSelectedYear(prev => prev + 1) : setSelectedBarIndex(prev => Math.min(prev + 1, monthlyData.length - 1))}
              style={[styles.chevronBtn, { backgroundColor: Colors.surfaceHighlight }]}
              disabled={viewMode === 'yearly' ? selectedYear >= new Date().getFullYear() : selectedBarIndex >= monthlyData.length - 1}
            >
              <ChevronRight size={20} color={Colors.text} opacity={(selectedBarIndex >= monthlyData.length - 1 && viewMode !== 'yearly') || (selectedYear >= new Date().getFullYear() && viewMode === 'yearly') ? 0.3 : 1} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Owed Sections --- */}
        {(() => {
          const lentTransactions = transactions.filter(t => t.isLent && !t.isPaidBack);
          const totalLent = lentTransactions.reduce((acc, t) => acc + t.amount, 0);

          const owedTransactions = transactions.filter(t => t.isFriendPayment && !t.isPaidBack);
          const totalOwed = owedTransactions.reduce((acc, t) => acc + t.amount, 0);

          return (
            <>
              {totalLent > 0 && (
                <DebtCreditCard
                  type="owed"
                  amount={totalLent}
                  transactions={lentTransactions}
                  onSettle={(id) => deleteTransaction(id)} // Assuming 'delete' settles it, or we could update
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
            </>
          );
        })()}

        {/* Recent Transactions */}
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
            {recentTransactions.slice(0, showAllTransactions ? undefined : 5).map(t => (
              <ExpenseCard key={t.id} transaction={t} />
            ))}
            {recentTransactions.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: Colors.surface }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Geist-Regular',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Geist-Bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  toggleText: {
    fontFamily: 'Geist-SemiBold',
    fontSize: 12,
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  mainCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  chevronBtn: {
    padding: 8,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsHeader: {
    marginBottom: 20,
  },
  statsLabel: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Geist-Regular',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
  },
  statsSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginLeft: -10, // Offset for chart padding
  },
  budgetWrapper: {
    padding: 16,
    borderRadius: 16,
  },
  budgetHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
  },
  budgetTotal: {
    fontSize: 12,
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
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
  },
  owedCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
  },
  owedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  owedLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Geist-Medium',
  },
  owedValue: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Geist-Bold',
  },
  owedList: {
    gap: 12,
  },
  owedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  owedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontFamily: 'Geist-Bold',
    fontSize: 14,
  },
  owedName: {
    color: '#FFF',
    fontFamily: 'Geist-SemiBold',
    fontSize: 14,
  },
  owedDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  settleBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  settleText: {
    fontSize: 12,
    fontFamily: 'Geist-SemiBold',
  },
  transactionsList: {
    gap: 4,
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
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