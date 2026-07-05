import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

type DividerProps = {
  text?: string;
};

export const Divider: React.FC<DividerProps> = ({ text = 'or' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  text: {
    marginHorizontal: scale(10),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
});
