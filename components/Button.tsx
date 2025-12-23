import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'warning' | 'success';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    useGradient?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    useGradient = true,
}) => {
    const Colors = useThemeColor();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const getGradientColors = (): [string, string] => {
        if (variant === 'primary') return Colors.primaryGradient as [string, string];
        if (variant === 'success') return Colors.successGradient as [string, string];
        if (variant === 'danger') return Colors.dangerGradient as [string, string];
        if (variant === 'warning') return Colors.warningGradient as [string, string];
        return [Colors.surfaceHighlight, Colors.surfaceHighlight];
    };

    const getBackgroundColor = () => {
        if (variant === 'primary') return Colors.primary;
        if (variant === 'success') return Colors.success;
        if (variant === 'danger') return Colors.danger;
        if (variant === 'warning') return Colors.warning;
        if (variant === 'outline') return 'transparent';
        return Colors.surfaceHighlight;
    };

    const getTextColor = () => {
        if (variant === 'outline') return Colors.primary;
        if (variant === 'secondary') return Colors.text;
        return '#fff';
    };

    const buttonContent = (
        <>
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
            )}
        </>
    );

    if (useGradient && variant !== 'outline' && variant !== 'secondary') {
        return (
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading || disabled}
                    activeOpacity={1}
                    style={{ opacity: (loading || disabled) ? 0.5 : 1 }}
                >
                    <LinearGradient
                        colors={getGradientColors()}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        {buttonContent}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: getBackgroundColor(),
                        borderColor: variant === 'outline' ? Colors.primary : 'transparent',
                        borderWidth: variant === 'outline' ? 2 : 0,
                        opacity: (loading || disabled) ? 0.5 : 1,
                    },
                    style,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading || disabled}
                activeOpacity={1}
            >
                {buttonContent}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 56,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
