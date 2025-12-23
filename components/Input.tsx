import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    prefix?: string | React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, style, prefix, ...props }) => {
    const Colors = useThemeColor();

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: Colors.textSecondary }]}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: Colors.surfaceHighlight,
                    borderColor: error ? Colors.danger : 'transparent',
                    borderWidth: 1,
                },
                style as any
            ]}>
                {prefix && (
                    <Text style={[styles.prefix, { color: Colors.text }]}>{prefix}</Text>
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: Colors.text,
                        }
                    ]}
                    placeholderTextColor={Colors.textSecondary}
                    {...props}
                />
            </View>
            {error && <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    prefix: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
});
