import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { WebContainer } from '@/components/WebContainer';
import { Colors } from '@/constants/Colors';
import { AlertProvider } from '@/context/AlertContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { ExpenseProvider } from '../store/expenseStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Geist-Regular': require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Bold': require('../assets/fonts/Geist-Bold.ttf'),
    'Geist-Black': require('../assets/fonts/Geist-Black.ttf'),
    'Geist-Light': require('../assets/fonts/Geist-Light.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <AlertProvider>
            <ExpenseProvider>
              <AppContent />
            </ExpenseProvider>
          </AlertProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {

  const { colorScheme } = useTheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const CustomLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      text: Colors.light.text,
      card: Colors.light.surface,
      border: Colors.light.border,
      primary: Colors.light.primary,
    },
  };

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      text: Colors.dark.text,
      card: Colors.dark.surface,
      border: Colors.dark.border,
      primary: Colors.dark.primary,
    },
  };

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <WebContainer>
        <OfflineIndicator />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen
            name="add"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false
            }}
          />
          <Stack.Screen name="search" options={{ headerShown: false, animation: 'ios_from_right' }} />

          <Stack.Screen name="trash" options={{ headerShown: false, animation: 'ios_from_right' }} />
          <Stack.Screen name="export" options={{ headerShown: false, animation: 'ios_from_right' }} />
          <Stack.Screen name="manage-account" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </WebContainer>
    </NavigationThemeProvider>
  );
}