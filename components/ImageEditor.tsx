import { Button } from '@/components/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { RotateCw, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImageEditorProps {
    visible: boolean;
    imageUri: string | null;
    onSave: (editedUri: string) => void;
    onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ImageEditor: React.FC<ImageEditorProps> = ({ visible, imageUri, onSave, onCancel }) => {
    const Colors = useThemeColor();
    const [rotation, setRotation] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleSave = async () => {
        if (!imageUri) return;

        setIsProcessing(true);
        try {
            const actions: ImageManipulator.Action[] = [];

            // Add rotation if needed
            if (rotation !== 0) {
                actions.push({ rotate: rotation });
            }

            // Only manipulate if there are actions to perform
            if (actions.length > 0) {
                const result = await ImageManipulator.manipulateAsync(
                    imageUri,
                    actions,
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );
                onSave(result.uri);
            } else {
                onSave(imageUri);
            }

            // Reset rotation state
            setRotation(0);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setRotation(0);
        onCancel();
    };

    if (!imageUri) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleCancel}
        >
            <View style={[styles.container, { backgroundColor: Colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: Colors.text }]}>Edit Receipt</Text>
                    <TouchableOpacity onPress={handleCancel}>
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUri }}
                        style={[
                            styles.image,
                            {
                                transform: [{ rotate: `${rotation}deg` }],
                            },
                        ]}
                        contentFit="contain"
                    />
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
                        onPress={handleRotate}
                        disabled={isProcessing}
                    >
                        <RotateCw size={24} color={Colors.text} />
                        <Text style={[styles.controlButtonText, { color: Colors.text }]}>Rotate</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Cancel"
                        onPress={handleCancel}
                        variant="secondary"
                        style={{ flex: 1, marginRight: 10 }}
                        disabled={isProcessing}
                    />
                    <Button
                        title={isProcessing ? 'Processing...' : 'Save'}
                        onPress={handleSave}
                        style={{ flex: 1 }}
                        disabled={isProcessing}
                    />
                </View>

                {isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={[styles.loadingText, { color: Colors.text }]}>Processing image...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    image: {
        width: SCREEN_WIDTH - 40,
        height: '100%',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    controlButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
