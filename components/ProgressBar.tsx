import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ProgressBarProps {
    progress: number; // 0 to 1
    color?: string;
    height?: number;
    label?: string;
    style?: StyleProp<ViewStyle>;
    gradientColors?: [string, string, ...string[]];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color,
    height = 10,
    label,
    style,
    gradientColors: customGradientColors
}) => {
    const Colors = useThemeColor();
    const clampedProgress = Math.min(Math.max(progress, 0), 1);

    // Determine gradient colors based on progress
    let gradientColors: [string, string, ...string[]] = [Colors.primary, Colors.primaryHighlight];

    if (customGradientColors) {
        gradientColors = customGradientColors;
    } else if (!color) {
        if (clampedProgress >= 0.9) {
            gradientColors = [Colors.danger, '#FF6B6B']; // Red gradient
        } else if (clampedProgress >= 0.75) {
            gradientColors = [Colors.warning, '#FFD700']; // Orange to Gold gradient
        } else {
            gradientColors = [Colors.success, '#4ADE80']; // Green gradient
        }
    } else {
        gradientColors = [color, color]; // Fallback if specific color provided
    }

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={[styles.label, { color: Colors.textSecondary }]}>{label}</Text>}
            <View style={[styles.track, { height, backgroundColor: Colors.surfaceHighlight }]}>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.fill,
                        {
                            width: `${clampedProgress * 100}%`,
                            height
                        }
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
    },
    track: {
        width: '100%',
        borderRadius: 5,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: 5,
    },
});
