import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  CreditCard,
  FilePlus2,
  FlaskConical,
  RefreshCw,
} from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type {
  DiagnosticsBooking,
  DiagnosticsBookingRequest,
  DiagnosticsCancelRequest,
  DiagnosticsRescheduleRequest,
  DiagnosticsRetryPaymentRequest,
} from '../../api/pharmyx';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type DiagnosticsProps = NativeStackScreenProps<RootStackParamList, 'Diagnostics'>;
type CreateProps = NativeStackScreenProps<
  RootStackParamList,
  'DiagnosticsCreateBooking'
>;
type DetailsProps = NativeStackScreenProps<
  RootStackParamList,
  'DiagnosticsBookingDetails'
>;
type PaymentProps = NativeStackScreenProps<
  RootStackParamList,
  'DiagnosticsPayment'
>;
type RescheduleProps = NativeStackScreenProps<
  RootStackParamList,
  'DiagnosticsReschedule'
>;

type DiagnosticsForm = {
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

const DEFAULT_FORM: DiagnosticsForm = {
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

const getBookingId = (
  booking: Partial<DiagnosticsBooking> | null | undefined,
): string => String(booking?.bookingId || booking?.id || booking?._id || '');

const isPaymentPending = (booking: Partial<DiagnosticsBooking> | null | undefined) => {
  const paymentStatus = String(booking?.paymentStatus || '').toLowerCase();
  return paymentStatus.includes('pending') || paymentStatus.includes('created');
};

const toCreatePayload = (form: DiagnosticsForm): DiagnosticsBookingRequest => ({
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

const validateCreateForm = (form: DiagnosticsForm) => {
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

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.input, multiline && styles.inputArea, error && styles.inputError]}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

const EmptyState = ({
  title,
  subtitle,
  actionTitle,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionTitle: string;
  onAction: () => void;
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <FlaskConical size={scale(26)} color={colors.primaryBlue} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
    <PrimaryButton title={actionTitle} onPress={onAction} style={styles.emptyAction} />
  </View>
);

const BookingCard = ({
  booking,
  onPress,
  onCancel,
  onReschedule,
}: {
  booking: DiagnosticsBooking;
  onPress: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) => (
  <Pressable style={styles.bookingCard} onPress={onPress}>
    <View style={styles.bookingHeader}>
      <View style={styles.bookingTitleWrap}>
        <Text style={styles.bookingTitle}>{booking.patientName || 'Diagnostics Booking'}</Text>
        <Text style={styles.bookingSubTitle}>
          Booking #{getBookingId(booking) || 'NA'}
        </Text>
      </View>
      <View
        style={[
          styles.statusPill,
          isPaymentPending(booking) ? styles.statusPillPending : styles.statusPillSuccess,
        ]}
      >
        <Text
          style={[
            styles.statusPillText,
            isPaymentPending(booking)
              ? styles.statusPillTextPending
              : styles.statusPillTextSuccess,
          ]}
        >
          {booking.paymentStatus || booking.status || 'Pending'}
        </Text>
      </View>
    </View>

    <View style={styles.bookingMetaRow}>
      <Text style={styles.metaLabel}>Date</Text>
      <Text style={styles.metaValue}>{booking.bookingDate || 'NA'}</Text>
    </View>
    <View style={styles.bookingMetaRow}>
      <Text style={styles.metaLabel}>Time</Text>
      <Text style={styles.metaValue}>{booking.bookingTime || 'NA'}</Text>
    </View>
    <View style={styles.bookingMetaRow}>
      <Text style={styles.metaLabel}>Amount</Text>
      <Text style={styles.metaValue}>₹{String(booking.amount ?? 0)}</Text>
    </View>

    <View style={styles.cardActions}>
      <PrimaryButton
        title="Cancel"
        onPress={onCancel}
        variant="outline"
        style={styles.cardActionButton}
      />
      <PrimaryButton
        title="Reschedule"
        onPress={onReschedule}
        variant="outline"
        style={styles.cardActionButton}
      />
    </View>
  </Pressable>
);

export const DiagnosticsScreen: React.FC<DiagnosticsProps> = ({ navigation }) => {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['diagnosticsSessionBookings'],
    queryFn: diagnosticsBookingService.listSessionBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DiagnosticsCancelRequest }) =>
      diagnosticsBookingService.cancel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      Toast.show({
        type: 'success',
        text1: 'Booking cancelled',
        text2: 'Diagnostics booking has been cancelled.',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to cancel booking',
        text2: error?.message || 'Please try again.',
      });
    },
  });

  const bookings = bookingsQuery.data || [];

  const confirmCancel = (bookingId: string) => {
    Alert.alert('Cancel Booking', 'This diagnostics booking will be cancelled.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: () =>
          cancelMutation.mutate({
            id: bookingId,
            payload: { cancellationReason: 'Cancelled by pharmacy' },
          }),
      },
    ]);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        refreshControl={
          <RefreshControl
            refreshing={bookingsQuery.isRefetching}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] })
            }
            tintColor={colors.primaryBlue}
          />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Diagnostics Bookings</Text>
          <Text style={styles.headerSubtitle}>
            Manage diagnostics bookings with clean card-based actions.
          </Text>
        </View>

        {bookingsQuery.isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading diagnostics bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No bookings available"
            subtitle="Create a new diagnostics booking to start the flow."
            actionTitle="Create New Booking"
            onAction={() => navigation.navigate('DiagnosticsCreateBooking')}
          />
        ) : (
          <>
            <PrimaryButton
              title="Create New Booking"
              onPress={() => navigation.navigate('DiagnosticsCreateBooking')}
              icon={<FilePlus2 size={scale(18)} color="#fff" />}
              style={styles.topAction}
            />
            <View style={styles.listWrap}>
              {bookings.map(booking => {
                const bookingId = getBookingId(booking);
                return (
                  <BookingCard
                    key={bookingId}
                    booking={booking}
                    onPress={() =>
                      navigation.navigate('DiagnosticsBookingDetails', { bookingId })
                    }
                    onCancel={() => confirmCancel(bookingId)}
                    onReschedule={() =>
                      navigation.navigate('DiagnosticsReschedule', { bookingId })
                    }
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

export const DiagnosticsCreateBookingScreen: React.FC<CreateProps> = ({
  navigation,
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<DiagnosticsForm>(DEFAULT_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (payload: DiagnosticsBookingRequest) =>
      diagnosticsBookingService.create(payload),
    onSuccess: created => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      const bookingId = getBookingId(created);
      Toast.show({
        type: 'success',
        text1: 'Booking created',
        text2: 'Diagnostics booking created successfully.',
      });
      if (bookingId) {
        navigation.replace('DiagnosticsBookingDetails', { bookingId });
        return;
      }
      navigation.goBack();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Unable to create booking',
        text2: error?.message || 'Please try again.',
      });
    },
  });

  const submit = () => {
    const nextErrors = validateCreateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    createMutation.mutate(toCreatePayload(form));
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create New Booking</Text>
          <Text style={styles.formSubtitle}>
            Fill in diagnostics booking details on a dedicated screen.
          </Text>

          <Field
            label="Integration"
            value={form.integration}
            onChangeText={text => setForm(current => ({ ...current, integration: text }))}
            placeholder="labstack"
          />
          <Field
            label="Booking Date"
            value={form.bookingDate}
            onChangeText={text => setForm(current => ({ ...current, bookingDate: text }))}
            placeholder="20260810"
            error={errors.bookingDate}
          />
          <Field
            label="Booking Time"
            value={form.bookingTime}
            onChangeText={text => setForm(current => ({ ...current, bookingTime: text }))}
            placeholder="09:30"
            error={errors.bookingTime}
          />
          <Field
            label="Patient Name"
            value={form.patientName}
            onChangeText={text => setForm(current => ({ ...current, patientName: text }))}
            placeholder="Ravi Kumar"
            error={errors.patientName}
          />
          <Field
            label="Patient Phone"
            value={form.patientPhone}
            onChangeText={text => setForm(current => ({ ...current, patientPhone: text }))}
            placeholder="9876543210"
            error={errors.patientPhone}
          />
          <Field
            label="Pincode"
            value={form.pincode}
            onChangeText={text => setForm(current => ({ ...current, pincode: text }))}
            placeholder="110001"
            error={errors.pincode}
          />
          <Field
            label="Address"
            value={form.addressLine}
            onChangeText={text => setForm(current => ({ ...current, addressLine: text }))}
            placeholder="House no, locality"
            error={errors.addressLine}
            multiline
          />
          <Field
            label="Payment Option"
            value={form.paymentOption}
            onChangeText={text => setForm(current => ({ ...current, paymentOption: text }))}
            placeholder="prepaid"
          />
          <Field
            label="Test IDs"
            value={form.testIds}
            onChangeText={text => setForm(current => ({ ...current, testIds: text }))}
            placeholder="cbc, thyroid"
            error={errors.testIds}
          />
          <Field
            label="Test Names"
            value={form.testNames}
            onChangeText={text => setForm(current => ({ ...current, testNames: text }))}
            placeholder="CBC, Thyroid Profile"
            error={errors.testNames}
          />

          <PrimaryButton
            title="Create Booking"
            onPress={submit}
            loading={createMutation.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

export const DiagnosticsBookingDetailsScreen: React.FC<DetailsProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const queryClient = useQueryClient();

  const bookingQuery = useQuery({
    queryKey: ['diagnosticsBooking', bookingId],
    queryFn: async () =>
      diagnosticsBookingService.getSessionBookingById(bookingId) ||
      (await diagnosticsBookingService.getPaymentDetails(bookingId)),
    enabled: !!bookingId,
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: DiagnosticsCancelRequest) =>
      diagnosticsBookingService.cancel(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticsBooking', bookingId] });
      Toast.show({
        type: 'success',
        text1: 'Booking cancelled',
        text2: 'Diagnostics booking has been cancelled.',
      });
    },
  });

  const booking = bookingQuery.data;

  if (bookingQuery.isLoading) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </Screen>
    );
  }

  if (!booking) {
    return (
      <Screen style={styles.screen}>
        <EmptyState
          title="Booking not found"
          subtitle="This booking is not available in the current session."
          actionTitle="Back to Diagnostics"
          onAction={() => navigation.navigate('Diagnostics')}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{booking.patientName || 'Diagnostics Booking'}</Text>
          <Text style={styles.formSubtitle}>Booking #{bookingId}</Text>

          <View style={styles.detailsGrid}>
            <DetailItem label="Booking Status" value={String(booking.status || 'Created')} />
            <DetailItem
              label="Payment Status"
              value={String(booking.paymentStatus || 'Pending')}
            />
            <DetailItem label="Date" value={String(booking.bookingDate || 'NA')} />
            <DetailItem label="Time" value={String(booking.bookingTime || 'NA')} />
            <DetailItem label="Phone" value={String(booking.patientPhone || 'NA')} />
            <DetailItem label="Amount" value={`₹${String(booking.amount ?? 0)}`} />
            <DetailItem label="Pincode" value={String(booking.pincode || 'NA')} />
            <DetailItem
              label="Address"
              value={String(booking.addressLine || 'NA')}
              fullWidth
            />
            <DetailItem
              label="Tests"
              value={Array.isArray(booking.testNames) ? booking.testNames.join(', ') : 'NA'}
              fullWidth
            />
          </View>

          <View style={styles.actionStack}>
            {isPaymentPending(booking) ? (
              <PrimaryButton
                title="Retry Payment"
                onPress={() => navigation.navigate('DiagnosticsPayment', { bookingId })}
                icon={<CreditCard size={scale(18)} color="#fff" />}
              />
            ) : null}
            <PrimaryButton
              title="Reschedule"
              onPress={() => navigation.navigate('DiagnosticsReschedule', { bookingId })}
              variant="outline"
            />
            <PrimaryButton
              title="Cancel"
              onPress={() =>
                Alert.alert('Cancel Booking', 'This diagnostics booking will be cancelled.', [
                  { text: 'Keep', style: 'cancel' },
                  {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: () =>
                      cancelMutation.mutate({
                        cancellationReason: 'Cancelled by pharmacy',
                      }),
                  },
                ])
              }
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const DetailItem = ({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) => (
  <View style={[styles.detailItem, fullWidth && styles.detailItemFull]}>
    <Text style={styles.detailItemLabel}>{label}</Text>
    <Text style={styles.detailItemValue}>{value}</Text>
  </View>
);

export const DiagnosticsPaymentScreen: React.FC<PaymentProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = React.useState('');
  const [useWalletBalance, setUseWalletBalance] = React.useState(false);

  const booking = diagnosticsBookingService.getSessionBookingById(bookingId);

  const retryMutation = useMutation({
    mutationFn: (payload: DiagnosticsRetryPaymentRequest) =>
      diagnosticsBookingService.retryPayment(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticsBooking', bookingId] });
      Toast.show({
        type: 'success',
        text1: 'Payment retry started',
        text2: 'Payment flow has been triggered again.',
      });
      navigation.replace('DiagnosticsBookingDetails', { bookingId });
    },
  });

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Retry Payment</Text>
          <Text style={styles.formSubtitle}>
            Continue payment for booking #{bookingId}
          </Text>

          <View style={styles.paymentInfoCard}>
            <Text style={styles.paymentInfoLabel}>Patient</Text>
            <Text style={styles.paymentInfoValue}>{booking?.patientName || 'NA'}</Text>
            <Text style={styles.paymentInfoLabel}>Amount</Text>
            <Text style={styles.paymentInfoValue}>₹{String(booking?.amount ?? 0)}</Text>
          </View>

          <Field
            label="Coupon Code"
            value={couponCode}
            onChangeText={setCouponCode}
            placeholder="Optional coupon"
          />
          <Field
            label="Use Wallet Balance"
            value={useWalletBalance ? 'yes' : 'no'}
            onChangeText={text => setUseWalletBalance(text.trim().toLowerCase() === 'yes')}
            placeholder="yes / no"
          />

          <PrimaryButton
            title="Retry Payment"
            onPress={() =>
              retryMutation.mutate({
                useWalletBalance,
                couponCode: couponCode.trim() || undefined,
              })
            }
            loading={retryMutation.isPending}
            icon={<ArrowRight size={scale(18)} color="#fff" />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

export const DiagnosticsRescheduleScreen: React.FC<RescheduleProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const queryClient = useQueryClient();
  const booking = diagnosticsBookingService.getSessionBookingById(bookingId);
  const [bookingDate, setBookingDate] = React.useState(String(booking?.bookingDate || ''));
  const [bookingTime, setBookingTime] = React.useState(String(booking?.bookingTime || ''));
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const rescheduleMutation = useMutation({
    mutationFn: (payload: DiagnosticsRescheduleRequest) =>
      diagnosticsBookingService.reschedule(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticsSessionBookings'] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticsBooking', bookingId] });
      Toast.show({
        type: 'success',
        text1: 'Booking rescheduled',
        text2: 'Diagnostics booking has been updated.',
      });
      navigation.replace('DiagnosticsBookingDetails', { bookingId });
    },
  });

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!/^\d{8}$/.test(bookingDate.trim())) {
      nextErrors.bookingDate = 'Booking date must be YYYYMMDD';
    }
    if (!bookingTime.trim()) {
      nextErrors.bookingTime = 'Booking time is required';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    rescheduleMutation.mutate({
      bookingDate: bookingDate.trim(),
      bookingTime: bookingTime.trim(),
    });
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Reschedule Booking</Text>
          <Text style={styles.formSubtitle}>
            Update date and time for booking #{bookingId}
          </Text>

          <Field
            label="Booking Date"
            value={bookingDate}
            onChangeText={setBookingDate}
            placeholder="20260810"
            error={errors.bookingDate}
          />
          <Field
            label="Booking Time"
            value={bookingTime}
            onChangeText={setBookingTime}
            placeholder="11:30"
            error={errors.bookingTime}
          />

          <PrimaryButton
            title="Save Changes"
            onPress={submit}
            loading={rescheduleMutation.isPending}
            icon={<CalendarClock size={scale(18)} color="#fff" />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },
  screenContent: {
    padding: scale(16),
    paddingBottom: verticalScale(32),
  },
  formContent: {
    padding: scale(16),
    paddingBottom: verticalScale(32),
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    padding: scale(18),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    marginBottom: verticalScale(14),
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(20),
  },
  topAction: {
    marginVertical: 0,
    marginBottom: verticalScale(14),
  },
  listWrap: {
    gap: verticalScale(12),
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(22),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    padding: scale(16),
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  bookingTitleWrap: {
    flex: 1,
    marginRight: scale(12),
  },
  bookingTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  bookingSubTitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statusPill: {
    borderRadius: scale(999),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
  },
  statusPillPending: {
    backgroundColor: '#FEF1E8',
  },
  statusPillSuccess: {
    backgroundColor: '#EAF8ED',
  },
  statusPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  statusPillTextPending: {
    color: '#C16306',
  },
  statusPillTextSuccess: {
    color: '#2E8E43',
  },
  bookingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  metaLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  metaValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  cardActions: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(8),
  },
  cardActionButton: {
    flex: 1,
    width: undefined,
    minWidth: 0,
    marginVertical: 0,
  },
  emptyState: {
    minHeight: verticalScale(360),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(24),
  },
  emptyIcon: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(24),
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: scale(22),
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  emptyAction: {
    width: '100%',
    marginVertical: 0,
  },
  loadingCard: {
    minHeight: verticalScale(220),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(22),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(24),
    margin: scale(16),
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    padding: scale(18),
  },
  formTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  formSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(19),
    marginBottom: verticalScale(18),
  },
  fieldWrap: {
    marginBottom: verticalScale(14),
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  input: {
    minHeight: verticalScale(52),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#D9E3EE',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(14),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  inputArea: {
    minHeight: verticalScale(92),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(14),
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scale(6),
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: scale(6),
    marginBottom: verticalScale(14),
  },
  detailItemFull: {
    width: '100%',
  },
  detailItemLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },
  detailItemValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  actionStack: {
    marginTop: verticalScale(10),
    gap: verticalScale(10),
  },
  paymentInfoCard: {
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    backgroundColor: '#F8FBFE',
    padding: scale(14),
    marginBottom: verticalScale(14),
  },
  paymentInfoLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: verticalScale(2),
  },
  paymentInfoValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(10),
  },
});
