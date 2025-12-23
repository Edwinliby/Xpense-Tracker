import { useExpense } from '@/store/expenseStore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineIndicator = () => {
    const { isOffline } = useExpense();
    const insets = useSafeAreaInsets();

    if (!isOffline) return null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.text}>You are currently offline. Changes will sync when online.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ef4444',
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
    text: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
