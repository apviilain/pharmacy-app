import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type { DiagnosticsCancelRequest, DiagnosticsBooking } from '../../api/pharmyx';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { 
  getBookingId, 
  isPaymentPending, 
  DiagnosticsEmptyState 
} from './components/DiagnosticsShared';

type HistoryProps = NativeStackScreenProps<RootStackParamList, 'DiagnosticsHistory'>;

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
      <Pressable style={styles.actionBtnOutline} onPress={onCancel}>
        <Text style={styles.actionBtnOutlineText}>Cancel</Text>
      </Pressable>
      <Pressable style={styles.actionBtnOutline} onPress={onReschedule}>
        <Text style={styles.actionBtnOutlineText}>Reschedule</Text>
      </Pressable>
    </View>
  </Pressable>
);

export const DiagnosticsHistoryScreen: React.FC<HistoryProps> = ({ navigation }) => {
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
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
          <DiagnosticsEmptyState
            title="No bookings available"
            subtitle="Create a new diagnostics booking to start the flow."
            actionTitle="Browse Packages"
            onAction={() => navigation.navigate('Diagnostics')}
          />
        ) : (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContent: {
    padding: scale(16),
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(14),
    color: colors.textLight,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(32),
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.medium,
    color: colors.textLight,
    fontSize: scale(14),
  },
  listWrap: {
    gap: verticalScale(12),
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  bookingTitleWrap: {
    flex: 1,
  },
  bookingTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(16),
    color: colors.textHeader,
  },
  bookingSubTitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(13),
    color: colors.textLight,
    marginTop: verticalScale(2),
  },
  statusPill: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    marginLeft: scale(12),
  },
  statusPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
  },
  statusPillTextPending: {
    color: '#F59E0B',
  },
  statusPillTextSuccess: {
    color: '#10B981',
  },
  bookingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metaLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(14),
    color: colors.textLight,
  },
  metaValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    color: '#334155',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale(12),
    marginTop: verticalScale(16),
  },
  actionBtnOutline: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnOutlineText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    color: '#64748B',
  },
});
