import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface SettingsCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    noPadding?: boolean;
}

export const SettingsCard = ({ children, style, noPadding }: SettingsCardProps) => {
    const Colors = useThemeColor();
    return (
        <View style={[
            styles.card,
            {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
                shadowColor: Colors.shadow,
            },
            noPadding && { padding: 0 },
            style
        ]}>
            {children}
        </View>
    );
};

export const SettingsHeroCard = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
    const Colors = useThemeColor();
    // Use primary gradient if available, or just a nice highlight background
    return (
        <View style={[styles.heroCardContainer, { shadowColor: Colors.primary }]}>
            <LinearGradient
                colors={(Colors.primaryGradient || [Colors.primary, Colors.primaryDark]) as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroCard, style]}
            >
                {children}
            </LinearGradient>
        </View>
    );
};

interface SettingsItemProps {
    icon?: keyof typeof Icons;
    iconColor?: string;
    iconBackgroundColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isDestructive?: boolean;
    showChevron?: boolean;
    style?: ViewStyle;
}

export const SettingsItem = ({
    icon,
    iconColor,
    iconBackgroundColor,
    title,
    subtitle,
    onPress,
    rightElement,
    isDestructive,
    showChevron = true,
    style,
}: SettingsItemProps) => {
    const Colors = useThemeColor();
    const IconComponent = icon ? (Icons as any)[icon] : null;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={[styles.itemCallback, style]}
        >
            <View style={styles.itemContainer}>
                {icon && IconComponent && (
                    <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor || Colors.surfaceHighlight }]}>
                        <IconComponent size={20} color={iconColor || Colors.text} />
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: isDestructive ? Colors.danger : Colors.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>{subtitle}</Text>}
                </View>
                <View style={styles.rightContainer}>
                    {rightElement}
                    {onPress && showChevron && !rightElement && (
                        <Icons.ChevronRight size={18} color={Colors.textSecondary} opacity={0.5} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const SectionHeader = ({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) => {
    const Colors = useThemeColor();
    return (
        <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeader, { color: Colors.text }]}>{title}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity onPress={onAction}>
                    <Text style={[styles.sectionAction, { color: Colors.primary }]}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export const Separator = () => {
    const Colors = useThemeColor();
    return <View style={[styles.separator, { backgroundColor: Colors.border }]} />;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24, // Increased radius
        padding: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    heroCardContainer: {
        marginBottom: 4,
        borderRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
    },
    itemCallback: {
        paddingVertical: 14, // Slightly taller
        paddingHorizontal: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 40, // Larger icon box
        height: 40,
        borderRadius: 12, // Squircle
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
        marginTop: 32,
    },
    sectionHeader: {
        fontSize: 18, // Much larger
        fontFamily: 'Geist-Bold', // Bold, not semi-bold
        // No opacity/uppercase reduction - keeping it clean and bold like a title
    },
    sectionAction: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
    },
    separator: {
        height: 1,
        marginLeft: 76,
        opacity: 0.5,
    }
});
