import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { appointmentService } from '../../api/appointmentService';
import { formatDoctorName, formatDate } from '../../utils/appointmentUtils';
import { buildFullUrl } from '../../utils/urlUtils';
import { ListSkeleton } from '../../components/ListSkeleton';
import { useFocusEffect } from '@react-navigation/native';
import { useBadgeStore } from '../../state/badgeStore';

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const Chip = ({
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
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const OrdersScreen = () => {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const navigation = useNavigation<any>();

  const { data: appointments, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: () => appointmentService.getAppointments({ status: 'All' }),
  });

  useFocusEffect(
    React.useCallback(() => {
      useBadgeStore.getState().clearOrdersBadgeCount();
    }, []),
  );

  const filtered = (appointments || []).filter(appt => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return appt.status === 'pending';
    if (activeFilter === 'Confirmed') return appt.status === 'confirmed';
    return true;
  });

  const getStatusStyle = (status: string) => {
    if (status === 'confirmed')
      return { pill: styles.statusSuccess, text: styles.statusTextSuccess, label: '● Confirmed' };
    if (status === 'pending')
      return { pill: styles.statusPending, text: styles.statusTextPending, label: '● Pending' };
    return { pill: styles.statusTransit, text: styles.statusTextTransit, label: status };
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        {/* Filter Chips */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {STATUS_FILTERS.map(f => (
              <Chip
                key={f}
                label={f}
                active={activeFilter === f}
                onPress={() => setActiveFilter(f)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Failed to load orders</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: verticalScale(24) }}
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconBox}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                </View>
                <Text style={styles.emptyTitle}>No appointments found</Text>
                <Text style={styles.emptySub}>
                  Your consultation history will appear here
                </Text>
              </View>
            ) : (
              filtered.map(appt => {
                const { pill, text, label } = getStatusStyle(appt.status);
                return (
                  <TouchableOpacity
                    key={appt.id}
                    activeOpacity={0.9}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate('AppointmentDetails', {
                        appointmentId: appt.id,
                        appointment: appt,
                      })
                    }
                  >
                    {/* Card Top Row */}
                    <View style={styles.cardTop}>
                      <Text style={styles.type}>TELEHEALTH · CONSULTATION</Text>
                      <View style={[styles.statusPill, pill]}>
                        <Text style={[styles.statusText, text]}>{label}</Text>
                      </View>
                    </View>

                    {/* Doctor Row */}
                    <View style={styles.docRow}>
                      {appt.doctorImage ? (
                        <Image source={{ uri: buildFullUrl(appt.doctorImage) }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>
                            {formatDoctorName(appt.doctorName)?.[0] || 'D'}
                          </Text>
                        </View>
                      )}
                      <View style={{ marginLeft: scale(14), flex: 1 }}>
                        <Text style={styles.title} numberOfLines={1}>
                          {formatDoctorName(appt.doctorName) || 'Doctor'}
                        </Text>
                        <Text style={styles.sub} numberOfLines={1}>
                          {appt.specialization || 'Specialist'} ·{' '}
                          <Text style={{ color: colors.textLight }}>
                            #{appt.id?.slice(-8).toUpperCase()}
                          </Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Bottom Row */}
                    <View style={styles.bottomRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.meta} numberOfLines={1}>
                          {formatDate(appt.dateLabel)} · {appt.timeLabel}
                        </Text>
                        <Text style={styles.amountText}>{appt.fee}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.actionBtn}
                        onPress={() =>
                          navigation.navigate('AppointmentDetails', {
                            appointmentId: appt.id,
                            appointment: appt,
                          })
                        }
                      >
                        <Text style={styles.actionText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: scale(16), paddingTop: verticalScale(10) },

  chipsRow: { paddingBottom: verticalScale(14), paddingRight: scale(16) },
  chip: {
    height: verticalScale(36),
    paddingHorizontal: scale(16),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  chipActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: colors.primaryBlue,
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.primaryBlue, fontFamily: typography.fontFamily.semiBold },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: verticalScale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(14),
  },
  type: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(10),
    color: colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* Status pills */
  statusPill: {
    height: verticalScale(26),
    borderRadius: scale(13),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSuccess: { backgroundColor: 'rgba(65,179,74,0.1)' },
  statusPending: { backgroundColor: 'rgba(21,114,183,0.08)' },
  statusTransit: { backgroundColor: 'rgba(245,158,11,0.1)' },
  statusText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
  statusTextSuccess: { color: colors.primaryGreen },
  statusTextPending: { color: colors.primaryBlue },
  statusTextTransit: { color: '#F59E0B' },

  /* Doctor row */
  docRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(14),
    backgroundColor: '#F5F8FE',
  },
  avatarPlaceholder: {
    width: scale(48),
    height: scale(48),
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
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginVertical: verticalScale(16),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  amountText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primaryGreen,
    marginTop: verticalScale(2),
  },
  actionBtn: {
    height: verticalScale(38),
    paddingHorizontal: scale(16),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(21,114,183,0.1)',
  },
  actionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },

  /* Loading / Error / Empty */
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: verticalScale(40) },
  loadingText: {
    marginTop: verticalScale(10),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.error,
  },
  retryBtn: {
    marginTop: verticalScale(12),
    height: verticalScale(40),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
    backgroundColor: 'rgba(21,114,183,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  emptyCard: {
    marginTop: verticalScale(24),
    backgroundColor: '#F9FAFC',
    borderRadius: scale(20),
    padding: scale(30),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
  },
  emptyIconBox: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(20),
    backgroundColor: 'rgba(21,114,183,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  emptyEmoji: { fontSize: scale(32) },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: verticalScale(22),
  },
});
