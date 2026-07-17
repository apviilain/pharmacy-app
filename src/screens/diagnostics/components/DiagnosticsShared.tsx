import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { scale, verticalScale, moderateScale } from '../../../theme/responsive';
import type { DiagnosticsBooking, DiagnosticsBookingRequest } from '../../../api/pharmyx';

export type DiagnosticsForm = {
  integration: string;
  orderType: string;
  bookingDate: string;
  bookingTime: string;
  patientName: string;
  patientPhone: string;
  pincode: string;
  addressLine: string;
  paymentOption: string;
  testIds: string;
  testNames: string;
  useWalletBalance: boolean;
};

export const DEFAULT_FORM: DiagnosticsForm = {
  integration: 'labstack',
  orderType: 'diagnostics',
  bookingDate: '',
  bookingTime: '',
  patientName: '',
  patientPhone: '',
  pincode: '',
  addressLine: '',
  paymentOption: 'prepaid',
  testIds: '',
  testNames: '',
  useWalletBalance: false,
};

export const getBookingId = (
  booking: Partial<DiagnosticsBooking> | null | undefined,
): string => String(booking?.bookingId || booking?.id || booking?._id || '');

export const isPaymentPending = (booking: Partial<DiagnosticsBooking> | null | undefined) => {
  const paymentStatus = String(booking?.paymentStatus || '').toLowerCase();
  return paymentStatus.includes('pending') || paymentStatus.includes('created');
};

export const toCreatePayload = (form: DiagnosticsForm): DiagnosticsBookingRequest => ({
  integration: form.integration.trim(),
  orderType: form.orderType.trim(),
  bookingDate: form.bookingDate.trim(),
  bookingTime: form.bookingTime.trim(),
  patientName: form.patientName.trim(),
  patientPhone: form.patientPhone.trim(),
  pincode: form.pincode.trim(),
  addressLine: form.addressLine.trim(),
  paymentOption: form.paymentOption.trim(),
  testIds: form.testIds
    .split(',')
    .map(item => item.trim())
    .filter(Boolean),
  testNames: form.testNames
    .split(',')
    .map(item => item.trim())
    .filter(Boolean),
  useWalletBalance: form.useWalletBalance,
});

export const validateCreateForm = (form: DiagnosticsForm) => {
  const errors: Record<string, string> = {};
  if (!/^\d{8}$/.test(form.bookingDate.trim())) {
    errors.bookingDate = 'Booking date must be YYYYMMDD';
  }
  if (!form.bookingTime.trim()) errors.bookingTime = 'Booking time is required';
  if (!form.patientName.trim()) errors.patientName = 'Patient name is required';
  if (!/^\d{10}$/.test(form.patientPhone.trim())) {
    errors.patientPhone = 'Enter a valid 10 digit phone number';
  }
  if (!form.pincode.trim()) errors.pincode = 'Pincode is required';
  if (!form.addressLine.trim()) errors.addressLine = 'Address is required';
  if (!form.testIds.split(',').map(item => item.trim()).filter(Boolean).length) {
    errors.testIds = 'At least one test ID is required';
  }
  if (!form.testNames.split(',').map(item => item.trim()).filter(Boolean).length) {
    errors.testNames = 'At least one test name is required';
  }
  return errors;
};

// UI Components extracted from DiagnosticsScreens
export const DiagnosticsEmptyState = ({
  title,
  subtitle,
  actionTitle,
  onAction,
  icon: Icon
}: {
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: any;
}) => (
  <View style={styles.emptyStateContainer}>
    {Icon && <Icon size={scale(48)} color={colors.inputBorder} style={{ marginBottom: verticalScale(16) }} />}
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
    {actionTitle && onAction && (
      <TouchableOpacity style={styles.emptyStateAction} onPress={onAction}>
        <Text style={styles.emptyStateActionText}>{actionTitle}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(32),
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(18),
    color: colors.textHeader,
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  emptyStateAction: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
    backgroundColor: 'rgba(21, 114, 183, 0.1)',
    borderRadius: scale(8),
  },
  emptyStateActionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: colors.primaryBlue,
  },
});

export const getDiagnosticsPaymentContext = (
  booking: Partial<DiagnosticsBooking> | null | undefined,
) => {
  const payment = (booking?.payment ||
    booking?.paymentDetails ||
    booking?.paymentMeta ||
    booking?.paymentContext ||
    {}) as Record<string, unknown>;

  const razorpayOrderId = String(
    payment.razorpayOrderId || booking?.razorpayOrderId || '',
  );
  const paymentTransactionId = String(
    payment.paymentTransactionId || booking?.paymentTransactionId || '',
  );
  const amount = Number(payment.amount ?? booking?.amount ?? 0);
  const currency = String(payment.currency || 'INR');
  const razorpayKeyId = String(payment.razorpayKeyId || '');

  return {
    razorpayOrderId,
    paymentTransactionId,
    amount,
    currency,
    razorpayKeyId,
  };
};
