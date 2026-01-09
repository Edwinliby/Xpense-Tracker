import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();
    const { showAlert } = useAlert();

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            showAlert('Error', 'Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('Error', 'Passwords do not match');
            return;
        }
        setLoading(true);
        const { data, error } = await signUp(email, password);
        setLoading(false);

        if (error) {
            showAlert('Registration Failed', error.message);
        } else if (!data?.session) {
            showAlert('Success', 'Please check your email to verify your account.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Header Section with Logo */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/android-icon-foreground.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Join us and start tracking your expenses
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

                        <View style={{ height: 16 }} />

                        <Input
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            icon="Lock"
                        />

                        <View style={{ marginTop: 32 }}>
                            <Button
                                title={loading ? "Creating Account..." : "Sign Up"}
                                onPress={handleSignUp}
                                disabled={loading}
                                size="large"
                            />
                        </View>
                    </View>

                    {/* Footer Section */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Already have an account?
                        </Text>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.signinLink, { color: colors.primary }]}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        justifyContent: 'center',
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
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
    signinLink: {
        fontSize: 14,
        fontFamily: 'Geist-SemiBold',
    },
});
