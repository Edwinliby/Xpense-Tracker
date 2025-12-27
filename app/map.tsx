import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

export default function MapScreen() {
    const { transactions, currencySymbol } = useExpense();
    const Colors = useThemeColor();
    const { theme } = useTheme();
    const router = useRouter();

    const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

    // Filter transactions with location
    const mapTransactions = useMemo(() => {
        return transactions.filter(t => t.latitude && t.longitude && !t.deletedAt);
    }, [transactions]);

    // Calculate initial region
    const initialRegion = useMemo(() => {
        if (mapTransactions.length === 0) return null;

        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        mapTransactions.forEach(t => {
            if (t.latitude! < minLat) minLat = t.latitude!;
            if (t.latitude! > maxLat) maxLat = t.latitude!;
            if (t.longitude! < minLon) minLon = t.longitude!;
            if (t.longitude! > maxLon) maxLon = t.longitude!;
        });

        const midLat = (minLat + maxLat) / 2;
        const midLon = (minLon + maxLon) / 2;
        const deltaLat = (maxLat - minLat) * 1.5 || 0.05;
        const deltaLon = (maxLon - minLon) * 1.5 || 0.05;

        return {
            latitude: midLat,
            longitude: midLon,
            latitudeDelta: Math.max(0.01, deltaLat),
            longitudeDelta: Math.max(0.01, deltaLon),
        };
    }, [mapTransactions]);

    const darkMapStyle = [
        {
            "elementType": "geometry",
            "stylers": [{ "color": "#242f3e" }]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#746855" }]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#242f3e" }]
        },
        {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
        },
        {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{ "color": "#263c3f" }]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#6b9a76" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#38414e" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#212a37" }]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9ca5b3" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#746855" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#1f2835" }]
        },
        {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#f3d19c" }]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#17263c" }]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#515c6d" }]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#17263c" }]
        }
    ];

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                customMapStyle={theme === 'dark' ? darkMapStyle : []}
                initialRegion={initialRegion || {
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
            >
                {mapTransactions.map((t) => (
                    <Marker
                        key={t.id}
                        coordinate={{ latitude: t.latitude!, longitude: t.longitude! }}
                        onPress={() => setSelectedTransaction(t.id)}
                    >
                        <View style={{
                            backgroundColor: t.type === 'expense' ? Colors.danger : Colors.success,
                            padding: 5,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: '#fff',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30
                        }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>
                                {currencySymbol}
                            </Text>
                        </View>
                        <Callout tooltip>
                            <View style={[styles.callout, { backgroundColor: Colors.surface }]}>
                                <Text style={[styles.calloutTitle, { color: Colors.text }]}>{t.category}</Text>
                                <Text style={[styles.calloutAmount, { color: t.type === 'expense' ? Colors.danger : Colors.success }]}>
                                    {currencySymbol}{t.amount.toFixed(2)}
                                </Text>
                                <Text style={[styles.calloutDate, { color: Colors.textSecondary }]}>
                                    {format(new Date(t.date), 'MMM d, yyyy')}
                                </Text>
                                {t.locationName && (
                                    <Text style={[styles.calloutLoc, { color: Colors.textSecondary }]}>
                                        {t.locationName}
                                    </Text>
                                )}
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            <TouchableOpacity
                style={[styles.backButton, { backgroundColor: Colors.surface }]}
                onPress={() => router.back()}
            >
                <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>

            <View style={[styles.headerCard, { backgroundColor: Colors.surface }]}>
                <Text style={[styles.headerTitle, { color: Colors.text }]}>Spending Map</Text>
                <Text style={[styles.headerSub, { color: Colors.textSecondary }]}>
                    {mapTransactions.length} locations found
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 12,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    headerCard: {
        position: 'absolute',
        top: 50,
        left: 80,
        right: 20,
        padding: 12,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerSub: {
        fontSize: 12,
    },
    callout: {
        padding: 12,
        borderRadius: 12,
        minWidth: 140,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    calloutAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    calloutDate: {
        fontSize: 10,
    },
    calloutLoc: {
        fontSize: 10,
        marginTop: 2,
        fontStyle: 'italic',
        maxWidth: 120,
        textAlign: 'center',
    }
});
