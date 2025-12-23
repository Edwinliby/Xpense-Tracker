import { useThemeColor } from '@/hooks/useThemeColor';
import { Achievement } from '@/types/achievements';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AchievementBadgeProps {
    achievement: Achievement;
    onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, onPress }) => {
    const Colors = useThemeColor();
    const isUnlocked = !!achievement.unlockedAt;
    const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;

    const getCategoryColor = () => {
        switch (achievement.category) {
            case 'savings': return '#10B981'; // Green
            case 'spending': return '#3B82F6'; // Blue
            case 'streak': return '#F59E0B'; // Orange
            case 'milestone': return '#8B5CF6'; // Purple
            default: return Colors.primary;
        }
    };

    const categoryColor = getCategoryColor();
    const progress = achievement.progress || 0;
    const progressPercentage = Math.min((progress / achievement.requirement) * 100, 100);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            disabled={!onPress}
            style={{ marginBottom: 16 }}
        >
            <LinearGradient
                colors={isUnlocked
                    ? [Colors.surface, Colors.surfaceHighlight]
                    : [Colors.surface, Colors.surface]}
                style={[
                    styles.container,
                    {
                        borderColor: isUnlocked ? categoryColor : 'rgba(255,255,255,0.05)',
                        borderWidth: isUnlocked ? 1 : 1,
                        opacity: isUnlocked ? 1 : 0.7
                    }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {isUnlocked && (
                    <View style={[styles.glowContainer, { backgroundColor: categoryColor }]} />
                )}

                <View style={styles.innerContent}>
                    <LinearGradient
                        colors={isUnlocked ? [categoryColor, categoryColor] : [Colors.surfaceHighlight, Colors.surfaceHighlight]}
                        style={styles.iconContainer}
                    >
                        {isUnlocked ? (
                            <IconComponent size={24} color="#fff" />
                        ) : (
                            <Lock size={24} color={Colors.textSecondary} />
                        )}
                    </LinearGradient>

                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, { color: isUnlocked ? Colors.text : Colors.textSecondary }]} numberOfLines={1}>
                                {achievement.title}
                            </Text>
                            {isUnlocked && (
                                <View style={[styles.badge, { backgroundColor: categoryColor + '20' }]}>
                                    <Text style={[styles.badgeText, { color: categoryColor }]}>Unlocked</Text>
                                </View>
                            )}
                        </View>

                        <Text style={[styles.description, { color: Colors.textSecondary }]} numberOfLines={2}>
                            {achievement.description}
                        </Text>

                        {!isUnlocked && (
                            <View style={styles.progressSection}>
                                <View style={styles.progressInfo}>
                                    <Text style={[styles.progressLabel, { color: Colors.textSecondary }]}>Progress</Text>
                                    <Text style={[styles.progressText, { color: categoryColor }]}>
                                        {Math.round(progressPercentage)}%
                                    </Text>
                                </View>
                                <View style={[styles.progressBar, { backgroundColor: Colors.surfaceHighlight }]}>
                                    <LinearGradient
                                        colors={[categoryColor, categoryColor]}
                                        style={[
                                            styles.progressFill,
                                            { width: `${progressPercentage}%` },
                                        ]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    />
                                </View>
                                <Text style={[styles.requirementText, { color: Colors.textSecondary }]}>
                                    {progress} / {achievement.requirement}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        // Generic Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    innerContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    glowContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 13,
        marginBottom: 12,
        lineHeight: 18,
    },
    progressSection: {
        marginTop: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    progressText: {
        fontSize: 11,
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    requirementText: {
        fontSize: 10,
        textAlign: 'right',
        opacity: 0.7,
    },
});
