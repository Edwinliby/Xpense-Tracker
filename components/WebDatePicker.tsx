import { useThemeColor } from '@/hooks/useThemeColor';
import { format } from 'date-fns';
import React from 'react';
import { Platform } from 'react-native';

interface WebDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export const WebDatePicker: React.FC<WebDatePickerProps> = ({ value, onChange }) => {
    const Colors = useThemeColor();

    if (Platform.OS !== 'web') {
        return null;
    }

    // We cast to any because direct HTML elements aren't typed in RN files by default
    // preventing TS errors while working correctly on web.
    const Input = 'input' as any;

    return (
        <Input
            type="date"
            value={format(value, 'yyyy-MM-dd')}
            onChange={(e: any) => {
                const dateString = e.target.value;
                if (dateString) {
                    const [y, m, d] = dateString.split('-').map(Number);
                    // Construct date using local time
                    onChange(new Date(y, m - 1, d));
                }
            }}
            style={{
                border: 'none',
                background: 'transparent',
                color: Colors.text,
                fontSize: 16,
                fontFamily: 'Geist-Medium, sans-serif',
                outline: 'none',
                width: '100%',
                padding: 0,
                height: 24, // Matches typical line height
                marginTop: 0,
                cursor: 'pointer',
                appearance: 'none', // Standard
                WebkitAppearance: 'none', // Safari/Chrome
                MozAppearance: 'none', // Firefox
            }}
        />
    );
};
