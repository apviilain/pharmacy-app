import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { scale, verticalScale } from '../theme/responsive';
import { typography } from '../theme/typography';

export const ErrorFallbackScreen = ({
  title = 'Something went wrong',
  message = 'We hit an unexpected issue. Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry ? (
      <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onRetry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: scale(24),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(18),
  },
  button: {
    backgroundColor: colors.primaryBlue,
    borderRadius: scale(14),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
  },
  buttonText: {
    color: '#fff',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
  },
});
