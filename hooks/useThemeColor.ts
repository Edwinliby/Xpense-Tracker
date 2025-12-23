import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

export function useThemeColor() {
  const { colorScheme } = useTheme();
  const theme = colorScheme ?? "light";
  return Colors[theme];
}
