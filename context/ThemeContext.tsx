import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    colorScheme: ColorSchemeName;
    colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
    colorScheme: 'dark',
    colors: Colors.dark,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeType>('system');
    const systemColorScheme = _useColorScheme();
    const { user } = useAuth();

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme) {
                    setTheme(savedTheme as ThemeType);
                }

                if (user) {
                    const { data, error } = await supabase
                        .from('user_settings')
                        .select('value')
                        .eq('user_id', user.id)
                        .eq('key', 'theme')
                        .single();

                    if (data && !error) {
                        setTheme(data.value as ThemeType);
                        await AsyncStorage.setItem('theme', data.value);
                    }
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            }
        };
        loadTheme();
    }, [user]);

    const saveTheme = async (newTheme: ThemeType) => {
        try {
            setTheme(newTheme);
            await AsyncStorage.setItem('theme', newTheme);

            if (user) {
                const { error } = await supabase.from('user_settings').upsert({
                    key: 'theme',
                    value: newTheme,
                    user_id: user.id
                });
                if (error) console.error('Supabase save theme error', error);
            }
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const colorScheme = theme === 'system' ? systemColorScheme : theme;
    const activeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

    return (
        <ThemeContext.Provider value={{ theme, setTheme: saveTheme, colorScheme, colors: activeColors }}>
            {children}
        </ThemeContext.Provider>
    );
};
