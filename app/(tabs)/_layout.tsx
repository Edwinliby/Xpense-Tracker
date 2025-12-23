import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, PieChart, Plus, Settings, Trophy } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const Colors = useThemeColor();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 20,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: Colors.surface,
          borderRadius: 25,
          height: 60,
          borderTopWidth: 0,
          // Custom Shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          height: 60,
          padding: 0,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <PieChart size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="plus"
        options={{
          title: 'Add',
          tabBarIcon: () => null,
          tabBarButton: (props) => {
            const { onLongPress, accessibilityLabel } = props;
            return (
              <TouchableOpacity
                onPress={(e) => {
                  e.preventDefault();
                  router.push('/add');
                }}
                onLongPress={onLongPress || undefined}
                accessibilityLabel={accessibilityLabel}
                activeOpacity={0.9}
                style={styles.addButtonContainer}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.addButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={30} color="#fff" strokeWidth={3} />
                </LinearGradient>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    position: 'absolute',
    bottom: -8,
  },
  addButtonContainer: {
    top: -20,
    left: '50%',
    transform: [{ translateX: -30 }], 
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for button
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  }
});
