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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, PauseCircle, Package, User, ChevronRight, Edit3, XCircle, ArrowLeft, Trash2, Plus, Search } from 'lucide-react-native';
import { getEntityId, LabeledField, FormToggle, InlineError, EmptyState, StatCard } from './components/PharmacyShared';

import Toast from 'react-native-toast-message';

import { pharmacySubscriptionService } from '../../api/pharmacySubscriptionService';
import type { 
  PharmyxSubscription
} from '../../api/pharmyx';

import { ApiError } from '../../api/errorHandler';

import { PrimaryButton } from '../../components/PrimaryButton';





import { colors } from '../../theme/colors';
import { moderateScale, scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

export function PharmacySubscriptionsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const subsQuery = useQuery({
    queryKey: ['pharmacySubscriptions'],
    queryFn: () => pharmacySubscriptionService.list(),
  });

  const subscriptions = subsQuery.data || [];
  const selectedSub = useMemo(
    () => subscriptions.find((s) => getEntityId(s) === selectedSubId),
    [subscriptions, selectedSubId]
  );

  const stats = useMemo(() => {
    return {
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === 'ACTIVE').length,
      paused: subscriptions.filter((s) => s.status === 'PAUSED').length,
    };
  }, [subscriptions]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pharmacySubscriptionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacySubscriptions'] });
      setSelectedSubId(null);
      Toast.show({ type: 'success', text1: 'Subscription deleted' });
    },
    onError: (err) => {
      const apiErr = err as ApiError;
      Toast.show({ type: 'error', text1: 'Delete failed', text2: apiErr.message });
    },
  });

  const handleOpenAction = (mode: 'UPDATE' | 'PAUSE' | 'CREATE') => {
    if (mode === 'CREATE') {
      navigation.navigate('ManagePharmacySubscription', { mode: 'CREATE' });
    } else {
      navigation.navigate('ManagePharmacySubscription', { mode, subscriptionId: selectedSubId, subscription: selectedSub });
    }
  };

  const renderList = () => (
    <View style={[styles.listContainer, isTablet && styles.listContainerTablet]}>
      {subsQuery.isLoading ? (
        <ActivityIndicator color={colors.primaryBlue} style={{ marginTop: verticalScale(40) }} />
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Search size={scale(32)} color={colors.primaryBlue} />
          </View>
          <Text style={styles.emptyTitle}>No Subscriptions</Text>
          <Text style={styles.emptySubtitle}>No active subscriptions found.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {subscriptions.map((s) => {
            const id = getEntityId(s);
            const isSelected = id === selectedSubId;
            const isActive = s.status === 'ACTIVE';

            return (
              <TouchableOpacity
                key={id}
                style={[styles.listItem, isSelected && styles.listItemSelected]}
                onPress={() => setSelectedSubId(id)}
              >
                <View style={styles.listInfo}>
                  <View style={styles.listHeaderRow}>
                    <Text style={[styles.listTitle, isSelected && { color: colors.primaryBlue }]}>
                      {(s.customer as any)?.name || (s.user as any)?.name || 'Customer'}
                    </Text>
                    {isActive ? (
                      <CheckCircle2 size={scale(14)} color={'#10B981'} />
                    ) : (
                      <PauseCircle size={scale(14)} color={'#F59E0B'} />
                    )}
                  </View>
                  <Text style={styles.listSubtitle}>
                    Every {String(s.intervalDays || s.items?.[0]?.intervalDays || 30)} days
                  </Text>
                </View>
                <ChevronRight size={scale(16)} color={isSelected ? colors.primaryBlue : colors.textLight} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderDetails = () => {
    if (!selectedSubId || !selectedSub) {
      return (
        <EmptyState
          title="Select a Subscription"
          subtitle="Choose from the list to view subscription details."
        />
      );
    }

    const isActive = selectedSub.status === 'ACTIVE';

    return (
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        {!isTablet && (
          <TouchableOpacity style={styles.mobileBackButton} onPress={() => setSelectedSubId(null)}>
            <ArrowLeft size={scale(20)} color={colors.textHeader} style={{ marginRight: scale(8) }} />
            <Text style={styles.mobileBackText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.detailsHeader}>
          <View>
            <Text style={styles.detailsTitle}>Subscription Details</Text>
          </View>
          <View style={styles.actionRow}>
            {isActive && (
              <TouchableOpacity style={styles.pauseIconBtn} onPress={() => handleOpenAction('PAUSE')}>
                <PauseCircle size={scale(20)} color={'#F59E0B'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteIconBtn} onPress={() => deleteMutation.mutate(selectedSubId!)}>
              <Trash2 size={scale(20)} color={'#EF4444'} />
            </TouchableOpacity>
            <PrimaryButton
              title="Update"
              onPress={() => handleOpenAction('UPDATE')}
              icon={<Edit3 size={scale(16)} color="#fff" />}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <User size={scale(20)} color={colors.primaryBlue} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>
                {(selectedSub.customer as any)?.name || (selectedSub.user as any)?.name || 'Unknown'}
              </Text>
            </View>
            <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgePaused]}>
              <Text style={[styles.statusBadgeText, isActive ? styles.badgeTextActive : styles.badgeTextPaused]}>
                {selectedSub.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Clock size={scale(20)} color={'#10B981'} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Refill Interval</Text>
              <Text style={styles.infoValue}>Every {String(selectedSub.intervalDays || selectedSub.items?.[0]?.intervalDays || 30)} days</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Package size={scale(20)} color={'#F59E0B'} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Next Refill Date</Text>
              <Text style={styles.infoValue}>
                {String(selectedSub.nextRefillDate || selectedSub.items?.[0]?.nextRefillDate || 'Not scheduled')}
              </Text>
            </View>
          </View>
        </View>

        {selectedSub.items && selectedSub.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Subscribed Items</Text>
            {selectedSub.items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemBullet} />
                <Text style={styles.itemName}>{(item.medicine as any)?.name || (item as any)?.name || 'Medicine'}</Text>
                <Text style={styles.itemQty}>Qty: {(item as any).quantity}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {subscriptions.length > 0 && (
        <View style={styles.topHeader}>
          <View style={{ flexDirection: 'row', gap: scale(12), flex: 1 }}>
            <StatCard label="Active" value={String(stats.active)} accent="rgba(16,185,129,0.1)" icon={<CheckCircle2 size={scale(18)} color={'#10B981'} />} />
            <StatCard label="Paused" value={String(stats.paused)} accent="rgba(245,158,11,0.1)" icon={<PauseCircle size={scale(18)} color={'#F59E0B'} />} />
          </View>
        </View>
      )}

      <View style={[styles.layout, isTablet && styles.layoutTablet]}>
        {(!selectedSubId || isTablet) && renderList()}
        {(selectedSubId || isTablet) && (
          isTablet ? (
            <View style={styles.detailsPaneTablet}>{renderDetails()}</View>
          ) : (
            <View style={styles.fullScreenDetails}>{renderDetails()}</View>
          )
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => handleOpenAction('CREATE')}
        activeOpacity={0.8}
      >
        <Plus size={scale(24)} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topHeader: { flexDirection: 'row', padding: scale(16), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  layout: { flex: 1, flexDirection: 'column' },
  layoutTablet: { flexDirection: 'row' },
  listContainer: { flex: 1 },
  listContainerTablet: { width: scale(320), borderRightWidth: 1, borderRightColor: colors.inputBorder },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: scale(16), borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  listItemSelected: { backgroundColor: 'rgba(21,114,183,0.05)' },
  listInfo: { flex: 1 },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: verticalScale(2) },
  listTitle: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(15), color: colors.textHeader },
  listSubtitle: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(13), color: colors.textLight, marginTop: verticalScale(4) },
  detailsPaneTablet: { flex: 2, backgroundColor: colors.background, padding: scale(24) },
  fullScreenDetails: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background },
  detailsContainer: { flex: 1, padding: scale(16) },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(24) },
  detailsTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: moderateScale(20), color: colors.textHeader },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  pauseIconBtn: { padding: scale(8), backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: scale(8) },
  deleteIconBtn: { padding: scale(8), backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: scale(8) },
  card: { backgroundColor: '#fff', borderRadius: scale(12), padding: scale(16), marginBottom: verticalScale(16), ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(12), borderBottomWidth: 1, borderBottomColor: colors.inputBorder },
  iconBox: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center', marginRight: scale(16) },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(12), color: colors.textLight, textTransform: 'uppercase', marginBottom: verticalScale(2) },
  infoValue: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(15), color: colors.textHeader },
  statusBadge: { paddingHorizontal: scale(8), paddingVertical: verticalScale(4), borderRadius: scale(12) },
  badgeActive: { backgroundColor: 'rgba(16,185,129,0.1)' },
  badgePaused: { backgroundColor: 'rgba(245,158,11,0.1)' },
  statusBadgeText: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(12) },
  badgeTextActive: { color: '#10B981' },
  badgeTextPaused: { color: '#F59E0B' },
  sectionTitle: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(15), color: colors.textHeader, marginBottom: verticalScale(12) },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(8) },
  itemBullet: { width: scale(6), height: scale(6), borderRadius: scale(3), backgroundColor: colors.primaryBlue, marginRight: scale(8) },
  itemName: { flex: 1, fontFamily: typography.fontFamily.regular, fontSize: moderateScale(14), color: colors.textHeader },
  itemQty: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(14), color: colors.textLight },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(32) },
  emptyIconCircle: { width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: verticalScale(16) },
  emptyTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: moderateScale(18), color: colors.textHeader, marginBottom: verticalScale(8) },
  emptySubtitle: { fontFamily: typography.fontFamily.regular, fontSize: moderateScale(14), color: colors.textLight, textAlign: 'center' },
  mobileBackButton: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(16) },
  mobileBackText: { fontFamily: typography.fontFamily.medium, fontSize: moderateScale(16), color: colors.textHeader },
  fab: {
    position: 'absolute',
    bottom: verticalScale(24),
    right: scale(24),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }
});
