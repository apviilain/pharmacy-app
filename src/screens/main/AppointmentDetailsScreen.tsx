import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  CreditCard,
  Activity,
  RefreshCw,
  X,
  FileText,
  Download,
  Eye,
  RotateCcw,
  MessageSquare,
  Copy,
  Pill,
  Stethoscope,
} from 'lucide-react-native';
import { env } from '../../config/env';
import LinearGradient from 'react-native-linear-gradient';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appointmentService } from '../../api/appointmentService';
import { walletApi } from '../../api/walletApi';
import { telehealthService } from '../../api/telehealthService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { parsePaymentError } from '../../utils/paymentUtils';
import {
  scheduleAppointmentReminders,
  cancelAppointmentReminders,
  isReminderScheduled,
  AppointmentNotificationData,
} from '../../services/notificationService';
import { getApptDateTime } from '../../utils/appointmentUtils';
import { buildFullUrl } from '../../utils/urlUtils';
import {
  formatDate,
  capitalize,
  formatDoctorName,
  isAppointmentPast,
  canRescheduleAppointment,
  canFollowUpAppointment,
} from '../../utils/appointmentUtils';

/* ───────── Reschedule Slot Chip ───────── */
const SlotChip = ({
  active,
  label,
  onPress,
  disabled,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.slotChip,
      active && styles.slotChipActive,
      disabled && styles.slotChipDisabled,
    ]}
  >
    <Text
      style={[
        styles.slotChipText,
        active && styles.slotChipTextActive,
        disabled && styles.slotChipTextDisabled,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/* ═══════════════════════════════════════════════ */

export const AppointmentDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { appointmentId, appointment, openReschedule } = route.params || {};

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Auto-open reschedule modal when navigated with openReschedule flag
  useEffect(() => {
    if (openReschedule) {
      // Small delay to let the screen render first
      const timer = setTimeout(() => openRescheduleModal(), 300);
      return () => clearTimeout(timer);
    }
  }, [openReschedule]);

  /* ── Cancel state ── */
  const [cancelModalVisible, setCancelModalVisible] = useState<string | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState('');
  const cancelScaleAnim = useRef(new Animated.Value(0)).current;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [parentAppointment, setParentAppointment] = useState<any>(null);
  const [fetchingParent, setFetchingParent] = useState(false);
  const [childAppointment, setChildAppointment] = useState<any>(null);
  const [fetchingChild, setFetchingChild] = useState(false);



  /* ── Reminder state ── */
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  // Check if reminder is already scheduled on mount
  useEffect(() => {
    if (appointmentId) {
      isReminderScheduled(appointmentId).then(setReminderEnabled);
    }
  }, [appointmentId]);


  useEffect(() => {
    if (appointment?.followUp?.isFollowUp && appointment?.followUp?.parentConsultationId) {
      const fetchParent = async () => {
        setFetchingParent(true);
        try {
          const data = await appointmentService.getAppointmentById(
            appointment.followUp.parentConsultationId,
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
  }, [appointment]);

  useEffect(() => {
    if (appointment?.followUp?.benefitUsed) {
      const fetchChild = async () => {
        setFetchingChild(true);
        try {
          const list = await appointmentService.getAppointments();
          const found = list.find(
            a =>
              (a.followUp as { parentConsultationId?: string } | undefined)
                ?.parentConsultationId === appointment.id,
          );
          if (found) setChildAppointment(found);
        } catch (error) {
          console.error('Failed to fetch child appointment', error);
        } finally {
          setFetchingChild(false);
        }
      };
      fetchChild();
    }
  }, [appointment]);



  const handleToggleReminder = async () => {
    if (reminderLoading) return;
    setReminderLoading(true);

    try {
      if (reminderEnabled) {
        // Cancel existing reminders
        await cancelAppointmentReminders(appointmentId);
        await AsyncStorage.removeItem(`@reminder_${appointmentId}`);
        setReminderEnabled(false);
        Toast.show({
          type: 'info',
          text1: 'Reminder Removed',
          text2: 'Appointment reminder has been cancelled.',
        });
      } else {
        // Build notification data from appointment
        const apptDateTime = getApptDateTime(
          appointment?.dateLabel,
          appointment?.timeLabel,
        );

        const notifData: AppointmentNotificationData = {
          id: appointmentId,
          patientName: appointment?.patientName || 'Patient',
          specialistName:
            appointment?.doctorName
              ? (appointment.doctorName.toLowerCase().startsWith('dr')
                  ? appointment.doctorName
                  : `Dr. ${appointment.doctorName}`)
              : 'Your Doctor',
          concern: appointment?.primaryConcern || 'Consultation',
          appointmentTime: apptDateTime,
          meetingLink: appointment?.virtualMeeting?.joinUrl || '',
          doctorId: appointment?.specialistId || appointment?.doctorId || '',
          dateLabel: appointment?.dateLabel || '',
        };

        const scheduled = await scheduleAppointmentReminders(notifData);
        if (scheduled) {
          await AsyncStorage.setItem(`@reminder_${appointmentId}`, 'true');
          setReminderEnabled(true);
          Toast.show({
            type: 'success',
            text1: 'Reminder Set ✓',
            text2: 'You will be notified before your appointment.',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Could Not Set Reminder',
            text2:
              'The appointment may have already passed or permission was denied.',
          });
        }
      }
    } catch (error) {
      console.error('[Reminder] Toggle error:', error);
      Toast.show({
        type: 'error',
        text1: 'Reminder Error',
        text2: 'Something went wrong. Please try again.',
      });
    } finally {
      setReminderLoading(false);
    }
  };

  /* ── Retry Payment state ── */
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);



  const handleRetryPayment = async () => {
    if (!appointmentId) return;
    if (appointment?.paymentStatus === 'paid') {
      Toast.show({
        type: 'info',
        text1: 'Already Paid',
        text2: 'This booking has already been paid.',
      });
      return;
    }
    setIsRetryingPayment(true);
    try {
      // First try wallet-based payment
      const response = await appointmentService.retryPayment(appointmentId, {
        useWalletBalance: false,
      });
      console.log(
        '[RetryPayment] API response:',
        JSON.stringify(response, null, 2),
      );

      const payment = response?.payment || (response as any);
      const razorpayOrderId =
        payment?.razorpayOrderId ||
        (response as any)?.data?.payment?.razorpayOrderId;

      if (razorpayOrderId) {
        // Launch Razorpay checkout
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
          description: `Retry payment for Booking #${appointmentId
            ?.slice(-8)
            .toUpperCase()}`,
          currency,
          key: razorpayKey,
          amount: amountInPaise,
          name: 'Pharmacy App',
          order_id: razorpayOrderId,
          theme: { color: colors.primaryBlue },
          prefill: {
            contact: appointment?.contactNo || '',
            name: appointment?.patientName || '',
          },
        };

        console.log(
          '[RetryPayment] Razorpay options:',
          JSON.stringify(options),
        );

        RazorpayCheckout.open(options)
          .then(async (data: any) => {
            console.log(
              '[RetryPayment] Razorpay success:',
              JSON.stringify(data),
            );
            try {
              await walletApi.verifyPayment({
                paymentTransactionId,
                razorpayOrderId: data.razorpay_order_id,
                razorpayPaymentId: data.razorpay_payment_id,
                razorpaySignature: data.razorpay_signature,
              });
              appointmentService.updateCachedAppointment(appointmentId, {
                status: 'confirmed',
              });
              queryClient.invalidateQueries({ queryKey: ['appointments'] });
              Toast.show({
                type: 'success',
                text1: 'Payment Successful',
                text2: 'Your booking has been confirmed.',
              });
              navigation.goBack();
            } catch (verifyErr: any) {
              Toast.show({
                type: 'error',
                text1: 'Payment Verification Failed',
                text2: parsePaymentError(verifyErr),
              });
            }
          })
          .catch((err: any) => {
            console.log('[RetryPayment] Razorpay error:', JSON.stringify(err));
            Toast.show({
              type: 'error',
              text1: 'Payment Cancelled',
              text2: parsePaymentError(err),
            });
          })
          .finally(() => setIsRetryingPayment(false));
      } else {
        // No Razorpay order — wallet fully covered or already paid
        appointmentService.updateCachedAppointment(appointmentId, {
          status: 'confirmed',
        });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        Toast.show({
          type: 'success',
          text1: 'Payment Processed',
          text2: 'Your booking has been confirmed via wallet.',
        });
        setIsRetryingPayment(false);
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('[RetryPayment] Failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Retry Failed',
        text2: parsePaymentError(error),
      });
      setIsRetryingPayment(false);
    }
  };

  useEffect(() => {
    if (cancelModalVisible) {
      Animated.spring(cancelScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
        speed: 14,
      }).start();
    } else {
      cancelScaleAnim.setValue(0);
    }
  }, [cancelModalVisible]);

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentService.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setCancelModalVisible(null);
      setCancelReason('');
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Cancellation Failed',
        text2:
          error?.userMessage ||
          error?.response?.data?.message ||
          error?.message ||
          'Could not cancel the booking.',
      });
    },
  });

  const submitCancel = () => {
    if (cancelModalVisible && cancelReason.trim().length > 0) {
      cancelMutation.mutate({
        id: cancelModalVisible,
        reason: cancelReason.trim(),
      });
    }
  };

  /* ── Reschedule state ── */
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleMode, setRescheduleMode] = useState<'video' | 'audio'>(
    'video',
  );
  const [rescheduleActiveDay, setRescheduleActiveDay] = useState('');
  const [rescheduleActiveSlot, setRescheduleActiveSlot] = useState('');
  const [rescheduleActiveSlotId, setRescheduleActiveSlotId] = useState('');
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{
    morning: any[];
    afternoon: any[];
    evening: any[];
  } | null>(null);

  const rescheduleScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rescheduleVisible) {
      Animated.spring(rescheduleScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
        speed: 14,
      }).start();
    } else {
      rescheduleScaleAnim.setValue(0);
    }
  }, [rescheduleVisible]);

  const daysList = useMemo(() => {
    const result: {
      id: string;
      label: string;
      date: string;
      fullDate: string;
    }[] = [];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const c = new Date();
      c.setDate(today.getDate() + i);
      result.push({
        id: c.toISOString().split('T')[0],
        label: daysOfWeek[c.getDay()],
        date: String(c.getDate()),
        fullDate: `${daysOfWeek[c.getDay()]} ${
          months[c.getMonth()]
        } ${c.getDate()}`,
      });
    }
    return result;
  }, []);

  // Fetch slots when day changes
  useEffect(() => {
    if (
      !rescheduleVisible ||
      !rescheduleActiveDay ||
      !appointment?.specialistId
    )
      return;

    const fetchSlots = async () => {
      setFetchingSlots(true);
      try {
        const formattedDate = rescheduleActiveDay.replace(/-/g, '');
        const response = await telehealthService.getSlots(
          appointment.specialistId,
          formattedDate,
        );
        const slotsArray = Array.isArray(response)
          ? response
          : response?.data || [];

        if (Array.isArray(slotsArray)) {
          const morning: any[] = [];
          const afternoon: any[] = [];
          const evening: any[] = [];
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];

          slotsArray.forEach((slot: any) => {
            if (
              !slot?.isActive ||
              !slot?.isAvailable ||
              typeof slot.startTime !== 'string'
            )
              return;
            const [hourStr, modifier] = slot.startTime.split(' ');
            if (!hourStr || !modifier) return;
            const [hour, minute] = hourStr.split(':').map(Number);
            let h = hour;
            if (modifier === 'PM' && hour !== 12) h += 12;
            if (modifier === 'AM' && hour === 12) h = 0;

            if (
              rescheduleActiveDay === todayStr &&
              (h < now.getHours() ||
                (h === now.getHours() && (minute || 0) <= now.getMinutes()))
            )
              return;

            if (h < 12) morning.push(slot);
            else if (h < 17) afternoon.push(slot);
            else evening.push(slot);
          });

          setAvailableSlots({ morning, afternoon, evening });
          const flat = [...morning, ...afternoon, ...evening];
          if (flat.length > 0) {
            setRescheduleActiveSlot(flat[0].startTime);
            setRescheduleActiveSlotId(flat[0]._id || flat[0].id);
          } else {
            setRescheduleActiveSlot('');
            setRescheduleActiveSlotId('');
          }
        } else {
          setAvailableSlots(null);
        }
      } catch {
        setAvailableSlots(null);
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchSlots();
  }, [rescheduleActiveDay, rescheduleVisible]);

  const rescheduleMutation = useMutation({
    mutationFn: (payload: {
      slotId: string;
      bookingDate: string;
      bookingTime: string;
      serviceMode: string;
      consultationMode: string;
      notes: string;
    }) => appointmentService.rescheduleAppointment(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setRescheduleVisible(false);
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Reschedule Failed',
        text2:
          error?.userMessage ||
          error?.response?.data?.message ||
          error?.message ||
          'Could not reschedule the booking.',
      });
    },
  });

  const submitReschedule = () => {
    if (!rescheduleActiveSlotId || !rescheduleActiveDay) return;
    rescheduleMutation.mutate({
      slotId: rescheduleActiveSlotId,
      bookingDate: rescheduleActiveDay.replace(/-/g, ''),
      bookingTime: rescheduleActiveSlot,
      serviceMode: rescheduleMode === 'audio' ? 'call' : 'video',
      consultationMode: rescheduleMode,
      notes: rescheduleNotes.trim(),
    });
  };

  const openRescheduleModal = () => {
    setRescheduleActiveDay(daysList[0]?.id || '');
    setRescheduleNotes('');
    setRescheduleMode('video');
    setRescheduleActiveSlot('');
    setRescheduleActiveSlotId('');
    setAvailableSlots(null);
    setRescheduleVisible(true);
  };

  /* ── Follow-up handler ── */
  const handleFollowUp = () => {
    if (!appointment?.specialistId) return;
    navigation.navigate('SlotSelection', {
      doctorId: appointment.specialistId,
      member: {
        id: appointment.userId || '',
        name: appointment.patientName || 'Self',
        relation: 'Self',
        gender: '',
        contact: '',
        email: '',
        isMe: true,
      },
      followUp: {
        isFollowUp: true,
        parentConsultationId: appointmentId,
      },
    });
  };

  /* ── Derived ── */
  const isUpcoming =
    appointment?.status === 'pending' || appointment?.status === 'confirmed';
  const isCompleted = appointment?.status === 'completed';
  const currentSlots = availableSlots || {
    morning: [],
    afternoon: [],
    evening: [],
  };
  const noSlots =
    !fetchingSlots &&
    currentSlots.morning.length === 0 &&
    currentSlots.afternoon.length === 0 &&
    currentSlots.evening.length === 0;

  /* ── Build document list from appointment data ── */

  const allDocuments = useMemo(() => {
    const docs: {
      id: string;
      title: string;
      type: string;
      url: string;
      icon: string;
      statusType: 'report' | 'prescription' | 'document';
      source: 'user' | 'doctor';
    }[] = [];

    // Uploaded documents
    if (appointment?.documents && Array.isArray(appointment.documents)) {
      appointment.documents.forEach((doc: any, idx: number) => {
        const docType = doc.type || 'document';
        docs.push({
          id: `doc-${idx}`,
          title:
            doc.filename ||
            `${docType.charAt(0).toUpperCase() + docType.slice(1)}`,
          type: docType,
          url: doc.url || '',
          icon:
            docType === 'prescription'
              ? '💊'
              : docType === 'report'
              ? '📋'
              : '📄',
          statusType:
            docType === 'prescription'
              ? 'prescription'
              : docType === 'report'
              ? 'report'
              : 'document',
          source: 'user',
        });
      });
    }

    // Reports from completed consultation
    if (
      appointment?.report?.fileUrls &&
      Array.isArray(appointment.report.fileUrls)
    ) {
      appointment.report.fileUrls.forEach((url: string, idx: number) => {
        docs.push({
          id: `report-${idx}`,
          title: 'Consultation Report',
          type: 'report',
          url,
          icon: '🩺',
          statusType: 'report',
          source: 'doctor',
        });
      });
    }

    // Prescriptions from completed consultation
    if (
      appointment?.prescription?.fileUrls &&
      Array.isArray(appointment.prescription.fileUrls)
    ) {
      appointment.prescription.fileUrls.forEach((url: string, idx: number) => {
        docs.push({
          id: `presc-${idx}`,
          title: 'Prescription',
          type: 'prescription',
          url,
          icon: '💊',
          statusType: 'prescription',
          source: 'doctor',
        });
      });
    }

    return docs;
  }, [appointment]);

  const handleDownload = async (url: string, filename: string) => {
    if (!url) return;
    try {
      const { config, fs } = ReactNativeBlobUtil;
      const date = new Date();
      const { DownloadDir } = fs.dirs;

      const fileExt = url.split('.').pop() || 'pdf';
      const path = `${DownloadDir}/${filename.replace(
        /\s+/g,
        '_',
      )}_${Math.floor(date.getTime() + date.getSeconds() / 2)}.${fileExt}`;

      Toast.show({
        type: 'info',
        text1: 'Downloading...',
        text2: 'Please wait while your file is being saved.',
      });

      config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path,
          description: 'Downloading File',
        },
      })
        .fetch('GET', url)
        .then(res => {
          console.log('The file saved to ', res.path());
          Toast.show({
            type: 'success',
            text1: 'Download Complete',
            text2: 'File saved to your downloads folder.',
          });
        })
        .catch(err => {
          console.error('Download error:', err);
          Toast.show({
            type: 'error',
            text1: 'Download Failed',
            text2: 'Could not download the file.',
          });
        });
    } catch (err) {
      console.error('Download setup error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to start download.',
      });
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Row */}
        <View style={styles.statusRow}>
          <Text style={styles.bookingId}>
            Booking ID: #{appointmentId?.slice(-8).toUpperCase() || 'N/A'}
          </Text>
          <View
            style={[
              styles.badge,
              appointment?.status === 'confirmed'
                ? styles.badgeGreen
                : appointment?.status === 'cancelled'
                ? styles.badgeRed
                : styles.badgeBlue,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                appointment?.status === 'confirmed'
                  ? styles.badgeTextGreen
                  : appointment?.status === 'cancelled'
                  ? styles.badgeTextRed
                  : styles.badgeTextBlue,
              ]}
            >
              {appointment?.status
                ? appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1)
                : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Doctor Card */}
        <View style={styles.card}>
          <View style={styles.docRow}>
            {appointment?.doctorImage ? (
              <Image
                source={{ uri: buildFullUrl(appointment.doctorImage) }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <Text style={styles.avatarInitial}>
                {formatDoctorName(appointment?.doctorName)?.[0] || 'D'}
                </Text>
              </View>
            )}
            <View style={styles.docInfo}>
              <Text style={styles.docName}>
                {formatDoctorName(appointment?.doctorName) || 'Unknown Doctor'}
              </Text>
              <Text style={styles.docSpec}>
                {appointment?.specialization || 'General Physician'}
              </Text>
            </View>
            <View style={styles.iconCircle}>
              <Activity size={scale(20)} color={colors.primaryBlue} />
            </View>
          </View>
        </View>

        {/* Virtual Meeting Link */}
        {appointment?.virtualMeeting?.joinUrl &&
          !isAppointmentPast(appointment?.dateLabel, appointment?.timeLabel) &&
          appointment?.status !== 'cancelled' && (
          <LinearGradient
            colors={[colors.primaryBlue, '#0D5A92']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.meetingGradientCard}
          >
            <View style={styles.meetingHeader}>
              <View style={styles.whiteIconBox}>
                <Video size={scale(20)} color={colors.primaryBlue} />
              </View>
              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <Text style={styles.meetingTitle}>Virtual Consultation</Text>
                <Text style={styles.meetingSubtitle}>
                  Join your session via the secure link
                </Text>
              </View>
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                {appointment.virtualMeeting.joinUrl}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.glassCopyBtn}
                onPress={() => {
                  Share.share({ message: appointment.virtualMeeting.joinUrl });
                  Toast.show({
                    type: 'success',
                    text1: 'Link Shared',
                    text2: 'Meeting link ready to share/copy',
                  });
                }}
              >
                <Copy size={scale(16)} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* ── Follow-up Context ── */}
        {appointment?.followUp?.isFollowUp && (
          <View style={styles.card}>
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
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    navigation.push('AppointmentDetails', {
                      appointmentId: parentAppointment.id,
                      appointment: parentAppointment
                    });
                  }}
                  style={styles.parentBrief}
                >
                  <View style={{ flex: 1 }}>
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
                  <ArrowLeft size={scale(16)} color={colors.primaryBlue} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              ) : (
                <View style={styles.parentBrief}>
                   <Text style={styles.parentText}>
                    Booking ID: #{appointment.followUp.parentConsultationId.slice(-8).toUpperCase()}
                  </Text>
                </View>
              )}
          </View>
        )}


        {/* ── Appointment Reminder Toggle ── */}
        {isUpcoming &&
          !isAppointmentPast(appointment?.dateLabel, appointment?.timeLabel) && (
          <View style={styles.reminderCard}>
            <View style={styles.reminderLeft}>
              <View style={styles.reminderIconBox}>
                <Text style={{ fontSize: scale(20) }}>🔔</Text>
              </View>
              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <Text style={styles.reminderTitle}>Appointment Reminder</Text>
                <Text style={styles.reminderSubtitle}>
                  {reminderEnabled
                    ? 'You will be notified 10 min before & at appointment time'
                    : 'Get notified before your appointment'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={reminderLoading}
              onPress={handleToggleReminder}
              style={[
                styles.reminderToggleBtn,
                reminderEnabled && styles.reminderToggleBtnActive,
              ]}
            >
              {reminderLoading ? (
                <ActivityIndicator
                  size="small"
                  color={reminderEnabled ? '#fff' : colors.primaryBlue}
                />
              ) : (
                <Text
                  style={[
                    styles.reminderToggleText,
                    reminderEnabled && styles.reminderToggleTextActive,
                  ]}
                >
                  {reminderEnabled ? '✓ Enabled' : 'Set Reminder'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Child Follow-up Context ── */}
        {appointment?.followUp?.benefitUsed && (
          <View style={styles.card}>
             <View style={styles.followUpHeader}>
                <View style={styles.followUpIconBox}>
                  <RefreshCw size={scale(18)} color={colors.primaryBlue} />
                </View>
                <Text style={styles.followUpTitle}>
                  Linked Follow-up Consultation
                </Text>
              </View>
              {fetchingChild ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryBlue}
                  style={{ marginVertical: verticalScale(10) }}
                />
              ) : childAppointment ? (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    navigation.push('AppointmentDetails', {
                      appointmentId: childAppointment.id,
                      appointment: childAppointment
                    });
                  }}
                  style={styles.parentBrief}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.parentText}>
                      Date: {childAppointment.dateLabel} · {childAppointment.timeLabel}
                    </Text>
                    <Text style={styles.parentText}>
                      Doctor: {formatDoctorName(childAppointment.doctorName)}
                    </Text>
                    <Text style={styles.parentText}>
                      Booking ID: #{childAppointment.id?.slice(-8).toUpperCase()}
                    </Text>
                  </View>
                  <ArrowLeft size={scale(16)} color={colors.primaryBlue} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              ) : (
                <View style={styles.parentBrief}>
                   <Text style={styles.parentText}>
                    Follow-up has been booked.
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* Consultation Details */}

        <Text style={styles.sectionTitle}>Consultation Details</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.itemIconBox}>
              <Calendar size={scale(20)} color={colors.primaryBlue} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Date</Text>
              <Text style={styles.itemValue}>
                {formatDate(appointment?.dateLabel) || 'Not Selected'}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.itemIconBox}>
              <Clock size={scale(20)} color={colors.primaryBlue} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Time</Text>
              <Text style={styles.itemValue}>
                {appointment?.timeLabel || 'Not Selected'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.itemIconBox}>
              <Video size={scale(20)} color={colors.primaryBlue} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Mode</Text>
              <Text style={styles.itemValue}>
                {capitalize(appointment?.mode) || 'Video'}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View
              style={[
                styles.itemIconBox,
                { backgroundColor: 'rgba(65,179,74,0.05)' },
              ]}
            >
              <CreditCard size={scale(20)} color={colors.primaryGreen} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Fee</Text>
              <Text style={[styles.itemValue, { color: colors.primaryGreen }]}>
                {appointment?.fee || '₹0'}
              </Text>
            </View>
          </View>
          {(appointment?.walletAmount > 0 ||
            (appointment?.status === 'pending' &&
              appointment?.remainingAmount > 0)) && (
            <>
              <View style={styles.divider} />
              <View style={styles.paymentBreakdown}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Consultation Fee</Text>
                  <Text style={styles.paymentValue}>
                    {appointment?.fee || '₹0'}
                  </Text>
                </View>
                {appointment?.walletAmount > 0 && (
                  <View
                    style={[styles.paymentRow, { marginTop: verticalScale(4) }]}
                  >
                    <Text
                      style={[
                        styles.paymentLabel,
                        { color: colors.primaryGreen },
                      ]}
                    >
                      Paid via Wallet
                    </Text>
                    <Text
                      style={[
                        styles.paymentValue,
                        { color: colors.primaryGreen },
                      ]}
                    >
                      -₹{appointment.walletAmount}
                    </Text>
                  </View>
                )}
                {appointment?.status === 'pending' && (
                  <>
                    <View
                      style={[
                        styles.paymentRow,
                        {
                          marginTop: verticalScale(6),
                          paddingTop: verticalScale(6),
                          borderTopWidth: 1,
                          borderTopColor: 'rgba(0,0,0,0.03)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.paymentLabel,
                          {
                            color: '#C2410C',
                            fontFamily: typography.fontFamily.semiBold,
                          },
                        ]}
                      >
                        Remaining (Pending)
                      </Text>
                      <Text
                        style={[
                          styles.paymentValue,
                          {
                            color: '#C2410C',
                            fontFamily: typography.fontFamily.bold,
                          },
                        ]}
                      >
                        ₹{appointment.remainingAmount || 0}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </>
          )}
        </View>

        {/* Patient Notes & Concerns */}
        {(appointment?.primaryConcern || appointment?.notes) && (
          <>
            <Text style={styles.sectionTitle}>Patient Notes & Concerns</Text>
            {appointment?.primaryConcern && (
              <View style={styles.card}>
                <View style={styles.noteHeader}>
                  <View
                    style={[
                      styles.noteIconBox,
                      { backgroundColor: 'rgba(21,114,183,0.08)' },
                    ]}
                  >
                    <Activity size={scale(18)} color={colors.primaryBlue} />
                  </View>
                  <Text style={styles.noteLabel}>Primary Concern</Text>
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteValue}>
                    {appointment.primaryConcern}
                  </Text>
                </View>
              </View>
            )}
            {appointment?.notes && (
              <View
                style={[
                  styles.card,
                  appointment?.primaryConcern && {
                    marginTop: -verticalScale(10),
                  },
                ]}
              >
                <View style={styles.noteHeader}>
                  <View
                    style={[
                      styles.noteIconBox,
                      { backgroundColor: 'rgba(245,158,11,0.08)' },
                    ]}
                  >
                    <MessageSquare size={scale(18)} color="#F59E0B" />
                  </View>
                  <Text style={styles.noteLabel}>Additional Notes</Text>
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteValue}>{appointment.notes}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Documents Uploaded by You */}
        {allDocuments.filter(d => d.source === 'user').length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📂 Documents Uploaded by You</Text>
            <View style={styles.sectionDescription}>
              <View style={styles.bulletPointRow}>
                <Text style={styles.bulletPoint}>• All your uploaded documents are listed below</Text>
              </View>
              <View style={styles.bulletPointRow}>
                <Text style={styles.bulletPoint}>• Add comments or notes for reference</Text>
              </View>
            </View>
            <View style={styles.card}>
              {allDocuments
                .filter(d => d.source === 'user')
                .map((doc, idx, arr) => (
                  <View key={doc.id}>
                    <View style={styles.docRow}>
                      <View
                        style={[
                          styles.docIconBox,
                          doc.statusType === 'report' && {
                            backgroundColor: 'rgba(65,179,74,0.08)',
                          },
                          doc.statusType === 'prescription' && {
                            backgroundColor: 'rgba(21,114,183,0.08)',
                          },
                          doc.statusType === 'document' && {
                            backgroundColor: 'rgba(245,158,11,0.08)',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: scale(16) }}>{doc.icon}</Text>
                      </View>
                      <View style={styles.docTextArea}>
                        <Text style={styles.docTitle} numberOfLines={1}>
                          {doc.title}
                        </Text>
                        <Text style={styles.docType}>
                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.docActionBtn}
                        onPress={() => {
                          setPreviewTitle(doc.title);
                          setPreviewUrl(buildFullUrl(doc.url));
                        }}
                      >
                        <Eye size={scale(16)} color={colors.primaryBlue} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.docActionBtn, { marginLeft: scale(8) }]}
                        onPress={() => {
                          const fullUrl = buildFullUrl(doc.url);
                          if (fullUrl)
                            Linking.openURL(fullUrl).catch(err =>
                              console.error('Open failed:', err),
                            );
                        }}
                      >
                        <Download
                          size={scale(16)}
                          color={colors.primaryGreen}
                        />
                      </TouchableOpacity>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
            </View>
          </>
        )}

        {/* Prescription Uploaded by Doctor */}
        {allDocuments.filter(d => d.source === 'doctor').length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: verticalScale(12) }]}>📄 Prescription Uploaded by Doctor</Text>
            <View style={styles.sectionDescription}>
              <View style={styles.bulletPointRow}>
                <Text style={styles.bulletPoint}>• Doctor-shared prescriptions appear here</Text>
              </View>
              <View style={styles.bulletPointRow}>
                <Text style={styles.bulletPoint}>• Review and manage prescription details</Text>
              </View>
            </View>
            <View style={styles.card}>
              {allDocuments
                .filter(d => d.source === 'doctor')
                .map((doc, idx, arr) => (
                  <View key={doc.id}>
                    <View style={styles.docRow}>
                      <View
                        style={[
                          styles.docIconBox,
                          doc.statusType === 'report' && {
                            backgroundColor: 'rgba(65,179,74,0.08)',
                          },
                          doc.statusType === 'prescription' && {
                            backgroundColor: 'rgba(21,114,183,0.08)',
                          },
                          doc.statusType === 'document' && {
                            backgroundColor: 'rgba(245,158,11,0.08)',
                          },
                        ]}
                      >
                        <Text style={{ fontSize: scale(16) }}>{doc.icon}</Text>
                      </View>
                      <View style={styles.docTextArea}>
                        <Text style={styles.docTitle} numberOfLines={1}>
                          {doc.title}
                        </Text>
                        <Text style={styles.docType}>
                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.docActionBtn}
                        onPress={() => {
                          setPreviewTitle(doc.title);
                          setPreviewUrl(buildFullUrl(doc.url));
                        }}
                      >
                        <Eye size={scale(16)} color={colors.primaryBlue} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.docActionBtn, { marginLeft: scale(8) }]}
                        onPress={() => {
                          const fullUrl = buildFullUrl(doc.url);
                          if (fullUrl)
                            Linking.openURL(fullUrl).catch(err =>
                              console.error('Open failed:', err),
                            );
                        }}
                      >
                        <Download
                          size={scale(16)}
                          color={colors.primaryGreen}
                        />
                      </TouchableOpacity>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
            </View>
          </>
        )}

        {/* Report / Prescription Messages */}
        {appointment?.report?.message && (
          <>
            <Text style={styles.sectionTitle}>Doctor's Report Note</Text>
            <View style={styles.card}>
              <Text style={styles.reportMessage}>
                {appointment.report.message}
              </Text>
            </View>
          </>
        )}
        {appointment?.prescription?.message && (
          <>
            <Text style={styles.sectionTitle}>Prescription Note</Text>
            <View style={styles.card}>
              <Text style={styles.reportMessage}>
                {appointment.prescription.message}
              </Text>
            </View>
          </>
        )}

        {/* Detailed Prescription Details */}
        {(appointment?.prescription?.diagnosis ||
          appointment?.prescription?.medicines?.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Prescription Details</Text>
            <View style={styles.card}>
              {appointment?.prescription?.diagnosis && (
                <View style={{ marginBottom: verticalScale(16) }}>
                  <View style={styles.noteHeader}>
                    <View
                      style={[
                        styles.noteIconBox,
                        {
                          backgroundColor: 'rgba(65,179,74,0.08)',
                          width: scale(28),
                          height: scale(28),
                        },
                      ]}
                    >
                      <Stethoscope
                        size={scale(16)}
                        color={colors.primaryGreen}
                      />
                    </View>
                    <Text style={[styles.noteLabel, { fontSize: scale(13) }]}>
                      Diagnosis
                    </Text>
                  </View>
                  <Text style={styles.prescriptionText}>
                    {appointment.prescription.diagnosis}
                  </Text>
                </View>
              )}

              {appointment?.prescription?.medicines?.length > 0 && (
                <View style={{ marginBottom: verticalScale(16) }}>
                  <View style={styles.noteHeader}>
                    <View
                      style={[
                        styles.noteIconBox,
                        {
                          backgroundColor: 'rgba(21,114,183,0.08)',
                          width: scale(28),
                          height: scale(28),
                        },
                      ]}
                    >
                      <Pill size={scale(16)} color={colors.primaryBlue} />
                    </View>
                    <Text style={[styles.noteLabel, { fontSize: scale(13) }]}>
                      Medicines
                    </Text>
                  </View>
                  <View style={styles.medicationList}>
                    {appointment.prescription.medicines.map(
                      (med: any, idx: number) => (
                        <View key={idx} style={styles.premiumMedItem}>
                          <View style={styles.medLeftLine} />
                          <View style={styles.medContentArea}>
                            <View style={styles.medRowTop}>
                              <Text style={styles.premiumMedName}>
                                {med.name}
                              </Text>
                              <View style={styles.medBadge}>
                                <Text style={styles.medBadgeText}>
                                  {med.duration} Days
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.premiumMedDosage}>
                              {med.dosage} • {med.frequency}
                            </Text>
                            {med.instructions && (
                              <View style={styles.instructionRow}>
                                <Activity
                                  size={scale(12)}
                                  color={colors.primaryGreen}
                                />
                                <Text style={styles.premiumMedInstruction}>
                                  {med.instructions}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              {appointment?.prescription?.advice && (
                <View style={{ marginBottom: verticalScale(16) }}>
                  <View style={styles.noteHeader}>
                    <View
                      style={[
                        styles.noteIconBox,
                        {
                          backgroundColor: 'rgba(245,158,11,0.08)',
                          width: scale(28),
                          height: scale(28),
                        },
                      ]}
                    >
                      <MessageSquare size={scale(16)} color="#F59E0B" />
                    </View>
                    <Text style={[styles.noteLabel, { fontSize: scale(13) }]}>
                      Advice
                    </Text>
                  </View>
                  <Text style={styles.prescriptionText}>
                    {appointment.prescription.advice}
                  </Text>
                </View>
              )}

              {appointment?.prescription?.testsAdvised?.length > 0 && (
                <View>
                  <View style={styles.noteHeader}>
                    <View
                      style={[
                        styles.noteIconBox,
                        {
                          backgroundColor: 'rgba(239,68,68,0.08)',
                          width: scale(28),
                          height: scale(28),
                        },
                      ]}
                    >
                      <Activity size={scale(16)} color="#EF4444" />
                    </View>
                    <Text style={[styles.noteLabel, { fontSize: scale(13) }]}>
                      Tests Advised
                    </Text>
                  </View>
                  <View style={styles.testTags}>
                    {appointment.prescription.testsAdvised.map(
                      (test: string, idx: number) => (
                        <View key={idx} style={styles.testTag}>
                          <Text style={styles.testTagText}>{test}</Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>


      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom:
              insets.bottom > 0 ? insets.bottom : verticalScale(20),
          },
        ]}
      >
        {appointment?.status === 'pending' &&
        appointment?.paymentStatus !== 'paid' &&
        !isAppointmentPast(appointment?.dateLabel, appointment?.timeLabel) ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.retryPaymentBtn,
                isRetryingPayment && { opacity: 0.6 },
              ]}
              onPress={handleRetryPayment}
              disabled={isRetryingPayment}
            >
              {isRetryingPayment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <RotateCcw
                    size={scale(16)}
                    color="#fff"
                    style={{ marginRight: scale(6) }}
                  />
                  <Text style={styles.retryPaymentText}>Retry Payment</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cancelBtn}
              onPress={() => setCancelModalVisible(appointmentId)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : isUpcoming ? (
          !isAppointmentPast(appointment?.dateLabel, appointment?.timeLabel) ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.joinBtn}
                onPress={() => {
                  navigation.navigate('ConsultationRoom', {
                    doctorId: appointment?.specialistId || appointment?.doctorId,
                    appointmentId: appointmentId || appointment?.id || appointment?._id,
                    dateLabel: appointment?.dateLabel,
                    timeLabel: appointment?.timeLabel,
                  });
                }}
              >
                <Text style={styles.joinText}>Join</Text>
              </TouchableOpacity>
              {canRescheduleAppointment(appointment?.dateLabel, appointment?.timeLabel) && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.rescheduleBtn}
                  onPress={openRescheduleModal}
                >
                  <Text style={styles.rescheduleText}>Reschedule</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.cancelBtn}
                onPress={() => setCancelModalVisible(appointmentId)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : null
        ) : (isCompleted && 
              !appointment?.followUp?.benefitUsed && 
              canFollowUpAppointment(appointment?.dateLabel)) ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.followUpBtnFull}
                onPress={handleFollowUp}
              >
                <Text style={styles.followUpTextFull}>Book Follow-up</Text>
              </TouchableOpacity>
            </View>
        ) : null}
      </View>

      {/* ═══════ Cancel Modal ═══════ */}
      <Modal
        visible={!!cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ scale: cancelScaleAnim }] },
            ]}
          >
            <Text style={styles.modalTitle}>Cancel Appointment</Text>
            <Text style={styles.modalSub}>Please provide a reason</Text>
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
                style={styles.modalBtnBack}
                onPress={() => {
                  setCancelModalVisible(null);
                  setCancelReason('');
                }}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.modalBtnBackText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnDanger,
                  (!cancelReason.trim() || cancelMutation.isPending) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={submitCancel}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
              >
                <Text style={styles.modalBtnDangerText}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ═══════ Reschedule Modal ═══════ */}
      <Modal
        visible={rescheduleVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.rescheduleModal,
              { transform: [{ scale: rescheduleScaleAnim }] },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.rescheduleHeader}>
              <View style={styles.rescheduleIconWrap}>
                <RefreshCw size={scale(20)} color={colors.primaryBlue} />
              </View>
              <Text style={styles.rescheduleTitle}>Reschedule Appointment</Text>
              <TouchableOpacity
                onPress={() => setRescheduleVisible(false)}
                style={styles.rescheduleClose}
              >
                <X size={scale(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: verticalScale(420) }}
            >
              {/* Date Picker */}
              <Text style={styles.rsLabel}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: scale(8) }}
              >
                {daysList.map(d => {
                  const active = d.id === rescheduleActiveDay;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      activeOpacity={0.85}
                      onPress={() => setRescheduleActiveDay(d.id)}
                      style={[
                        styles.rsDayPill,
                        active && styles.rsDayPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rsDayLabel,
                          active && styles.rsDayLabelActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                      <Text
                        style={[
                          styles.rsDayDate,
                          active && styles.rsDayDateActive,
                        ]}
                      >
                        {d.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Mode */}
              <Text style={[styles.rsLabel, { marginTop: verticalScale(16) }]}>
                Consultation Mode
              </Text>
              <View style={styles.rsModeRow}>
                {[
                  { id: 'video', label: '📹 Video' },
                  { id: 'audio', label: '📞 Audio' },
                ].map(mode => (
                  <TouchableOpacity
                    key={mode.id}
                    activeOpacity={0.8}
                    onPress={() => setRescheduleMode(mode.id as any)}
                    style={[
                      styles.rsModeTab,
                      rescheduleMode === mode.id && styles.rsModeTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rsModeText,
                        rescheduleMode === mode.id && styles.rsModeTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Slots */}
              <Text style={[styles.rsLabel, { marginTop: verticalScale(16) }]}>
                Select Time Slot
              </Text>
              {fetchingSlots ? (
                <ActivityIndicator
                  color={colors.primaryBlue}
                  style={{ marginVertical: verticalScale(16) }}
                />
              ) : noSlots ? (
                <View style={styles.rsNoSlots}>
                  <Text style={styles.rsNoSlotsText}>
                    No slots available for this date
                  </Text>
                </View>
              ) : (
                <>
                  {currentSlots.morning.length > 0 && (
                    <>
                      <Text style={styles.rsSlotSection}>Morning</Text>
                      <View style={styles.rsSlotsWrap}>
                        {currentSlots.morning.map(s => (
                          <SlotChip
                            key={s._id || s.id}
                            label={s.startTime}
                            active={rescheduleActiveSlot === s.startTime}
                            onPress={() => {
                              setRescheduleActiveSlot(s.startTime);
                              setRescheduleActiveSlotId(s._id || s.id);
                            }}
                          />
                        ))}
                      </View>
                    </>
                  )}
                  {currentSlots.afternoon.length > 0 && (
                    <>
                      <Text style={styles.rsSlotSection}>Afternoon</Text>
                      <View style={styles.rsSlotsWrap}>
                        {currentSlots.afternoon.map(s => (
                          <SlotChip
                            key={s._id || s.id}
                            label={s.startTime}
                            active={rescheduleActiveSlot === s.startTime}
                            onPress={() => {
                              setRescheduleActiveSlot(s.startTime);
                              setRescheduleActiveSlotId(s._id || s.id);
                            }}
                          />
                        ))}
                      </View>
                    </>
                  )}
                  {currentSlots.evening.length > 0 && (
                    <>
                      <Text style={styles.rsSlotSection}>Evening</Text>
                      <View style={styles.rsSlotsWrap}>
                        {currentSlots.evening.map(s => (
                          <SlotChip
                            key={s._id || s.id}
                            label={s.startTime}
                            active={rescheduleActiveSlot === s.startTime}
                            onPress={() => {
                              setRescheduleActiveSlot(s.startTime);
                              setRescheduleActiveSlotId(s._id || s.id);
                            }}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </>
              )}

              {/* Notes */}
              <Text style={[styles.rsLabel, { marginTop: verticalScale(16) }]}>
                Notes (optional)
              </Text>
              <TextInput
                style={styles.rsNotesInput}
                placeholder="Add a note for the doctor..."
                placeholderTextColor={colors.textLight}
                value={rescheduleNotes}
                onChangeText={setRescheduleNotes}
                multiline
              />
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnBack}
                onPress={() => setRescheduleVisible(false)}
                disabled={rescheduleMutation.isPending}
              >
                <Text style={styles.modalBtnBackText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rsConfirmBtn,
                  (!rescheduleActiveSlotId || rescheduleMutation.isPending) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={submitReschedule}
                disabled={
                  !rescheduleActiveSlotId || rescheduleMutation.isPending
                }
              >
                <Text style={styles.rsConfirmText}>
                  {rescheduleMutation.isPending
                    ? 'Rescheduling...'
                    : 'Confirm Reschedule'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ═══════ Document Preview Modal ═══════ */}
      <Modal
        visible={!!previewUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUrl(null)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {previewTitle}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => handleDownload(previewUrl || '', previewTitle)}
                style={[
                  styles.previewCloseBtn,
                  {
                    marginRight: scale(10),
                    backgroundColor: colors.primaryGreen,
                  },
                ]}
              >
                <Download size={scale(18)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreviewUrl(null)}
                style={styles.previewCloseBtn}
              >
                <X size={scale(20)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.previewBody}>
            {previewUrl?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
              <Image
                source={{ uri: previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : previewUrl?.toLowerCase().includes('.pdf') ? (
              <Pdf
                trustAllCerts={false}
                source={{ uri: previewUrl, cache: true }}
                style={styles.pdfViewer}
                onLoadComplete={numberOfPages => {
                  console.log(`Number of pages: ${numberOfPages}`);
                }}
                onPageChanged={page => {
                  console.log(`Current page: ${page}`);
                }}
                onError={error => {
                  console.log('PDF load error:', error);
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load PDF.',
                  });
                }}
                onPressLink={uri => {
                  console.log(`Link pressed: ${uri}`);
                  Linking.openURL(uri);
                }}
                renderActivityIndicator={() => (
                  <ActivityIndicator color={colors.primaryBlue} size="large" />
                )}
              />
            ) : (
              <View style={styles.previewFallback}>
                <FileText size={scale(48)} color={colors.primaryBlue} />
                <Text style={styles.previewFallbackText}>{previewTitle}</Text>
                <TouchableOpacity
                  style={styles.previewOpenBtn}
                  onPress={() => {
                    if (previewUrl)
                      Linking.openURL(previewUrl).catch(err =>
                        console.error('Open failed:', err),
                      );
                  }}
                >
                  <Text style={styles.previewOpenText}>Open in Browser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ═══════════════════════ STYLES ═══════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { width: scale(40), height: scale(40), justifyContent: 'center' },
  headerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  content: { padding: scale(16) },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  bookingId: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
  },
  badgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
  badgeBlue: { backgroundColor: 'rgba(21,114,183,0.1)' },
  badgeTextBlue: { color: colors.primaryBlue },
  badgeGreen: { backgroundColor: 'rgba(65,179,74,0.1)' },
  badgeTextGreen: { color: colors.primaryGreen },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.1)' },
  badgeTextRed: { color: '#EF4444' },

  card: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: 'rgba(21,114,183,0.1)',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primaryBlue,
  },
  docInfo: { flex: 1, marginLeft: scale(16) },
  docName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(2),
  },
  docSpec: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  iconCircle: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: 'rgba(21,114,183,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(6),
    marginLeft: scale(4),
  },
  sectionDescription: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: verticalScale(12),
    marginLeft: scale(4),
    lineHeight: verticalScale(16),
  },
  bulletPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },
  bulletPoint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs - 1,
    color: colors.textSecondary,
    marginLeft: scale(6),
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1, marginLeft: scale(12) },
  itemLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  itemValue: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: verticalScale(16),
  },
  dividerVertical: {
    width: 1,
    height: verticalScale(30),
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: scale(10),
  },
  bottomSpace: { height: verticalScale(40) },
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  parentText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
  },


  /* Bottom bar */
  bottomBar: {
    backgroundColor: '#fff',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionsRow: { flexDirection: 'row' },
  joinBtn: {
    flex: 1,
    height: verticalScale(44),
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
    height: verticalScale(44),
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
    height: verticalScale(44),
    borderRadius: scale(10),
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#EF4444',
  },
  retryPaymentBtn: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: scale(10),
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: scale(10),
  },
  retryPaymentText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  followUpBtnFull: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: scale(10),
    backgroundColor: 'rgba(65,179,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followUpTextFull: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.primaryGreen,
  },

  /* ── Shared Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(20),
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
  },
  modalSub: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(16),
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: scale(12),
    padding: scale(12),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: verticalScale(20),
    justifyContent: 'flex-end',
    gap: scale(12),
  },
  modalBtnBack: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalBtnBackText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  modalBtnDanger: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#EF4444',
  },
  modalBtnDangerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },

  /* ── Reschedule Modal ── */
  rescheduleModal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(20),
    maxHeight: '85%',
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(18),
  },
  rescheduleIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  rescheduleTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  rescheduleClose: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rsLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
  rsDayPill: {
    width: scale(50),
    height: verticalScale(52),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: scale(10),
  },
  rsDayPillActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: 'rgba(21,114,183,0.65)',
  },
  rsDayLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  rsDayDate: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  rsDayLabelActive: { color: 'rgba(255,255,255,0.85)' },
  rsDayDateActive: { color: '#fff' },

  rsModeRow: { flexDirection: 'row', gap: scale(12) },
  rsModeTab: {
    flex: 1,
    height: verticalScale(40),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  rsModeTabActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: 'rgba(21,114,183,0.55)',
  },
  rsModeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  rsModeTextActive: { color: colors.primaryBlue },

  rsSlotSection: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: verticalScale(8),
    marginBottom: verticalScale(6),
  },
  rsSlotsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  rsNoSlots: { paddingVertical: verticalScale(16), alignItems: 'center' },
  rsNoSlotsText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  rsNotesInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: scale(12),
    padding: scale(12),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    minHeight: verticalScale(60),
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  rsConfirmBtn: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#F59E0B',
  },
  rsConfirmText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },

  /* Slot chips */
  slotChip: {
    height: verticalScale(34),
    paddingHorizontal: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    marginBottom: verticalScale(10),
  },
  slotChipActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: 'rgba(21,114,183,0.55)',
  },
  slotChipDisabled: {
    backgroundColor: '#F2F2F2',
    borderColor: 'rgba(0,0,0,0.05)',
  },
  slotChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  slotChipTextActive: { color: colors.primaryBlue },
  slotChipTextDisabled: { color: 'rgba(0,0,0,0.25)' },

  /* ── Document rows ── docRow reused from above */
  docIconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextArea: { flex: 1, marginLeft: scale(12) },
  docTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  docType: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  docActionBtn: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: verticalScale(20),
  },

  /* ── Preview Modal ── */
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(12),
  },
  previewTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  previewCloseBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '90%', height: '80%' },
  previewFallback: { alignItems: 'center', padding: scale(32) },
  previewFallbackText: {
    marginTop: verticalScale(16),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#fff',
    textAlign: 'center',
  },
  previewOpenBtn: {
    marginTop: verticalScale(20),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: scale(10),
    backgroundColor: colors.primaryBlue,
  },
  previewOpenText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },

  /* ── Aesthetic Note Items ── */
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  noteIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteLabel: {
    marginLeft: scale(10),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  noteContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  noteValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    lineHeight: verticalScale(20),
  },
  paymentBreakdown: {
    paddingTop: verticalScale(10),
    paddingHorizontal: scale(12),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  meetingLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(10),
    padding: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  meetingUrl: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
    marginRight: scale(10),
  },
  copyBtn: {
    padding: scale(6),
    backgroundColor: 'rgba(21,114,183,0.05)',
    borderRadius: scale(8),
  },
  prescriptionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    lineHeight: verticalScale(18),
    backgroundColor: '#F9FAFB',
    padding: scale(10),
    borderRadius: scale(8),
  },
  medItem: {
    marginBottom: verticalScale(12),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  medName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  medDuration: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.primaryBlue,
    backgroundColor: 'rgba(21,114,183,0.05)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
  },
  medDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: scale(8),
  },
  medSubText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  medInstruction: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.primaryGreen,
    backgroundColor: 'rgba(65,179,74,0.05)',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1),
    borderRadius: scale(4),
  },
  testTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  testTag: {
    backgroundColor: 'rgba(239,68,68,0.05)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.1)',
  },
  testTagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#EF4444',
  },
  meetingGradientCard: {
    borderRadius: scale(20),
    padding: scale(20),
    marginBottom: verticalScale(20),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  whiteIconBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  meetingSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: verticalScale(2),
  },

  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  linkText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#fff',
    marginRight: scale(12),
  },
  glassCopyBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  medicationList: {
    marginTop: verticalScale(8),
  },
  premiumMedItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  medLeftLine: {
    width: scale(4),
    backgroundColor: colors.primaryBlue,
  },
  medContentArea: {
    flex: 1,
    padding: scale(12),
  },
  medRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  premiumMedName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  medBadge: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(6),
  },
  medBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(10),
    color: colors.primaryBlue,
  },
  premiumMedDosage: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: verticalScale(6),
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: scale(6),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  premiumMedInstruction: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: colors.primaryGreen,
    marginLeft: scale(6),
  },
  pdfViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  successContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: scale(24),
    padding: scale(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconBg: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  successTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
  successSub: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(24),
  },
  successCloseBtn: {
    width: '100%',
    height: verticalScale(48),
    backgroundColor: colors.primaryBlue,
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCloseBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },

  /* ── Reminder Styles ── */
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.12)',
    shadowColor: '#1572B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  reminderIconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: 'rgba(21,114,183,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(2),
  },
  reminderSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: verticalScale(16),
  },
  reminderToggleBtn: {
    height: verticalScale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(21,114,183,0.04)',
  },
  reminderToggleBtnActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  reminderToggleText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  reminderToggleTextActive: {
    color: '#fff',
  },
});
