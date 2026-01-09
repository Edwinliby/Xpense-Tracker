import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const { showAlert } = useAlert();
    const { colors } = useTheme();

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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={[styles.content]}>

                    {/* Header Section with Logo */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/android-icon-foreground.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Sign in to access your dashboard
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <Input
                            label="Email Address"
                            placeholder="hello@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            icon="Mail"
                        />

                        <View style={{ height: 16 }} />

                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon="Lock"
                        />

                        <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
                            <Link href="/auth/forgot-password" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                                        Forgot Password?
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        <View style={{ marginTop: 32 }}>
                            <Button
                                title={loading ? "Signing In..." : "Sign In"}
                                onPress={handleSignIn}
                                disabled={loading}
                                size="large"
                            />
                        </View>
                    </View>

                    {/* Footer Section */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Don&apos;t have an account?
                        </Text>
                        <Link href="/auth/register" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.signupLink, { color: colors.primary }]}>Create Account</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Geist-Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Geist-Regular',
        textAlign: 'center',
        opacity: 0.8,
    },
    form: {
        width: '100%',
    },
    forgotPassword: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        gap: 6,
    },
    footerText: {
        fontSize: 14,
        fontFamily: 'Geist-Regular',
    },
    signupLink: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
    },
});
