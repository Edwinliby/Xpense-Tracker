import { useExpense } from '@/store/expenseStore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineIndicator = () => {
    const { isOffline } = useExpense();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        if (isOffline) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 4000); // Dissapear after 4 seconds
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [isOffline]);

    if (!visible) return null;

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
