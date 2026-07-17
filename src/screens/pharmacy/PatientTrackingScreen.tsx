import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Activity, Calendar, FileText, ChevronRight, Edit3, ArrowLeft } from 'lucide-react-native';
import { getEntityId, InlineError, EmptyState } from './components/PharmacyShared';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

import Toast from 'react-native-toast-message';

import { pharmacyCustomerService } from '../../api/pharmacyCustomerService';
import { patientTrackingService } from '../../api/patientTrackingService';

import { ApiError } from '../../api/errorHandler';

import { PrimaryButton } from '../../components/PrimaryButton';





import { colors } from '../../theme/colors';
import { moderateScale, scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

export function PatientTrackingScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ['pharmacyCustomers'],
    queryFn: () => pharmacyCustomerService.list(),
  });

  const trackingQuery = useQuery({
    queryKey: ['patientTracking', selectedCustomerId],
    queryFn: () => patientTrackingService.getById(selectedCustomerId!),
    enabled: !!selectedCustomerId,
  });

  const customers = customersQuery.data || [];
  const trackingData = trackingQuery.data;

  const handleOpenEdit = () => {
    if (!selectedCustomerId) return;
    navigation.navigate('ManagePatientTracking', { customerId: selectedCustomerId });
  };

  const renderCustomerList = () => {
    if (customersQuery.isLoading) return <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />;
    if (!customers.length) return <EmptyState title="No Customers" subtitle="Add customers to start tracking." />;

    return (
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {customers.map((c) => {
          const id = getEntityId(c);
          const isSelected = id === selectedCustomerId;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.customerListItem, isSelected && styles.customerListItemSelected]}
              onPress={() => setSelectedCustomerId(id)}
            >
              <View style={styles.customerListInfo}>
                <Text style={[styles.customerName, isSelected && { color: colors.primaryBlue }]}>
                  {c.name || (c as any).user?.name || (c as any).customer?.name || 'Unnamed customer'}
                </Text>
                <Text style={styles.customerPhone}>{c.phone}</Text>
              </View>
              <ChevronRight size={scale(16)} color={isSelected ? colors.primaryBlue : colors.textLight} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderTrackingDetails = () => {
    if (!selectedCustomerId) {
      if (!isTablet) return null;
      return (
        <EmptyState
          title="Select a Patient"
          subtitle="Choose a patient to view their tracking details."
        />
      );
    }

    if (trackingQuery.isLoading) return <ActivityIndicator color={colors.primaryBlue} style={styles.loader} />;
    
    if (trackingQuery.error) {
      return (
        <InlineError
          message={(trackingQuery.error as any).message || 'Failed to load tracking data'}
          onRetry={() => trackingQuery.refetch()}
        />
      );
    }

    const t = trackingData;
    if (!t) return <EmptyState title="No Data" subtitle="Tracking data not available." />;

    return (
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsHeader}>
          <View>
            <Text style={styles.detailsTitle}>Tracking Overview</Text>
            <Text style={styles.detailsSubtitle}>Manage follow-ups and conditions.</Text>
          </View>
          <PrimaryButton
            title="Update"
            onPress={handleOpenEdit}
            icon={<Edit3 size={scale(16)} color="#fff" />}
            style={styles.updateButton}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Activity size={scale(20)} color={'#F59E0B'} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Condition Status</Text>
              <Text style={styles.infoValue}>
                {t.chronicCondition ? 'Chronic Condition' : 'Standard'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Calendar size={scale(20)} color={'#10B981'} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Refill Schedule</Text>
              <Text style={styles.infoValue}>
                {t.recurringMedicine 
                  ? `Every ${t.recurringIntervalDays || '-'} days`
                  : 'No recurring medicines'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Calendar size={scale(20)} color={colors.primaryBlue} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Next Follow-up</Text>
              <Text style={styles.infoValue}>
                {t.preferredFollowUpDate || 'Not scheduled'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.notesHeader}>
            <FileText size={scale(18)} color={colors.textLight} style={{ marginRight: scale(8) }} />
            <Text style={styles.notesTitle}>Disease Notes</Text>
          </View>
          <Text style={styles.notesText}>{t.diseaseNotes || 'No disease notes added.'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.notesHeader}>
            <FileText size={scale(18)} color={colors.textLight} style={{ marginRight: scale(8) }} />
            <Text style={styles.notesTitle}>Pharmacy Internal Notes</Text>
          </View>
          <Text style={styles.notesText}>{t.pharmacyNotes || 'No internal notes added.'}</Text>
        </View>

      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={[styles.layout, isTablet && styles.layoutTablet]}>
        {/* Left Pane: Customer List */}
        {(!selectedCustomerId || isTablet) && (
          <View style={[styles.sidebar, isTablet ? styles.sidebarTablet : { height: '100%', borderRightWidth: 0 }]}>
            <Text style={styles.sidebarTitle}>Customers</Text>
            {renderCustomerList()}
          </View>
        )}

        {/* Right Pane: Details */}
        {(selectedCustomerId || isTablet) && (
          <View style={[styles.mainArea, isTablet && styles.mainAreaTablet]}>
            {!isTablet && selectedCustomerId && (
              <TouchableOpacity style={styles.mobileBackButton} onPress={() => setSelectedCustomerId(null)}>
                <ArrowLeft size={scale(20)} color={colors.textHeader} style={{ marginRight: scale(8) }} />
                <Text style={styles.mobileBackText}>Back to Customers</Text>
              </TouchableOpacity>
            )}
            {renderTrackingDetails()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  layout: { flex: 1, flexDirection: 'column' },
  layoutTablet: { flexDirection: 'row' },
  sidebar: { backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: colors.inputBorder, height: '35%' },
  sidebarTablet: { width: scale(300), height: '100%' },
  sidebarTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: moderateScale(16), padding: scale(16), borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  listContainer: { flex: 1 },
  customerListItem: { flexDirection: 'row', alignItems: 'center', padding: scale(16), borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  customerListItemSelected: { backgroundColor: 'rgba(21,114,183,0.05)' },
  customerListInfo: { flex: 1 },
  customerName: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(15), color: colors.textHeader, marginBottom: verticalScale(2) },
  customerPhone: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(13), color: colors.textLight },
  mainArea: { flex: 1, backgroundColor: colors.background },
  mainAreaTablet: { padding: scale(24) },
  detailsContainer: { flex: 1, padding: scale(16) },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(24) },
  detailsTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: moderateScale(20), color: colors.textHeader },
  detailsSubtitle: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(14), color: colors.textLight, marginTop: verticalScale(4) },
  updateButton: { minWidth: scale(100) },
  card: { backgroundColor: '#fff', borderRadius: scale(12), padding: scale(16), marginBottom: verticalScale(16), ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(12), borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  iconBox: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center', marginRight: scale(16) },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(12), color: colors.textLight, textTransform: 'uppercase', marginBottom: verticalScale(2) },
  infoValue: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(15), color: colors.textHeader },
  notesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12) },
  notesTitle: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(15), color: colors.textHeader },
  notesText: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(14), color: colors.textHeader, lineHeight: moderateScale(20) },
  loader: { marginTop: verticalScale(32) },
  emptyDetails: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(32) },
  emptyTitle: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(18), color: colors.textHeader, marginTop: verticalScale(16) },
  emptySubtitle: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(14), color: colors.textLight, textAlign: 'center', marginTop: verticalScale(8) },
  mobileBackButton: { flexDirection: 'row', alignItems: 'center', padding: scale(16), borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  mobileBackText: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(16), color: colors.textHeader },
});
