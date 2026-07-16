import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { premiumShadows, premiumTheme, radii } from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PremiumCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: premiumTheme.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: premiumTheme.cardBorder,
    ...premiumShadows.card,
  },
});
