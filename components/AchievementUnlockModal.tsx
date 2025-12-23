import { useThemeColor } from '@/hooks/useThemeColor';
import { Achievement } from '@/types/achievements';
import * as Haptics from 'expo-haptics';
import * as Icons from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AchievementUnlockModalProps {
    visible: boolean;
    achievement: Achievement | null;
    onClose: () => void;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
    visible,
    achievement,
    onClose,
}) => {
    const Colors = useThemeColor();
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && achievement) {
            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Scale animation
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();

            // Rotate animation
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);
        }
    }, [visible, achievement, scaleAnim, rotateAnim]);

    if (!achievement) return null;

    const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;

    const getCategoryColor = () => {
        switch (achievement.category) {
            case 'savings':
                return '#10B981';
            case 'spending':
                return '#3B82F6';
            case 'streak':
                return '#F59E0B';
            case 'milestone':
                return '#8B5CF6';
            default:
                return Colors.primary;
        }
    };

    const categoryColor = getCategoryColor();

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        { backgroundColor: Colors.surface, transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Confetti-like circles */}
                    <View style={styles.confetti}>
                        {[...Array(8)].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.confettiCircle,
                                    {
                                        backgroundColor: i % 2 === 0 ? categoryColor : Colors.primary,
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    <Text style={[styles.title, { color: Colors.text }]}>Achievement Unlocked!</Text>

                    <Animated.View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: categoryColor, transform: [{ rotate }] },
                        ]}
                    >
                        <IconComponent size={48} color="#fff" />
                    </Animated.View>

                    <Text style={[styles.achievementTitle, { color: Colors.text }]}>
                        {achievement.title}
                    </Text>
                    <Text style={[styles.description, { color: Colors.textSecondary }]}>
                        {achievement.description}
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: categoryColor }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Awesome!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    confetti: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    confettiCircle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        opacity: 0.6,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        zIndex: 1,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 1,
    },
    achievementTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        zIndex: 1,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        zIndex: 1,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        zIndex: 1,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
