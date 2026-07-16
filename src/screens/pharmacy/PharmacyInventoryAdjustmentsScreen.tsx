import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowUpDown, Dot } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { premiumTheme, radii, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import {
  formatDate,
  formatNumber,
  getInventoryAdjustmentKey,
  getMedicineName,
  useInventoryData,
} from './inventoryShared';

export function PharmacyInventoryAdjustmentsScreen() {
  const { adjustmentsQuery, refreshAll } = useInventoryData({
    adjustmentLimit: 30,
  });
  const adjustments = adjustmentsQuery.data || [];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={adjustmentsQuery.isFetching}
            onRefresh={refreshAll}
          />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.sectionEyebrow}>Timeline</Text>
          <Text style={styles.sectionTitle}>Recent Adjustments</Text>
          <Text style={styles.sectionHint}>
            Manual changes, sync reasons, and quantity movement history in one place.
          </Text>
        </View>

        {adjustmentsQuery.isLoading ? (
          <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
        ) : adjustments.length ? (
          adjustments.map((item, index) => (
            <View
              key={getInventoryAdjustmentKey(item, index)}
              style={styles.timelineCard}
            >
              <View style={styles.timelineTopRow}>
                <View style={styles.timelineIconWrap}>
                  <ArrowUpDown size={scale(16)} color={colors.primaryBlue} />
                </View>
                <View style={styles.timelineTitleWrap}>
                  <Text style={styles.timelineTitle} numberOfLines={1}>
                    {getMedicineName(item)}
                  </Text>
                  <Text style={styles.timelineMeta} numberOfLines={1}>
                    {item.type || 'update'} • {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Text style={styles.timelineQty}>
                  {Number(item.quantity || 0) > 0 ? '+' : ''}
                  {formatNumber(Number(item.quantity || 0))}
                </Text>
              </View>

              <View style={styles.reasonRow}>
                <Dot size={scale(16)} color={colors.primaryBlue} />
                <Text style={styles.reasonText}>
                  {item.reason || 'Inventory sync update'}
                </Text>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLine}>Batch: {item.batchNumber || 'Pending'}</Text>
                <Text style={styles.metaLine}>
                  Notes: {item.notes || 'No additional note'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyCopy}>No recent adjustments available.</Text>
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.lg,
    ...shadows.small,
  },
  sectionEyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sectionTitle: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: colors.textHeader,
  },
  sectionHint: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    lineHeight: verticalScale(21),
    color: premiumTheme.subtext,
  },
  loader: {
    marginTop: verticalScale(30),
  },
  timelineCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  timelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  timelineIconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(14),
    backgroundColor: '#EAF4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitleWrap: {
    flex: 1,
  },
  timelineTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(16),
    color: colors.textHeader,
  },
  timelineMeta: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: premiumTheme.subtext,
  },
  timelineQty: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(16),
    color: colors.primaryBlue,
  },
  reasonRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: colors.textHeader,
  },
  metaBlock: {
    marginTop: scale(10),
    gap: scale(6),
  },
  metaLine: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: premiumTheme.subtext,
  },
  emptyCopy: {
    marginTop: verticalScale(24),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    color: premiumTheme.subtext,
  },
});
