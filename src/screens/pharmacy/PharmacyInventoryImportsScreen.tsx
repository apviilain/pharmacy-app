import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as DocumentPicker from '@react-native-documents/picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  ClipboardList,
  FileUp,
  Search,
  ShieldCheck,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { pharmacyInventoryImportService } from '../../api/pharmacyInventoryImportService';
import type { InventoryImportMode } from '../../api/pharmyx';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { premiumTheme, radii, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import {
  formatDate,
  formatNumber,
  getEntityId,
  getInventoryImportKey,
  statusTone,
  useInventoryData,
} from './inventoryShared';

export function PharmacyInventoryImportsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const queryClient = useQueryClient();
  const { importsQuery, refreshAll } = useInventoryData({
    importLimit: 12,
  });
  const imports = importsQuery.data || [];
  const [selectedImportId, setSelectedImportId] = useState('');
  const [inventoryImportMode, setInventoryImportMode] =
    useState<InventoryImportMode>('upsert');
  const [inventoryImportFile, setInventoryImportFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    if (!imports.length) {
      setSelectedImportId('');
      return;
    }

    if (!selectedImportId) {
      setSelectedImportId(getEntityId(imports[0]));
    }
  }, [imports, selectedImportId]);

  const selectedImportQuery = useQuery({
    queryKey: ['inventory-dashboard-import-detail', selectedImportId],
    queryFn: () => pharmacyInventoryImportService.getById(selectedImportId),
    enabled: !!selectedImportId,
  });

  const selectedImport =
    selectedImportQuery.data ||
    imports.find((item) => getEntityId(item) === selectedImportId) ||
    null;
  const selectedImportSummary = (selectedImport?.summary || {}) as Record<
    string,
    unknown
  >;
  const previewRows = Array.isArray(selectedImport?.rows)
    ? selectedImport.rows.slice(0, 5)
    : [];

  const previewMutation = useMutation({
    mutationFn: pharmacyInventoryImportService.preview,
    onSuccess: async (preview) => {
      const importId = getEntityId(preview);
      if (importId) {
        setSelectedImportId(importId);
      }
      await queryClient.invalidateQueries({
        queryKey: ['inventory-dashboard-imports'],
      });
      Toast.show({
        type: 'success',
        text1: 'Import preview ready',
        text2: 'Review diagnostics and sample rows before commit.',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Preview failed',
        text2: 'Unable to generate import preview. Please try again.',
      });
    },
  });

  const commitMutation = useMutation({
    mutationFn: pharmacyInventoryImportService.commit,
    onSuccess: async (committedImport) => {
      const importId = getEntityId(committedImport);
      if (importId) {
        setSelectedImportId(importId);
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['inventory-dashboard-imports'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['inventory-dashboard-list'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['inventory-dashboard-low-stock'],
        }),
      ]);
      Toast.show({
        type: 'success',
        text1: 'Import committed',
        text2: 'Inventory stock has been updated successfully.',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Commit failed',
        text2: 'Preview the file again or retry the commit.',
      });
    },
  });

  const pickInventoryImportFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });
      const pickedFile = Array.isArray(result) ? result[0] : result;
      if (!pickedFile) return;

      setInventoryImportFile({
        uri: pickedFile.uri,
        name: pickedFile.name || 'inventory-import',
        type: pickedFile.type || 'application/octet-stream',
      });
    } catch (error: any) {
      if (
        error instanceof Error &&
        error.message &&
        error.message.toLowerCase().includes('cancel')
      ) {
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'File selection failed',
        text2: 'Please try selecting the import file again.',
      });
    }
  };

  const submitImportPreview = () => {
    if (!inventoryImportFile) {
      Toast.show({
        type: 'error',
        text1: 'Select a file',
        text2: 'Choose an inventory file before previewing the import.',
      });
      return;
    }

    previewMutation.mutate({
      ...inventoryImportFile,
      importMode: inventoryImportMode,
    });
  };

  const submitImportCommit = () => {
    const importId =
      getEntityId(previewMutation.data || {}) || getEntityId(selectedImport || {});

    if (!importId) {
      Toast.show({
        type: 'error',
        text1: 'No import to commit',
        text2: 'Preview an import first, then commit it.',
      });
      return;
    }

    Alert.alert(
      'Commit Import',
      'This will apply the previewed inventory import to your pharmacy stock.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Commit',
          onPress: () => commitMutation.mutate({ importId }),
        },
      ],
    );
  };

  const removeSelectedImportFile = () => {
    setInventoryImportFile(null);
    previewMutation.reset();
    Toast.show({
      type: 'success',
      text1: 'File removed',
      text2: 'You can choose another inventory import file.',
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={importsQuery.isFetching || selectedImportQuery.isFetching}
            onRefresh={refreshAll}
          />
        }
      >
        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <View>
              <Text style={styles.uploadEyebrow}>Bulk Stock Updates</Text>
              <Text style={styles.uploadTitle}>Import File</Text>
              <Text style={styles.uploadSubtitle}>
                Upload CSV, XLS, or spreadsheet exports to preview and apply stock changes.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadDropzone}
            activeOpacity={0.88}
            onPress={pickInventoryImportFile}
          >
            <View style={styles.uploadDropIcon}>
              <FileUp size={scale(24)} color={colors.primaryBlue} />
            </View>
            <Text style={styles.uploadDropTitle}>
              {inventoryImportFile ? 'Change selected import file' : 'Drag and drop your file here'}
            </Text>
            <Text style={styles.uploadDropCopy}>
              Supports `.csv`, `.xlsx`, `.xls`, and `.xml` up to 50MB
            </Text>
            <View style={styles.uploadFilePill}>
              <Text style={styles.uploadFilePillText}>
                {inventoryImportFile?.name || 'Browse Files'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeChip,
                inventoryImportMode === 'upsert' && styles.modeChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setInventoryImportMode('upsert')}
            >
              <Text
                style={[
                  styles.modeChipText,
                  inventoryImportMode === 'upsert' && styles.modeChipTextActive,
                ]}
              >
                Upsert
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeChip,
                inventoryImportMode === 'insert' && styles.modeChipActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setInventoryImportMode('insert')}
            >
              <Text
                style={[
                  styles.modeChipText,
                  inventoryImportMode === 'insert' && styles.modeChipTextActive,
                ]}
              >
                Insert
              </Text>
            </TouchableOpacity>
            {inventoryImportFile ? (
              <TouchableOpacity
                style={styles.removeChip}
                activeOpacity={0.85}
                onPress={removeSelectedImportFile}
              >
                <Text style={styles.removeChipText}>Remove File</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.actionButtonRow}>
            <TouchableOpacity
              style={styles.secondaryActionButton}
              activeOpacity={0.88}
              onPress={submitImportPreview}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <Search size={scale(16)} color={colors.primaryBlue} />
              )}
              <Text style={styles.secondaryActionButtonText}>Preview Import</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryActionButton}
              activeOpacity={0.88}
              onPress={submitImportCommit}
              disabled={commitMutation.isPending}
            >
              {commitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ShieldCheck size={scale(16)} color="#FFFFFF" />
              )}
              <Text style={styles.primaryActionButtonText}>Commit Import</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.grid, isTablet && styles.gridTablet]}>
          <View style={styles.leftColumn}>
            <Text style={styles.sectionTitle}>Import History</Text>
            <Text style={styles.sectionHint}>
              Bulk inventory uploads, status, and batch processing trail.
            </Text>

            {importsQuery.isLoading ? (
              <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />
            ) : imports.length ? (
              imports.map((item, index) => {
                const tone = statusTone(item.status);
                const isSelected = getEntityId(item) === getEntityId(selectedImport);
                return (
                  <TouchableOpacity
                    key={getInventoryImportKey(item, index)}
                    style={[
                      styles.historyCard,
                      { borderColor: isSelected ? colors.primaryBlue : tone.borderColor },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedImportId(getEntityId(item))}
                  >
                    <View style={styles.historyTopRow}>
                      <View
                        style={[
                          styles.statusTag,
                          { backgroundColor: tone.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[styles.statusTagText, { color: tone.textColor }]}
                        >
                          {tone.label}
                        </Text>
                      </View>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {item.originalFileName || item.fileName || 'Inventory import'}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {formatNumber(Number(item.processedRows || item.totalRows || 0))} rows
                      processed
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyCopy}>No import logs found.</Text>
            )}
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.auditCard}>
              <View style={styles.auditHeader}>
                <View style={styles.auditTag}>
                  <ClipboardList size={scale(14)} color="#FFFFFF" />
                  <Text style={styles.auditTagText}>Diagnostics</Text>
                </View>
                <ArrowUpRight size={scale(16)} color="#FFFFFF" />
              </View>

              <Text style={styles.auditTitle} numberOfLines={2}>
                {selectedImport?.originalFileName ||
                  selectedImport?.fileName ||
                  'Select an import log'}
              </Text>
              <Text style={styles.auditSubtitle}>
                Process summary and sample rows are grouped on this screen for quick review.
              </Text>

              <View style={styles.metricStack}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {formatNumber(Number(selectedImport?.processedRows || 0))}
                  </Text>
                  <Text style={styles.metricLabel}>Rows Processed</Text>
                </View>
                <View style={[styles.metricCard, styles.metricCardAccent]}>
                  <Text style={[styles.metricValue, styles.metricValueAccent]}>
                    {formatNumber(
                      Number(
                        selectedImportSummary.newItemsAdded ||
                          selectedImport?.successRows ||
                          0,
                      ),
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>New Items Added</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {formatNumber(
                      Number(
                        selectedImportSummary.quantitiesUpdated ||
                          selectedImport?.successRows ||
                          0,
                      ),
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>Quantities Updated</Text>
                </View>
              </View>
            </View>

            <View style={styles.logCard}>
              <Text style={styles.logTitle}>Sample Log Excerpt</Text>
              {previewRows.length ? (
                <View style={styles.logTable}>
                  <View style={styles.logHeaderRow}>
                    <Text style={[styles.logHeaderText, styles.codeCell]}>CODE</Text>
                    <Text style={[styles.logHeaderText, styles.nameCell]}>NAME</Text>
                    <Text style={[styles.logHeaderText, styles.qtyCell]}>QTY</Text>
                    <Text style={[styles.logHeaderText, styles.statusCell]}>STATUS</Text>
                  </View>
                  {previewRows.map((row, index) => {
                    const isProblem =
                      Number(row?.quantity || row?.qty || 0) <= 0 || !!row?.error;
                    return (
                      <View
                        key={`preview-${index}`}
                        style={[
                          styles.logBodyRow,
                          isProblem && styles.logBodyRowDanger,
                        ]}
                      >
                        <Text style={[styles.logCellText, styles.codeCell]}>
                          {String(row?.ndcCode || row?.code || row?.sku || '0000')}
                        </Text>
                        <Text style={[styles.logCellText, styles.nameCell]} numberOfLines={2}>
                          {String(
                            row?.medicineName || row?.name || row?.medicine || 'Inventory item',
                          )}
                        </Text>
                        <Text style={[styles.logCellText, styles.qtyCell]}>
                          {Number(row?.quantity || row?.qty || 0) > 0 ? '+' : ''}
                          {String(row?.quantity || row?.qty || 0)}
                        </Text>
                        <Text
                          style={[
                            styles.logCellText,
                            styles.statusCell,
                            isProblem && styles.logCellDangerText,
                          ]}
                        >
                          {isProblem ? '!' : 'OK'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyCopy}>Select an import to preview sample rows.</Text>
              )}
            </View>
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
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  uploadHeader: {
    marginBottom: spacing.md,
  },
  uploadEyebrow: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: colors.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  uploadTitle: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: colors.textHeader,
  },
  uploadSubtitle: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    lineHeight: verticalScale(21),
    color: premiumTheme.subtext,
  },
  uploadDropzone: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9DDF1',
    backgroundColor: '#F9FCFF',
    paddingHorizontal: spacing.md,
    paddingVertical: verticalScale(24),
    alignItems: 'center',
  },
  uploadDropIcon: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(20),
    backgroundColor: '#EAF4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDropTitle: {
    marginTop: scale(14),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(18),
    color: '#16395A',
    textAlign: 'center',
  },
  uploadDropCopy: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    lineHeight: verticalScale(19),
    color: premiumTheme.subtext,
    textAlign: 'center',
  },
  uploadFilePill: {
    marginTop: scale(16),
    borderRadius: radii.pill,
    backgroundColor: '#1A77BC',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  uploadFilePillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: '#FFFFFF',
  },
  modeRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: scale(10),
    flexWrap: 'wrap',
  },
  modeChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#CFE2F5',
    backgroundColor: '#FFFFFF',
  },
  modeChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  modeChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: colors.primaryBlue,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
  },
  removeChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#F0C7C7',
    backgroundColor: '#FFF6F6',
  },
  removeChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: '#D64545',
  },
  actionButtonRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: scale(10),
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: verticalScale(50),
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#CFE2F5',
    backgroundColor: '#EFF6FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingHorizontal: scale(12),
  },
  secondaryActionButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: colors.primaryBlue,
  },
  primaryActionButton: {
    flex: 1,
    minHeight: verticalScale(50),
    borderRadius: radii.lg,
    backgroundColor: colors.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingHorizontal: scale(12),
    ...shadows.small,
  },
  primaryActionButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    color: '#FFFFFF',
  },
  grid: {
    gap: spacing.md,
  },
  gridTablet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: colors.textHeader,
  },
  sectionHint: {
    marginTop: scale(6),
    marginBottom: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    lineHeight: verticalScale(21),
    color: premiumTheme.subtext,
  },
  loader: {
    marginTop: verticalScale(30),
  },
  historyCard: {
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1.2,
    padding: spacing.md,
    ...shadows.small,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  statusTag: {
    borderRadius: radii.pill,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
  },
  statusTagText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
  },
  historyDate: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: premiumTheme.subtext,
  },
  historyTitle: {
    marginTop: scale(12),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    color: '#16395A',
  },
  historyMeta: {
    marginTop: scale(6),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: premiumTheme.subtext,
  },
  auditCard: {
    backgroundColor: '#142D52',
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
  },
  auditTagText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  auditTitle: {
    marginTop: scale(18),
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(26),
    lineHeight: verticalScale(32),
    color: '#FFFFFF',
  },
  auditSubtitle: {
    marginTop: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    lineHeight: verticalScale(19),
    color: 'rgba(255,255,255,0.72)',
  },
  metricStack: {
    marginTop: spacing.lg,
    gap: scale(12),
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingVertical: verticalScale(16),
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  metricCardAccent: {
    backgroundColor: '#F2FBFA',
    borderWidth: 1,
    borderColor: '#BDE8E3',
  },
  metricValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    color: '#153A63',
  },
  metricValueAccent: {
    color: '#0D8B7D',
  },
  metricLabel: {
    marginTop: scale(4),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: premiumTheme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#D9E7F5',
    padding: spacing.md,
    ...shadows.small,
  },
  logTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(20),
    color: colors.textHeader,
  },
  logTable: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E1ECF6',
    overflow: 'hidden',
  },
  logHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F8FC',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
  },
  logHeaderText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: '#6D7A88',
  },
  logBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(14),
    borderTopWidth: 1,
    borderTopColor: '#EEF4FA',
    backgroundColor: '#FFFFFF',
  },
  logBodyRowDanger: {
    backgroundColor: '#FFF7F7',
  },
  logCellText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    color: colors.textHeader,
  },
  logCellDangerText: {
    color: '#D64545',
  },
  codeCell: {
    flex: 1,
  },
  nameCell: {
    flex: 2.1,
  },
  qtyCell: {
    flex: 0.8,
    textAlign: 'center',
  },
  statusCell: {
    flex: 0.8,
    textAlign: 'center',
  },
  emptyCopy: {
    marginTop: scale(14),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    color: premiumTheme.subtext,
  },
});
