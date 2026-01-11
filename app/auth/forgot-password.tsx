import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();
    const { colorScheme } = useTheme();
    const router = useRouter();
    const { showAlert } = useAlert();
    const Colors = useThemeColor();

    const backgroundGradient = colorScheme === 'dark'
        ? ['#2c2c2e', '#000000'] as [string, string]
        : ['#ffffff', '#f0f2f5'] as [string, string];

    const handleReset = async () => {
        if (!email) {
            showAlert('Error', 'Please enter your email');
            return;
        }
        setLoading(true);
        const { error } = await forgotPassword(email);
        setLoading(false);

        if (error) {
            showAlert('Error', error.message);
        } else {
            showAlert('Success', 'Password reset instructions have been sent to your email.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    };

    return (
        <LinearGradient colors={backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ headerShown: false }} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.card, { backgroundColor: Colors.surfaceHighlight }]}>

                        {/* Header Section with Logo */}
                        <View style={styles.header}>
                            <View style={[styles.logoContainer, { backgroundColor: Colors.background }]}>
                                <Image
                                    source={require('../../assets/images/android-icon-foreground.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={[styles.title, { color: Colors.text }]}>Reset Password</Text>
                            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                                Enter your email to receive instructions
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.form}>
                            <Input
                                placeholder="Email address"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                containerStyle={styles.inputContainer}
                                style={{ backgroundColor: Colors.background, borderWidth: 0 }}
                                inputStyle={{ color: Colors.text }}
                                placeholderTextColor={Colors.textSecondary}
                            />

                            <View style={{ marginTop: 16 }}>
                                <Button
                                    title={loading ? "Sending..." : "Send Instructions"}
                                    onPress={handleReset}
                                    disabled={loading}
                                    size="large"
                                    style={[styles.continueButton, { backgroundColor: Colors.text }]}
                                    textStyle={[styles.continueButtonText, { color: Colors.background }]}
                                    useGradient={false}
                                />
                            </View>
                        </View>

                        {/* Footer Section */}
                        <View style={styles.footer}>
                            <Link href="/auth/login" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.backLink, { color: Colors.textSecondary }]}>
                                        ← Back to Sign In
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 16,
    },
    card: {
        marginHorizontal: 20,
        borderRadius: 32,
        padding: 20,
        paddingTop: 40,
        paddingBottom: 32,
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden'
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Geist-SemiBold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Geist-Regular',
        textAlign: 'center',
        opacity: 0.8,
        marginHorizontal: 20,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    continueButton: {
        borderRadius: 25,
        height: 50,
        marginTop: 8,
    },
    continueButtonText: {
        fontFamily: 'Geist-Bold',
        fontSize: 16,
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    backLink: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
    },
});
