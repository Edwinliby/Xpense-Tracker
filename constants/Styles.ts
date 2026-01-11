import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet } from "react-native";

export const useStyles = () => {
  const Colors = useThemeColor();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingTop: 10,
    },
    title: {
      fontSize: 28,
      fontFamily: "Geist-Bold",
      color: Colors.text,
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 18,
      color: Colors.textSecondary,
      marginBottom: 16,
      fontFamily: "Geist-SemiBold",
    },
    card: {
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    header: {
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    text: {
      color: Colors.text,
      fontSize: 16,
      fontFamily: "Geist-Regular",
    },
    textSecondary: {
      color: Colors.textSecondary,
      fontSize: 14,
      fontFamily: "Geist-Regular",
    },
    shadow: {
      shadowColor: Colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1, // Softer opacity
      shadowRadius: 20,
      elevation: 1,
    },
  });
};
