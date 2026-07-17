import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, HeartPulse, Activity, Stethoscope, Baby, Microscope, Plus, ChevronRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { diagnosticsCatalogService } from '../../api/diagnosticsCatalogService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, moderateScale } from '../../theme/responsive';
import { DiagnosticsEmptyState } from './components/DiagnosticsShared';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnostics'>;

const CATEGORIES = [
  { id: 'fullbody', name: 'Full Body', icon: Activity, color: '#FEE2E2', iconColor: '#EF4444' },
  { id: 'diabetes', name: 'Diabetes', icon: HeartPulse, color: '#E0E7FF', iconColor: '#6366F1' },
  { id: 'women', name: 'Women Care', icon: Baby, color: '#FCE7F3', iconColor: '#EC4899' },
  { id: 'fever', name: 'Fever', icon: Stethoscope, color: '#FEF3C7', iconColor: '#F59E0B' },
  { id: 'covid', name: 'Covid-19', icon: Microscope, color: '#D1FAE5', iconColor: '#10B981' },
];

export const DiagnosticsHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const packagesQuery = useQuery({
    queryKey: ['diagnosticsPackages', 'labstack'],
    queryFn: () => diagnosticsCatalogService.getPackages({ integration: 'labstack' }),
  });

  const packages = packagesQuery.data || [];
  
  const filteredPackages = packages.filter(pkg => {
    if (searchQuery) {
      return (pkg.name || pkg.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    }
    // We can also filter by category if the API supported it or if we mock it
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Book Lab Tests</Text>
            <Text style={styles.subtitle}>Safe and secure home collection</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DiagnosticsHistory')} style={styles.historyBtn}>
            <Text style={styles.historyText}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={scale(18)} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for tests, profiles & packages"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories Carousel */}
        {!searchQuery && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Shop by Health Concern</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryItem, isSelected && { borderColor: cat.iconColor, borderWidth: 1 }]}
                    onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                  >
                    <View style={[styles.categoryIconWrap, { backgroundColor: cat.color }]}>
                      <Icon size={scale(24)} color={cat.iconColor} />
                    </View>
                    <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Promotional Banner Mock */}
        {!searchQuery && (
          <View style={styles.promoBanner}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Comprehensive Full Body Checkup</Text>
              <Text style={styles.promoSubtitle}>Includes 84 parameters</Text>
              <View style={styles.promoTag}><Text style={styles.promoTagText}>Save 40%</Text></View>
            </View>
          </View>
        )}

        {/* Packages List */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Popular Packages'}
          </Text>

          {packagesQuery.isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.primaryBlue} />
            </View>
          ) : filteredPackages.length === 0 ? (
            <DiagnosticsEmptyState
              title="No packages found"
              subtitle="Try adjusting your search criteria"
            />
          ) : (
            filteredPackages.map(pkg => (
              <TouchableOpacity
                key={pkg.id || pkg.packageId || pkg.code}
                style={styles.packageCard}
                onPress={() => navigation.navigate('DiagnosticsPackage', { packageId: String(pkg.id || pkg.packageId || pkg.code) })}
              >
                <View style={styles.packageTop}>
                  <Text style={styles.packageName}>{pkg.displayName || pkg.name}</Text>
                  <View style={styles.testCountBadge}>
                    <Text style={styles.testCountText}>{pkg.testCount || pkg.testsCount || 1} Tests</Text>
                  </View>
                </View>
                
                <Text style={styles.packageDesc} numberOfLines={2}>
                  {pkg.description || 'Comprehensive diagnostic package for thorough health screening.'}
                </Text>

                <View style={styles.packageBottom}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.discountedPrice}>₹{pkg.discountedPrice || pkg.price || pkg.amount}</Text>
                    {(pkg.price || pkg.amount) && (pkg.price || pkg.amount) !== (pkg.discountedPrice || pkg.price || pkg.amount) && (
                      <Text style={styles.originalPrice}>₹{pkg.price || pkg.amount}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('DiagnosticsCreateBooking', { selectedPackageIds: [String(pkg.id || pkg.packageId || pkg.code)] })}
                  >
                    <Plus size={scale(16)} color="#fff" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    padding: scale(16),
    paddingTop: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  greeting: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(22),
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#10B981',
    marginTop: verticalScale(4),
  },
  historyBtn: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    backgroundColor: 'rgba(21, 114, 183, 0.1)',
    borderRadius: scale(20),
  },
  historyText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(12),
    color: colors.primaryBlue,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    height: verticalScale(48),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  categoriesSection: {
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(18),
    color: '#0F172A',
    marginLeft: scale(16),
    marginBottom: verticalScale(16),
  },
  categoriesList: {
    paddingHorizontal: scale(16),
    gap: scale(16),
  },
  categoryItem: {
    alignItems: 'center',
    width: scale(72),
  },
  categoryIconWrap: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  categoryName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(12),
    color: '#334155',
    textAlign: 'center',
  },
  promoBanner: {
    margin: scale(16),
    backgroundColor: '#EEF2FF',
    borderRadius: scale(16),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#E0E7FF',
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(18),
    color: '#312E81',
    marginBottom: verticalScale(4),
  },
  promoSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(13),
    color: '#4F46E5',
    marginBottom: verticalScale(12),
  },
  promoTag: {
    backgroundColor: '#4338CA',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(4),
    alignSelf: 'flex-start',
  },
  promoTagText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(11),
    color: '#fff',
    textTransform: 'uppercase',
  },
  packagesSection: {
    padding: scale(16),
  },
  loader: {
    marginTop: verticalScale(40),
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  packageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  packageName: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginRight: scale(12),
  },
  testCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(6),
  },
  testCountText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(11),
    color: '#475569',
  },
  packageDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: moderateScale(13),
    color: '#64748B',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(16),
  },
  packageBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: verticalScale(16),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  discountedPrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: moderateScale(18),
    color: '#0F172A',
    marginRight: scale(8),
  },
  originalPrice: {
    fontFamily: typography.fontFamily.medium,
    fontSize: moderateScale(14),
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
  },
  addButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: moderateScale(14),
    color: '#fff',
    marginLeft: scale(4),
  },
});
