import { CategoryManager } from '@/components/CategoryManager';
import { useStyles } from '@/constants/Styles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
    const Styles = useStyles();
    const Colors = useThemeColor();
    const router = useRouter();

    return (
        <SafeAreaView style={Styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[Styles.header, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ backgroundColor: Colors.surface, padding: 8, borderRadius: 12 }}
                >
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 24, letterSpacing: -1 }]}>Categories</Text>
            </View>


            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 24, fontFamily: 'Geist-Regular' }}>
                    Manage your expense categories. Tap to delete custom categories.Predefined categories cannot be removed.
                </Text>

                <CategoryManager />
            </ScrollView>
        </SafeAreaView>
    );
}


