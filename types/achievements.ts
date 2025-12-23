export type AchievementCategory =
  | "savings"
  | "spending"
  | "streak"
  | "milestone";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: AchievementCategory;
  requirement: number;
  unlockedAt?: string; // ISO date
  progress?: number; // Current progress toward goal
}

export const ACHIEVEMENTS: Achievement[] = [
  // Savings (4)
  {
    id: "first_saver",
    title: "First Saver",
    description: "Save money for the first time",
    icon: "Coins",
    category: "savings",
    requirement: 1,
  },
  {
    id: "budget_master",
    title: "Budget Master",
    description: "Stay under budget for 3 months",
    icon: "Target",
    category: "savings",
    requirement: 3,
  },
  {
    id: "diamond_saver",
    title: "Diamond Saver",
    description: "Save 50% of income in a month",
    icon: "Gem",
    category: "savings",
    requirement: 50,
  },
  {
    id: "savings_streak",
    title: "Savings Streak",
    description: "Save money 7 days in a row",
    icon: "TrendingUp",
    category: "savings",
    requirement: 7,
  },

  // Spending (4)
  {
    id: "first_transaction",
    title: "First Transaction",
    description: "Add your first expense",
    icon: "Receipt",
    category: "spending",
    requirement: 1,
  },
  {
    id: "category_explorer",
    title: "Category Explorer",
    description: "Use 5 different categories",
    icon: "Compass",
    category: "spending",
    requirement: 5,
  },
  {
    id: "receipt_keeper",
    title: "Receipt Keeper",
    description: "Add 10 receipts",
    icon: "Camera",
    category: "spending",
    requirement: 10,
  },
  {
    id: "organized",
    title: "Organized",
    description: "Categorize 50 transactions",
    icon: "FolderCheck",
    category: "spending",
    requirement: 50,
  },

  // Streak (2)
  {
    id: "week_warrior",
    title: "Week Warrior",
    description: "Log expenses 7 days straight",
    icon: "Flame",
    category: "streak",
    requirement: 7,
  },
  {
    id: "consistent",
    title: "Consistent",
    description: "Log expenses 14 days straight",
    icon: "Calendar",
    category: "streak",
    requirement: 14,
  },

  // Milestone (2)
  {
    id: "century_club",
    title: "Century Club",
    description: "Record 100 transactions",
    icon: "Award",
    category: "milestone",
    requirement: 100,
  },
  {
    id: "frugal",
    title: "Frugal",
    description: "Keep daily spending under $20 for a week",
    icon: "Sparkles",
    category: "milestone",
    requirement: 7,
  },
];
