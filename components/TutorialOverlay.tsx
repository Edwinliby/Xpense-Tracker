import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface TutorialStep {
    title: string;
    description: string;
    targetPosition: { top?: number; bottom?: number; left?: number; right?: number };
    arrowDirection: 'up' | 'down' | 'left' | 'right';
    arrowPercentage?: number; // 0-100, relative to card width/height
}

export interface TutorialOverlayProps {
    visible: boolean;
    onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ visible, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const Colors = useThemeColor();
    const { height } = useWindowDimensions();

    // Define steps dynamically to adapt to screen size if needed, 
    // but for now strict positioning based on typical UI layout
    // Assuming Phone Layout logic predominantly
    const STEPS: TutorialStep[] = [
        {
            title: "Welcome!",
            description: "Welcome to your new financial assistant. Let's take a quick tour around.",
            targetPosition: { top: height * 0.4 }, // Centered-ish
            arrowDirection: 'up', // No specific target, just a floater, but we'll use 'up' to hide or generic
            arrowPercentage: 50,
        },
        {
            title: "Dashboard",
            description: "Here you can see your monthly summary, budget status, and recent transactions.",
            targetPosition: { top: 120, left: 20, right: 20 },
            arrowDirection: 'up',
            arrowPercentage: 15, // Pointing near top left
        },
        {
            title: "Quick Add",
            description: "Tap the + button to quickly add expenses or income records.",
            targetPosition: { bottom: 120, left: 40, right: 40 },
            arrowDirection: 'down',
            arrowPercentage: 50, // Pointing to center bottom (FAB location)
        },
        {
            title: "Smart Analysis",
            description: "Switch between Monthly and Yearly views to get deeper insights.",
            targetPosition: { top: height * 0.55, left: 20, right: 20 },
            arrowDirection: 'down',
            arrowPercentage: 85, // Pointing roughly to where the view selector might be (bottom right of top section)
        }
    ];

    useEffect(() => {
        if (!visible) {
            setCurrentStepIndex(0);
        }
    }, [visible]);

    if (!visible) return null;

    const currentStep = STEPS[currentStepIndex];
    const isLastStep = currentStepIndex === STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    // Calculate Arrow Style
    const getArrowStyle = () => {
        const size = 16;
        const color = Colors.surface;

        const baseStyle: any = {
            position: 'absolute',
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
        };

        const percent = currentStep.arrowPercentage ?? 50;

        switch (currentStep.arrowDirection) {
            case 'up':
                return {
                    ...baseStyle,
                    borderLeftWidth: size,
                    borderRightWidth: size,
                    borderBottomWidth: size,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: color,
                    top: -size,
                    left: `${percent}%`,
                    marginLeft: -size,
                };
            case 'down':
                return {
                    ...baseStyle,
                    borderLeftWidth: size,
                    borderRightWidth: size,
                    borderTopWidth: size,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: color,
                    bottom: -size,
                    left: `${percent}%`,
                    marginLeft: -size,
                };
            case 'left':
            case 'right':
                // Keeping simple for now, mostly using up/down for this vertical content app
                return {};
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                {/* Highlight/Darken background */}
                <View style={StyleSheet.absoluteFillObject} />

                {/* Tooltip Card */}
                <View
                    style={[
                        styles.tooltip,
                        {
                            backgroundColor: Colors.surface,
                            borderColor: Colors.border,
                            ...currentStep.targetPosition
                        }
                    ]}
                >
                    {/* Arrow */}
                    {currentStepIndex !== 0 && <View style={getArrowStyle()} />}

                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: Colors.text }]}>{currentStep.title}</Text>
                            <TouchableOpacity onPress={onComplete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.description, { color: Colors.textSecondary }]}>
                            {currentStep.description}
                        </Text>

                        <View style={styles.footer}>
                            <View style={styles.dots}>
                                {STEPS.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            { backgroundColor: index === currentStepIndex ? Colors.primary : Colors.border }
                                        ]}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={handleNext}
                                style={[styles.button, { backgroundColor: Colors.primary }]}
                            >
                                <Text style={styles.buttonText}>{isLastStep ? "Finish" : "Next"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    tooltip: {
        position: 'absolute',
        borderRadius: 16,
        borderWidth: 1, // subtle border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        maxWidth: 350,
        // Default positioning if not overridden
        left: 20,
        right: 20,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Geist-Bold',
    },
    description: {
        fontSize: 15,
        fontFamily: 'Geist-Regular',
        lineHeight: 22,
        marginBottom: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dots: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontFamily: 'Geist-SemiBold',
        fontSize: 14,
    },
});
