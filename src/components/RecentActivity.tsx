import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Droplet, Pill, CheckCircle2, Truck, ChevronRight, ArrowRight, Activity } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';
import { SectionHeader } from './SectionHeader';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../api/patientService';

const getStatusUI = (type: string, status: string) => {
  const s = status?.toLowerCase() || '';
  if (type === 'LAB REPORT') {
    if (s === 'completed' || s === 'ready') {
      return {
        label: 'Ready',
        color: colors.primaryGreen,
        bg: 'rgba(70, 196, 81, 0.1)',
        icon: CheckCircle2,
      };
    }
    return {
      label: 'Pending',
      color: '#FFAA00',
      bg: 'rgba(255, 170, 0, 0.1)',
      icon: Activity,
    };
  } else {
    // Pharmacy
    if (s === 'delivered') {
      return {
        label: 'Delivered',
        color: colors.primaryGreen,
        bg: 'rgba(70, 196, 81, 0.1)',
        icon: CheckCircle2,
      };
    }
    return {
      label: 'Transit',
      color: '#FFAA00',
      bg: 'rgba(255, 170, 0, 0.1)',
      icon: Truck,
    };
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch (e) {
    return 'Recently';
  }
};


export const RecentActivity: React.FC = () => {
  const { data: labTests, isLoading: isLabsLoading } = useQuery({
    queryKey: ['lab-tests', 'me'],
    queryFn: () => patientService.getLabTests('me'),
  });

  const { data: pharmacyOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['medicine-orders', 'me'],
    queryFn: () => patientService.getMedicineOrders('me'),
  });

  // Merge and Map
  const mergedActivities = React.useMemo(() => {
    const activities: any[] = [];

    (labTests || []).forEach((test: any) => {
      const statusUI = getStatusUI('LAB REPORT', test.status);
      activities.push({
        id: test.id,
        type: 'LAB REPORT',
        title: test.name || 'Lab Report',
        sub: test.labName || 'Thyrocare Labs',
        date: formatDate(test.orderedAt || test.createdAt),
        rawDate: test.orderedAt || test.createdAt || '',
        status: statusUI.label,
        statusColor: statusUI.color,
        statusBg: statusUI.bg,
        icon: statusUI.icon,
        iconGraphic: Droplet,
        iconColor: '#FF5E5E',
        iconBg: 'rgba(255, 94, 94, 0.05)',
        buttonText: 'View Report',
        buttonColor: colors.primaryGreen,
        buttonBg: 'rgba(70, 196, 81, 0.1)',
        chevronColor: colors.primaryGreen,
      });
    });

    (pharmacyOrders || []).forEach((order: any) => {
      const statusUI = getStatusUI('PHARMACY ORDER', order.status);
      activities.push({
        id: order.id,
        type: 'PHARMACY ORDER',
        title: `#${order.id?.slice(-8).toUpperCase() || 'ORDER'}`,
        sub: `${order.itemCount || 1} items • ₹${order.totalAmount || order.price || '0'}`,
        date: formatDate(order.orderedAt || order.createdAt),
        rawDate: order.orderedAt || order.createdAt || '',
        status: statusUI.label,
        statusColor: statusUI.color,
        statusBg: statusUI.bg,
        icon: statusUI.icon,
        iconGraphic: Pill,
        iconColor: '#FFAA00',
        iconBg: 'rgba(255, 170, 0, 0.05)',
        buttonText: 'Track Order',
        buttonColor: '#FFAA00',
        buttonBg: 'rgba(255, 170, 0, 0.1)',
        chevronColor: '#FFAA00',
      });
    });

    // Sort by date descending
    return activities.sort((a, b) => {
      return (
        new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
      );
    });
  }, [labTests, pharmacyOrders]);

  const isLoading = isLabsLoading || isOrdersLoading;

  if (!isLoading && mergedActivities.length === 0) {
    return null; // Don't show anything if no activity
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Recent Activity" onViewAll={() => {}} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.activityScroll}
      >
        {isLoading ? (
          // Simple loading placeholder
          [1, 2].map((i) => (
            <View key={i} style={[styles.activityCard, { opacity: 0.6 }]}>
              <View
                style={{
                  height: verticalScale(14),
                  width: '40%',
                  backgroundColor: '#F3F6FB',
                  borderRadius: 4,
                  marginBottom: 10,
                }}
              />
              <View
                style={{
                  height: scale(36),
                  width: '100%',
                  backgroundColor: '#F3F6FB',
                  borderRadius: 8,
                  marginBottom: 15,
                }}
              />
              <View
                style={{
                  height: scale(40),
                  width: '100%',
                  backgroundColor: '#F3F6FB',
                  borderRadius: 8,
                }}
              />
            </View>
          ))
        ) : (
          mergedActivities.map((activity) => {
            const Graphic = activity.iconGraphic;
            const StatusIcon = activity.icon;
            return (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityCardHeader}>
                  <Text style={styles.activityType}>{activity.type}</Text>
                </View>
                <View style={styles.activityRow}>
                  <View
                    style={[
                      styles.activityIconBox,
                      { backgroundColor: activity.iconBg },
                    ]}
                  >
                    <Graphic size={scale(18)} color={activity.iconColor} />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySub}>{activity.sub}</Text>
                  </View>
                </View>
                <View style={styles.activityStatusRow}>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: activity.statusBg },
                    ]}
                  >
                    <StatusIcon
                      size={scale(12)}
                      color={activity.statusColor}
                    />
                    <Text
                      style={[styles.statusText, { color: activity.statusColor }]}
                    >
                      {activity.status}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.activityButton,
                    { backgroundColor: activity.buttonBg },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.activityButtonText,
                      { color: activity.buttonColor },
                    ]}
                  >
                    {activity.buttonText}
                  </Text>
                  <ArrowRight size={scale(16)} color={activity.chevronColor} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(10),
  },
  activityScroll: {
    marginHorizontal: -scale(20),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(18),
  },
  scrollContent: {
    paddingRight: scale(40),
    paddingVertical: scale(8),
  },
  activityCard: {
    width: scale(260),
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginRight: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  activityCardHeader: {
    marginBottom: verticalScale(12),
  },
  activityType: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs - 2,
    color: colors.textLight,
    letterSpacing: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  activityIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  activitySub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: verticalScale(2),
  },
  activityStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  activityDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    marginLeft: scale(4),
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: scale(10),
  },
  activityButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    marginRight: scale(4),
  },
});
