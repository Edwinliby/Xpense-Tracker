import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { BudgetWidget } from './widgets/BudgetWidget';

const nameToWidget = {
    // HelloWidget will come here
    BudgetWidget: BudgetWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const widgetInfo = props.widgetInfo;
    const Widget = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
            if (Widget) {
                props.renderWidget(<Widget />);
            }
            break;
        case 'WIDGET_DELETED':
            // Cleanup if needed
            break;
        case 'WIDGET_CLICK':
            // Click handling
            break;
        default:
            break;
    }
}
