import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart, lineDataItem } from 'react-native-gifted-charts';

interface HomeChartProps {
  data: lineDataItem[];
  data2?: lineDataItem[]; // For previous month comparison
  viewMode: 'monthly' | 'yearly';
  maxValue: number;
  currencySymbol: string;
}

const screenWidth = Dimensions.get('window').width;

export const HomeChart: React.FC<HomeChartProps> = ({
  data,
  data2,
  viewMode,
  maxValue,
  currencySymbol,
}) => {

  const Colors = useThemeColor();

  const chartConfig = useMemo(() => {
    return {
      width: screenWidth - 40, // consistent padding
      height: 180,
      spacing: (screenWidth - 60) / (Math.max(data.length, 1)),
      initialSpacing: 20,
    };
  }, [data.length]);

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        data2={data2}
        height={chartConfig.height}
        width={chartConfig.width}
        spacing={chartConfig.spacing}
        initialSpacing={chartConfig.initialSpacing}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        hideYAxisText

        // Curve & Animation
        curved
        isAnimated
        animationDuration={1200}

        // Colors & Fill - Dataset 1 (Current)
        color={Colors.primary}
        thickness={3}
        startFillColor={Colors.primary}
        endFillColor={Colors.surface}
        startOpacity={0.3}
        endOpacity={0.0}
        areaChart

        // Colors & Fill - Dataset 2 (Previous)
        color2={data2 ? Colors.textSecondary + '40' : undefined}
        thickness2={data2 ? 2 : 0}

        // Points
        hideDataPoints
        // Disable default focus to prevent z-index issues with the native dot
        focusEnabled={false}

        // Text
        textColor={Colors.text}
        textFontSize={10}
        textShiftY={-6}
        xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10, fontFamily: 'Geist-Medium' }}

        // Interaction / Pointer
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: Colors.primaryLight,
          pointerStripWidth: 2, // Increased for easier touch detection
          pointerColor: Colors.primary,
          radius: 6,
          pointerLabelWidth: 100,
          pointerLabelHeight: 90,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          // Render the dot manually in the pointer layer with negative z-index
          pointerComponent: () => (
            <View
              style={{
                height: 12,
                width: 12,
                borderRadius: 6,
                backgroundColor: Colors.primary,
                borderWidth: 2,
                borderColor: Colors.surface,
                zIndex: -1, // Force behind the label
                elevation: 0,
              }}
            />
          ),
          pointerLabelComponent: (items: any) => {
            const item = items[0];
            const secondaryItem = items[1];
            return (
              <View
                style={{
                  height: 60,
                  width: 100,
                  backgroundColor: Colors.surface,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: Colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 50, // High elevation
                  zIndex: 50, // High Z-Index
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 10, marginBottom: 2, fontFamily: 'Geist-Regular' }}>
                  {viewMode === 'monthly' ? `Day ${item?.date}` : item?.date}
                </Text>
                <Text style={{ color: Colors.text, fontSize: 14, fontFamily: 'Geist-Bold' }}>
                  {currencySymbol}{item?.value?.toFixed(0)}
                </Text>
                {secondaryItem && (
                  <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2, fontFamily: 'Geist-Regular' }}>
                    Vs {currencySymbol}{secondaryItem?.value?.toFixed(0)}
                  </Text>
                )}
              </View>
            );
          },
        }}

        // Scale
        maxValue={maxValue * 1.2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
});
