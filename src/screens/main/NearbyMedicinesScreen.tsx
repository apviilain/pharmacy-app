import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin, Pill } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { pharmacyMedicineService } from '../../api/pharmacyMedicineService';
import { ModuleScreen } from '../../components/ui/ModuleScreen';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { PremiumSearchField } from '../../components/ui/PremiumSearchField';
import { SectionState } from '../../components/ui/SectionState';
import type { RootStackParamList } from '../../navigation/types';
import {
  locationService,
  type DeviceCoordinates,
} from '../../services/locationService';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { premiumTheme, radii, spacing } from '../../theme/tokens';

type NearbyMedicineItem = {
  id?: string;
  _id?: string;
  brandName?: string;
  genericName?: string;
  pharmacyId?: string;
  retailPrice?: number;
  distance?: number;
  pharmacy?: {
    id?: string;
    _id?: string;
    name?: string;
  };
};

export const NearbyMedicinesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState<DeviceCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const locationOutcome = await locationService.requestCurrentLocation();
        if (locationOutcome.status === 'granted' && locationOutcome.coords) {
          setCoords(locationOutcome.coords);
          return;
        }

        Toast.show({
          type: 'error',
          text1: 'Location access required',
          text2:
            locationOutcome.message ||
            'Allow location access to search nearby medicines.',
        });
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Location error',
          text2: 'Could not fetch your current location.',
        });
      } finally {
        setLocationLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const nearbyMedicinesQuery = useQuery({
    queryKey: [
      'nearbyMedicines',
      debouncedQuery,
      coords?.latitude,
      coords?.longitude,
    ],
    queryFn: async () => {
      if (!coords) return [];
      return pharmacyMedicineService.getNearbyMedicines({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: 5,
        search: debouncedQuery,
      });
    },
    enabled: !!coords && debouncedQuery.length > 2,
  });

  const renderItem = ({ item }: { item: NearbyMedicineItem }) => {
    const pharmacyId = String(
      item.pharmacyId || item.pharmacy?.id || item.pharmacy?._id || '',
    );

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (!pharmacyId) return;

          navigation.navigate('PharmacyDetails', {
            pharmacyId,
            title: String(item.pharmacy?.name || 'Pharmacy Details'),
          });
        }}
        style={styles.resultItem}
      >
        <PremiumCard style={styles.resultCard}>
          <View style={styles.resultInner}>
            <View style={styles.iconContainer}>
              <Pill color={colors.primaryBlue} size={scale(20)} />
            </View>

            <View style={styles.resultTextContainer}>
              <Text style={styles.resultTitle}>
                {item.brandName || item.genericName || 'Unnamed medicine'}
              </Text>
              <Text style={styles.resultSubTitle}>
                {item.pharmacy?.name || 'Local pharmacy'}
              </Text>
              {typeof item.distance === 'number' ? (
                <View style={styles.distanceRow}>
                  <MapPin color={premiumTheme.caption} size={scale(12)} />
                  <Text style={styles.distanceText}>
                    {item.distance.toFixed(1)} km away
                  </Text>
                </View>
              ) : null}
            </View>

            {item.retailPrice ? (
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>₹{item.retailPrice}</Text>
              </View>
            ) : null}
          </View>
        </PremiumCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={colors.textHeader} size={scale(24)} />
        </TouchableOpacity>

        <PremiumSearchField
          containerStyle={styles.searchBar}
          placeholder="Search nearby medicines..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <ModuleScreen
        title="Nearby medicines"
        subtitle="Discover stocked medicines around your current location and open the matching pharmacy."
        scroll={false}
        contentContainerStyle={styles.moduleContent}
      >
        {locationLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Locating you...</Text>
          </View>
        ) : !coords ? (
          <SectionState
            title="Location access required"
            subtitle="Allow location access to search nearby stock around your pharmacy."
            tone="error"
          />
        ) : debouncedQuery.length <= 2 ? (
          <SectionState
            title="Start searching"
            subtitle="Type at least 3 characters to find available nearby medicines."
          />
        ) : nearbyMedicinesQuery.isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
          </View>
        ) : nearbyMedicinesQuery.isError ? (
          <SectionState
            title="Unable to load medicines"
            subtitle="Please retry once your location and network are stable."
            tone="error"
            actionLabel="Retry"
            onAction={() => nearbyMedicinesQuery.refetch()}
          />
        ) : nearbyMedicinesQuery.data?.length ? (
          <FlatList
            data={nearbyMedicinesQuery.data}
            keyExtractor={(item, index) =>
              String(item.id || item._id || index)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <SectionState
            title="No medicines found"
            subtitle="Try another keyword or broaden the nearby radius."
          />
        )}
      </ModuleScreen>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumTheme.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: premiumTheme.screen,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: scale(4),
  },
  searchBar: {
    flex: 1,
  },
  moduleContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.medium,
    color: premiumTheme.subtext,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  resultItem: {
    marginBottom: spacing.sm,
  },
  resultCard: {
    overflow: 'hidden',
  },
  resultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: scale(42),
    height: scale(42),
    borderRadius: radii.md,
    backgroundColor: premiumTheme.blueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  resultSubTitle: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: premiumTheme.subtext,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: scale(4),
  },
  distanceText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: premiumTheme.caption,
  },
  priceContainer: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: premiumTheme.greenTint,
  },
  priceText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryGreen,
  },
});
