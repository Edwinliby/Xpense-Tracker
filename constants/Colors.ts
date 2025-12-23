const tintColorLight = "#0D9488"; // Teal 600
const tintColorDark = "#F97316"; // Orange 500

export const Colors = {
  light: {
    text: "#0F172A", // Slate 900
    textSecondary: "#64748B", // Slate 500
    background: "#F8FAFC", // Soft Gray
    surface: "#FFFFFF",
    surfaceHighlight: "#F1F5F9", // Slate 100
    tint: tintColorLight,
    primary: "#0D9488", // Teal 600
    primaryLight: "#5EEAD4", // Teal 300
    primaryDark: "#0F766E", // Teal 700
    primaryHighlight: "#F0FDFA", // Teal 50
    success: "#10B981", // Emerald 500
    successLight: "#34D399", // Emerald 400
    danger: "#EF4444", // Red 500
    dangerLight: "#F87171", // Red 400
    warning: "#F59E0B", // Amber 500
    warningLight: "#FBBF24", // Amber 400
    tabIconDefault: "#94A3B8", // Slate 400
    tabIconSelected: tintColorLight,
    border: "#E2E8F0", // Slate 200
    borderLight: "#F1F5F9", // Slate 100
    shadow: "#94A3B8", // Slate 400
    // Gradients (start, end)
    primaryGradient: ["#2DD4BF", "#0D9488"], // Teal 400 -> Teal 600
    successGradient: ["#34D399", "#10B981"],
    dangerGradient: ["#F87171", "#EF4444"],
    warningGradient: ["#FBBF24", "#F59E0B"],
  },
  dark: {
    text: "#F8FAFC", // Slate 50
    textSecondary: "#94A3B8", // Slate 400
    background: "#000000", // Pure Black
    surface: "#111111", // Very Dark Gray
    surfaceHighlight: "#222222", // Dark Gray
    tint: "#F97316", // Orange 500
    primary: "#F97316", // Orange 500
    primaryLight: "#FB923C", // Orange 400
    primaryDark: "#EA580C", // Orange 600
    primaryHighlight: "#431407", // Orange 950 (Subtle highlight)
    success: "#22C55E", // Green 500 (Vibrant)
    successLight: "#4ADE80", // Green 400
    danger: "#EF4444", // Red 500 (Vibrant)
    dangerLight: "#F87171", // Red 400
    warning: "#F59E0B", // Amber 500
    warningLight: "#FBBF24", // Amber 400
    tabIconDefault: "#475569", // Slate 600
    tabIconSelected: "#F97316", // Orange 500
    border: "#222222", // Gray 800
    borderLight: "#333333", // Gray 700
    shadow: "#000000",
    // Gradients (start, end)
    primaryGradient: ["#FB923C", "#F97316"], // Orange 400 -> Orange 500
    successGradient: ["#4ADE80", "#22C55E"], // Green 400 -> Green 500
    dangerGradient: ["#F87171", "#EF4444"], // Red 400 -> Red 500
    warningGradient: ["#FCD34D", "#FBBF24"],
  },
};
