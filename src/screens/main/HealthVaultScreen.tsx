import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Linking,
  Modal,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Download, Image as ImageIcon, X } from 'lucide-react-native';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { appointmentService } from '../../api/appointmentService';
import { ListSkeleton } from '../../components/ListSkeleton';
import { env } from '../../config/env';

const FILTERS = ['All', 'Reports', 'Prescriptions', 'Documents'] as const;
type FilterType = (typeof FILTERS)[number];

const FilterChip = ({
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
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

type VaultItem = {
  id: string;
  title: string;
  sub: string;
  status: string;
  statusType: 'success' | 'warning' | 'info';
  icon: string;
  url: string;
  category: FilterType;
};

const buildFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = env.BASE_URL?.endsWith('/')
    ? env.BASE_URL.slice(0, -1)
    : env.BASE_URL;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

export const HealthVaultScreen = () => {
  const [active, setActive] = useState<FilterType>('All');
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

  const {
    data: appointments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['appointments', 'all-vault'],
    queryFn: () => appointmentService.getAppointments({}),
  });

  // Extract all documents, reports, and prescriptions from bookings
  const vaultItems: VaultItem[] = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return [];

    const items: VaultItem[] = [];

    appointments.forEach((appt: any) => {
      const doctorName = appt.doctorName || 'Doctor';
      const dateLabel = appt.dateLabel || '';

      // 1. Documents uploaded during booking
      if (appt.documents && Array.isArray(appt.documents)) {
        appt.documents.forEach((doc: any, idx: number) => {
          const docType = doc.type || 'document';
          const isReport = docType === 'report';
          const isPrescription = docType === 'prescription';

          items.push({
            id: `${appt.id}-doc-${idx}`,
            title:
              doc.filename ||
              `${docType.charAt(0).toUpperCase() + docType.slice(1)}`,
            sub: `${doctorName} · ${dateLabel}`,
            status: isReport
              ? 'Report'
              : isPrescription
              ? 'Prescription'
              : 'Document',
            statusType: isReport
              ? 'success'
              : isPrescription
              ? 'info'
              : 'warning',
            icon: isPrescription ? '💊' : isReport ? '📋' : '📄',
            url: doc.url || '',
            category: isReport
              ? 'Reports'
              : isPrescription
              ? 'Prescriptions'
              : 'Documents',
          });
        });
      }

      // 2. Reports from completed consultations
      if (
        appt.report &&
        appt.report.fileUrls &&
        Array.isArray(appt.report.fileUrls)
      ) {
        appt.report.fileUrls.forEach((url: string, idx: number) => {
          items.push({
            id: `${appt.id}-report-${idx}`,
            title: `Consultation Report`,
            sub: `${doctorName} · ${dateLabel}`,
            status: appt.report.message || 'Report Available',
            statusType: 'success',
            icon: '🩺',
            url,
            category: 'Reports',
          });
        });
      }

      // 3. Prescriptions from completed consultations
      if (
        appt.prescription &&
        appt.prescription.fileUrls &&
        Array.isArray(appt.prescription.fileUrls)
      ) {
        appt.prescription.fileUrls.forEach((url: string, idx: number) => {
          items.push({
            id: `${appt.id}-prescription-${idx}`,
            title: `Prescription`,
            sub: `${doctorName} · ${dateLabel}`,
            status: appt.prescription.message || 'Prescription Available',
            statusType: 'info',
            icon: '💊',
            url,
            category: 'Prescriptions',
          });
        });
      }
    });

    return items;
  }, [appointments]);

  const filteredItems = useMemo(() => {
    if (active === 'All') return vaultItems;
    return vaultItems.filter(i => i.category === active);
  }, [active, vaultItems]);

  const handleDownload = async (url: string, title?: string) => {
    const fullUrl = buildFullUrl(url);
    if (!fullUrl) return;

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'Need storage permission to download',
          });
          // return; // Fallback to Linking for now
        }
      } catch (err) {
        console.warn(err);
      }
    }

    const { config, fs } = ReactNativeBlobUtil;
    const date = new Date();
    const ext = fullUrl.split('.').pop() || 'pdf';
    const filePath = `${fs.dirs.DownloadDir}/Pharmacy App_${title?.replace(
      /\s+/g,
      '_',
    )}_${Math.floor(date.getTime() + date.getSeconds() / 2)}.${ext}`;

    Toast.show({
      type: 'info',
      text1: 'Download Started',
      text2: 'Please wait while your file is downloading...',
    });

    config({
      fileCache: true,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path: filePath,
        description: 'Downloading health record...',
      },
    })
      .fetch('GET', fullUrl)
      .then(res => {
        console.log('File saved to: ', res.path());
        Toast.show({
          type: 'success',
          text1: 'Download Complete',
          text2: 'File saved to your Downloads folder',
        });
        if (Platform.OS === 'android') {
          ReactNativeBlobUtil.android.actionViewIntent(
            res.path(),
            `application/${ext === 'pdf' ? 'pdf' : 'image'}`,
          );
        }
      })
      .catch(err => {
        console.error('Download error:', err);
        Linking.openURL(fullUrl).catch(err =>
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Could not download file',
          }),
        );
      });
  };

  const renderPreview = () => {
    if (!selectedItem) return null;
    const fullUrl = buildFullUrl(selectedItem.url);
    const isPdf = fullUrl.toLowerCase().endsWith('.pdf');

    return (
      <Modal
        visible={!!selectedItem}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              style={styles.closeBtn}
            >
              <X size={scale(24)} color={colors.textHeader} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: scale(12) }}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selectedItem.title}
              </Text>
              <Text style={styles.previewSub}>{selectedItem.sub}</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                handleDownload(selectedItem.url, selectedItem.title)
              }
              style={styles.previewDownloadBtn}
            >
              <Download size={scale(20)} color={colors.primaryBlue} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewBody}>
            {isPdf ? (
              <Pdf
                source={{ uri: fullUrl, cache: true }}
                style={styles.pdf}
                onError={error => {
                  console.error('Pdf error:', error);
                  Toast.show({
                    type: 'error',
                    text1: 'Preview Error',
                    text2: 'Could not load PDF',
                  });
                }}
              />
            ) : (
              <Image
                source={{ uri: fullUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        <View style={styles.chipsRow}>
          {FILTERS.map(f => (
            <FilterChip
              key={f}
              label={f}
              active={active === f}
              onPress={() => setActive(f)}
            />
          ))}
        </View>

        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>
              Failed to load records. Please try again.
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySub}>
              {active === 'All'
                ? 'Your health documents from consultations will appear here.'
                : `No ${active.toLowerCase()} found yet.`}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: verticalScale(16) }}
          >
            {filteredItems.map(it => (
              <TouchableOpacity
                key={it.id}
                activeOpacity={0.9}
                onPress={() => setSelectedItem(it)}
                style={styles.card}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.emoji}>{it.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: scale(12) }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {it.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {it.sub}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      it.statusType === 'success' && styles.statusSuccess,
                      it.statusType === 'warning' && styles.statusWarn,
                      it.statusType === 'info' && styles.statusInfo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        it.statusType === 'success' && styles.statusTextSuccess,
                        it.statusType === 'warning' && styles.statusTextWarn,
                        it.statusType === 'info' && styles.statusTextInfo,
                      ]}
                      numberOfLines={1}
                    >
                      {it.statusType === 'success'
                        ? '✓ '
                        : it.statusType === 'warning'
                        ? '⚠ '
                        : '📄 '}
                      {it.status}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.downloadBtn}
                  onPress={() => handleDownload(it.url, it.title)}
                >
                  <Download size={scale(18)} color={colors.primaryBlue} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      {renderPreview()}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
    paddingRight: scale(16),
  },
  chip: {
    height: verticalScale(34),
    paddingHorizontal: scale(14),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  chipActive: {
    backgroundColor: 'rgba(21,114,183,0.08)',
    borderColor: 'rgba(21,114,183,0.5)',
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.primaryBlue },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderRadius: scale(16),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: scale(18) },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  sub: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  statusPill: {
    marginTop: verticalScale(8),
    alignSelf: 'flex-start',
    paddingHorizontal: scale(10),
    height: verticalScale(26),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  statusSuccess: { backgroundColor: 'rgba(65,179,74,0.12)' },
  statusWarn: { backgroundColor: 'rgba(245,158,11,0.14)' },
  statusInfo: { backgroundColor: 'rgba(21,114,183,0.10)' },
  statusTextSuccess: { color: colors.primaryGreen },
  statusTextWarn: { color: '#F59E0B' },
  statusTextInfo: { color: colors.primaryBlue },
  downloadBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(12),
    backgroundColor: 'rgba(21,114,183,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.error,
    textAlign: 'center',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  emptyIcon: {
    fontSize: scale(48),
    marginBottom: verticalScale(12),
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: verticalScale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    padding: scale(4),
  },
  previewTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  previewSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  previewDownloadBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(21,114,183,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: {
    flex: 1,
    backgroundColor: '#F3F6FB',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
