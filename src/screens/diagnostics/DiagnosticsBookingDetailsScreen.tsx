import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, User, FileText, CreditCard, XCircle, RotateCcw } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsBookingService } from '../../api/diagnosticsBookingService';
import type { DiagnosticsCancelRequest } from '../../api/pharmyx';
import { colors } from '../../theme/colors';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { isPaymentPending, DiagnosticsEmptyState } from './components/DiagnosticsShared';

type DetailsProps = NativeStackScreenProps<RootStackParamList, 'DiagnosticsBookingDetails'>;

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
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primaryBlue} size="large" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <DiagnosticsEmptyState
          title="Booking not found"
          subtitle="This booking is not available in the current session."
          actionTitle="Back to Diagnostics"
          onAction={() => navigation.navigate('Diagnostics')}
        />
      </SafeAreaView>
    );
  }

  const isPending = isPaymentPending(booking);
  const tests = Array.isArray(booking.testNames) ? booking.testNames : [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Status Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.bookingId}>Booking #{bookingId}</Text>
            <View style={[styles.statusBadge, isPending ? styles.statusBadgePending : styles.statusBadgeSuccess]}>
              <Text style={[styles.statusText, isPending ? styles.statusTextPending : styles.statusTextSuccess]}>
                {String(booking.status || 'Created')}
              </Text>
            </View>
          </View>
          <Text style={styles.amount}>₹{String(booking.amount ?? 0)}</Text>
          <Text style={styles.paymentStatus}>
            Payment: {String(booking.paymentStatus || 'Pending')}
          </Text>
        </View>

        {/* Patient & Appointment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          
          <View style={styles.detailRow}>
            <User size={scale(18)} color="#64748B" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValue}>{booking.patientName || 'NA'}</Text>
              <Text style={styles.detailSubValue}>{booking.patientPhone || 'NA'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Calendar size={scale(18)} color="#64748B" style={styles.detailIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{booking.bookingDate || 'NA'}</Text>
            </View>
            <Clock size={scale(18)} color="#64748B" style={styles.detailIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{booking.bookingTime || 'NA'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <MapPin size={scale(18)} color="#64748B" style={styles.detailIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Home Collection Address</Text>
              <Text style={styles.detailValue}>{booking.addressLine || 'NA'}</Text>
              <Text style={styles.detailSubValue}>Pincode: {booking.pincode || 'NA'}</Text>
            </View>
          </View>
        </View>

        {/* Tests Included */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12) }}>
            <FileText size={scale(18)} color="#0F172A" style={{ marginRight: scale(8) }} />
            <Text style={styles.sectionTitle}>Tests Included</Text>
          </View>
          {tests.length > 0 ? tests.map((test, idx) => (
            <View key={idx} style={styles.testItem}>
              <View style={styles.bullet} />
              <Text style={styles.testName}>{test}</Text>
            </View>
          )) : (
            <Text style={styles.testName}>NA</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {isPending && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]} 
              onPress={() => navigation.navigate('DiagnosticsPayment', { bookingId })}
            >
              <CreditCard size={scale(18)} color="#fff" style={styles.btnIcon} />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Pay Now</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.outlineBtn, { flex: 1 }]} 
              onPress={() => navigation.navigate('DiagnosticsReschedule', { bookingId })}
            >
              <RotateCcw size={scale(16)} color="#475569" style={styles.btnIcon} />
              <Text style={styles.actionBtnText}>Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.outlineBtn, { flex: 1, borderColor: '#FECACA' }]} 
              onPress={() =>
                Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
                  { text: 'Keep', style: 'cancel' },
                  {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: () => cancelMutation.mutate({ cancellationReason: 'Cancelled by patient' }),
                  },
                ])
              }
            >
              <XCircle size={scale(16)} color="#EF4444" style={styles.btnIcon} />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Cancel</Text>
            </TouchableOpacity>
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
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: verticalScale(16),
  },
  bookingId: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  statusBadgePending: { backgroundColor: '#FEF3C7' },
  statusBadgeSuccess: { backgroundColor: '#D1FAE5' },
  statusText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(11),
    textTransform: 'uppercase',
  },
  statusTextPending: { color: '#D97706' },
  statusTextSuccess: { color: '#059669' },
  amount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(32),
    color: '#0F172A',
    marginBottom: verticalScale(4),
  },
  paymentStatus: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#475569',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginBottom: verticalScale(16),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginTop: verticalScale(2),
    marginRight: scale(12),
  },
  detailLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(12),
    color: '#64748B',
    marginBottom: verticalScale(2),
  },
  detailValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(15),
    color: '#0F172A',
  },
  detailSubValue: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(13),
    color: '#64748B',
    marginTop: verticalScale(2),
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: verticalScale(12),
    marginLeft: scale(30),
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    paddingLeft: scale(4),
  },
  bullet: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: colors.primaryBlue,
    marginRight: scale(10),
  },
  testName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#334155',
  },
  actionsSection: {
    marginTop: verticalScale(8),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
  },
  primaryBtn: {
    backgroundColor: colors.primaryBlue,
  },
  outlineBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnIcon: {
    marginRight: scale(8),
  },
  actionBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(14),
    color: '#475569',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: scale(12),
  },
});
