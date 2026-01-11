import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useStyles } from '@/constants/Styles';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpense } from '@/store/expenseStore';
import { router, Stack } from 'expo-router';
import { debounce } from 'lodash';
import * as Icons from 'lucide-react-native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccountInfoScreen() {
    const Styles = useStyles();
    const Colors = useThemeColor();
    const { username, setUsername, purgeData } = useExpense();
    const { signOut, user } = useAuth();
    const { showAlert } = useAlert();

    const [usernameInput, setUsernameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [, setIsSaving] = useState(false);

    useEffect(() => {
        setUsernameInput(username);
        // If user object has email, populate it, otherwise empty
        // Assuming user might be an object with email property
        if (user && 'email' in user) {
            setEmailInput((user as any).email);
        }
    }, [username, user]);

    const debouncedSaveUsername = React.useMemo(
        () => debounce((value: string) => {
            if (value.trim()) {
                setIsSaving(true);
                setUsername(value.trim());
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 1000),
        [setUsername]
    );

    const handleUsernameChange = (text: string) => {
        setUsernameInput(text);
        debouncedSaveUsername(text);
    };

    const handleResetData = () => {
        showAlert(
            'Reset App Data',
            'This will permanently delete ALL transactions, categories, and settings. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                        await purgeData();
                        showAlert('Success', 'App data has been reset.');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        showAlert(
            'Delete Account',
            'Are you sure you want to delete your account? This will permanently remove all your data associated with this account.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => {
                        setTimeout(() => {
                            showAlert(
                                'Final Warning',
                                'This action CANNOT be undone. All your transactions, goals, and history will be lost forever. Are you absolutely sure?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Yes, Delete Account',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await purgeData(true);
                                                try { await signOut(); } catch { /* ignore */ }
                                                router.replace('/auth/login');
                                            } catch (error) {
                                                console.error("Error deleting account:", error);
                                                showAlert("Error", "Failed to delete account data. Please try again.");
                                            }
                                        }
                                    }
                                ]
                            );
                        }, 500);
                    }
                }
            ]
        );
    };

    return (
        <View style={[Styles.container, { backgroundColor: Colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ backgroundColor: Colors.surface, padding: 8, borderRadius: 12 }}
                >
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[Styles.title, { marginBottom: 0, fontFamily: 'Geist-Bold', fontSize: 24, letterSpacing: -1 }]}>Account Info</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Profile Section */}
                <View style={[styles.section, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: Colors.textSecondary }]}>Username</Text>
                        <Input
                            value={usernameInput}
                            onChangeText={handleUsernameChange}
                            placeholder="Enter username"
                            containerStyle={{ marginBottom: 0 }}
                            style={{ backgroundColor: Colors.surfaceHighlight, borderWidth: 0 }}
                            inputStyle={{ color: Colors.text, fontSize: 16 }}
                            placeholderTextColor={Colors.textSecondary}
                        />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: Colors.textSecondary }]}>Email</Text>
                        <Input
                            value={emailInput}
                            onChangeText={setEmailInput}
                            placeholder="Enter email"
                            editable={false} // Often email is not editable directly
                            containerStyle={{ marginBottom: 0 }}
                            style={{ backgroundColor: Colors.surfaceHighlight, borderWidth: 0, opacity: 0.7 }}
                            inputStyle={{ color: Colors.text, fontSize: 16 }}
                            placeholderTextColor={Colors.textSecondary}
                        />
                        <Text style={[styles.helperText, { color: Colors.textSecondary }]}>
                            Email cannot be changed securely from here.
                        </Text>
                    </View>
                </View>

                {/* Danger Zone */}
                <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Danger Zone</Text>
                <View style={[styles.section, { backgroundColor: Colors.danger + '05', borderColor: Colors.danger + '20' }]}>
                    <Button
                        title="Reset App Data"
                        onPress={handleResetData}
                        variant="secondary"
                        style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 }}
                        textStyle={{ color: Colors.danger }}
                        icon={<Icons.RefreshCw size={18} color={Colors.danger} />}
                    />
                    <Text style={[styles.warningText, { color: Colors.textSecondary, marginBottom: 24 }]}>
                        This will delete only your local data on this device.
                    </Text>

                    <Button
                        title="Delete Account"
                        onPress={handleDeleteAccount}
                        variant="secondary"
                        style={{ backgroundColor: Colors.danger, borderWidth: 0 }}
                        textStyle={{ color: '#fff' }}
                        icon={<Icons.Trash2 size={18} color="#fff" />}
                    />
                    <Text style={[styles.warningText, { color: Colors.textSecondary, marginTop: 12 }]}>
                        This will permanently delete your account and all data.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    section: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Geist-Bold',
        marginBottom: 12,
        marginLeft: 4,
    },
    inputGroup: {
        marginBottom: 0,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Geist-Medium',
        marginBottom: 8,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 20,
    },
    helperText: {
        fontSize: 12,
        marginTop: 6,
        fontFamily: 'Geist-Regular',
    },
    warningText: {
        fontSize: 13,
        fontFamily: 'Geist-Regular',
        textAlign: 'center',
    },
});
