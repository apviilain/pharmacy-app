import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { premiumTheme, radii, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import {
  formatTime,
  getEntityId,
  getOrderCustomer,
  getOrderStatusMeta,
  normalizeState,
  usePharmacyOrdersOverview,
} from './ordersShared';

type FilterKey = 'all' | 'pending' | 'processed' | 'payment';

const FILTERS: Array<{
  key: FilterKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}> = [
  { key: 'all', label: 'All', icon: ShoppingBag },
  { key: 'pending', label: 'Pending', icon: Clock3 },
  { key: 'processed', label: 'Done', icon: CheckCircle2 },
  { key: 'payment', label: 'Payment', icon: CircleDollarSign },
];

export function PharmacyOrdersListScreen() {
  const queryClient = useQueryClient();
  const { ordersQuery, orders, pendingOrders, processedOrders, pendingPayment } =
    usePharmacyOrdersOverview();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const status = normalizeState(order.status);
      const paymentStatus = normalizeState(order.paymentStatus);
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'pending' && ['placed', 'pending'].includes(status)) ||
        (activeFilter === 'processed' &&
          ['accepted', 'processing', 'ready', 'delivered'].includes(status)) ||
        (activeFilter === 'payment' && paymentStatus === 'pending');

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const orderId = getEntityId(order).toLowerCase();
      const customer = getOrderCustomer(order).toLowerCase();
      const firstItem = String(order.items?.[0]?.medicineName || '').toLowerCase();

      return (
        orderId.includes(normalizedQuery) ||
        customer.includes(normalizedQuery) ||
        firstItem.includes(normalizedQuery)
      );
    });
  }, [activeFilter, orders, searchQuery]);

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pharmacyOrdersOverview'] });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={ordersQuery.isFetching} onRefresh={refreshAll} />
        }
      >
        <View style={styles.overviewRow}>
          <View style={styles.overviewCard}>
            <Clock3 size={scale(18)} color={colors.primaryBlue} />
            <Text style={styles.overviewLabel}>Pending</Text>
            <Text style={styles.overviewValue}>{pendingOrders}</Text>
          </View>
          <View style={styles.overviewCard}>
            <PackageCheck size={scale(18)} color={colors.primaryBlue} />
            <Text style={styles.overviewLabel}>Processed</Text>
            <Text style={styles.overviewValue}>{processedOrders}</Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <Search size={scale(18)} color={premiumTheme.caption} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Order ID, Patient Name..."
            placeholderTextColor={premiumTheme.caption}
            style={styles.searchInput}
          />
          {searchQuery.trim().length ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <X size={scale(14)} color={premiumTheme.subtext} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => {
            const FilterIcon = filter.icon;
            const active = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.86}
                onPress={() => setActiveFilter(filter.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <FilterIcon
                  size={scale(15)}
                  color={active ? '#FFFFFF' : colors.primaryBlue}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>{pendingPayment} payment pending</Text>
          </View>
        </View>

        {ordersQuery.isLoading ? (
          <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
        ) : filteredOrders.length ? (
          filteredOrders.slice(0, 8).map((order) => {
            const statusMeta = getOrderStatusMeta(order);
            const StatusIcon = statusMeta.icon;
            const paymentPending = normalizeState(order.paymentStatus) === 'pending';

            return (
              <View key={getEntityId(order)} style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderIdText}>#{getEntityId(order) || 'ORDER'}</Text>
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: statusMeta.backgroundColor },
                    ]}
                  >
                    <StatusIcon size={scale(13)} color={statusMeta.color} />
                    <Text style={[styles.statusChipText, { color: statusMeta.color }]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.customerName}>{getOrderCustomer(order)}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Truck size={scale(14)} color={premiumTheme.subtext} />
                    <Text style={styles.metaText}>
                      {String(order.items?.[0]?.medicineName || 'Medicine order')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.paymentChip,
                      paymentPending ? styles.paymentChipPending : styles.paymentChipPaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentChipText,
                        paymentPending
                          ? styles.paymentChipTextPending
                          : styles.paymentChipTextPaid,
                      ]}
                    >
                      {paymentPending ? 'Pending' : 'Paid'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <Clock3 size={scale(14)} color={premiumTheme.subtext} />
                  <Text style={styles.timeText}>
                    {formatTime(order.updatedAt || order.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Search size={scale(22)} color={colors.primaryBlue} />
            </View>
            <Text style={styles.emptyTitle}>No matching orders</Text>
            <Text style={styles.emptySubtitle}>
              Try another customer name, medicine, or order ID.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: premiumTheme.screen,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: verticalScale(28),
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  overviewLabel: {
    marginTop: scale(12),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  overviewValue: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(28),
    color: '#102C4F',
  },
  searchCard: {
    marginTop: spacing.md,
    minHeight: verticalScale(56),
    borderRadius: radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E7F5',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: colors.textHeader,
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(15),
  },
  clearButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: '#F2F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: scale(10),
    paddingTop: spacing.md,
    paddingBottom: scale(2),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E7F5',
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: colors.primaryBlue,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(22),
    color: '#112D50',
  },
  pendingPill: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: radii.pill,
    backgroundColor: '#E8F6EF',
  },
  pendingPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: '#16827D',
  },
  loader: {
    marginTop: verticalScale(28),
  },
  orderCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  orderIdText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: radii.pill,
  },
  statusChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
  },
  customerName: {
    marginTop: scale(10),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: '#102C4F',
  },
  metaRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  metaText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  timeRow: {
    marginTop: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  timeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: premiumTheme.subtext,
  },
  paymentChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: radii.pill,
  },
  paymentChipPending: {
    backgroundColor: '#FFF4F1',
  },
  paymentChipPaid: {
    backgroundColor: '#ECFBF6',
  },
  paymentChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
  },
  paymentChipTextPending: {
    color: '#D64545',
  },
  paymentChipTextPaid: {
    color: '#16827D',
  },
  emptyCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.small,
  },
  emptyIconWrap: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(20),
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: scale(14),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    color: '#102C4F',
  },
  emptySubtitle: {
    marginTop: scale(6),
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    lineHeight: verticalScale(20),
    color: premiumTheme.subtext,
  },
});
