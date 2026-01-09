import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AlertAction {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    actions: AlertAction[];
    onRequestClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    actions,
    onRequestClose,
}) => {
    const Colors = useThemeColor();

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onRequestClose}
            statusBarTranslucent
        >
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <View style={[styles.alertContainer, { backgroundColor: Colors.surface, shadowColor: "#000" }]}>
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: Colors.text }]}>{title}</Text>
                        <Text style={[styles.message, { color: Colors.textSecondary }]}>{message}</Text>
                    </View>
                    <View style={[styles.actions, { borderTopColor: Colors.border }]}>
                        {actions.map((action, index) => {
                            const isDestructive = action.style === 'destructive';
                            const isCancel = action.style === 'cancel';

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.actionButton,
                                        index < actions.length - 1 && styles.actionDivider,
                                        index < actions.length - 1 && { borderRightColor: Colors.border }
                                    ]}
                                    onPress={action.onPress}
                                >
                                    <Text style={[
                                        styles.actionText,
                                        {
                                            color: isDestructive ? Colors.danger : isCancel ? Colors.primary : Colors.text,
                                            fontFamily: isCancel || isDestructive ? 'Geist-SemiBold' : 'Geist-Medium'
                                        }
                                    ]}>
                                        {action.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        fontFamily: 'Geist-Regular',
        textAlign: 'center',
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        height: 50,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionDivider: {
        borderRightWidth: 1,
    },
    actionText: {
        fontSize: 16,
    },
});
