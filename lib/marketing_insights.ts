import { Category, Transaction } from "@/types/expense";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

export function generateMonthlyInsights(
  transactions: Transaction[],
  categories: Category[],
  currencySymbol: string
): string[] {
  const insights: string[] = [];
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const getExpenses = (start: Date, end: Date) => {
    return transactions.filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.date) >= start &&
        new Date(t.date) <= end &&
        !t.deletedAt
    );
  };

  const currentExpenses = getExpenses(currentMonthStart, currentMonthEnd);
  const prevExpenses = getExpenses(prevMonthStart, prevMonthEnd);

  const currentTotal = currentExpenses.reduce((sum, t) => sum + t.amount, 0);
  const prevTotal = prevExpenses.reduce((sum, t) => sum + t.amount, 0);

  // 1. Total Spend Comparison
  if (prevTotal > 0) {
    const diff = currentTotal - prevTotal;
    const percent = Math.round((Math.abs(diff) / prevTotal) * 100);

    if (diff < 0) {
      insights.push(
        `🎉 Great job! You spent ${percent}% less than last month.`
      );
    } else if (diff > 0) {
      insights.push(`⚠️ You spent ${percent}% more than last month.`);
    } else {
      insights.push(`You spent exactly the same as last month.`);
    }
  }

  // 2. Top Category Analysis
  const getCategoryTotals = (txs: Transaction[]) => {
    const totals: Record<string, number> = {};
    txs.forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  };

  const currentCatTotals = getCategoryTotals(currentExpenses);
  const prevCatTotals = getCategoryTotals(prevExpenses);

  const topCategoryCur = Object.entries(currentCatTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (topCategoryCur) {
    const catName =
      categories.find((c) => c.name === topCategoryCur[0])?.name ||
      topCategoryCur[0];
    insights.push(
      `🍔 Your biggest expense was ${catName} at ${currencySymbol}${topCategoryCur[1].toLocaleString()}.`
    );

    // Compare specific category
    const prevCatAmount = prevCatTotals[topCategoryCur[0]] || 0;
    if (prevCatAmount > 0) {
      const catDiff = topCategoryCur[1] - prevCatAmount;
      const catPercent = Math.round((Math.abs(catDiff) / prevCatAmount) * 100);
      if (catDiff < 0) {
        insights.push(
          `📉 You cut down on ${catName} by ${catPercent}% compared to last month.`
        );
      } else if (catDiff > 0) {
        insights.push(`📈 Spending on ${catName} increased by ${catPercent}%.`);
      }
    }
  }

  // 3. Dining Out Check (Heuristic if category exists)
  const diningKeys = ["Food", "Dining", "Restaurants", "Eating Out"];
  const currentDining = currentExpenses
    .filter((t) => diningKeys.some((k) => t.category.includes(k)))
    .reduce((sum, t) => sum + t.amount, 0);
  const prevDining = prevExpenses
    .filter((t) => diningKeys.some((k) => t.category.includes(k)))
    .reduce((sum, t) => sum + t.amount, 0);

  if (prevDining > 0 && currentDining < prevDining) {
    const saved = prevDining - currentDining;
    insights.push(
      `🍽️ You saved ${currencySymbol}${saved.toLocaleString()} on food compared to last month!`
    );
  }

  // 4. Subscription Check (Heuristic: identical amounts on same day? Or just recurring flag)
  const recurringCount = currentExpenses.filter((t) => t.isRecurring).length;
  if (recurringCount > 0) {
    insights.push(
      `🔄 You have ${recurringCount} active recurring subscriptions this month.`
    );
  }

  if (insights.length === 0) {
    insights.push("Start tracking more expenses to see personalized insights!");
  }

  return insights.slice(0, 5); // Return top 5
}
