import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { scale, verticalScale } from '../theme/responsive';
import { typography } from '../theme/typography';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkBanner = () => {
  const { isOffline, isSlowConnection, isReconnecting } = useNetworkStatus();

  if (!isOffline && !isSlowConnection && !isReconnecting) {
    return null;
  }

  const message = isOffline
    ? 'No internet connection'
    : isReconnecting
    ? 'Reconnecting to network...'
    : 'Slow network detected';

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  text: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
