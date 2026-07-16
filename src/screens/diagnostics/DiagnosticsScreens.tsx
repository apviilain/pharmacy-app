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
  Check,
  RefreshCw,
} from 'lucide-react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsCatalogService } from '../../api/diagnosticsCatalogService';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type {
  DiagnosticsBooking,
  DiagnosticsBookingRequest,
  DiagnosticsCancelRequest,
  DiagnosticsPackage,
  DiagnosticsRescheduleRequest,
  DiagnosticsRetryPaymentRequest,
  DiagnosticsSlot,
} from '../../api/pharmyx';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { env } from '../../config/env';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { parsePaymentError } from '../../utils/paymentUtils';

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

const getDiagnosticsPaymentContext = (
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
  const razorpayKeyId = String(payment.razorpayKeyId || env.RAZORPAY_KEY || '');

  return {
    razorpayOrderId,
    paymentTransactionId,
    amount,
    currency,
    razorpayKeyId,
  };
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

const PackageCard = ({
  item,
  selected,
  onPress,
}: {
  item: DiagnosticsPackage;
  selected: boolean;
  onPress: () => void;
}) => {
  const label =
    item.packageName || item.displayName || item.name || item.code || 'Package';
  const amount = Number(item.discountedPrice ?? item.amount ?? item.price ?? 0);
  const testsCount = Number(item.testsCount ?? item.testCount ?? 0);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.choiceCard, selected && styles.choiceCardActive]}
    >
      <View style={styles.choiceCardTopRow}>
        <Text style={styles.choiceCardTitle}>{label}</Text>
        {selected ? (
          <View style={styles.choiceCheck}>
            <Check size={scale(14)} color="#fff" />
          </View>
        ) : null}
      </View>
      <Text style={styles.choiceCardMeta}>
        {testsCount > 0 ? `${testsCount} tests` : 'Labstack package'}
      </Text>
      <Text style={styles.choiceCardPrice}>₹{amount}</Text>
    </TouchableOpacity>
  );
};

const SlotChip = ({
  item,
  selected,
  onPress,
}: {
  item: DiagnosticsSlot;
  selected: boolean;
  onPress: () => void;
}) => {
  const label = item.startTime || item.bookingTime || item.label || 'Slot';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.slotOption, selected && styles.slotOptionActive]}
    >
      <Text
        style={[styles.slotOptionText, selected && styles.slotOptionTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

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
  const [selectedPackageIds, setSelectedPackageIds] = React.useState<string[]>([]);

  const packagesQuery = useQuery({
    queryKey: ['diagnosticsPackages', form.integration],
    queryFn: () =>
      diagnosticsCatalogService.getPackages({ integration: form.integration }),
  });

  const slotsQuery = useQuery({
    queryKey: [
      'diagnosticsSlots',
      form.integration,
      form.bookingDate,
      form.pincode,
      selectedPackageIds.join(','),
    ],
    queryFn: () =>
      diagnosticsCatalogService.getSlots({
        integration: form.integration,
        bookingDate: form.bookingDate.trim(),
        pincode: form.pincode.trim(),
        packageIds: selectedPackageIds,
      }),
    enabled:
      /^\d{8}$/.test(form.bookingDate.trim()) &&
      form.pincode.trim().length >= 6 &&
      selectedPackageIds.length > 0,
  });

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
        if (isPaymentPending(created)) {
          navigation.replace('DiagnosticsPayment', { bookingId });
          return;
        }
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

  const togglePackage = (pkg: DiagnosticsPackage) => {
    const packageId = String(pkg.packageId || pkg.id || pkg._id || pkg.code || '');
    const packageName = String(
      pkg.packageName || pkg.displayName || pkg.name || pkg.code || '',
    );

    if (!packageId || !packageName) return;

    setSelectedPackageIds(current => {
      const exists = current.includes(packageId);
      const nextIds = exists
        ? current.filter(value => value !== packageId)
        : [...current, packageId];

      const selectedPackages = (packagesQuery.data || []).filter(item => {
        const currentId = String(
          item.packageId || item.id || item._id || item.code || '',
        );
        return nextIds.includes(currentId);
      });

      setForm(currentForm => ({
        ...currentForm,
        testIds: selectedPackages
          .map(item => String(item.packageId || item.id || item._id || item.code || ''))
          .filter(Boolean)
          .join(', '),
        testNames: selectedPackages
          .map(item =>
            String(item.packageName || item.displayName || item.name || item.code || ''),
          )
          .filter(Boolean)
          .join(', '),
      }));

      return nextIds;
    });
  };

  const selectSlot = (slot: DiagnosticsSlot) => {
    setForm(current => ({
      ...current,
      bookingTime: String(slot.startTime || slot.bookingTime || slot.label || ''),
    }));
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create New Booking</Text>
          <Text style={styles.formSubtitle}>
            Fill in diagnostics booking details on a dedicated screen.
          </Text>

          <View style={styles.catalogSection}>
            <Text style={styles.catalogTitle}>Select Packages</Text>
            <Text style={styles.catalogSubtitle}>
              Labstack packages are loaded first. Manual entry stays available below as fallback.
            </Text>
            {packagesQuery.isLoading ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator color={colors.primaryBlue} />
                <Text style={styles.inlineLoaderText}>Loading packages...</Text>
              </View>
            ) : packagesQuery.isError ? (
              <View style={styles.inlineInfoCard}>
                <CircleAlert size={scale(16)} color="#B45309" />
                <Text style={styles.inlineInfoText}>
                  Package catalog is unavailable right now. You can still enter test IDs manually.
                </Text>
              </View>
            ) : (
              <View style={styles.choiceGrid}>
                {(packagesQuery.data || []).map(item => {
                  const packageId = String(
                    item.packageId || item.id || item._id || item.code || '',
                  );
                  return (
                    <PackageCard
                      key={packageId}
                      item={item}
                      selected={selectedPackageIds.includes(packageId)}
                      onPress={() => togglePackage(item)}
                    />
                  );
                })}
              </View>
            )}
          </View>

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
          <View style={styles.catalogSection}>
            <Text style={styles.catalogTitle}>Select Slot</Text>
            <Text style={styles.catalogSubtitle}>
              Slots refresh after date, pincode, and package selection.
            </Text>
            {slotsQuery.isLoading ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator color={colors.primaryBlue} />
                <Text style={styles.inlineLoaderText}>Loading slots...</Text>
              </View>
            ) : slotsQuery.data && slotsQuery.data.length > 0 ? (
              <View style={styles.slotGrid}>
                {slotsQuery.data.map(item => {
                  const slotId = String(item.slotId || item.id || item._id || '');
                  const label = String(
                    item.startTime || item.bookingTime || item.label || '',
                  );
                  return (
                    <SlotChip
                      key={slotId}
                      item={item}
                      selected={form.bookingTime.trim() === label}
                      onPress={() => selectSlot(item)}
                    />
                  );
                })}
              </View>
            ) : slotsQuery.isFetched &&
              /^\d{8}$/.test(form.bookingDate.trim()) &&
              form.pincode.trim().length >= 6 &&
              selectedPackageIds.length > 0 ? (
              <View style={styles.inlineInfoCard}>
                <CircleAlert size={scale(16)} color="#B45309" />
                <Text style={styles.inlineInfoText}>
                  No Labstack slots returned for this date yet. You can still type the booking time manually.
                </Text>
              </View>
            ) : null}
          </View>
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
  const bookingQuery = useQuery({
    queryKey: ['diagnosticsBookingPayment', bookingId],
    queryFn: async () =>
      diagnosticsBookingService.getSessionBookingById(bookingId) ||
      (await diagnosticsBookingService.getPaymentDetails(bookingId)),
    enabled: !!bookingId,
  });

  const booking = bookingQuery.data;
  const paymentContext = getDiagnosticsPaymentContext(booking);

  const completePayment = React.useCallback(
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
      <Screen style={styles.screen}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </Screen>
    );
  }

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
            <Text style={styles.paymentInfoLabel}>Status</Text>
            <Text style={styles.paymentInfoValue}>
              {String(booking?.paymentStatus || booking?.status || 'Pending')}
            </Text>
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
          {paymentContext.razorpayOrderId ? (
            <PrimaryButton
              title="Pay Now"
              onPress={() => completePayment(booking)}
              variant="outline"
              icon={<CreditCard size={scale(18)} color={colors.textHeader} />}
            />
          ) : null}
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
  catalogSection: {
    marginBottom: verticalScale(14),
  },
  catalogTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  catalogSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: scale(18),
    marginBottom: verticalScale(10),
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  inlineLoaderText: {
    marginLeft: scale(10),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inlineInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#F2D3A5',
    backgroundColor: '#FFF8ED',
    padding: scale(12),
    gap: scale(8),
  },
  inlineInfoText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#8A5A11',
    lineHeight: scale(18),
  },
  choiceGrid: {
    gap: verticalScale(10),
  },
  choiceCard: {
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#E2EAF2',
    backgroundColor: '#F8FBFE',
    padding: scale(14),
  },
  choiceCardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#EEF6FD',
  },
  choiceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: scale(10),
  },
  choiceCardTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  choiceCheck: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardMeta: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  choiceCardPrice: {
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primaryBlue,
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
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  slotOption: {
    borderRadius: scale(999),
    borderWidth: 1,
    borderColor: '#D9E3EE',
    backgroundColor: '#F8FBFE',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
  },
  slotOptionActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#EEF6FD',
  },
  slotOptionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  slotOptionTextActive: {
    color: colors.primaryBlue,
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
