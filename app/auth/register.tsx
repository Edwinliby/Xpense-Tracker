import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsernameInput] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const { colorScheme } = useTheme();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { setUsername } = useExpense();
    const Colors = useThemeColor();

    const backgroundGradient = colorScheme === 'dark'
        ? ['#2c2c2e', '#000000'] as [string, string]
        : ['#ffffff', '#f0f2f5'] as [string, string];

    const handleSignUp = async () => {
        if (!email || !password) {
            showAlert('Error', 'Please fill in all fields (Username is optional)');
            return;
        }
        setLoading(true);
        const { data, error } = await signUp(email, password);

        if (data?.session && !error) {
            setUsername(username.trim() || 'Guest');
        }

        setLoading(false);

        if (error) {
            showAlert('Registration Failed', error.message);
        } else if (!data?.session) {
            showAlert('Success', 'Please check your email to verify your account.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();

        // If success, we might want to ask for username? 
        // For now, default to name in Google profile or Guest.
        // We can handle that in AuthContext or here if session is set.
        // But navigation will happen automatically if auth state changes.

        setLoading(false);
        if (error) {
            showAlert('Google Sign Up Failed', error.message || 'Something went wrong');
        }
    };

    return (
        <LinearGradient colors={backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ headerShown: false }} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
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
                                <Text style={[styles.title, { color: Colors.text }]}>Create an account</Text>
                            </View>

                            {/* Social Auth */}
                            <View style={styles.socialSection}>
                                <TouchableOpacity style={[styles.socialButton, { backgroundColor: Colors.background }]} onPress={handleGoogleSignIn}>
                                    <Text style={{ fontSize: 18, fontFamily: 'Geist-Bold', color: '#EA4335', marginRight: 10 }}>G</Text>
                                    <Text style={[styles.socialButtonText, { color: Colors.text }]}>Sign Up With Google</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Divider */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>Or continue with</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Form */}
                            <View style={styles.form}>
                                <Input
                                    placeholder="Username (Optional)"
                                    value={username}
                                    onChangeText={setUsernameInput}
                                    autoCapitalize="words"
                                    containerStyle={styles.inputContainer}
                                    style={{ backgroundColor: Colors.background, borderWidth: 0 }}
                                    inputStyle={{ color: Colors.text }}
                                    placeholderTextColor={Colors.textSecondary}
                                />

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

                                {/* <View style={{ marginTop: 8 }}>
                                    <Text style={styles.termsText}>
                                        I accept and agree to comply with Terms and Conditions and Privacy policy
                                    </Text>
                                </View> */}

                                <Button
                                    title={loading ? "Creating Account..." : "Sign Up"}
                                    onPress={handleSignUp}
                                    disabled={loading}
                                    size="large"
                                    style={[styles.continueButton, { backgroundColor: Colors.text }]}
                                    textStyle={[styles.continueButtonText, { color: Colors.background }]}
                                    useGradient={false}
                                />
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={[styles.footerText, { color: Colors.textSecondary }]}>Already have an account? </Text>
                                <Link href="/auth/login" asChild>
                                    <TouchableOpacity>
                                        <Text style={[styles.signupLink, { color: Colors.text }]}>Sign In</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>

                        </View>
                    </ScrollView>
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
        marginVertical: 20,
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
    termsText: {
        color: '#8E8E93',
        fontSize: 12,
        fontFamily: 'Geist-Regular',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    continueButton: {
        borderRadius: 25,
        height: 50,
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
});
