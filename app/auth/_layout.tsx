import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Create Account', headerBackTitle: 'Back' }} />
            <Stack.Screen name="forgot-password" options={{ title: 'Reset Password', headerBackTitle: 'Back' }} />
        </Stack>
    );
}
