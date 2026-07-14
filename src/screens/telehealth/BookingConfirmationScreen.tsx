import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  Modal,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { RefreshCw } from 'lucide-react-native';

import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { PrimaryButton } from '../../components/PrimaryButton';
import { dependentService, Dependent } from '../../api/dependentService';
import { couponService, Coupon } from '../../api/couponService';
import {
  Specialist,
  telehealthService,
  BookingPayload,
} from '../../api/telehealthService';
import { walletApi } from '../../api/walletApi';
import { getCurrentUserId, useAuthStore } from '../../state/authStore';
import { env } from '../../config/env';
import { Platform } from 'react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import type { RootStackParamList } from '../../navigation/types';
import { appointmentService } from '../../api/appointmentService';
import { parsePaymentError } from '../../utils/paymentUtils';
import { formatDoctorName, getApptDateTime } from '../../utils/appointmentUtils';
import { useBadgeStore } from '../../state/badgeStore';
import { useNotificationStore } from '../../state/notificationStore';
import {
  scheduleAppointmentReminders,
  AppointmentNotificationData,
} from '../../services/notificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>;

export const BookingConfirmationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { width } = useWindowDimensions();
  const [doctor, setDoctor] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotificationStore(state => state.showNotification);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentDetailsStatus, setPaymentDetailsStatus] = useState('');
  const [paymentDetailsError, setPaymentDetailsError] = useState('');
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio'>(
    route.params.mode && route.params.mode.toLowerCase() === 'audio'
      ? 'audio'
      : 'video',
  );

  // Coupon states
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'wallet' | 'online' | 'later'
  >('online');
  const [parentAppointment, setParentAppointment] = useState<any>(null);
  const [fetchingParent, setFetchingParent] = useState(false);

  // Animated pulse for payment loader
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (bookingLoading) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
      // Spin animation
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      pulseAnim.setValue(1);
      spinAnim.setValue(0);
    }
  }, [bookingLoading]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const contentWidth = Math.min(width - scale(24), width >= 768 ? 920 : 680);


  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await telehealthService.getSpecialists();
        const dataArray = Array.isArray(response)
          ? response
          : (response as any)?.data || [];
        const found = dataArray.find(
          (d: any) => (d._id || d.id) === route.params.doctorId,
        );
        setDoctor(found || null);
      } catch (error) {
        console.error('Failed to fetch doctor in confirmation', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [route.params.doctorId]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await couponService.getCoupons();
        setAvailableCoupons(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch coupons', error);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      const userId = getCurrentUserId();
      if (!userId) return;
      try {
        const response = await walletApi.getWalletDetails(userId);
        const amount = response?.data?.balance ?? response?.balance ?? 0;
        setWalletAmount(amount);
      } catch (err) {
        console.error('Wallet fetch failed in confirmation:', err);
      }
    };
    fetchWallet();
    console.log(
      '[BookingConfirmation] Page Mount Params:',
      JSON.stringify(route.params, null, 2),
    );
  }, []);

  useEffect(() => {
    const bookingId = route.params.bookingId;
    if (!bookingId) return;

    const hydratePaymentDetails = async () => {
      try {
        setPaymentDetailsError('');
        const response = await appointmentService.getPaymentDetails(bookingId);
        const status =
          response?.status ||
          response?.paymentStatus ||
          response?.payment?.status ||
          response?.booking?.paymentStatus ||
          '';
        setPaymentDetailsStatus(String(status || '').trim());
      } catch (error: any) {
        setPaymentDetailsError(
          error?.userMessage ||
            error?.response?.data?.message ||
            error?.message ||
            'Unable to refresh payment details right now.',
        );
      }
    };

    hydratePaymentDetails();
  }, [route.params.bookingId]);

  useEffect(() => {
    if (route.params.followUp?.isFollowUp && route.params.followUp?.parentConsultationId) {
      const fetchParent = async () => {
        setFetchingParent(true);
        try {
          const data = await appointmentService.getAppointmentById(
            route.params.followUp!.parentConsultationId,
          );
          setParentAppointment(data);
        } catch (error) {
          console.error('Failed to fetch parent appointment', error);
        } finally {
          setFetchingParent(false);
        }
      };
      fetchParent();
    }
  }, [route.params.followUp]);


  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;

    const userId = getCurrentUserId();
    if (!userId) return;

    setIsValidating(true);
    try {
      const response = await couponService.validateCoupon({
        code: code.trim().toUpperCase(),
        userId,
        bookingType: 'consultation',
        bookingId: route.params.doctorId,
        purchaseAmount: route.params.fee,
      });

      if (response && response.discountAmount !== undefined) {
        setAppliedCoupon(response.coupon || { code });
        setDiscountAmount(response.discountAmount);
        Toast.show({
          type: 'success',
          text1: 'Coupon Applied!',
          text2: `You saved ₹${response.discountAmount} extra.`,
        });
      } else {
        throw new Error('Invalid coupon response');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Coupon',
        text2:
          error.response?.data?.message ||
          error.message ||
          'Coupon could not be applied.',
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

  const triggerSuccessNotification = (appointmentId: string) => {
    showNotification({
      id: `success-${appointmentId}-${Date.now()}`,
      type: 'booking_success',
      title: 'Booking Confirmed!',
      body: `Your appointment with ${formatDoctorName(doctor?.name ?? 'Doctor')} is confirmed for ${route.params.dateLabel} at ${route.params.timeLabel}.`,
      appointmentId,
      patientName: route.params.member.name,
      doctorId: route.params.doctorId,
      dateLabel: route.params.dateLabel,
      timeStr: route.params.timeLabel,
    });
  };

  /** Auto-schedule local push notifications for the appointment */
  const autoScheduleReminder = async (appointmentId: string) => {
    try {
      const apptTime = getApptDateTime(
        route.params.rawDate, // YYYY-MM-DD or YYYYMMDD
        route.params.timeLabel,
      );
      if (apptTime.getTime() <= Date.now()) return; // already passed

      const notifData: AppointmentNotificationData = {
        id: appointmentId,
        patientName: route.params.member.name || 'Patient',
        specialistName: formatDoctorName(doctor?.name ?? 'Doctor'),
        concern: route.params.concern || 'Consultation',
        appointmentTime: apptTime,
        doctorId: route.params.doctorId,
        dateLabel: route.params.dateLabel,
      };
      await scheduleAppointmentReminders(notifData);
      console.log('[BookingConfirmation] Auto-scheduled reminders for', appointmentId);
    } catch (err) {
      console.warn('[BookingConfirmation] Failed to auto-schedule reminders:', err);
    }
  };

  const handleConfirm = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User is not logged in.',
      });
      return;
    }

    setBookingLoading(true);

    console.log('[BookingConfirmation] handleConfirm triggered');
    try {
      const appointmentId = route.params.bookingId || 'APT-0000';

      if (paymentMethod === 'later') {
        // Pay Later logic — just navigate to success
        appointmentService.updateCachedAppointment(appointmentId, {
          status: 'pending',
        });
        triggerSuccessNotification(appointmentId);
        await autoScheduleReminder(appointmentId);
        navigation.navigate('BookingSuccess', {
          doctorId: route.params.doctorId,
          appointmentId,
          dateLabel: route.params.dateLabel,
          timeLabel: route.params.timeLabel,
          paymentPending: true,
        });
        useBadgeStore.getState().incrementOrdersBadgeCount();
        setBookingLoading(false);
        return;
      }

      // Step 1: Call retryPayment API with wallet preference
      console.log(
        '[BookingConfirmation] Finalizing with Method:',
        paymentMethod,
      );
      const response = await appointmentService.retryPayment(appointmentId, {
        useWalletBalance: paymentMethod === 'wallet',
      });

      console.log(
        '[BookingConfirmation] API SUCCESS Response:',
        JSON.stringify(response, null, 2),
      );

      const payment = response?.payment;

      // Step 2: Handle Razorpay if needed (partial payment)
      if ((response as any)?.status === 'paid' || !payment?.razorpayOrderId) {
        // Step 3: Direct deduction or free — Successfully processed by backend
        appointmentService.updateCachedAppointment(appointmentId, {
          status: 'confirmed',
        });
        triggerSuccessNotification(appointmentId);
        await autoScheduleReminder(appointmentId);
        navigation.navigate('BookingSuccess', {
          doctorId: route.params.doctorId,
           appointmentId,
          dateLabel: route.params.dateLabel,
          timeLabel: route.params.timeLabel,
        });
        useBadgeStore.getState().incrementOrdersBadgeCount();
      } else if (payment?.razorpayOrderId) {
        const razorpayKey = payment.razorpayKeyId || env.RAZORPAY_KEY;
        const amountInPaise = payment.amount || Math.round(finalToPay * 100);

        const options = {
          description: `Consultation with ${doctor?.name || 'Doctor'}`,
          currency: payment.currency || 'INR',
          key: razorpayKey,
          amount: amountInPaise,
          name: 'Pharmyx',
          order_id: payment.razorpayOrderId,
          theme: { color: colors.primaryBlue },
          prefill: {
            contact: route.params.member.contact || '',
            name: route.params.member.name || '',
          },
        };

        console.log(
          '[BookingConfirmation] Opening Razorpay:',
          JSON.stringify(options),
        );

        try {
          const data: any = await RazorpayCheckout.open(options);
          console.log('Razorpay success:', JSON.stringify(data));
          try {
            await walletApi.verifyPayment({
              paymentTransactionId: payment.paymentTransactionId,
              razorpayOrderId: data.razorpay_order_id,
              razorpayPaymentId: data.razorpay_payment_id,
              razorpaySignature: data.razorpay_signature,
            });

            appointmentService.updateCachedAppointment(appointmentId, {
              status: 'confirmed',
            });
            triggerSuccessNotification(appointmentId);
            await autoScheduleReminder(appointmentId);
            navigation.navigate('BookingSuccess', {
              doctorId: route.params.doctorId,
              appointmentId,
              dateLabel: route.params.dateLabel,
              timeLabel: route.params.timeLabel,
            });
            useBadgeStore.getState().incrementOrdersBadgeCount();
          } catch (verifyErr: any) {
            Toast.show({
              type: 'error',
              text1: 'Payment Verification Failed',
              text2:
                verifyErr?.response?.data?.message ||
                verifyErr.message ||
                'Payment pending, support will contact you.',
            });
          }
        } catch (error: any) {
          console.log('Razorpay error:', JSON.stringify(error));
          Toast.show({
            type: 'error',
            text1: 'Payment Cancelled',
            text2: parsePaymentError(error),
          });
        }
      }
    } catch (error: any) {
      console.error('[BookingConfirmation] handleConfirm FAILED:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: parsePaymentError(error),
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const total = Math.max(0, route.params.fee - discountAmount);
  const walletDeduction =
    paymentMethod === 'wallet' ? Math.min(total, walletAmount) : 0;
  const finalToPay = Math.max(0, total - walletDeduction);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  const insets = useSafeAreaInsets();
  const avatarUri = doctor?.profilePictureUrl
    ? `${env.BASE_URL}${doctor.profilePictureUrl}`
    : 'https://via.placeholder.com/150';

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { width: contentWidth, alignSelf: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.docCard}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: scale(10) }}>
            <Text style={styles.docName}>{formatDoctorName(doctor?.name ?? 'Doctor')}</Text>
            <Text style={styles.docSub}>
              {doctor?.specialization || doctor?.specialty || ''}
            </Text>
            <Text style={styles.videoText}>
              {selectedMode === 'audio'
                ? '📞 Audio Consultation'
                : '📹 Video Consultation'}
            </Text>
          </View>
        </View>

        {paymentDetailsStatus ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Current payment status: {paymentDetailsStatus}
            </Text>
          </View>
        ) : null}

        {paymentDetailsError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{paymentDetailsError}</Text>
          </View>
        ) : null}

        {route.params.followUp?.isFollowUp && (
          <>
            <Text style={styles.blockTitle}>Follow-up Details</Text>
            <View style={styles.summaryCard}>
              <View style={styles.followUpHeader}>
                <View style={styles.followUpIconBox}>
                  <RefreshCw size={scale(18)} color={colors.primaryBlue} />
                </View>
                <Text style={styles.followUpTitle}>
                  Following up on Previous Consultation
                </Text>
              </View>
              {fetchingParent ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryBlue}
                  style={{ marginVertical: verticalScale(10) }}
                />
              ) : parentAppointment ? (
                <View style={styles.parentBrief}>
                  <Text style={styles.parentText}>
                    Date: {parentAppointment.dateLabel} · {parentAppointment.timeLabel}
                  </Text>
                  <Text style={styles.parentText}>
                    Doctor: {formatDoctorName(parentAppointment.doctorName)}
                  </Text>
                  <Text style={styles.parentText}>
                    Booking ID: #{parentAppointment.id?.slice(-8).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.parentText}>
                  Booking ID: #{route.params.followUp.parentConsultationId.slice(-8).toUpperCase()}
                </Text>
              )}
            </View>
          </>
        )}


        <Text style={styles.blockTitle}>Consultation Mode</Text>
        <View style={styles.modeTabs}>
          {[
            { id: 'video', label: '📹 Video' },
            { id: 'audio', label: '📞 Audio' },
          ].map(mode => (
            <TouchableOpacity
              key={mode.id}
              activeOpacity={0.8}
              onPress={() => setSelectedMode(mode.id as any)}
              style={[
                styles.modeTab,
                selectedMode === mode.id && styles.modeTabActive,
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  selectedMode === mode.id && styles.modeTabTextActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Row label="Date" value={route.params.dateLabel} />
          <Divider />
          <Row label="Time" value={`${route.params.timeLabel} IST`} />
          <Divider />
          <Row
            label="Fee"
            value={`₹${route.params.fee}`}
            valueStyle={styles.green}
          />

          {appliedCoupon && (
            <>
              <Divider />
              <Row
                label={`Coupon (${appliedCoupon.code})`}
                value={`-₹${discountAmount}`}
                valueStyle={styles.green}
              />
            </>
          )}

          {paymentMethod === 'wallet' && walletDeduction > 0 && (
            <>
              <Divider />
              <Row
                label="Wallet Deduction"
                value={`-₹${walletDeduction}`}
                valueStyle={styles.green}
              />
            </>
          )}

          {paymentMethod === 'later' && (
            <>
              <Divider />
              <Row
                label="Payment Status"
                value="Pay Later"
                valueStyle={styles.orange}
              />
            </>
          )}

          <Divider />
          <Row
            label="Total Payable"
            value={`₹${finalToPay}`}
            valueStyle={styles.blue}
            strong
          />
        </View>

        {/* Payment Selection */}
        <Text style={styles.blockTitle}>Payment Method</Text>
        <View style={styles.summaryCard}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPaymentMethod('wallet')}
            style={[
              styles.paymentChoice,
              paymentMethod === 'wallet' && styles.paymentChoiceActive,
            ]}
          >
            <View style={styles.walletInfo}>
              <View style={styles.walletIconContainer}>
                <Text style={{ fontSize: scale(18) }}>👛</Text>
              </View>
              <View style={{ marginLeft: scale(10) }}>
                <Text style={styles.paymentMethodTitle}>Wallet Balance</Text>
                <Text style={styles.paymentMethodSub}>
                  Available: ₹{walletAmount.toFixed(2)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'wallet' && styles.radioOuterActive,
              ]}
            >
              {paymentMethod === 'wallet' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPaymentMethod('online')}
            style={[
              styles.paymentChoice,
              paymentMethod === 'online' && styles.paymentChoiceActive,
            ]}
          >
            <View style={styles.walletInfo}>
              <View
                style={[
                  styles.walletIconContainer,
                  { backgroundColor: '#F3F6FB' },
                ]}
              >
                <Text style={{ fontSize: scale(18) }}>💳</Text>
              </View>
              <View style={{ marginLeft: scale(10) }}>
                <Text style={styles.paymentMethodTitle}>Online Payment</Text>
                <Text style={styles.paymentMethodSub}>
                  Razorpay, UPI, Cards
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'online' && styles.radioOuterActive,
              ]}
            >
              {paymentMethod === 'online' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <Divider />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPaymentMethod('later')}
            style={[
              styles.paymentChoice,
              paymentMethod === 'later' && styles.paymentChoiceActive,
            ]}
          >
            <View style={styles.walletInfo}>
              <View
                style={[
                  styles.walletIconContainer,
                  { backgroundColor: '#FFF7ED' },
                ]}
              >
                <Text style={{ fontSize: scale(18) }}>🕒</Text>
              </View>
              <View style={{ marginLeft: scale(10) }}>
                <Text style={styles.paymentMethodTitle}>Pay Later</Text>
                <Text style={styles.paymentMethodSub}>
                  Pay before consultation begins
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'later' && styles.radioOuterActive,
              ]}
            >
              {paymentMethod === 'later' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {paymentMethod === 'wallet' && walletDeduction > 0 && (
            <View style={styles.deductionNotice}>
              <Text style={styles.deductionText}>
                {finalToPay > 0
                  ? `₹${walletDeduction.toFixed(
                      0,
                    )} will be deducted from your wallet. Remaining ₹${finalToPay.toFixed(
                      0,
                    )} to be paid online.`
                  : `Full amount ₹${total.toFixed(
                      0,
                    )} will be covered by your wallet balance.`}
              </Text>
            </View>
          )}

          {paymentMethod === 'later' && (
            <View
              style={[styles.deductionNotice, { backgroundColor: '#FFF7ED' }]}
            >
              <Text style={[styles.deductionText, { color: '#C2410C' }]}>
                Slot will be secured now. Please complete payment ₹
                {total.toFixed(0)} before the session.
              </Text>
            </View>
          )}
        </View>

        {/* Coupons Section */}
        <Text style={styles.blockTitle}>Offers & Benefits</Text>
        <View style={styles.summaryCard}>
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
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
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
        </View>

        {/* Patient Details */}
        <Text style={styles.blockTitle}>Patient Details</Text>
        <View style={styles.summaryCard}>
          <Row label="Name" value={route.params.member.name} />
          <Divider />
          <Row
            label="Relation"
            value={route.params.member.relation || 'Self'}
          />
        </View>

        {/* Consultation Details */}
        {route.params.concern ? (
          <>
            <Text style={styles.blockTitle}>Primary Concern</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.concernText}>{route.params.concern}</Text>
            </View>
          </>
        ) : null}

        {/* Documents */}
        {route.params.documents && route.params.documents.length > 0 ? (
          <>
            <Text style={styles.blockTitle}>Uploaded Documents</Text>
            <View style={styles.summaryCard}>
              {route.params.documents.map((doc: any, i: number) => (
                <View key={i} style={{ paddingVertical: verticalScale(2) }}>
                  <Text style={styles.docText} numberOfLines={1}>
                    📄 {doc.filename || doc.name || 'Attachment'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ height: verticalScale(20) }} />
      </ScrollView>

      <View
        style={[
          styles.bottom,
          {
            paddingBottom: insets.bottom + verticalScale(16),
            alignItems: 'center',
          },
        ]}
      >
        <View style={{ width: contentWidth }}>
          <PrimaryButton
            title={
              paymentMethod === 'later'
                ? 'Confirm Booking (Pay Later)'
                : paymentMethod === 'wallet'
                ? finalToPay > 0
                  ? `Confirm & Pay ₹${finalToPay.toFixed(0)}`
                  : 'Confirm & Pay from Wallet'
                : `Pay ₹${total.toFixed(0)} Online`
            }
            onPress={handleConfirm}
            variant="green"
            style={styles.cta}
            disabled={bookingLoading}
          />
        </View>
      </View>

      {/* Payment Processing Modal */}
      <Modal
        visible={bookingLoading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Animated ring */}
            <Animated.View
              style={[
                styles.pulseCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.spinRing,
                  { transform: [{ rotate: spin }] },
                ]}
              />
              <Text style={styles.modalEmoji}>💳</Text>
            </Animated.View>

            <Text style={styles.modalTitle}>Processing Payment</Text>
            <Text style={styles.modalSubtitle}>
              Please wait while we securely process your transaction…
            </Text>

            <View style={styles.modalDots}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Row = ({
  label,
  value,
  valueStyle,
  strong,
}: {
  label: string;
  value: string;
  valueStyle?: any;
  strong?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text
      style={[styles.value, strong && styles.valueStrong, valueStyle]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

const Divider = () => <View style={styles.hr} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(20),
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FB',
    borderRadius: scale(14),
    padding: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(12),
    backgroundColor: '#eee',
  },
  docName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  docSub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  videoText: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  infoBanner: {
    marginTop: verticalScale(12),
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.16)',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
  },
  infoBannerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  errorBanner: {
    marginTop: verticalScale(12),
    backgroundColor: '#FFF1EF',
    borderWidth: 1,
    borderColor: '#FFD2CC',
    borderRadius: scale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
  },
  errorBannerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#9F2E25',
  },
  summaryCard: {
    marginTop: verticalScale(14),
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
  },
  label: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    maxWidth: '60%',
    textAlign: 'right',
  },
  valueStrong: { fontSize: typography.fontSize.lg },
  hr: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  green: { color: colors.primaryGreen },
  blue: { color: colors.primaryBlue },
  orange: { color: '#F59E0B' },
  bottom: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: colors.background,
  },
  cta: { marginVertical: 0 },
  blockTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginTop: verticalScale(16),
    marginBottom: verticalScale(6),
  },
  concernText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: verticalScale(18),
  },
  docText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponInput: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    paddingVertical: verticalScale(6),
  },
  applyBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primaryBlue,
    marginLeft: scale(10),
  },
  removeBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.error,
    marginLeft: scale(10),
  },
  couponsScroll: {
    marginTop: verticalScale(12),
  },
  couponChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21, 114, 183, 0.2)',
  },
  couponChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primaryBlue,
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
    gap: scale(10),
  },
  modeTab: {
    flex: 1,
    height: verticalScale(40),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: 'rgba(21,114,183,0.55)',
  },
  modeTabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.primaryBlue,
  },
  paymentChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
  },
  paymentChoiceActive: {
    // Opacity tint or something could go here
  },
  paymentChoiceDisabled: {
    opacity: 0.9,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  paymentMethodSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: verticalScale(2),
  },
  radioOuter: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primaryBlue,
  },
  radioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: colors.primaryBlue,
  },
  deductionNotice: {
    marginTop: verticalScale(10),
    backgroundColor: 'rgba(52, 168, 83, 0.05)',
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(52, 168, 83, 0.1)',
  },
  deductionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryGreen,
    textAlign: 'center',
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  followUpIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  followUpTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  parentBrief: {
    backgroundColor: '#F9FAFB',
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  parentText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs + 1,
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
  },
  // Payment loader modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: scale(280),
    backgroundColor: '#fff',
    borderRadius: scale(24),
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  pulseCircle: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
  },
  spinRing: {
    position: 'absolute',
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: colors.primaryBlue,
    borderRightColor: 'rgba(21, 114, 183, 0.3)',
  },
  modalEmoji: {
    fontSize: scale(36),
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  modalSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: verticalScale(16),
  },
  modalDots: {
    marginTop: verticalScale(4),
  },
});
