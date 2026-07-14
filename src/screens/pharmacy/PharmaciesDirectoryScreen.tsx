import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin, Phone, Search, ShieldCheck, Store } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '../../navigation/types';
import { pharmacyService } from '../../api/pharmacyService';
import type { PharmyxPharmacyProfile } from '../../api/pharmyx';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type DirectoryProps = NativeStackScreenProps<
  RootStackParamList,
  'PharmaciesDirectory'
>;
type DetailsProps = NativeStackScreenProps<RootStackParamList, 'PharmacyDetails'>;

const getPharmacyId = (item: PharmyxPharmacyProfile | null | undefined) =>
  String(item?.id || item?._id || '');

export const PharmaciesDirectoryScreen: React.FC<DirectoryProps> = ({
  navigation,
}) => {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const pharmaciesQuery = useQuery({
    queryKey: ['pharmaciesDirectory', debouncedSearch],
    queryFn: () =>
      pharmacyService.list({
        search: debouncedSearch || undefined,
        isVerified: true,
        page: 1,
        limit: 30,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const renderItem = ({ item }: { item: PharmyxPharmacyProfile }) => {
    const pharmacyId = getPharmacyId(item);
    if (!pharmacyId) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        style={styles.card}
        onPress={() =>
          navigation.navigate('PharmacyDetails', {
            pharmacyId,
            title: String(item.name || item.nickname || 'Pharmacy'),
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconShell}>
            <Store size={scale(18)} color={colors.primaryBlue} />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>
              {item.name || item.nickname || 'Unnamed pharmacy'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {[item.city, item.state].filter(Boolean).join(', ') ||
                item.address ||
                'Location not added'}
            </Text>
          </View>
          {item.isVerified ? (
            <View style={styles.verifiedPill}>
              <ShieldCheck size={scale(14)} color={colors.primaryGreen} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardMetaRow}>
          <View style={styles.metaGroup}>
            <Phone size={scale(13)} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.phone || 'Phone unavailable'}</Text>
          </View>
          <View style={styles.metaGroup}>
            <MapPin size={scale(13)} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {item.deliveryAvailable ? 'Delivery' : 'Pickup only'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={scale(18)} color={colors.textLight} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search pharmacies by name or city"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
        />
      </View>

      {pharmaciesQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.helperText}>Loading pharmacies...</Text>
        </View>
      ) : pharmaciesQuery.isError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Unable to load pharmacies right now.</Text>
        </View>
      ) : (
        <FlatList
          data={pharmaciesQuery.data || []}
          keyExtractor={item => getPharmacyId(item)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.helperText}>No pharmacies found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export const PharmacyDetailsScreen: React.FC<DetailsProps> = ({ route }) => {
  const detailsQuery = useQuery({
    queryKey: ['pharmacyDetails', route.params.pharmacyId],
    queryFn: () => pharmacyService.getById(route.params.pharmacyId),
    enabled: !!route.params.pharmacyId,
  });

  const profile = detailsQuery.data;

  return (
    <View style={styles.container}>
      {detailsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.helperText}>Loading pharmacy details...</Text>
        </View>
      ) : !profile ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Pharmacy details unavailable.</Text>
        </View>
      ) : (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>
            {profile.name || profile.nickname || 'Pharmacy'}
          </Text>
          <Text style={styles.detailsSubtitle}>
            {profile.ownerName || 'Owner name not added'}
          </Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>
                {profile.phone || 'Not available'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>
                {profile.email || 'Not available'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pickup</Text>
              <Text style={styles.detailValue}>
                {profile.pickupAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Delivery</Text>
              <Text style={styles.detailValue}>
                {profile.deliveryAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.addressText}>
              {[
                profile.address,
                profile.city,
                profile.state,
                profile.pincode,
              ]
                .filter(Boolean)
                .join(', ') || 'Address not available'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFF',
    padding: scale(16),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: '#DCE9F6',
    paddingHorizontal: scale(14),
    marginBottom: verticalScale(14),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(10),
    minHeight: verticalScale(44),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: '#DCE9F6',
    padding: scale(16),
    marginBottom: verticalScale(12),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconShell: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(14),
    backgroundColor: '#EAF4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  cardSubtitle: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF3',
    borderRadius: scale(999),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    gap: scale(6),
  },
  verifiedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primaryGreen,
  },
  cardMetaRow: {
    marginTop: verticalScale(12),
    gap: verticalScale(8),
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    marginTop: verticalScale(10),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(22),
    borderWidth: 1,
    borderColor: '#DCE9F6',
    padding: scale(18),
  },
  detailsTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
  },
  detailsSubtitle: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: verticalScale(18),
  },
  detailItem: {
    width: '48%',
    marginBottom: verticalScale(14),
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: verticalScale(4),
  },
  detailValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  addressBox: {
    marginTop: verticalScale(4),
    padding: scale(14),
    borderRadius: scale(16),
    backgroundColor: '#F6FAFE',
  },
  addressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
    lineHeight: scale(20),
  },
});
