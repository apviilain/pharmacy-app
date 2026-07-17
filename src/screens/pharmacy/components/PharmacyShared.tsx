import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { CircleAlert, RefreshCw, Search } from 'lucide-react-native';
import { scale, moderateScale, verticalScale } from '../../../theme/responsive';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export const getEntityId = (entity: any) => entity?.id || entity?._id || '';

export const StatCard = ({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: accent }]}>
      {icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

export const InlineError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <View style={styles.inlineError}>
    <CircleAlert size={scale(18)} color="#B3261E" />
    <View style={styles.inlineErrorContent}>
      <Text style={styles.inlineErrorTitle}>Something went wrong</Text>
      <Text style={styles.inlineErrorText}>{message}</Text>
    </View>
    {onRetry ? (
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={styles.retryPill}
      >
        <RefreshCw size={scale(14)} color={colors.primaryBlue} />
        <Text style={styles.retryPillText}>Retry</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const EmptyState = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateIcon}>
      <Search size={scale(20)} color={colors.primaryBlue} />
    </View>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
  </View>
);

export const LabeledField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  error?: string;
}) => (
  <View style={styles.formField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      keyboardType={keyboardType as any}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        styles.textInput,
        multiline && styles.textArea,
        error && styles.textInputError,
      ]}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

export const FormToggle = ({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleTextWrap}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#D8DEE8', true: '#A7D3F2' }}
      thumbColor={value ? colors.primaryBlue : '#FFFFFF'}
    />
  </View>
);

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    backgroundColor: '#fff',
    borderRadius: scale(12),
    gap: scale(12),
  },
  statIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(16),
    color: colors.textHeader,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: colors.textLight,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9DEDC',
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: verticalScale(16),
  },
  inlineErrorContent: {
    flex: 1,
    marginLeft: scale(8),
  },
  inlineErrorTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#B3261E',
    marginBottom: verticalScale(2),
  },
  inlineErrorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(13),
    color: '#49454F',
  },
  retryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    gap: scale(4),
  },
  retryPillText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(32),
  },
  emptyStateIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(21, 114, 183, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(16),
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  emptyStateSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: colors.textLight,
    textAlign: 'center',
  },
  formField: {
    marginBottom: verticalScale(16),
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: colors.textHeader,
    marginBottom: verticalScale(6),
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    minHeight: verticalScale(44),
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: colors.textHeader,
  },
  textArea: {
    minHeight: verticalScale(80),
    paddingVertical: verticalScale(12),
  },
  textInputError: {
    borderColor: colors.error,
  },
  fieldError: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: colors.error,
    marginTop: verticalScale(4),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: scale(16),
  },
  toggleLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: colors.textHeader,
  },
  toggleHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(12),
    color: colors.textLight,
    marginTop: verticalScale(2),
  },
});
