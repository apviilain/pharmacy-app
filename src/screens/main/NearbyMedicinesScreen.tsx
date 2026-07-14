import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search, Pill, MapPin } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { pharmacyMedicineService } from '../../api/pharmacyMedicineService';
import { locationService, type DeviceCoordinates } from '../../services/locationService';

export const NearbyMedicinesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState<DeviceCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Get Location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const locationOutcome = await locationService.requestCurrentLocation();
        if (locationOutcome.status === 'granted' && locationOutcome.coords) {
          setCoords(locationOutcome.coords);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Location Permission Denied',
            text2:
              locationOutcome.message ||
              'We need your location to find nearby medicines.',
          });
        }
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: 'Could not fetch your location.',
        });
      } finally {
        setLocationLoading(false);
      }
    };
    fetchLocation();
  }, []);

  const { data: medicines, isLoading, isError } = useQuery({
    queryKey: ['nearbyMedicines', debouncedQuery, coords?.latitude, coords?.longitude],
    queryFn: () => {
      if (!coords) return [];
      return pharmacyMedicineService.getNearbyMedicines({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: 5, // Default 5km radius
        search: debouncedQuery,
      });
    },
    enabled: !!coords && debouncedQuery.length > 2,
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.resultItem}
      onPress={() => {
        const pharmacyId = String(
          item.pharmacyId || item.pharmacy?.id || item.pharmacy?._id || '',
        );

        if (!pharmacyId) return;

        navigation.navigate('PharmacyDetails', {
          pharmacyId,
          title: String(item.pharmacy?.name || 'Pharmacy Details'),
        });
      }}
    >
      <View style={styles.iconContainer}>
        <Pill color={colors.primaryBlue} size={scale(20)} />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultTitle}>{item.brandName || item.genericName}</Text>
        <Text style={styles.resultSubTitle}>{item.pharmacy?.name || 'Local Pharmacy'}</Text>
        {item.distance && (
          <View style={styles.distanceRow}>
            <MapPin color="#888" size={scale(12)} />
            <Text style={styles.distanceText}>{item.distance.toFixed(1)} km away</Text>
          </View>
        )}
      </View>
      {item.retailPrice && (
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>₹{item.retailPrice}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textHeader} size={scale(24)} />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <Search color="#888" size={scale(18)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nearby medicines..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.content}>
        {locationLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Locating you...</Text>
          </View>
        ) : !coords ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Location access required.</Text>
          </View>
        ) : debouncedQuery.length <= 2 ? (
          <View style={styles.centerContainer}>
            <Search color="#ddd" size={scale(48)} style={{ marginBottom: verticalScale(16) }} />
            <Text style={styles.emptyStateTitle}>Find Medicines Near You</Text>
            <Text style={styles.emptyStateSub}>Type at least 3 characters to search.</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
          </View>
        ) : isError ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error fetching medicines.</Text>
          </View>
        ) : medicines && medicines.length > 0 ? (
          <FlatList
             data={medicines}
            keyExtractor={(item, index) => item.id || item._id || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyStateTitle}>No medicines found</Text>
            <Text style={styles.emptyStateSub}>Try a different search term or increase radius.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: scale(12),
    padding: scale(4),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FB',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(44),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.medium,
    color: '#666',
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: '#333',
    marginBottom: verticalScale(8),
  },
  emptyStateSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#777',
  },
  listContent: {
    padding: scale(16),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#F3F6FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#333',
  },
  resultSubTitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#666',
    marginTop: verticalScale(2),
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  distanceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: '#888',
    marginLeft: scale(4),
  },
  priceContainer: {
    marginLeft: scale(12),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: scale(8),
  },
  priceText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryGreen,
  },
});
