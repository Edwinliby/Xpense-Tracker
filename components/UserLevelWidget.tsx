import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Achievement } from '@/types/achievements';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Star, Trophy } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface UserLevelWidgetProps {
    achievements: Achievement[];
    onPress?: () => void;
    variant?: 'default' | 'compact';
    username?: string;
}

export const UserLevelWidget: React.FC<UserLevelWidgetProps> = ({ achievements, onPress, variant = 'default', username = 'Guest' }) => {
    const Colors = useThemeColor();
    const Styles = useStyles();

    const { level, xp, nextLevelXp, progressPercent, unlockedCount } = useMemo(() => {
        const unlocked = achievements.filter(a => a.unlockedAt).length;
        const totalXp = unlocked * 100; // Simplified for demo
        const thresholds = [0, 300, 800, 1500, 2500, 4000, 6000, 99999];


        let lvl = 1;
        for (let i = 0; i < thresholds.length - 1; i++) {
            if (totalXp >= thresholds[i]) lvl = i + 1; else break;
        }

        const currentThreshold = thresholds[lvl - 1];
        const nextThreshold = thresholds[lvl];
        const levelXp = totalXp - currentThreshold;
        const levelRange = nextThreshold - currentThreshold;
        const percent = Math.min((levelXp / levelRange) * 100, 100);

        return { level: lvl, xp: totalXp, nextLevelXp: nextThreshold, progressPercent: percent, unlockedCount: unlocked };
    }, [achievements]);

    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = withTiming(progressPercent / 100, { duration: 1500, easing: Easing.out(Easing.exp) });
    }, [progressPercent, progress]);

    // Dimensions based on variant
    const size = variant === 'compact' ? 48 : 100;
    const strokeWidth = variant === 'compact' ? 4 : 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const animatedCircleProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

    const Wrapper = onPress ? TouchableOpacity : View;

    if (variant === 'compact') {
        return (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.container]}>
                <Wrapper onPress={onPress} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.primary + 'E6']} // Slightly transparent
                        style={[styles.compactCard, { shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {/* Mini Chart */}
                        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                                <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
                                <AnimatedCircle
                                    stroke="#fff" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
                                    strokeDasharray={circumference} strokeLinecap="round" rotation="-90"
                                    origin={`${size / 2}, ${size / 2}`}
                                    animatedProps={animatedCircleProps} fill="none"
                                />
                            </Svg>
                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Geist-Bold' }}>{level}</Text>
                        </View>

                        {/* Text Info */}
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.compactTitle}>{username}</Text>
                                {variant === 'compact' && <Crown size={14} color="#FFD700" fill="#FFD700" />}
                            </View>
                            <Text style={styles.compactSubtitle}>{unlockedCount} Achievements • {xp} XP</Text>
                        </View>

                        {/* Arrow */}
                        <View style={{ opacity: 0.5 }}>
                            <Trophy size={20} color="#fff" />
                        </View>
                    </LinearGradient>
                </Wrapper>
            </Animated.View>
        );
    }

    return (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.container, { marginBottom: 24, marginHorizontal: 20 }]}>
            <Wrapper
                onPress={onPress}
                activeOpacity={0.9}
                style={{ borderRadius: 32 }}
            >
                <LinearGradient
                    colors={[Colors.primary, Colors.primary + 'CC']}
                    style={[styles.card, Styles.shadow, { shadowColor: Colors.primary }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Background Decor */}
                    <View style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                        <Crown size={120} color="#fff" />
                    </View>

                    <View style={styles.content}>
                        {/* Left: Level Ring */}
                        <View style={styles.chartWrapper}>
                            <Svg width={size} height={size}>
                                <Defs>
                                    <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                        <Stop offset="0" stopColor="#fff" stopOpacity="1" />
                                        <Stop offset="1" stopColor="#fff" stopOpacity="0.8" />
                                    </SvgGradient>
                                </Defs>
                                {/* Background Track */}
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                />
                                {/* Progress Arc */}
                                <AnimatedCircle
                                    stroke="url(#grad)"
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeLinecap="round"
                                    rotation="-90"
                                    origin={`${size / 2}, ${size / 2}`}
                                    animatedProps={animatedCircleProps}
                                    fill="none"
                                />
                            </Svg>

                            <View style={styles.levelInfo}>
                                <Text style={styles.levelLabel}>LEVEL</Text>
                                <Text style={styles.levelNumber}>{level}</Text>
                            </View>
                        </View>

                        {/* Right: Stats */}
                        <View style={styles.stats}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Text style={styles.rankTitle}>{username}</Text>
                                    <Sparkles size={16} color="#FFD700" fill="#FFD700" />
                                </View>
                                <Text style={styles.xpText}>{xp} XP / {nextLevelXp} XP</Text>
                            </View>

                            <View style={styles.badgesRow}>
                                <View style={styles.miniStat}>
                                    <Trophy size={14} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.miniStatText}>{unlockedCount} Unlocked</Text>
                                </View>
                                <View style={styles.miniStat}>
                                    <Star size={14} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.miniStatText}>Top 10%</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </Wrapper>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        marginTop: 5,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        overflow: 'hidden',
    },
    compactCard: {
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    chartWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelInfo: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontFamily: 'Geist-Bold',
        letterSpacing: 1,
    },
    levelNumber: {
        color: '#fff',
        fontSize: 32,
        fontFamily: 'Geist-Bold',
        letterSpacing: -1,
        lineHeight: 38,
    },
    stats: {
        flex: 1,
        justifyContent: 'space-between',
        height: 90,
        paddingVertical: 4,
    },
    rankTitle: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Geist-Bold',
        letterSpacing: -0.5,
    },
    xpText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    },
    compactTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Geist-Bold',
    },
    compactSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontFamily: 'Geist-Medium',
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 12,
    },
    miniStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    miniStatText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'Geist-SemiBold',
    },
});
