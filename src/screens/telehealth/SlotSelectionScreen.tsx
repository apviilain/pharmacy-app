import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Upload, X, Eye, FileText } from 'lucide-react-native';
import * as DocumentPicker from '@react-native-documents/picker';
import { WebView } from 'react-native-webview';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DetailsSkeleton } from '../../components/DetailsSkeleton';
import { Specialist, telehealthService } from '../../api/telehealthService';
import { fileService } from '../../api/fileService';
import { getCurrentUserId } from '../../state/authStore';
import { useBadgeStore } from '../../state/badgeStore';
import type { RootStackParamList } from '../../navigation/types';
import { useNotificationStore } from '../../state/notificationStore';
import {
  scheduleAppointmentReminders,
  AppointmentNotificationData,
} from '../../services/notificationService';
import {
  formatDoctorName,
  getApptDateTime,
} from '../../utils/appointmentUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'SlotSelection'>;

const Chip = ({
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

export const SlotSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [doctor, setDoctor] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);

  const daysList = useMemo(() => {
    const result = [];
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
      const current = new Date();
      current.setDate(today.getDate() + i);
      result.push({
        id: current.toISOString().split('T')[0],
        label: daysOfWeek[current.getDay()],
        date: String(current.getDate()),
        fullDate: `${daysOfWeek[current.getDay()]} ${
          months[current.getMonth()]
        } ${current.getDate()}`,
      });
    }
    return result;
  }, []);

  const [activeDay, setActiveDay] = useState(daysList[0]?.id || '');
  const [activeSlot, setActiveSlot] = useState('');
  const [activeSlotId, setActiveSlotId] = useState('');
  const [concern, setConcern] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, any[]>>({
    Reports: [],
    Prescription: [],
    OtherDocuments: [],
  });
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio'>('video');
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{
    morning: any[];
    afternoon: any[];
    evening: any[];
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const showNotification = useNotificationStore(state => state.showNotification);

  const handlePickDocument = async (category: string) => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        allowMultiSelection: true,
      });
      setUploadedDocs(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), ...results],
      }));
    } catch (err) {
      if (
        err instanceof Error &&
        !err.message.toLowerCase().includes('cancel')
      ) {
        console.error(err);
      }
    }
  };

  const handlePreview = async (doc: any) => {
    if (doc.type === 'application/pdf' && Platform.OS === 'android') {
      try {
        const cachedPath = `${RNFS.CachesDirectoryPath}/${
          doc.name || 'preview.pdf'
        }`;
        await RNFS.copyFile(doc.uri, cachedPath);
        setPreviewDoc({ ...doc, uri: `file://${cachedPath}` });
      } catch (err) {
        console.error('File cache failed', err);
        setPreviewDoc(doc);
      }
    } else {
      setPreviewDoc(doc);
    }
  };

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await telehealthService.getSpecialists();
        const found = data.find(d => (d._id || d.id) === route.params.doctorId);
        setDoctor(found || null);
      } catch (error) {
        console.error('Failed to fetch doctor in slot selection', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [route.params.doctorId]);

  useEffect(() => {
    const fetchSlots = async () => {
      setFetchingSlots(true);
      try {
        const formattedDate = activeDay.replace(/-/g, '');
        const response = await telehealthService.getSlots(
          route.params.doctorId,
          formattedDate,
        );
        console.log('response', response);

        const slotsArray = Array.isArray(response)
          ? response
          : response?.data || [];

        if (Array.isArray(slotsArray)) {
          const morning: any[] = [];
          const afternoon: any[] = [];
          const evening: any[] = [];

          const now = new Date();
          const todayDateStr = now.toISOString().split('T')[0];
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          slotsArray.forEach((slot: any) => {
            if (
              !slot ||
              !slot.isActive ||
              !slot.isAvailable ||
              typeof slot.startTime !== 'string'
            )
              return;
            const time = slot.startTime;
            const [hourStr, modifier] = time.split(' ');
            if (!hourStr || !modifier) return;
            const [hour, minute] = hourStr.split(':').map(Number);
            let h = hour;
            if (modifier === 'PM' && hour !== 12) h += 12;
            if (modifier === 'AM' && hour === 12) h = 0;

            // Hide already passed slots for today
            if (activeDay === todayDateStr) {
              if (
                h < currentHour ||
                (h === currentHour && (minute || 0) <= currentMinute)
              ) {
                return;
              }
            }

            if (h < 12) morning.push(slot);
            else if (h < 17) afternoon.push(slot);
            else evening.push(slot);
          });

          setAvailableSlots({ morning, afternoon, evening });

          const flatSlots = [...morning, ...afternoon, ...evening];
          if (flatSlots.length > 0) {
            const currentSlot =
              flatSlots.find(s => s.startTime === activeSlot) || flatSlots[0];
            setActiveSlot(currentSlot.startTime);
            setActiveSlotId(currentSlot._id || currentSlot.id);
          }
        } else {
          setAvailableSlots(null);
        }
      } catch (error) {
        console.error('Failed to fetch slots', error);
        setAvailableSlots(null);
      } finally {
        setFetchingSlots(false);
      }
    };
    if (activeDay) fetchSlots();
  }, [activeDay, route.params.doctorId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <DetailsSkeleton />
      </SafeAreaView>
    );
  }

  const insets = useSafeAreaInsets();
  const fee = doctor?.consultationFee || 0;
  const currentSlots = availableSlots || {
    morning: [],
    afternoon: [],
    evening: [],
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayRow}
        >
          {daysList.map(d => {
            const active = d.id === activeDay;
            return (
              <TouchableOpacity
                key={d.id}
                activeOpacity={0.85}
                onPress={() => setActiveDay(d.id)}
                style={[styles.dayPill, active && styles.dayPillActive]}
              >
                <Text
                  style={[styles.dayLabel, active && styles.dayLabelActive]}
                >
                  {d.label}
                </Text>
                <Text style={[styles.dayDate, active && styles.dayDateActive]}>
                  {d.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

        <View style={styles.meetRow}>
          <Text style={styles.meetText}>
            📅 {daysList.find(d => d.id === activeDay)?.fullDate || ''} ·{' '}
            {selectedMode === 'audio' ? 'Via Audio Call' : 'Via Google Meet'}
          </Text>
        </View>

        {currentSlots.morning.length > 0 && (
          <>
            <Text style={styles.blockTitle}>Morning</Text>
            <View style={styles.slotsWrap}>
              {fetchingSlots ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryBlue}
                  style={{ margin: scale(10) }}
                />
              ) : (
                currentSlots.morning.map(s => (
                  <Chip
                    key={s._id || s.id}
                    label={s.startTime}
                    active={activeSlot === s.startTime}
                    onPress={() => {
                      setActiveSlot(s.startTime);
                      setActiveSlotId(s._id || s.id);
                    }}
                  />
                ))
              )}
            </View>
          </>
        )}

        {currentSlots.afternoon.length > 0 && (
          <>
            <Text style={styles.blockTitle}>Afternoon</Text>
            <View style={styles.slotsWrap}>
              {fetchingSlots ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryBlue}
                  style={{ margin: scale(10) }}
                />
              ) : (
                currentSlots.afternoon.map(s => (
                  <Chip
                    key={s._id || s.id}
                    label={s.startTime}
                    active={activeSlot === s.startTime}
                    onPress={() => {
                      setActiveSlot(s.startTime);
                      setActiveSlotId(s._id || s.id);
                    }}
                  />
                ))
              )}
            </View>
          </>
        )}

        {currentSlots.evening.length > 0 && (
          <>
            <Text style={styles.blockTitle}>Evening</Text>
            <View style={styles.slotsWrap}>
              {fetchingSlots ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryBlue}
                  style={{ margin: scale(10) }}
                />
              ) : (
                currentSlots.evening.map(s => (
                  <Chip
                    key={s._id || s.id}
                    label={s.startTime}
                    active={activeSlot === s.startTime}
                    onPress={() => {
                      setActiveSlot(s.startTime);
                      setActiveSlotId(s._id || s.id);
                    }}
                  />
                ))
              )}
            </View>
          </>
        )}

        {!fetchingSlots &&
          currentSlots.morning.length === 0 &&
          currentSlots.afternoon.length === 0 &&
          currentSlots.evening.length === 0 && (
            <View style={styles.noSlotsContainer}>
              <View style={styles.noSlotsCard}>
                <Text style={styles.noSlotsTitle}>
                  No slots available for this date
                </Text>
                <Text style={styles.noSlotsSub}>
                  Please select another date to view available appointments.
                </Text>
              </View>
            </View>
          )}

        <Text style={[styles.blockTitle, { marginTop: verticalScale(24) }]}>
          Member Details
        </Text>
        <View style={styles.memberCard}>
          <View>
            <Text style={styles.memberName}>{route.params.member.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.blockTitle, { marginTop: verticalScale(24) }]}>
          Appointment Details
        </Text>
        <View style={styles.concernCard}>
          <Text style={styles.concernLabel}>Primary Concern</Text>
          <TextInput
            style={styles.concernInput}
            value={concern}
            onChangeText={setConcern}
            placeholder="Type your concern..."
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Text style={[styles.blockTitle, { marginTop: verticalScale(24) }]}>
          Upload Documents
        </Text>

        {['Reports', 'Prescription', 'Other Documents'].map(category => {
          const key = category.replace(' ', '');
          const docs = uploadedDocs[key] || [];

          return (
            <View key={category} style={styles.uploadCardWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.uploadCard}
                onPress={() => handlePickDocument(key)}
              >
                <View style={styles.uploadCardLeft}>
                  <FileText
                    size={scale(20)}
                    color="#9CA3AF"
                    style={{ marginRight: scale(12) }}
                  />
                  <Text style={styles.uploadCardTitle}>{category}</Text>
                </View>
                <Upload size={scale(20)} color={colors.primaryBlue} />
              </TouchableOpacity>

              {docs.map((doc, index) => (
                <View key={`${category}-${index}`} style={styles.docRow}>
                  <TouchableOpacity
                    style={styles.docInfo}
                    onPress={() => handlePreview(doc)}
                  >
                    <Eye
                      size={scale(16)}
                      color={colors.primaryBlue}
                      style={{ marginRight: scale(6) }}
                    />
                    <Text style={styles.docName} numberOfLines={1}>
                      {doc.name || 'Report'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setUploadedDocs(prev => ({
                        ...prev,
                        [key]: prev[key].filter((_, i) => i !== index),
                      }));
                    }}
                  >
                    <X size={scale(16)} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.accepted}>Accepted Format : JPG,PNG,PDF.</Text>

        <View style={{ height: verticalScale(30) }} />
      </ScrollView>

      <View
        style={[
          styles.bottom,
          { paddingBottom: insets.bottom + verticalScale(16) },
        ]}
      >
        <PrimaryButton
          title={
            isUploading
              ? 'Uploading Docs...'
              : isBooking
              ? 'Booking...'
              : 'Book now →'
          }
          loading={isUploading || isBooking}
          onPress={async () => {
            if (!activeSlotId) {
              Toast.show({
                type: 'error',
                text1: 'Slot Required',
                text2: 'Please select a time slot before proceeding.',
              });
              return;
            }

            const userId = getCurrentUserId();
            if (!userId) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'User is not logged in.',
              });
              return;
            }

            // Step 1: Upload documents
            const allDocs = Object.entries(uploadedDocs).flatMap(
              ([category, list]) =>
                list.map(doc => ({
                  ...doc,
                  category,
                })),
            );
            console.log(
              '[SlotSelection:] documents for upload:',
              JSON.stringify(allDocs, null, 2),
            );

            let mappedDocs: any[] = [];
            if (allDocs.length > 0) {
              setIsUploading(true);
              try {
                const uploadResponse = await fileService.uploadFiles(allDocs);
                console.log('uploadResponse', JSON.stringify(uploadResponse));

                mappedDocs = uploadResponse.map((file: any, idx: number) => {
                  const original = allDocs[idx];
                  let type = 'other';
                  if (original.category === 'Reports') type = 'report';
                  else if (original.category === 'Prescription')
                    type = 'prescription';
                  else if (original.category === 'OtherDocuments')
                    type = 'other';

                  const fileUrl = typeof file === 'string' ? file : file?.url;

                  return {
                    type,
                    url: fileUrl,
                    filename: original.name || 'document',
                  };
                });
                console.log(
                  '✅ [SlotSelection: FINAL MAPPED PAYLOAD] documents expected by booking API:',
                  JSON.stringify(mappedDocs, null, 2),
                );
              } catch (error) {
                console.error('File upload failed in SlotSelection:', error);
                Toast.show({
                  type: 'error',
                  text1: 'Upload Failed',
                  text2:
                    'Could not upload selected documents. Please try again.',
                });
                setIsUploading(false);
                return;
              } finally {
                setIsUploading(false);
              }
            }

            // Step 2: Create booking via API
            setIsBooking(true);
            try {
              const mappedMode = selectedMode === 'audio' ? 'call' : 'video';
              const bookingPayload: any = {
                userId,
                specialistId: route.params.doctorId,
                primaryConcern: (concern || 'Health consultation').trim(),
                consultationMode: mappedMode,
                bookingDate: activeDay.replace(/-/g, ''),
                bookingTime: activeSlot,
                slotId: activeSlotId,
                contactNo: route.params.member.contact,
                documents: mappedDocs.length > 0 ? mappedDocs : undefined,
                followUp: route.params.followUp
                  ? {
                      isFollowUp: route.params.followUp.isFollowUp,
                      parentConsultationId:
                        route.params.followUp.parentConsultationId,
                    }
                  : undefined,
              };

              // Remove empty fields
              Object.keys(bookingPayload).forEach(key => {
                if (
                  bookingPayload[key] === undefined ||
                  bookingPayload[key] === '' ||
                  bookingPayload[key] === null
                ) {
                  delete bookingPayload[key];
                }
              });

              console.log(
                '[SlotSelection] Booking Payload:',
                JSON.stringify(bookingPayload, null, 2),
              );
              const response = await telehealthService.bookSpecialist(
                bookingPayload,
              );
              console.log(
                '[SlotSelection] Booking Response:',
                JSON.stringify(response, null, 2),
              );

              const booking = response?.booking || response;
              const payment = response?.payment;
              const bookingId =
                booking?.bookingId ||
                booking?._id ||
                booking?.id ||
                response?._id ||
                'APT-0000';
              const bookingPrice = booking?.price || fee;

              // Step 3: Handle Follow-up vs Regular Booking
              if (route.params.followUp?.isFollowUp) {
                console.log('[SlotSelection] Successful Follow-up! Skipping payment screen.');
                
                const dateLabel = daysList.find(d => d.id === activeDay)?.fullDate || '';
                
                // Trigger success notification
                showNotification({
                  id: `success-${bookingId}-${Date.now()}`,
                  type: 'booking_success',
                  title: 'Booking Confirmed!',
                  body: `Your follow-up with ${formatDoctorName(doctor?.name || 'Doctor')} is confirmed for ${dateLabel} at ${activeSlot}.`,
                  appointmentId: bookingId,
                  patientName: route.params.member.name,
                  doctorId: route.params.doctorId,
                  dateLabel,
                  timeStr: activeSlot,
                });

                // Auto-schedule reminders
                const apptTime = getApptDateTime(activeDay, activeSlot);
                if (apptTime.getTime() > Date.now()) {
                  const notifData: AppointmentNotificationData = {
                    id: bookingId,
                    patientName: route.params.member.name,
                    specialistName: formatDoctorName(doctor?.name || 'Doctor'),
                    concern: (concern || 'Follow-up consultation').trim(),
                    appointmentTime: apptTime,
                    doctorId: route.params.doctorId,
                    dateLabel,
                  };
                  scheduleAppointmentReminders(notifData);
                }

                // Increment badge count
                useBadgeStore.getState().incrementOrdersBadgeCount();

                // Navigate to Success directly
                navigation.replace('BookingSuccess', {
                  doctorId: route.params.doctorId,
                  appointmentId: bookingId,
                  dateLabel,
                  timeLabel: activeSlot,
                  paymentPending: false,
                });
                return;
              }

              // Step 4: Navigate to payment screen with booking data
              const navParams = {
                doctorId: route.params.doctorId,
                member: route.params.member,
                dateLabel:
                  daysList.find(d => d.id === activeDay)?.fullDate || '',
                timeLabel: activeSlot,
                slotId: activeSlotId,
                rawDate: activeDay.replace(/-/g, ''),
                fee: bookingPrice,
                concern: concern,
                documents: mappedDocs.length > 0 ? mappedDocs : undefined,
                mode: selectedMode,
                followUp: route.params.followUp,
                bookingId,
                bookingPrice,
                payment: payment
                  ? {
                      razorpayOrderId: payment.razorpayOrderId,
                      razorpayKeyId: payment.razorpayKeyId,
                      amount: payment.amount,
                      currency: payment.currency,
                      paymentTransactionId: payment.paymentTransactionId,
                    }
                  : undefined,
              };
              console.log(
                '[SlotSelection:Navigate] to BookingConfirmation with params:',
                JSON.stringify(navParams, null, 2),
              );
              navigation.navigate('BookingConfirmation', navParams);
            } catch (error: any) {
              console.error('[SlotSelection] Booking failed:', error);
              
              const errorData = error?.response?.data;
              if (errorData?.code === 'FOLLOW_UP_ALREADY_USED' || errorData?.message?.includes('already been used')) {
                Toast.show({
                  type: 'error',
                  text1: 'Follow-up Error',
                  text2: errorData?.message || 'The free follow-up for this consultation has already been used',
                });
                return;
              }

              Toast.show({
                type: 'error',
                text1: 'Booking Failed',
                text2:
                  error?.response?.data?.message ||
                  error?.message ||
                  'Could not create booking. Please try again.',
              });
            } finally {
              setIsBooking(false);
            }
          }}
          style={styles.cta}
        />
      </View>

      {previewDoc && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {previewDoc.name || 'Preview'}
              </Text>
              <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                <X size={scale(22)} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {previewDoc.type?.includes('image') ? (
                <Image
                  source={{ uri: previewDoc.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : previewDoc.type === 'application/pdf' ? (
                <Pdf
                  source={{ uri: previewDoc.uri, cache: true }}
                  style={styles.previewDoc}
                />
              ) : (
                <WebView
                  source={{ uri: previewDoc.uri }}
                  style={styles.previewDoc}
                  originWhitelist={['*']}
                  allowFileAccess={true}
                  allowUniversalAccessFromFileURLs={true}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(14),
  },
  dayRow: { flexDirection: 'row', paddingRight: scale(16) },
  dayPill: {
    width: scale(52),
    height: verticalScale(54),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: scale(12),
  },
  dayPillActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: 'rgba(21,114,183,0.65)',
  },
  dayLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  dayDate: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  dayLabelActive: { color: 'rgba(255,255,255,0.85)' },
  dayDateActive: { color: '#fff' },
  meetRow: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: scale(12),
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.12)',
  },
  meetText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  blockTitle: {
    marginTop: verticalScale(14),
    marginBottom: verticalScale(10),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
  },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0EFFF', // Light purple/pinkish border from screenshot
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(6),
  },
  memberName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  memberAge: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#9CA3AF',
  },
  editBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  concernCard: {
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#F0EFFF',
    borderRadius: scale(16),
    padding: scale(16),
    minHeight: verticalScale(100),
  },
  concernLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#9CA3AF',
  },
  concernInput: {
    marginTop: verticalScale(10),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    alignSelf: 'stretch',
    minHeight: verticalScale(120),
  },
  uploadCardWrapper: {
    marginBottom: verticalScale(12),
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0EFFF',
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  uploadCardLeft: { flexDirection: 'row', alignItems: 'center' },
  uploadCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  accepted: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
    backgroundColor: 'rgba(21,114,183,0.04)',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(10),
  },
  noSlotsContainer: {
    marginTop: verticalScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(10),
  },
  noSlotsCard: {
    width: '100%',
    padding: scale(20),
    backgroundColor: '#fff',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    ...shadows.small,
  },
  noSlotsTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    textAlign: 'center',
  },
  noSlotsSub: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    flex: 1,
  },
  bottom: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: colors.background,
  },
  cta: { marginVertical: 0 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(10),
  },
  modalTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
    marginRight: scale(10),
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: scale(14),
    marginBottom: verticalScale(30),
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  previewImage: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewDoc: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    backgroundColor: '#fff',
  },
  fallbackText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  fallbackButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: scale(10),
  },
  fallbackButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#fff',
  },
  noSlotsText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    paddingVertical: verticalScale(6),
  },
  modeTabs: {
    flexDirection: 'row',
    marginTop: verticalScale(16),
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
});
