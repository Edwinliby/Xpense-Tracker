import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInAsGuest, signInWithGoogle } = useAuth();
    const { showAlert } = useAlert();
    const { colorScheme } = useTheme();
    const Colors = useThemeColor();

    const backgroundGradient = colorScheme === 'dark'
        ? ['#2c2c2e', '#000000'] as [string, string] // Dark mode: Lighter gray to black
        : ['#ffffff', '#f0f2f5'] as [string, string]; // Light mode: White to very light gray

    const handleSignIn = async () => {
        if (!email || !password) {
            showAlert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            showAlert('Login Failed', error.message);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);
        if (error) {
            showAlert('Google Sign In Failed', error.message || 'Something went wrong');
        }
    };

    return (
        <LinearGradient colors={backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.card, { backgroundColor: Colors.surfaceHighlight }]}>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.logoContainer, { backgroundColor: Colors.background }]}>
                                <Image
                                    source={require('../../assets/images/android-icon-foreground.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={[styles.title, { color: Colors.text }]}>Sign in to your account</Text>
                        </View>

                        {/* Social Auth */}
                        <View style={styles.socialSection}>
                            <TouchableOpacity style={[styles.socialButton, { backgroundColor: Colors.background }]} onPress={handleGoogleSignIn}>
                                {/* Placeholder for Google Icon */}
                                <Text style={{ fontSize: 18, fontFamily: 'Geist-Bold', color: '#EA4335', marginRight: 10 }}>G</Text>
                                <Text style={[styles.socialButtonText, { color: Colors.text }]}>Sign In With Google</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Email Form */}
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

                            <View style={styles.passwordContainer}>
                                <Input
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    containerStyle={styles.inputContainer}
                                    style={{ backgroundColor: Colors.background, borderWidth: 0 }}
                                    inputStyle={{ color: Colors.text }}
                                    placeholderTextColor={Colors.textSecondary}
                                />
                            </View>

                            <Link href="/auth/forgot-password" asChild>
                                <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: -12, marginBottom: 24 }}>
                                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                                </TouchableOpacity>
                            </Link>

                            <Button
                                title={loading ? "Signing In..." : "Continue"}
                                onPress={handleSignIn}
                                disabled={loading}
                                size="large"
                                style={[styles.continueButton, { backgroundColor: Colors.text }]}
                                textStyle={[styles.continueButtonText, { color: Colors.background }]}
                                useGradient={false}
                            />
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: Colors.textSecondary }]}>Don&apos;t have an account? </Text>
                            <Link href="/auth/register" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.signupLink, { color: Colors.text }]}>Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        {/* Guest (Hidden/Subtle) */}
                        <TouchableOpacity onPress={signInAsGuest} style={{ marginTop: 20, alignSelf: 'center' }}>
                            <Text style={[styles.guestLink]}>
                                Continue as Guest
                            </Text>
                        </TouchableOpacity>

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
        textAlign: 'center',
    },
    socialSection: {
        marginBottom: 24,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 25,
    },
    socialButtonText: {
        fontFamily: 'Geist-Medium',
        fontSize: 15,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#3A3A3C',
    },
    dividerText: {
        color: '#8E8E93',
        marginHorizontal: 12,
        fontSize: 13,
        fontFamily: 'Geist-Regular',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    passwordContainer: {
        marginBottom: 16,
    },
    forgotPassword: {
        color: '#8E8E93',
        fontSize: 13,
        fontFamily: 'Geist-Regular',
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
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        fontFamily: 'Geist-Regular',
    },
    signupLink: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
        textDecorationLine: 'underline',
    },
    guestLink: {
        color: '#8E8E93',
        fontSize: 13,
        fontFamily: 'Geist-Medium',
    }
});
