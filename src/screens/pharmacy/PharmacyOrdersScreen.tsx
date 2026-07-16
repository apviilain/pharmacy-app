import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { premiumTheme, radii, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import {
  formatNumber,
  formatTime,
  getEntityId,
  getOrderCustomer,
  getOrderStatusMeta,
  normalizeState,
  usePharmacyOrdersOverview,
} from './ordersShared';

type DashboardCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

function DashboardCard({ label, value, helper, icon: Icon }: DashboardCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconWrap}>
        <Icon size={scale(18)} color={colors.primaryBlue} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHelper}>{helper}</Text>
    </View>
  );
}

export function PharmacyOrdersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const {
    ordersQuery,
    orders,
    totalOrders,
    pendingOrders,
    processedOrders,
    pendingPayment,
    liveOrders,
  } = usePharmacyOrdersOverview();

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pharmacyOrdersOverview'] });
  };

  const spotlightOrders = orders.slice(0, 3);

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
        <LinearGradient
          colors={['#EEF7FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <ClipboardList size={scale(16)} color={colors.primaryBlue} />
            <Text style={styles.heroBadgeText}>Orders Dashboard</Text>
          </View>
          <Text style={styles.heroTitle}>Pharmacy Orders</Text>
          <Text style={styles.heroSubtitle}>
            Minimal order overview with the most important numbers and live updates.
          </Text>

          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Truck size={scale(14)} color="#16827D" />
              <Text style={styles.heroPillText}>{liveOrders} live</Text>
            </View>
            <View style={styles.heroPill}>
              <CircleDollarSign size={scale(14)} color="#D64545" />
              <Text style={styles.heroPillText}>{pendingPayment} payment due</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.metricsRow}>
          <DashboardCard
            label="Orders"
            value={formatNumber(totalOrders)}
            helper="All active records"
            icon={ShoppingBag}
          />
          <DashboardCard
            label="Pending"
            value={formatNumber(pendingOrders)}
            helper="Need action"
            icon={Clock3}
          />
        </View>

        <View style={styles.metricsRow}>
          <DashboardCard
            label="Processed"
            value={formatNumber(processedOrders)}
            helper="Packed or delivered"
            icon={CheckCircle2}
          />
          <DashboardCard
            label="Payments"
            value={formatNumber(pendingPayment)}
            helper="Still unpaid"
            icon={CircleDollarSign}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryAction}
            onPress={() => navigation.navigate('PharmacyOrdersList')}
          >
            <PackageCheck size={scale(17)} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Open Active Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.secondaryAction}
            onPress={() =>
              navigation.navigate('Pharmacy', {
                section: 'orders',
                lockedSection: true,
              } as never)
            }
          >
            <ClipboardList size={scale(17)} color={colors.primaryBlue} />
            <Text style={styles.secondaryActionText}>Open Order Desk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PharmacyOrdersList')}
          >
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {ordersQuery.isLoading ? (
          <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
        ) : spotlightOrders.length ? (
          spotlightOrders.map((order) => {
            const statusMeta = getOrderStatusMeta(order);
            const StatusIcon = statusMeta.icon;
            const paymentPending = normalizeState(order.paymentStatus) === 'pending';

            return (
              <TouchableOpacity
                key={getEntityId(order)}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PharmacyOrdersList')}
                style={styles.orderCard}
              >
                <View style={styles.orderIconWrap}>
                  <StatusIcon size={scale(18)} color={statusMeta.color} />
                </View>

                <View style={styles.orderContent}>
                  <View style={styles.orderHeaderRow}>
                    <Text style={styles.orderCustomer}>{getOrderCustomer(order)}</Text>
                    <ArrowRight size={scale(16)} color={premiumTheme.subtext} />
                  </View>
                  <Text style={styles.orderMeta}>
                    #{getEntityId(order) || 'ORDER'} · {formatTime(order.updatedAt || order.createdAt)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.paymentBadge,
                    paymentPending ? styles.paymentBadgePending : styles.paymentBadgePaid,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentBadgeText,
                      paymentPending
                        ? styles.paymentBadgeTextPending
                        : styles.paymentBadgeTextPaid,
                    ]}
                  >
                    {paymentPending ? 'Pending' : 'Paid'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <ShoppingBag size={scale(24)} color={colors.primaryBlue} />
            </View>
            <Text style={styles.emptyTitle}>No active orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Fresh pharmacy orders will start appearing here.
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
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#D8E7F5',
    ...shadows.small,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: '#E7F3FE',
    borderRadius: radii.pill,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  heroBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: colors.primaryBlue,
  },
  heroTitle: {
    marginTop: scale(16),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(26),
    color: '#112D50',
  },
  heroSubtitle: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    lineHeight: verticalScale(21),
    color: premiumTheme.subtext,
  },
  heroPills: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DAE8F5',
  },
  heroPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: '#153A61',
  },
  metricsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  metricIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(14),
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    marginTop: scale(12),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  metricValue: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(27),
    color: '#102C4F',
  },
  metricHelper: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: premiumTheme.caption,
  },
  actionRow: {
    marginTop: spacing.md,
    gap: scale(12),
  },
  primaryAction: {
    minHeight: verticalScale(54),
    borderRadius: radii.xl,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(8),
    ...shadows.small,
  },
  primaryActionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(15),
    color: '#FFFFFF',
  },
  secondaryAction: {
    minHeight: verticalScale(52),
    borderRadius: radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E7F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(8),
  },
  secondaryActionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(14),
    color: colors.primaryBlue,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: scale(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(21),
    color: '#112D50',
  },
  viewAllText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: '#16827D',
  },
  loader: {
    marginTop: verticalScale(28),
  },
  orderCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E7F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    ...shadows.small,
  },
  orderIconWrap: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(18),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderContent: {
    flex: 1,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  orderCustomer: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(16),
    color: '#102C4F',
  },
  orderMeta: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: premiumTheme.subtext,
  },
  paymentBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    borderRadius: radii.pill,
  },
  paymentBadgePending: {
    backgroundColor: '#FFF4F1',
  },
  paymentBadgePaid: {
    backgroundColor: '#ECFBF6',
  },
  paymentBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
  },
  paymentBadgeTextPending: {
    color: '#D64545',
  },
  paymentBadgeTextPaid: {
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
    width: scale(56),
    height: scale(56),
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
