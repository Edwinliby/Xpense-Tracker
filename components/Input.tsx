import { useThemeColor } from '@/hooks/useThemeColor';
import * as Icons from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    prefix?: string | React.ReactNode;
    icon?: keyof typeof Icons;
    inputStyle?: any; // Allow custom text styling
    containerStyle?: any;
}

export const Input: React.FC<InputProps> = ({ label, error, style, prefix, icon, inputStyle, containerStyle, ...props }) => {
    const Colors = useThemeColor();
    const IconComponent = icon ? (Icons as any)[icon] : null;

    return (
        <View style={[styles.container, containerStyle]}>
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
                {IconComponent && (
                    <View style={{ marginRight: 8, opacity: 0.5 }}>
                        <IconComponent size={20} color={Colors.text} />
                    </View>
                )}
                {prefix && (
                    <Text style={[styles.prefix, { color: props.placeholderTextColor || Colors.text }]}>{prefix}</Text>
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: Colors.text,
                        },
                        inputStyle
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
        fontFamily: 'Geist-Medium',
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
        fontFamily: 'Geist-SemiBold',
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: 'Geist-Regular',
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'Geist-Regular',
    },
});
