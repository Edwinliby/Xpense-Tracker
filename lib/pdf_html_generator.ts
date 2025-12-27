import { Category, Transaction } from "@/types/expense";
import { format } from "date-fns";
import { generateMonthlyInsights } from "./marketing_insights";

interface PDFData {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  budget: number;
  income: number;
  userName?: string;
}

export const generateHTML = ({
  transactions,
  categories,
  currencySymbol,
  budget,
  income,
  userName,
}: PDFData) => {
  const now = new Date();
  const monthName = format(now, "MMMM yyyy");
  const insights = generateMonthlyInsights(
    transactions,
    categories,
    currencySymbol
  );

  // Filter for current month only
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end && !t.deletedAt;
  });

  // Calculate Totals
  const totalSpent = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalSpent;

  // Category Breakdown
  const categoryTotals: Record<string, { amount: number; color: string }> = {};
  monthlyTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = categories.find((c) => c.name === t.category);
      const color = cat ? cat.color : "#ccc";
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { amount: 0, color };
      }
      categoryTotals[t.category].amount += t.amount;
    });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 6); // Top 6

  const maxCatAmount = sortedCategories[0]?.[1].amount || 1;

  // Generate Chart HTML (Simple CSS Bars)
  const chartRows = sortedCategories
    .map(([name, data]) => {
      const width = (data.amount / maxCatAmount) * 100;
      return `
            <div class="chart-row">
                <div class="chart-label">${name}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${width}%; background-color: ${
        data.color
      };"></div>
                </div>
                <div class="chart-value">${currencySymbol}${data.amount.toLocaleString()}</div>
            </div>
        `;
    })
    .join("");

  // Generate Insights List
  const insightsHtml = insights
    .map(
      (text) => `
        <li class="insight-item">
            <span class="insight-icon">💡</span>
            <span class="insight-text">${text}</span>
        </li>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
        .header { margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .title { font-size: 32px; font-weight: bold; color: #111; margin: 0; }
        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
        
        .grid { display: flex; gap: 20px; margin-bottom: 40px; }
        .card { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 12px; }
        .card-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .card-value { font-size: 24px; font-weight: bold; color: #111; }
        .card-value.green { color: #10B981; }
        .card-value.red { color: #EF4444; }

        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; margin-top: 40px; border-left: 4px solid #3B82F6; padding-left: 10px; }

        .chart-container { background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 12px; }
        .chart-row { display: flex; align-items: center; margin-bottom: 12px; }
        .chart-label { width: 100px; font-size: 12px; color: #555; }
        .chart-bar-container { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin: 0 15px; }
        .chart-bar { height: 100%; border-radius: 4px; }
        .chart-value { width: 60px; text-align: right; font-size: 12px; font-weight: bold; color: #333; }

        .insights-list { list-style: none; padding: 0; }
        .insight-item { background: #EEF2FF; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; }
        .insight-icon { margin-right: 12px; font-size: 18px; }
        .insight-text { font-size: 14px; color: #3730A3; font-weight: 500; }

        .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Monthly Financial Report</h1>
        <div class="subtitle">Generated for ${
          userName || "User"
        } • ${monthName}</div>
    </div>

    <div class="grid">
        <div class="card">
            <div class="card-label">Total Spend</div>
            <div class="card-value">${currencySymbol}${totalSpent.toLocaleString()}</div>
        </div>
        <div class="card">
            <div class="card-label">Total Income</div>
            <div class="card-value green">${currencySymbol}${totalIncome.toLocaleString()}</div>
        </div>
        <div class="card">
            <div class="card-label">Net Savings</div>
            <div class="card-value ${netSavings >= 0 ? "green" : "red"}">
                ${
                  netSavings >= 0 ? "+" : ""
                }${currencySymbol}${netSavings.toLocaleString()}
            </div>
        </div>
    </div>

    <div class="section-title">AI Insights</div>
    <ul class="insights-list">
        ${
          insightsHtml ||
          '<li class="insight-item">No specific insights available for this month yet.</li>'
        }
    </ul>

    <div class="section-title">Spending by Category</div>
    <div class="chart-container">
        ${chartRows}
    </div>

    <div class="footer">
        Generated by Xpense Tracker
    </div>
</body>
</html>
    `;
};
