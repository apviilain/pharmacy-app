import React from 'react';
import { StyleSheet, View } from 'react-native';

import { scale } from '../../theme/responsive';

type Props = {
  length: number;
  filledCount: number;
  accentColor: string;
  mutedColor: string;
};

export const PinDots = ({ length, filledCount, accentColor, mutedColor }: Props) => (
  <View style={styles.row}>
    {Array.from({ length }).map((_, index) => {
      const filled = index < filledCount;
      const dotStyle = [
        styles.dot,
        {
          backgroundColor: filled ? `${accentColor}18` : 'transparent',
          borderColor: filled ? accentColor : mutedColor,
          transform: [{ scale: filled ? 1 : 0.96 }],
        },
      ];
      const innerDotStyle = [
        styles.dotInner,
        {
          backgroundColor: filled ? accentColor : 'transparent',
          transform: [{ scale: filled ? 1 : 0.3 }],
        },
      ];

      return (
        <View key={`dot-${index}`} style={dotStyle}>
          <View style={innerDotStyle} />
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
  },
  dot: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
});
