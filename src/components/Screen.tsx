import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  /**
   * By default we avoid top edge because headers manage it.
   */
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  style?: ViewStyle;
};

export const Screen: React.FC<Props> = ({
  children,
  edges = ['left', 'right', 'bottom'],
  style,
}) => {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

