import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CircleAlert, RefreshCw, SearchX } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { scale } from '../../theme/responsive';
import {
  premiumTheme,
  premiumTypography,
  radii,
  spacing,
} from '../../theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'empty' | 'error';
};

export function SectionState({
  title,
  subtitle,
  actionLabel,
  onAction,
  tone = 'empty',
}: Props) {
  const Icon = tone === 'error' ? CircleAlert : SearchX;
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, tone === 'error' && styles.iconWrapError]}>
        <Icon
          size={scale(22)}
          color={tone === 'error' ? '#E25B52' : colors.primaryBlue}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.85}>
          <RefreshCw size={scale(16)} color="#FFFFFF" />
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: premiumTheme.cardBorder,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: scale(48),
    height: scale(48),
    borderRadius: radii.md,
    backgroundColor: premiumTheme.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapError: {
    backgroundColor: premiumTheme.dangerTint,
  },
  title: {
    ...premiumTypography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...premiumTypography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontFamily: premiumTypography.body.fontFamily,
    fontSize: premiumTypography.body.fontSize,
  },
});
