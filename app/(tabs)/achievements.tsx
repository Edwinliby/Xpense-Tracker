import { AchievementBadge } from '@/components/AchievementBadge';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { AchievementCategory } from '@/types/achievements';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

    const unlockedCount = achievements.filter(a => a.unlockedAt).length;

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
                <Text style={[Styles.title, { marginBottom: 4 }]}>Achievements</Text>
                <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                    {unlockedCount} of {achievements.length} unlocked
                </Text>
            </View>

            {/* Filter Tabs */}
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

            {/* Achievements List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {filteredAchievements.map(achievement => (
                    <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}

                {filteredAchievements.length === 0 && (
                    <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                        No achievements in this category yet.
                    </Text>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    filterContainer: {
        flexGrow: 0,
        marginBottom: 16,
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
});
