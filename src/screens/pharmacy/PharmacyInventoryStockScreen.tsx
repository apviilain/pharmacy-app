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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, Boxes, Search } from 'lucide-react-native';

import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { premiumTheme, radii, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import {
  formatDate,
  formatNumber,
  getInventoryItemKey,
  getMedicineName,
  useInventoryData,
} from './inventoryShared';

export function PharmacyInventoryStockScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, 'PharmacyInventoryStock'>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(
    !!route.params?.lowStockOnly,
  );

  const { inventoryQuery, refreshAll } = useInventoryData({
    inventoryLimit: 60,
    lowStockOnly: showLowStockOnly,
  });

  const inventoryItems = inventoryQuery.data || [];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredInventory = useMemo(
    () =>
      !normalizedQuery
        ? inventoryItems
        : inventoryItems.filter((item) => {
            const name = getMedicineName(item).toLowerCase();
            const batch = String(item.batchNumber || '').toLowerCase();
            const rack = String(item.rackLocation || '').toLowerCase();
            return (
              name.includes(normalizedQuery) ||
              batch.includes(normalizedQuery) ||
              rack.includes(normalizedQuery)
            );
          }),
    [inventoryItems, normalizedQuery],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={inventoryQuery.isFetching}
            onRefresh={refreshAll}
          />
        }
      >
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Search size={scale(18)} color={premiumTheme.caption} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search stock, batch, rack"
              placeholderTextColor={premiumTheme.caption}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !showLowStockOnly && styles.filterChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setShowLowStockOnly(false)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !showLowStockOnly && styles.filterChipTextActive,
                ]}
              >
                All Stock
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                showLowStockOnly && styles.filterChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setShowLowStockOnly(true)}
            >
              <AlertTriangle
                size={scale(14)}
                color={showLowStockOnly ? '#FFFFFF' : colors.primaryBlue}
              />
              <Text
                style={[
                  styles.filterChipText,
                  showLowStockOnly && styles.filterChipTextActive,
                ]}
              >
                Low Stock
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Stock Control</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PharmacyMedicineCreate')}
          >
            <Text style={styles.headerLink}>Add Stock</Text>
          </TouchableOpacity>
        </View>

        {inventoryQuery.isLoading ? (
          <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
        ) : filteredInventory.length ? (
          filteredInventory.map((item, index) => {
            const isLowStock = Boolean(item.lowStock);
            return (
              <View key={getInventoryItemKey(item, index)} style={styles.stockCard}>
                <View style={styles.stockTopRow}>
                  <View style={styles.stockIconWrap}>
                    <Boxes size={scale(16)} color={colors.primaryBlue} />
                  </View>
                  <View
                    style={[
                      styles.statusChip,
                      isLowStock ? styles.statusChipDanger : styles.statusChipHealthy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isLowStock && styles.statusChipTextDanger,
                      ]}
                    >
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.stockName}>{getMedicineName(item)}</Text>
                <Text style={styles.stockSubtitle}>
                  {item.medicine?.genericName || 'Inventory item'}
                </Text>

                <View style={styles.metricsRow}>
                  <View>
                    <Text style={styles.metricValue}>
                      {formatNumber(Number(item.availableQuantity || item.quantity || 0))}
                    </Text>
                    <Text style={styles.metricLabel}>Available units</Text>
                  </View>
                  <View>
                    <Text style={styles.metricValue}>
                      {formatNumber(Number(item.reservedQuantity || 0))}
                    </Text>
                    <Text style={styles.metricLabel}>Reserved</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Batch: {item.batchNumber || 'Pending'}</Text>
                  <Text style={styles.metaText}>Rack: {item.rackLocation || 'TBD'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    Reorder at {formatNumber(Number(item.reorderThreshold || 0))}
                  </Text>
                  <Text style={styles.metaText}>Exp: {formatDate(item.expiryDate)}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyCopy}>No stock items matched this filter.</Text>
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
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  searchRow: {
    minHeight: verticalScale(54),
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#D8E7F5',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  searchInput: {
    flex: 1,
    color: colors.textHeader,
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(15),
    paddingVertical: 0,
  },
  filterRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#CFE2F5',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: colors.primaryBlue,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  headerRow: {
    marginTop: spacing.md,
    marginBottom: scale(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: colors.textHeader,
  },
  headerLink: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: colors.primaryBlue,
  },
  loader: {
    marginTop: verticalScale(32),
  },
  stockCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  stockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(13),
    backgroundColor: '#EAF4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    borderRadius: radii.pill,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
  },
  statusChipHealthy: {
    backgroundColor: '#EAF8ED',
  },
  statusChipDanger: {
    backgroundColor: '#FFF1F1',
  },
  statusChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: '#16824D',
  },
  statusChipTextDanger: {
    color: '#D64545',
  },
  stockName: {
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: '#16395A',
  },
  stockSubtitle: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  metricsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  metricValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: '#123A63',
  },
  metricLabel: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: premiumTheme.subtext,
  },
  metaRow: {
    marginTop: scale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  metaText: {
    flex: 1,
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
