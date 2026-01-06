import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }
        setLoading(true);
        const { error } = await forgotPassword(email);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Password reset instructions have been sent to your email.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.content}>

                    {/* Header Section with Logo */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/android-icon-foreground.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Enter your email to receive instructions
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

                        <View style={{ marginTop: 32 }}>
                            <Button
                                title={loading ? "Sending..." : "Send Instructions"}
                                onPress={handleReset}
                                disabled={loading}
                                size="large"
                            />
                        </View>
                    </View>

                    {/* Footer Section */}
                    <View style={styles.footer}>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.backLink, { color: colors.textSecondary }]}>
                                    ← Back to Sign In
                                </Text>
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
        alignItems: 'center',
        marginTop: 40,
    },
    backLink: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
    },
});
