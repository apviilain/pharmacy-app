import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { CreditCard, Tag } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type { DiagnosticsBooking, DiagnosticsRetryPaymentRequest } from '../../api/pharmyx';
import { PrimaryButton } from '../../components/PrimaryButton';
import { env } from '../../config/env';
import { colors } from '../../theme/colors';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { parsePaymentError } from '../../utils/paymentUtils';
import { getDiagnosticsPaymentContext } from './components/DiagnosticsShared';

type PaymentProps = NativeStackScreenProps<RootStackParamList, 'DiagnosticsPayment'>;

export const DiagnosticsPaymentScreen: React.FC<PaymentProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ['diagnosticsBookingPayment', bookingId],
    queryFn: async () =>
      diagnosticsBookingService.getSessionBookingById(bookingId) ||
      (await diagnosticsBookingService.getPaymentDetails(bookingId)),
    enabled: !!bookingId,
  });

  const booking = bookingQuery.data;
  const paymentContext = getDiagnosticsPaymentContext(booking);

  const completePayment = useCallback(
    async (currentBooking: Partial<DiagnosticsBooking> | null | undefined) => {
      const currentContext = getDiagnosticsPaymentContext(currentBooking);

      if (!currentContext.razorpayOrderId || !currentContext.paymentTransactionId) {
        Toast.show({
          type: 'success',
          text1: 'Payment updated',
          text2: 'Diagnostics payment status has been refreshed.',
        });
        navigation.replace('DiagnosticsBookingDetails', { bookingId });
        return;
      }

      const options = {
        description: `Diagnostics booking #${bookingId}`,
        currency: currentContext.currency || 'INR',
        key: currentContext.razorpayKeyId || env.RAZORPAY_KEY,
        amount: currentContext.amount || 0,
        name: 'Pharmyx',
        order_id: currentContext.razorpayOrderId,
        theme: { color: colors.primaryBlue },
        prefill: {
          contact: booking?.patientPhone || '',
          name: booking?.patientName || '',
        },
      };

      try {
        const paymentResult: any = await RazorpayCheckout.open(options);
        await diagnosticsBookingService.verifyPayment({
          paymentTransactionId: currentContext.paymentTransactionId,
          razorpayOrderId: paymentResult.razorpay_order_id,
          razorpayPaymentId: paymentResult.razorpay_payment_id,
          razorpaySignature: paymentResult.razorpay_signature,
          module: 'external-bookings',
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] }),
          queryClient.invalidateQueries({ queryKey: ['diagnosticsBooking', bookingId] }),
          queryClient.invalidateQueries({ queryKey: ['diagnosticsBookingPayment', bookingId] }),
        ]);

        Toast.show({
          type: 'success',
          text1: 'Payment verified',
          text2: 'Diagnostics booking payment completed.',
        });
        navigation.replace('DiagnosticsBookingDetails', { bookingId });
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Payment failed',
          text2: parsePaymentError(error),
        });
      }
    },
    [booking?.patientName, booking?.patientPhone, bookingId, navigation, queryClient],
  );

  const retryMutation = useMutation({
    mutationFn: (payload: DiagnosticsRetryPaymentRequest) =>
      diagnosticsBookingService.retryPayment(bookingId, payload),
    onSuccess: async response => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticsBooking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticsBookingPayment', bookingId] });
      await completePayment(response);
    },
  });

  if (bookingQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primaryBlue} size="large" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Payment</Text>
            <Text style={styles.subtitle}>Booking #{bookingId}</Text>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient Name</Text>
              <Text style={styles.summaryValue}>{booking?.patientName || 'NA'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={[styles.summaryValue, styles.amountValue]}>
                ₹{String(booking?.amount ?? 0)}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Have a coupon code?</Text>
            <View style={styles.inputWrapper}>
              <Tag size={scale(18)} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.actions}>
            {paymentContext.razorpayOrderId ? (
              <PrimaryButton
                title="Pay Now"
                onPress={() => completePayment(booking)}
                icon={<CreditCard size={scale(18)} color="#fff" />}
              />
            ) : (
              <PrimaryButton
                title="Generate Payment Link"
                onPress={() =>
                  retryMutation.mutate({
                    useWalletBalance,
                    couponCode: couponCode.trim() || undefined,
                  })
                }
                loading={retryMutation.isPending}
                icon={<CreditCard size={scale(18)} color="#fff" />}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.medium,
    color: colors.textLight,
    fontSize: moderateScale(14),
  },
  content: {
    padding: scale(16),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: verticalScale(20),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(20),
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#64748B',
    marginTop: verticalScale(4),
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: verticalScale(24),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: verticalScale(12),
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#475569',
  },
  summaryValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(15),
    color: '#0F172A',
  },
  amountValue: {
    fontSize: moderateScale(18),
    color: colors.primaryBlue,
  },
  inputGroup: {
    marginBottom: verticalScale(24),
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#334155',
    marginBottom: verticalScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(48),
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: scale(8),
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  actions: {
    marginTop: verticalScale(8),
  },
});
