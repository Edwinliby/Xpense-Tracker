import { CustomAlert } from '@/components/CustomAlert';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface AlertAction {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface AlertContextType {
    showAlert: (title: string, message: string, actions?: AlertAction[]) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        actions: AlertAction[];
    }>({
        visible: false,
        title: '',
        message: '',
        actions: [],
    });

    const hideAlert = useCallback(() => {
        setConfig(prev => ({ ...prev, visible: false }));
    }, []);

    const showAlert = useCallback((title: string, message: string, actions: AlertAction[] = [{ text: 'OK' }]) => {
        setConfig({
            visible: true,
            title,
            message,
            actions: actions.map(a => ({
                ...a,
                onPress: () => {
                    hideAlert();
                    if (a.onPress) {
                        a.onPress();
                    }
                }
            })),
        });
    }, [hideAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={config.visible}
                title={config.title}
                message={config.message}
                actions={config.actions}
                onRequestClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};
