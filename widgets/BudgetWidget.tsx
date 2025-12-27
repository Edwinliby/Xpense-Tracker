import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function BudgetWidget({ remainingAmount }: { remainingAmount?: string }) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#ffffff',
                borderRadius: 22,
                padding: 16,
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: '#E6E6E6',
                borderWidth: 2,
            }}
        >
            <FlexWidget style={{ flexDirection: 'column' }}>
                <TextWidget
                    text="Remaining Budget"
                    style={{ fontSize: 14, color: '#666666', fontFamily: 'sans-serif-medium' }}
                />
                <TextWidget
                    text={remainingAmount || '$ -.--'}
                    style={{ fontSize: 24, color: '#000000', fontFamily: 'sans-serif-bold', marginTop: 4 }}
                />
            </FlexWidget>

            <FlexWidget
                style={{
                    backgroundColor: '#007AFF',
                    borderRadius: 12,
                    paddingVertical: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                clickAction="OPEN_URI"
                clickActionData={{ uri: 'expensetracker://add' }}
            >
                <TextWidget
                    text="+ Add Expense"
                    style={{ fontSize: 14, color: '#ffffff', fontFamily: 'sans-serif-medium' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}
