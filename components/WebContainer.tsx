import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

export const WebContainer: React.FC<ViewProps> = ({ children, style, ...props }) => {
    const Colors = useThemeColor();

    if (Platform.OS !== 'web') {
        return <View style={[{ flex: 1 }, style]} {...props}>{children}</View>;
    }

    return (
        <View style={styles.container}>
            <View style={[
                styles.content,
                {
                    backgroundColor: Colors.background,
                    borderColor: Colors.border
                },
                style
            ]} {...props}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 1200, // Standard desktop width
        height: '100%',
        alignSelf: 'center', // Center the container
    },
});
