import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Stop the splash screen from hiding until auth is ready or similar (optional, not adding here)

WebBrowser.maybeCompleteAuthSession(); // Required for web redirect handling

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any; data: any }>;
    signOut: () => Promise<void>;
    forgotPassword: (email: string) => Promise<{ error: any }>;
    isGuest: boolean;
    signInAsGuest: () => Promise<void>;
    signInWithGoogle: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null, data: null }),
    signOut: async () => { },
    forgotPassword: async () => ({ error: null }),
    isGuest: false,
    signInAsGuest: async () => { },
    signInWithGoogle: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Check for guest mode first
            const guestMode = await AsyncStorage.getItem('guest_mode');
            if (guestMode === 'true') {
                setIsGuest(true);
                setLoading(false);
                return;
            }

            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setLoading(false);
            });
        };
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isGuest) { // Only update session if not in guest mode (or force logout if session expired?)
                setSession(session);
                setLoading(false);
            }
        });

        // Refresh session when app comes to foreground
        const subscriptionAppState = AppState.addEventListener('change', (state) => {
            if (state === 'active' && !isGuest) {
                supabase.auth.startAutoRefresh();
            } else {
                supabase.auth.stopAutoRefresh();
            }
        });

        return () => {
            subscription.unsubscribe();
            subscriptionAppState.remove();
        };
    }, [isGuest]); // Re-run if isGuest changes? No, mainly on mount. But keep an eye on dependency.

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { data, error };
    };

    const signOut = async () => {
        if (isGuest) {
            setIsGuest(false);
            await AsyncStorage.removeItem('guest_mode');
            setSession(null);
        } else {
            await supabase.auth.signOut();
        }
    };

    const signInAsGuest = async () => {
        setIsGuest(true);
        await AsyncStorage.setItem('guest_mode', 'true');
    };

    const forgotPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error };
    };

    const signInWithGoogle = async () => {
        try {
            const redirectUrl = makeRedirectUri({
                path: 'auth/callback',
                scheme: 'expensetracker',
            });

            console.log('Redirecting to:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    // Extract tokens from the URL
                    // Supabase redirects with #access_token=...&refresh_token=...
                    // We need to parse this.
                    const { url } = result;

                    // Simple parsing for fragment parameters
                    let params: any = {};
                    const extractParams = (paramStr: string) => {
                        paramStr.split('&').forEach(part => {
                            const [key, value] = part.split('=');
                            if (key && value) {
                                params[key] = decodeURIComponent(value);
                            }
                        });
                    }

                    if (url.includes('#')) {
                        extractParams(url.split('#')[1]);
                    }
                    // Fallback to query params if configured that way
                    if (Object.keys(params).length === 0 && url.includes('?')) {
                        extractParams(url.split('?')[1]);
                    }

                    const { access_token, refresh_token } = params;

                    if (access_token && refresh_token) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        if (sessionError) throw sessionError;
                    }
                }
            }
            return { error: null };
        } catch (error) {
            console.error('Google Sign In Error:', error);
            return { error };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: isGuest ? { id: 'auth-guest', email: 'guest@local', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } as User : session?.user ?? null,
                loading,
                signIn,
                signUp,
                signOut,
                forgotPassword,
                isGuest,
                signInAsGuest,
                signInWithGoogle,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
