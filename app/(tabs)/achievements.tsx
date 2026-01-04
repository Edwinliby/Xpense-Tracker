import { AchievementBadge } from '@/components/AchievementBadge';
import { UserLevelWidget } from '@/components/UserLevelWidget';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { AchievementCategory } from '@/types/achievements';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AchievementsScreen() {
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { achievements } = useExpense();
    const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');

    const filteredAchievements = useMemo(() => {
        const filtered = filter === 'all'
            ? achievements
            : achievements.filter(a => a.category === filter);

        // Sort: unlocked first, then by progress
        return filtered.sort((a, b) => {
            if (a.unlockedAt && !b.unlockedAt) return -1;
            if (!a.unlockedAt && b.unlockedAt) return 1;
            if (!a.unlockedAt && !b.unlockedAt) {
                return (b.progress || 0) - (a.progress || 0);
            }
            return 0;
        });
    }, [achievements, filter]);


    const filters: { label: string; value: AchievementCategory | 'all' }[] = [
        { label: 'All', value: 'all' },
        { label: 'Savings', value: 'savings' },
        { label: 'Spending', value: 'spending' },
        { label: 'Streak', value: 'streak' },
        { label: 'Milestone', value: 'milestone' },
    ];

    return (
        <SafeAreaView style={Styles.container}>
            <View style={Styles.header}>
                <Text style={[Styles.title, { marginBottom: 4, fontFamily: 'Geist-Bold', fontSize: 28, letterSpacing: -1 }]}>Achievements</Text>
            </View>

            {/* Level Widget */}
            <UserLevelWidget achievements={achievements} />

            {/* Filter Tabs */}
            <View style={{ paddingBottom: 16 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContent}
                >
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f.value}
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor: filter === f.value ? Colors.primary : Colors.surface,
                                    borderColor: filter === f.value ? Colors.primary : Colors.border,
                                    shadowColor: filter === f.value ? Colors.primary : 'transparent',
                                    shadowOpacity: filter === f.value ? 0.3 : 0,
                                    shadowRadius: 8,
                                    elevation: filter === f.value ? 4 : 0
                                },
                            ]}
                            onPress={() => setFilter(f.value)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: filter === f.value ? '#fff' : Colors.text },
                                ]}
                            >
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Achievements List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
                {filteredAchievements.map((achievement, index) => (
                    <Animated.View
                        key={achievement.id}
                        entering={FadeInDown.delay(index * 50 + 200).springify()} // Staggered entry
                    >
                        <AchievementBadge achievement={achievement} />
                    </Animated.View>
                ))}

                {filteredAchievements.length === 0 && (
                    <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                        No achievements in this category yet.
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 13,
        marginBottom: 16,
        fontFamily: 'Geist-Medium',
    },
    filterContainer: {
        flexGrow: 0,
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 10,
        alignItems: 'center',
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterText: {
        fontSize: 13,
        fontFamily: 'Geist-SemiBold',
        letterSpacing: 0.3,
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 60,
        fontSize: 15,
        fontFamily: 'Geist-Regular',
        lineHeight: 24,
    },
});
