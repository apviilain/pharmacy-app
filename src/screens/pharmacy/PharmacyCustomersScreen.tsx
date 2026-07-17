import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Phone, Search, X, Calendar, Activity } from 'lucide-react-native';
import { getEntityId, InlineError, EmptyState, StatCard } from './components/PharmacyShared';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

import Toast from 'react-native-toast-message';

import { pharmacyCustomerService } from '../../api/pharmacyCustomerService';

import { PrimaryButton } from '../../components/PrimaryButton';






import { colors } from '../../theme/colors';
import { moderateScale, scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

export function PharmacyCustomersScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchInput, setSearchInput] = useState('');

  const customersQuery = useQuery({
    queryKey: ['pharmacyCustomers'],
    queryFn: () => pharmacyCustomerService.list(),
  });
  
  const customers = customersQuery.data || [];

  const filteredCustomers = useMemo(() => {
    if (!searchInput.trim()) return customers;
    const lower = searchInput.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(lower)) ||
        (c.phone && c.phone.includes(lower))
    );
  }, [customers, searchInput]);

  const customerStats = useMemo(() => {
    return {
      total: customers.length,
      chronic: customers.filter((c) => c.chronicCondition).length,
      recurring: customers.filter((c) => c.recurringMedicine).length,
    };
  }, [customers]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header and Toolbar */}
      <View style={styles.header}>
        <View style={[styles.toolbar, isTablet && styles.toolbarTablet]}>
          <View style={styles.searchContainer}>
            <Search size={scale(18)} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              placeholderTextColor="#94A3B8"
              value={searchInput}
              onChangeText={setSearchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput('')} style={styles.clearButton}>
                <X size={scale(16)} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <PrimaryButton
            title="Add Customer"
            onPress={() => navigation.navigate('ManagePharmacyCustomer')}
            icon={<Plus size={scale(18)} color="#fff" />}
            style={isTablet ? styles.toolbarButtonTablet : styles.toolbarButton}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Customers"
            value={String(customerStats.total)}
            accent="rgba(21,114,183,0.10)"
            icon={<Users size={scale(18)} color={colors.primaryBlue} />}
          />
          <StatCard
            label="Chronic Patients"
            value={String(customerStats.chronic)}
            accent="rgba(245,158,11,0.10)"
            icon={<Activity size={scale(18)} color={'#F59E0B'} />}
          />
        </View>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {customersQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primaryBlue} size="large" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : customersQuery.error ? (
          <InlineError
            message={(customersQuery.error as any).message || 'Failed to load customers'}
            onRetry={() => customersQuery.refetch()}
          />
        ) : !filteredCustomers.length ? (
          <EmptyState
            title="No customers found"
            subtitle="Add a customer or try a different search term."
          />
        ) : (
          <View style={styles.grid}>
            {filteredCustomers.map((customer) => {
              const recurring = !!customer.recurringMedicine;
              const chronic = !!customer.chronicCondition;

              return (
                <View key={getEntityId(customer)} style={[styles.card, isTablet && styles.cardTablet]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <Users size={scale(24)} color={colors.primaryBlue} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.customerName}>
                        {customer.name || (customer as any).user?.name || (customer as any).customer?.name || 'Unnamed customer'}
                      </Text>
                      <View style={styles.phoneRow}>
                        <Phone size={scale(12)} color={colors.textLight} />
                        <Text style={styles.customerPhone}>{customer.phone || 'Phone not available'}</Text>
                      </View>
                    </View>
                    {customer.age && (
                      <View style={styles.ageBadge}>
                        <Text style={styles.ageText}>{customer.age} yrs</Text>
                      </View>
                    )}
                  </View>
                  
                  {(chronic || recurring) && (
                    <View style={styles.tagsContainer}>
                      {chronic && (
                        <View style={[styles.tag, styles.tagWarning]}>
                          <Text style={[styles.tagText, styles.tagTextWarning]}>Chronic</Text>
                        </View>
                      )}
                      {recurring && (
                        <View style={[styles.tag, styles.tagSuccess]}>
                          <Calendar size={scale(12)} color={'#10B981'} style={{marginRight: scale(4)}} />
                          <Text style={[styles.tagText, styles.tagTextSuccess]}>
                            Every {customer.recurringIntervalDays || '-'} days
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {customer.diseaseNotes && (
                    <View style={styles.notesContainer}>
                      <Text numberOfLines={2} style={styles.notesText}>{customer.diseaseNotes}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: scale(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  toolbar: {
    flexDirection: 'column',
    gap: verticalScale(12),
    marginBottom: verticalScale(16),
  },
  toolbarTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: verticalScale(44),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: colors.textHeader,
    height: '100%',
  },
  clearButton: {
    padding: scale(4),
  },
  toolbarButton: {
    width: '100%',
  },
  toolbarButtonTablet: {
    minWidth: scale(160),
    marginLeft: scale(16),
  },
  statsRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: scale(16),
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(16),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(16),
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardTablet: {
    width: '48%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  iconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(21,114,183,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(16),
    color: colors.textHeader,
    marginBottom: verticalScale(4),
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  customerPhone: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(14),
    color: colors.textLight,
  },
  ageBadge: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  ageText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: colors.textLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },
  tagWarning: {
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  tagSuccess: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  tagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
  },
  tagTextWarning: {
    color: '#F59E0B',
  },
  tagTextSuccess: {
    color: '#10B981',
  },
  notesContainer: {
    backgroundColor: colors.inputBg,
    padding: scale(12),
    borderRadius: scale(8),
  },
  notesText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(13),
    color: colors.textLight,
    lineHeight: moderateScale(18),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: colors.textLight,
    marginTop: verticalScale(12),
  },
});
