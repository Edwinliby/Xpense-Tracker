import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'warning' | 'success';
    size?: 'small' | 'default' | 'large';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    useGradient?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'default',
    loading = false,
    disabled = false,
    style,
    textStyle,
    useGradient = true,
    icon,
}) => {
    const Colors = useThemeColor();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    // ... (animations) ...
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
    // ...

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

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: 10, paddingHorizontal: 20, minHeight: 40 };
            case 'large':
                return { paddingVertical: 18, paddingHorizontal: 32, minHeight: 60 };
            default:
                return { paddingVertical: 16, paddingHorizontal: 28, minHeight: 56 };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small': return 14;
            case 'large': return 18;
            default: return 16;
        }
    };

    const buttonContent = (
        <>
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                    <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>{title}</Text>
                </>
            )}
        </>
    );
    // ...
    // ...
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
                        style={[styles.button, getSizeStyles()]}
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
                    getSizeStyles(),
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
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        fontWeight: '700',
        letterSpacing: 0.3,
        fontFamily: 'Geist-Bold',
    },
});
