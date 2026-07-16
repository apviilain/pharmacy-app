import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ClipboardList,
  PackagePlus,
  RefreshCcw,
  ScanSearch,
} from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { premiumTheme, radii, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { formatNumber, useInventoryData } from './inventoryShared';

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
};

function ActionCard({ title, subtitle, icon: Icon, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.actionIconWrap}>
        <Icon size={scale(20)} color={colors.primaryBlue} />
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <ArrowRight size={scale(18)} color={colors.primaryBlue} />
    </TouchableOpacity>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: 'default' | 'danger' | 'success';
};

function StatCard({ label, value, helper, tone = 'default' }: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        tone === 'danger'
          ? styles.statCardDanger
          : tone === 'success'
            ? styles.statCardSuccess
            : null,
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHelper}>{helper}</Text>
    </View>
  );
}

export function PharmacyInventoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { inventoryQuery, lowStockQuery, adjustmentsQuery, importsQuery, refreshAll } =
    useInventoryData({
      inventoryLimit: 40,
      lowStockLimit: 12,
      importLimit: 10,
      adjustmentLimit: 8,
    });

  const inventoryItems = inventoryQuery.data || [];
  const lowStockItems = lowStockQuery.data || [];
  const adjustments = adjustmentsQuery.data || [];
  const imports = importsQuery.data || [];

  const totalUnits = inventoryItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const reservedUnits = inventoryItems.reduce(
    (sum, item) => sum + Number(item.reservedQuantity || 0),
    0,
  );
  const pendingImports = imports.filter((item) =>
    String(item.status || '').toLowerCase().includes('preview'),
  ).length;

  const isRefreshing =
    inventoryQuery.isFetching ||
    lowStockQuery.isFetching ||
    adjustmentsQuery.isFetching ||
    importsQuery.isFetching;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshAll} />
        }
      >
        <LinearGradient
          colors={['#F2F8FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Boxes size={scale(18)} color={colors.primaryBlue} />
              <Text style={styles.heroBadgeText}>Inventory Dashboard</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.8}
              onPress={refreshAll}
            >
              <RefreshCcw size={scale(16)} color={colors.primaryBlue} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>Split inventory flows, cleaner daily operations</Text>
          <Text style={styles.heroSubtitle}>
            Overview yahan rahega, aur stock control, import history, adjustments
            separate dedicated screens par open honge.
          </Text>
        </LinearGradient>

        <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
          <StatCard
            label="Total SKU"
            value={formatNumber(inventoryItems.length)}
            helper={`${formatNumber(totalUnits)} units in stock`}
          />
          <StatCard
            label="Low Stock"
            value={formatNumber(lowStockItems.length)}
            helper="Priority items to restock"
            tone="danger"
          />
          <StatCard
            label="Pending Imports"
            value={formatNumber(pendingImports)}
            helper={`${formatNumber(reservedUnits)} reserved units`}
            tone="success"
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Flows</Text>
          <Text style={styles.sectionTitle}>Inventory functionality</Text>
          <Text style={styles.sectionHint}>
            Har major workflow ko separate screen me open karo for better usability.
          </Text>

          <View style={styles.actionList}>
            <ActionCard
              title="Stock Control"
              subtitle="Search stock, view batches, filter low stock"
              icon={PackagePlus}
              onPress={() => navigation.navigate('PharmacyInventoryStock')}
            />
            <ActionCard
              title="Low Stock Queue"
              subtitle="Only critical restock items with focused list"
              icon={AlertTriangle}
              onPress={() =>
                navigation.navigate('PharmacyInventoryStock', {
                  lowStockOnly: true,
                })
              }
            />
            <ActionCard
              title="Import History"
              subtitle="Bulk updates, diagnostics, and processed row logs"
              icon={ClipboardList}
              onPress={() => navigation.navigate('PharmacyInventoryImports')}
            />
            <ActionCard
              title="Recent Adjustments"
              subtitle="Manual stock movement timeline and notes"
              icon={ScanSearch}
              onPress={() => navigation.navigate('PharmacyInventoryAdjustments')}
            />
          </View>
        </View>

        <View style={[styles.previewGrid, isTablet && styles.previewGridTablet]}>
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Stock Snapshot</Text>
            {inventoryQuery.isLoading ? (
              <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
            ) : (
              <>
                <Text style={styles.previewValue}>{formatNumber(inventoryItems.length)}</Text>
                <Text style={styles.previewCopy}>
                  Active inventory records ready to manage in Stock Control.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PharmacyInventoryStock')}
                >
                  <Text style={styles.previewLink}>Open stock screen</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Import Snapshot</Text>
            {importsQuery.isLoading ? (
              <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
            ) : (
              <>
                <Text style={styles.previewValue}>{formatNumber(imports.length)}</Text>
                <Text style={styles.previewCopy}>
                  Recent import logs with diagnostics available in a dedicated history screen.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PharmacyInventoryImports')}
                >
                  <Text style={styles.previewLink}>Open import screen</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Adjustment Snapshot</Text>
            {adjustmentsQuery.isLoading ? (
              <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
            ) : (
              <>
                <Text style={styles.previewValue}>{formatNumber(adjustments.length)}</Text>
                <Text style={styles.previewCopy}>
                  Recent changes, reasons, and quantities moved into one focused timeline.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PharmacyInventoryAdjustments')}
                >
                  <Text style={styles.previewLink}>Open adjustment screen</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#D8E7F5',
    ...shadows.small,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroBadge: {
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
  refreshButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9E7F5',
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    lineHeight: verticalScale(30),
    color: colors.textHeader,
  },
  heroSubtitle: {
    marginTop: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    lineHeight: verticalScale(21),
    color: premiumTheme.subtext,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  statsGridTablet: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  statCardDanger: {
    backgroundColor: '#FFF8F8',
    borderColor: '#F2D8D8',
  },
  statCardSuccess: {
    backgroundColor: '#F6FCF8',
    borderColor: '#D4ECD8',
  },
  statLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: premiumTheme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    marginTop: scale(10),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(30),
    color: '#123A63',
  },
  statHelper: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
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
  actionList: {
    marginTop: spacing.md,
    gap: scale(12),
  },
  actionCard: {
    backgroundColor: '#F9FCFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#DDEAF7',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  actionIconWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4FD',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(15),
    color: colors.textHeader,
  },
  actionSubtitle: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: premiumTheme.subtext,
  },
  previewGrid: {
    gap: spacing.md,
  },
  previewGridTablet: {
    flexDirection: 'row',
  },
  previewCard: {
    flex: 1,
    minHeight: verticalScale(170),
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  previewLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  previewValue: {
    marginTop: scale(14),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(28),
    color: '#123A63',
  },
  previewCopy: {
    marginTop: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    lineHeight: verticalScale(20),
    color: premiumTheme.subtext,
  },
  previewLink: {
    marginTop: scale(14),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: colors.primaryBlue,
  },
  loader: {
    marginVertical: verticalScale(22),
  },
});
