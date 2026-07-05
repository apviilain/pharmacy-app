import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  View,
  Image,
  Animated as RNAnimated,
  Modal,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { PrimaryButton } from '../../components/PrimaryButton';
import { appointmentsTabs } from './mockMainData';
import { appointmentService } from '../../api/appointmentService';
import { walletApi } from '../../api/walletApi';
import { couponService, Coupon } from '../../api/couponService';
import { env } from '../../config/env';
import { getCurrentUserId } from '../../state/authStore';
import { parsePaymentError } from '../../utils/paymentUtils';
import {
  formatDate,
  capitalize,
  formatDoctorName,
  isAppointmentPast,
  canRescheduleAppointment,
  canFollowUpAppointment,
} from '../../utils/appointmentUtils';
import { buildFullUrl } from '../../utils/urlUtils';
import { ListSkeleton } from '../../components/ListSkeleton';
import type { ApiError } from '../../api/errorHandler';

const TabPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.tab, active && styles.tabActive]}
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PaymentActions = ({
  appt,
  onRetry,
  onCancel,
  isRetrying,
}: {
  appt: any;
  onRetry: () => void;
  onCancel: () => void;
  isRetrying: boolean;
}) => {
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!appt.createdAt) return;

    const timer = setInterval(() => {
      const created = new Date(appt.createdAt).getTime();
      const expiry = created + 30 * 60 * 1000; // 30 mins
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appt.createdAt]);

  return (
    <>
      <View style={styles.timerRow}>
        <Text style={[styles.timerText, isExpired && { color: colors.error }]}>
          {isExpired
            ? '⏳ Slot Expired'
            : `⏳ Slot reserved for ${timeLeft} mins`}
        </Text>
      </View>

      <View style={styles.remainingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.remainingLabel}>Payment Summary</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Total Fee: </Text>
            <Text style={styles.breakdownValue}>{appt.fee}</Text>
          </View>
          {appt.walletAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text
                style={[styles.breakdownLabel, { color: colors.primaryGreen }]}
              >
                Paid via Wallet:{' '}
              </Text>
              <Text
                style={[styles.breakdownValue, { color: colors.primaryGreen }]}
              >
                -₹{appt.walletAmount}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.breakdownRow,
              {
                marginTop: verticalScale(2),
                paddingTop: verticalScale(2),
                borderTopWidth: 1,
                borderTopColor: 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            <Text
              style={[
                styles.breakdownLabel,
                {
                  color: '#C2410C',
                  fontFamily: typography.fontFamily.semiBold,
                },
              ]}
            >
              Pending:{' '}
            </Text>
            <Text
              style={[
                styles.breakdownValue,
                { color: '#C2410C', fontFamily: typography.fontFamily.bold },
              ]}
            >
              ₹{appt.remainingAmount}
            </Text>
          </View>
        </View>
      </View>

      {!isExpired && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.retryBtn}
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.retryText}>Pay Now</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cancelBtn}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export const AppointmentsScreen = () => {
  const [active, setActive] =
    useState<(typeof appointmentsTabs)[number]>('All');

  const apiStatus =
    active === 'All'
      ? undefined
      : active === 'Upcoming'
      ? 'upcoming'
      : active === 'Pending'
      ? 'pending'
      : 'Past';

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['appointments', apiStatus || 'all'],
    queryFn: () =>
      appointmentService.getAppointments(
        apiStatus ? { status: apiStatus as any } : {},
      ),
  });

  const filteredAppointments = React.useMemo(() => {
    if (!appointments) return [];
    if (active === 'Upcoming') {
      return appointments.filter(
        (appt: any) => !isAppointmentPast(appt.dateLabel, appt.timeLabel),
      );
    }
    return appointments;
  }, [appointments, active]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const queryClient = useQueryClient();

  const [cancelModalVisible, setCancelModalVisible] = useState<string | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Payment Selection Modal States
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [walletAmount, setWalletAmount] = useState(0);
  const [useWallet, setUseWallet] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Coupon states
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const scaleAnim = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    if (cancelModalVisible) {
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
        speed: 14,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [cancelModalVisible]);

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setCancelModalVisible(null);
      setCancelReason('');
    },
  });

  const navigation = useNavigation<any>();

  const submitCancel = () => {
    if (cancelModalVisible && cancelReason.trim().length > 0) {
      cancelMutation.mutate({
        id: cancelModalVisible,
        reason: cancelReason.trim(),
      });
    }
  };

  const openPaymentModal = async (appt: any) => {
    setSelectedAppt(appt);
    setPaymentModalVisible(true);
    const userId = getCurrentUserId();
    if (userId) {
      try {
        const [walletResp, couponResp] = await Promise.all([
          walletApi.getWalletDetails(userId),
          couponService.getCoupons(),
        ]);
        const amount = walletResp?.data?.balance ?? walletResp?.balance ?? 0;
        setWalletAmount(amount);
        setAvailableCoupons(Array.isArray(couponResp) ? couponResp : []);
      } catch (err) {
        console.error('Initial payment modal data fetch failed:', err);
      }
    }
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;

    const userId = getCurrentUserId();
    if (!userId || !selectedAppt) return;

    setIsValidating(true);
    try {
      const fee = Number(String(selectedAppt.fee).replace(/[^0-9.]/g, '')) || 0;
      const response = await couponService.validateCoupon({
        code: code.trim().toUpperCase(),
        userId,
        bookingType: 'consultation',
        bookingId: selectedAppt.id,
        purchaseAmount: fee,
      });

      if (response && response.discountAmount !== undefined) {
        setAppliedCoupon(response.coupon || { code });
        setDiscountAmount(response.discountAmount);
        Toast.show({
          type: 'success',
          text1: 'Coupon Applied!',
          text2: `You saved ₹${response.discountAmount} extra.`,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Coupon',
        text2: error.response?.data?.message || 'Coupon could not be applied.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

  const handleRetryPayment = async (appt: any, walletChoice: boolean) => {
    if (!appt?.id) return;
    setIsProcessing(true);
    setRetryingId(appt.id);
    try {
      const response = await appointmentService.retryPayment(appt.id, {
        useWalletBalance: walletChoice,
        couponCode: appliedCoupon?.code,
      });
      console.log(
        '[RetryPayment] response:',
        JSON.stringify(response, null, 2),
      );

      const payment = response?.payment || (response as any);
      const razorpayOrderId =
        payment?.razorpayOrderId ||
        (response as any)?.data?.payment?.razorpayOrderId;

      if (razorpayOrderId) {
        const razorpayKey =
          payment?.razorpayKeyId ||
          (response as any)?.data?.payment?.razorpayKeyId ||
          env.RAZORPAY_KEY;
        const amountInPaise =
          payment?.amount || (response as any)?.data?.payment?.amount || 0;
        const currency =
          payment?.currency ||
          (response as any)?.data?.payment?.currency ||
          'INR';
        const paymentTransactionId =
          payment?.paymentTransactionId ||
          (response as any)?.data?.payment?.paymentTransactionId;

        const options = {
          description: `Retry for Booking #${appt.id?.slice(-8).toUpperCase()}`,
          currency,
          key: razorpayKey,
          amount: amountInPaise,
          name: 'Pharmacy App',
          order_id: razorpayOrderId,
          theme: { color: colors.primaryBlue },
          prefill: {
            contact: appt?.contactNo || '',
            name: appt?.patientName || appt?.doctorName || '',
          },
        };

        setPaymentModalVisible(false); // Hide choice modal before Razorpay opens

        RazorpayCheckout.open(options)
          .then(async (data: any) => {
            try {
              await walletApi.verifyPayment({
                paymentTransactionId,
                razorpayOrderId: data.razorpay_order_id,
                razorpayPaymentId: data.razorpay_payment_id,
                razorpaySignature: data.razorpay_signature,
              });
              queryClient.invalidateQueries({ queryKey: ['appointments'] });
              Toast.show({
                type: 'success',
                text1: 'Payment Successful',
                text2: 'Your booking has been confirmed.',
              });
            } catch (verifyErr: any) {
              Toast.show({
                type: 'error',
                text1: 'Verification Failed',
                text2: parsePaymentError(verifyErr),
              });
            }
          })
          .catch((err: any) => {
            Toast.show({
              type: 'error',
              text1: 'Payment Cancelled',
              text2: parsePaymentError(err),
            });
          })
          .finally(() => {
            setRetryingId(null);
            setIsProcessing(false);
          });
      } else {
        setPaymentModalVisible(false);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: 'Your booking has been confirmed via wallet.',
        });
        setRetryingId(null);
        setIsProcessing(false);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Retry Failed',
        text2: parsePaymentError(error),
      });
      setRetryingId(null);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.content}>
        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appointmentsTabs.map(t => (
              <TabPill
                key={t}
                label={t}
                active={active === t}
                onPress={() => setActive(t)}
              />
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.error }}>
              {(error as any)?.userMessage || 'Request failed'}
            </Text>
          </View>
        ) : null}
        {!isLoading && !error ? (
          <Animated.ScrollView showsVerticalScrollIndicator={false}>
            {filteredAppointments && filteredAppointments.length > 0 ? (
              filteredAppointments.map((appt: any) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  key={appt.id}
                  style={[styles.apptCard, { marginBottom: verticalScale(14) }]}
                  onPress={() =>
                    navigation.navigate('AppointmentDetails', {
                      appointmentId: appt.id,
                      appointment: appt,
                    })
                  }
                >
                  {['confirmed', 'pending'].includes(appt.status) ||
                  active === 'Upcoming' ? (
                    <>
                      <View style={styles.apptTopRow}>
                        {appt.doctorImage ? (
                          <Image
                            source={{ uri: buildFullUrl(appt.doctorImage) }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                              {formatDoctorName(appt.doctorName)?.[0] || 'D'}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: scale(10) }}>
                          <Text style={styles.docName}>
                            {formatDoctorName(appt.doctorName)}
                          </Text>
                          <Text style={styles.docSub}>
                            {appt.specialization}
                          </Text>
                        </View>
                        <View style={styles.badgeUpcoming}>
                          <Text style={styles.badgeUpcomingText}>
                            ●{' '}
                            {appt.status === 'confirmed'
                              ? 'Confirmed'
                              : appt.status === 'pending'
                              ? 'Pending'
                              : 'Upcoming'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.gridRow}>
                        <Stat
                          label="Date"
                          value={formatDate(appt.dateLabel)}
                          flex={1.8}
                        />
                        <Stat label="Time" value={appt.timeLabel} flex={1.6} />
                        <Stat
                          label="Mode"
                          value={capitalize(appt.mode)}
                          flex={1.2}
                        />
                        <Stat
                          label="Fee"
                          value={appt.fee}
                          valueColor={colors.primaryGreen}
                        />
                      </View>

                      {appt.status === 'pending' ? (
                        <PaymentActions
                          appt={appt}
                          onRetry={() => openPaymentModal(appt)}
                          onCancel={() => setCancelModalVisible(appt.id)}
                          isRetrying={retryingId === appt.id}
                        />
                      ) : !isAppointmentPast(appt.dateLabel, appt.timeLabel) ? (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.joinBtn}
                            onPress={() => {
                              navigation.navigate('ConsultationRoom', {
                                doctorId: appt.specialistId || appt.doctorId,
                                appointmentId: appt.id || appt._id,
                                dateLabel: appt.dateLabel,
                                timeLabel: appt.timeLabel,
                              });
                            }}
                          >
                            <Text style={styles.joinText}>Join</Text>
                          </TouchableOpacity>
                          {canRescheduleAppointment(
                            appt.dateLabel,
                            appt.timeLabel,
                          ) && (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              style={styles.rescheduleBtn}
                              onPress={() =>
                                navigation.navigate('AppointmentDetails', {
                                  appointmentId: appt.id,
                                  appointment: appt,
                                  openReschedule: true,
                                })
                              }
                            >
                              <Text style={styles.rescheduleText}>
                                Reschedule
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.cancelBtn}
                            onPress={() => setCancelModalVisible(appt.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <Text style={styles.cancelText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <View style={styles.completedTopRow}>
                        <Text style={styles.type}>TELEHEALTH</Text>
                        <View
                          style={
                            appt.status === 'cancelled'
                              ? styles.badgeCancelled
                              : styles.badgeCompleted
                          }
                        >
                          <Text
                            style={
                              appt.status === 'cancelled'
                                ? styles.badgeCancelledText
                                : styles.badgeCompletedText
                            }
                          >
                            {appt.status === 'cancelled'
                              ? '✕ Cancelled'
                              : '✓ Completed'}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.apptTopRow,
                          { marginTop: verticalScale(10) },
                        ]}
                      >
                        {appt.doctorImage ? (
                          <Image
                            source={{ uri: buildFullUrl(appt.doctorImage) }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                              {formatDoctorName(appt.doctorName)?.[0] || 'D'}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: scale(10) }}>
                          <Text style={styles.docName}>
                            {formatDoctorName(appt.doctorName)}
                          </Text>
                          <Text style={styles.docSub}>
                            {appt.specialization} · #
                            {appt.id.slice(-8).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.bottomRow}>
                        <Text
                          style={[
                            styles.meta,
                            { flexShrink: 1, marginRight: scale(8) },
                          ]}
                          numberOfLines={1}
                        >
                          {formatDate(appt.dateLabel)} · {appt.fee}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: scale(8) }}>
                          {appt.status === 'completed' &&
                            !appt.followUp?.isFollowUp &&
                            !appt.followUp?.benefitUsed &&
                            canFollowUpAppointment(appt.dateLabel) && (
                              <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.detailsBtn}
                                onPress={() => {
                                  if (appt.specialistId) {
                                    navigation.navigate('SlotSelection', {
                                      doctorId: appt.specialistId,
                                      member: {
                                        id: (appt as any).userId || '',
                                        name:
                                          (appt as any).patientName || 'Self',
                                        relation: 'Self',
                                        gender: '',
                                        contact: '',
                                        email: '',
                                        isMe: true,
                                      },
                                      followUp: {
                                        isFollowUp: true,
                                        parentConsultationId: appt.id,
                                      },
                                    });
                                  }
                                }}
                              >
                                <Text style={styles.detailsText}>Follow-up</Text>
                              </TouchableOpacity>
                            )}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.detailsBtn}
                            onPress={() =>
                              navigation.navigate('AppointmentDetails', {
                                appointmentId: appt.id,
                                appointment: appt,
                              })
                            }
                          >
                            <Text style={styles.detailsText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>
                  No {active.toLowerCase()} appointments
                </Text>
                <Text style={styles.emptySub}>
                  {active === 'Upcoming'
                    ? 'Book your first consultation with a doctor'
                    : active === 'Pending'
                    ? 'All your unpaid bookings will appear here'
                    : 'Your past consultations will appear here'}
                </Text>
                {active === 'Upcoming' && (
                  <>
                    <View style={{ height: verticalScale(8) }} />
                    <PrimaryButton
                      title="Book a Consultation"
                      onPress={() => {}}
                      style={styles.bookBtn}
                    />
                  </>
                )}
              </View>
            )}
          </Animated.ScrollView>
        ) : null}

        <Modal
          visible={!!cancelModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCancelModalVisible(null)}
        >
          <View style={styles.modalOverlay}>
            <RNAnimated.View
              style={[
                styles.modalContent,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <Text style={styles.modalSub}>
                Please provide a reason for cancellation
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Rescheduled, Unwell, etc."
                placeholderTextColor={colors.textLight}
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => {
                    setCancelModalVisible(null);
                    setCancelReason('');
                  }}
                  disabled={cancelMutation.isPending}
                >
                  <Text style={styles.modalBtnCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtnSubmit,
                    (!cancelReason.trim() || cancelMutation.isPending) && {
                      opacity: 0.5,
                    },
                  ]}
                  onPress={submitCancel}
                  disabled={!cancelReason.trim() || cancelMutation.isPending}
                >
                  <Text style={styles.modalBtnSubmitText}>
                    {cancelMutation.isPending ? 'Cancelling...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            </RNAnimated.View>
          </View>
        </Modal>

        {/* ── Payment Options Modal ── */}
        <Modal
          visible={paymentModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.paymentModalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.paymentModalTitle}>
                Choose Payment Method
              </Text>
              <Text style={styles.paymentModalSub}>
                Payable Amount: ₹
                {Math.max(
                  0,
                  (Number(String(selectedAppt?.fee).replace(/[^0-9.]/g, '')) ||
                    0) - discountAmount,
                )}
              </Text>

              <View style={styles.optionsWrap}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.payOption,
                    useWallet && styles.payOptionActive,
                  ]}
                  onPress={() => setUseWallet(true)}
                >
                  <View style={styles.payOptionLeft}>
                    <View style={styles.payIconBox}>
                      <Text style={{ fontSize: scale(18) }}>👛</Text>
                    </View>
                    <View style={{ marginLeft: scale(12) }}>
                      <Text style={styles.payLabel}>Wallet</Text>
                      <Text style={styles.payValue}>
                        Balance: ₹{walletAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.radio, useWallet && styles.radioActive]}>
                    {useWallet && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.payOption,
                    !useWallet && styles.payOptionActive,
                  ]}
                  onPress={() => setUseWallet(false)}
                >
                  <View style={styles.payOptionLeft}>
                    <View
                      style={[
                        styles.payIconBox,
                        { backgroundColor: '#F3F6FB' },
                      ]}
                    >
                      <Text style={{ fontSize: scale(18) }}>💳</Text>
                    </View>
                    <View style={{ marginLeft: scale(12) }}>
                      <Text style={styles.payLabel}>Online Payment</Text>
                      <Text style={styles.payValue}>Razorpay, UPI, Cards</Text>
                    </View>
                  </View>
                  <View
                    style={[styles.radio, !useWallet && styles.radioActive]}
                  >
                    {!useWallet && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Coupon Section */}
              <View style={styles.couponSection}>
                <Text style={styles.couponLabel}>Offers & Benefits</Text>
                <View style={styles.couponInputRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor={colors.textLight}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                    editable={!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <TouchableOpacity onPress={handleRemoveCoupon}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleApplyCoupon()}
                      disabled={isValidating || !couponCode.trim()}
                    >
                      {isValidating ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primaryBlue}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.applyBtnText,
                            !couponCode.trim() && { opacity: 0.5 },
                          ]}
                        >
                          Apply
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {!appliedCoupon && availableCoupons.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.couponsScroll}
                    contentContainerStyle={{ gap: scale(10) }}
                  >
                    {availableCoupons.map(coupon => (
                      <TouchableOpacity
                        key={coupon._id}
                        style={styles.couponChip}
                        onPress={() => handleApplyCoupon(coupon.code)}
                      >
                        <Text style={styles.couponChipText}>{coupon.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                {appliedCoupon && (
                  <Text style={styles.appliedText}>
                    Coupon applied! Saved ₹{discountAmount}
                  </Text>
                )}
              </View>

              <View style={styles.payModalActions}>
                <TouchableOpacity
                  style={styles.payBackBtn}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <Text style={styles.payBackText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.payConfirmBtn,
                    isProcessing && { opacity: 0.7 },
                  ]}
                  disabled={isProcessing}
                  onPress={() => handleRetryPayment(selectedAppt, useWallet)}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.payConfirmText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const Stat = ({
  label,
  value,
  valueColor,
  flex = 1,
}: {
  label: string;
  value: string;
  valueColor?: string;
  flex?: number;
}) => (
  <View style={{ flex, paddingRight: scale(4) }}>
    <Text style={styles.statLabel} numberOfLines={1}>
      {label}
    </Text>
    <Text
      style={[styles.statValue, valueColor ? { color: valueColor } : null]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },
  tabsRow: { flexDirection: 'row', marginBottom: verticalScale(12) },
  tab: {
    paddingHorizontal: scale(16),
    height: verticalScale(36),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  tabActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: colors.primaryBlue,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: { color: colors.primaryBlue },
  apptCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  apptTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: '#EAF1FB',
  },
  avatarPlaceholder: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: 'rgba(21,114,183,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primaryBlue,
  },
  docName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  docSub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  badgeUpcoming: {
    height: verticalScale(26),
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    backgroundColor: 'rgba(21,114,183,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUpcomingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  gridRow: {
    marginTop: verticalScale(12),
    flexDirection: 'row',
    backgroundColor: '#F6F8FB',
    borderRadius: scale(12),
    padding: scale(12),
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  statValue: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: colors.textHeader,
  },
  actionsRow: { flexDirection: 'row', marginTop: verticalScale(12) },
  joinBtn: {
    flex: 1,
    height: verticalScale(40),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  joinText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.primaryBlue,
  },
  rescheduleBtn: {
    flex: 1,
    height: verticalScale(40),
    borderRadius: scale(10),
    backgroundColor: 'rgba(245,158,11,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  rescheduleText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#F59E0B',
  },
  cancelBtn: {
    width: scale(92),
    height: verticalScale(40),
    borderRadius: scale(10),
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRow: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    backgroundColor: '#FFF7ED',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  timerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#C2410C',
    textAlign: 'center',
  },
  cancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#EF4444',
  },
  retryBtn: {
    flex: 1,
    height: verticalScale(40),
    borderRadius: scale(10),
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  retryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(4),
    padding: scale(12),
    backgroundColor: '#F8FAFC',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  remainingLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: verticalScale(1),
  },
  breakdownLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textHeader,
  },
  emptyCard: {
    marginTop: verticalScale(14),
    backgroundColor: '#F6F8FB',
    borderRadius: scale(16),
    padding: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  emptyIcon: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(18),
    backgroundColor: 'rgba(21,114,183,0.08)',
  },
  emptyTitle: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bookBtn: { width: scale(210), marginVertical: 0, borderRadius: scale(12) },
  completedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  badgeCompleted: {
    height: verticalScale(24),
    borderRadius: scale(12),
    paddingHorizontal: scale(10),
    backgroundColor: 'rgba(65,179,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCompletedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryGreen,
  },
  badgeCancelled: {
    height: verticalScale(24),
    borderRadius: scale(12),
    paddingHorizontal: scale(10),
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCancelledText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
  },
  compTitle: {
    marginTop: verticalScale(10),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
  },
  compSub: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginTop: verticalScale(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(20),
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  modalSub: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: verticalScale(80),
    backgroundColor: '#F3F6FB',
    borderRadius: scale(12),
    marginTop: verticalScale(16),
    padding: scale(12),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: verticalScale(20),
    gap: scale(12),
  },
  modalBtnCancel: {
    flex: 1,
    height: verticalScale(42),
    borderRadius: scale(12),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  modalBtnSubmit: {
    flex: 1,
    height: verticalScale(42),
    borderRadius: scale(12),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSubmitText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  paymentModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: scale(24),
    padding: scale(20),
    paddingBottom: scale(24),
  },
  modalHandle: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: verticalScale(14),
  },
  paymentModalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    textAlign: 'center',
  },
  paymentModalSub: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.primaryBlue,
    textAlign: 'center',
  },
  optionsWrap: {
    marginTop: verticalScale(20),
    gap: scale(12),
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(14),
    borderRadius: scale(16),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  payOptionActive: {
    backgroundColor: 'rgba(21,114,183,0.06)',
    borderColor: 'rgba(21,114,183,0.3)',
  },
  payOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payIconBox: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    backgroundColor: 'rgba(21,114,183,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  payValue: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: verticalScale(1),
  },
  radio: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primaryBlue,
  },
  radioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: colors.primaryBlue,
  },
  payModalActions: {
    flexDirection: 'row',
    marginTop: verticalScale(24),
    gap: scale(12),
  },
  payBackBtn: {
    flex: 1,
    height: verticalScale(48),
    borderRadius: scale(14),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBackText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  payConfirmBtn: {
    flex: 1.5,
    height: verticalScale(48),
    borderRadius: scale(14),
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payConfirmText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  meta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  detailsBtn: {
    height: verticalScale(34),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  couponSection: {
    marginTop: verticalScale(20),
    backgroundColor: '#F8FAFC',
    padding: scale(14),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  couponLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  couponInput: {
    flex: 1,
    height: verticalScale(38),
    backgroundColor: '#fff',
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  applyBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  removeBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
  },
  couponsScroll: {
    marginTop: verticalScale(12),
  },
  couponChip: {
    paddingHorizontal: scale(12),
    height: verticalScale(28),
    borderRadius: scale(14),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(11),
    color: colors.primaryBlue,
  },
  appliedText: {
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: colors.primaryGreen,
  },
});
