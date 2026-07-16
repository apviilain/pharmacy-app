import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { pharmacyService } from '../../api/pharmacyService';
import type { PharmyxPharmacyProfile } from '../../api/pharmyx';
import { ModuleScreen } from '../../components/ui/ModuleScreen';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { PremiumSearchField } from '../../components/ui/PremiumSearchField';
import { SectionState } from '../../components/ui/SectionState';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import {
  premiumTheme,
  premiumTypography,
  radii,
  spacing,
} from '../../theme/tokens';

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
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('PharmacyDetails', {
            pharmacyId,
            title: String(item.name || item.nickname || 'Pharmacy'),
          })
        }
        style={styles.cardPressable}
      >
        <PremiumCard style={styles.card}>
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

          <View style={styles.metaRow}>
            <View style={styles.metaGroup}>
              <Phone size={scale(13)} color={premiumTheme.subtext} />
              <Text style={styles.metaText}>
                {item.phone || 'Phone unavailable'}
              </Text>
            </View>
            <View style={styles.metaGroup}>
              <Truck size={scale(13)} color={premiumTheme.subtext} />
              <Text style={styles.metaText}>
                {item.deliveryAvailable ? 'Delivery' : 'Pickup only'}
              </Text>
            </View>
          </View>
        </PremiumCard>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleScreen
      title="Verified pharmacies"
      subtitle="Browse trusted pharmacies, compare availability, and open detailed store information."
      scroll={false}
      contentContainerStyle={styles.moduleContent}
    >
      <PremiumSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Search pharmacies by name or city"
      />

      {pharmaciesQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.helperText}>Loading pharmacies...</Text>
        </View>
      ) : pharmaciesQuery.isError ? (
        <SectionState
          title="Unable to load pharmacies"
          subtitle="Please retry in a moment. We could not fetch verified store listings."
          tone="error"
          actionLabel="Retry"
          onAction={() => pharmaciesQuery.refetch()}
        />
      ) : (
        <FlatList
          data={pharmaciesQuery.data || []}
          keyExtractor={item => getPharmacyId(item)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <SectionState
              title="No pharmacies found"
              subtitle="Try a different city or search keyword."
            />
          }
        />
      )}
    </ModuleScreen>
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
    <ModuleScreen
      title={route.params.title || 'Pharmacy details'}
      subtitle="Store profile, delivery options, and contact details in one place."
      scroll={false}
      contentContainerStyle={styles.moduleContent}
    >
      {detailsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primaryBlue} />
          <Text style={styles.helperText}>Loading pharmacy details...</Text>
        </View>
      ) : !profile ? (
        <SectionState
          title="Pharmacy details unavailable"
          subtitle="We could not load this pharmacy right now."
          tone="error"
        />
      ) : (
        <PremiumCard style={styles.detailsCard}>
          <View style={styles.detailsHero}>
            <View style={styles.detailIcon}>
              <Store size={scale(22)} color={colors.primaryBlue} />
            </View>
            <View style={styles.detailsCopy}>
              <Text style={styles.detailsTitle}>
                {profile.name || profile.nickname || 'Pharmacy'}
              </Text>
              <Text style={styles.detailsSubtitle}>
                {profile.ownerName || 'Owner name not added'}
              </Text>
            </View>
            {profile.isVerified ? (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={scale(14)} color={colors.primaryGreen} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{profile.phone || 'Not available'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{profile.email || 'Not available'}</Text>
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
            <View style={styles.addressHeader}>
              <MapPin size={scale(14)} color={colors.primaryBlue} />
              <Text style={styles.detailLabel}>Address</Text>
            </View>
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
        </PremiumCard>
      )}
    </ModuleScreen>
  );
};

const styles = StyleSheet.create({
  moduleContent: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  helperText: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: premiumTheme.subtext,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  cardPressable: {
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconShell: {
    width: scale(46),
    height: scale(46),
    borderRadius: radii.md,
    backgroundColor: premiumTheme.blueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cardCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  cardTitle: {
    ...premiumTypography.title,
  },
  cardSubtitle: {
    ...premiumTypography.body,
    marginTop: verticalScale(3),
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    borderRadius: radii.pill,
    backgroundColor: premiumTheme.greenTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    borderRadius: radii.pill,
    backgroundColor: premiumTheme.greenTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  verifiedText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.primaryGreen,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: premiumTheme.cardMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  metaText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: premiumTheme.subtext,
  },
  detailsCard: {
    padding: spacing.lg,
  },
  detailsHero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: scale(54),
    height: scale(54),
    borderRadius: radii.md,
    backgroundColor: premiumTheme.blueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailsCopy: {
    flex: 1,
  },
  detailsTitle: {
    ...premiumTypography.hero,
    fontSize: scale(20),
  },
  detailsSubtitle: {
    ...premiumTypography.body,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  detailItem: {
    width: '48%',
    borderRadius: radii.md,
    backgroundColor: premiumTheme.cardMuted,
    padding: spacing.md,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: premiumTheme.caption,
  },
  detailValue: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  addressBox: {
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: premiumTheme.cardMuted,
    padding: spacing.md,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  addressText: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: verticalScale(20),
    color: premiumTheme.subtext,
  },
});
