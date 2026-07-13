import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Search,
  User,
  Wallet,
  FileText,
  Settings,
  Award,
  BriefcaseMedical,
  Pill,
  Boxes,
  RefreshCw,
  UserRound,
  Clock3,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';

interface AppFeature {
  id: string;
  title: string;
  screen: keyof RootStackParamList;
  icon: any;
  keywords: string[];
  params?: any;
}

const APP_FEATURES: AppFeature[] = [
  { id: '1', title: 'Pharmacy Medicines', screen: 'Pharmacy', icon: Pill, keywords: ['medicine', 'tablet', 'drug', 'catalog', 'pharmacy'], params: { section: 'medicines', lockedSection: true } },
  { id: '2', title: 'Pharmacy Inventory', screen: 'Pharmacy', icon: Boxes, keywords: ['inventory', 'stock', 'batch', 'rack', 'low stock'], params: { section: 'inventory', lockedSection: true } },
  { id: '3', title: 'Pharmacy Orders', screen: 'Pharmacy', icon: RefreshCw, keywords: ['orders', 'delivery', 'pending order', 'paid order'], params: { section: 'orders', lockedSection: true } },
  { id: '4', title: 'Pharmacy Customers', screen: 'Pharmacy', icon: UserRound, keywords: ['customer', 'patient', 'member', 'buyer'], params: { section: 'customers', lockedSection: true } },
  { id: '5', title: 'Pharmacy Subscriptions', screen: 'Pharmacy', icon: Clock3, keywords: ['subscription', 'refill', 'repeat medicine', 'reminder'], params: { section: 'subscriptions', lockedSection: true } },
  { id: '6', title: 'Health Vault (Records)', screen: 'HealthVault', icon: FileText, keywords: ['health', 'vault', 'files', 'records', 'medical', 'reports', 'prescriptions'] },
  { id: '7', title: 'Wallet & Payments', screen: 'Wallet', icon: Wallet, keywords: ['wallet', 'money', 'payment', 'balance', 'add money', 'recharge'] },
  { id: '8', title: 'Pathkind Lab Tests', screen: 'PathkindBooking', icon: BriefcaseMedical, keywords: ['lab', 'test', 'pathology', 'pathkind', 'blood test', 'diagnostic'] },
  { id: '10', title: 'Refer & Earn', screen: 'ReferEarn', icon: Award, keywords: ['refer', 'earn', 'invite', 'friends', 'bonus', 'coupon'] },
  { id: '11', title: 'Settings', screen: 'Settings', icon: Settings, keywords: ['settings', 'preferences', 'account', 'password', 'logout'] },
  { id: '12', title: 'My Profile', screen: 'Profile', icon: User, keywords: ['profile', 'me', 'details', 'edit profile', 'account'] },
];

export const GlobalSearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

  }, []);

  type SearchResultItem = { type: 'feature'; item: AppFeature };

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const loweredQuery = query.toLowerCase().trim();
    const results: SearchResultItem[] = [];
    
    APP_FEATURES.forEach(feature => {
      if (feature.title.toLowerCase().includes(loweredQuery) || 
          feature.keywords.some(kw => kw.toLowerCase().includes(loweredQuery))) {
        results.push({ type: 'feature', item: feature });
      }
    });

    return results;
  }, [query]);

  const handleItemPress = (
    screenName: keyof RootStackParamList,
    params?: RootStackParamList[keyof RootStackParamList],
  ) => {
    if (screenName === 'Wallet') {
      (navigation as any).navigate('Wallet', {
        mode: 'pharmacy',
        title: 'Pharmacy Wallet',
      });
      return;
    }

    if (params) {
      (navigation as any).navigate(screenName, params);
      return;
    }

    (navigation as any).navigate(screenName);
  };

  const renderItem = ({ item }: { item: SearchResultItem }) => {
    if (item.type === 'feature') {
      const feature = item.item;
      const Icon = feature.icon;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          activeOpacity={0.7}
          onPress={() => handleItemPress(feature.screen as any, feature.params)}
        >
          <View style={styles.iconContainer}>
            <Icon color={colors.primaryBlue} size={scale(20)} />
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>{feature.title}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Header / Search Bar */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textHeader} size={scale(24)} />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <Search color="#888" size={scale(18)} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search medicines, inventory, orders..."
              placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {query.trim() === '' ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>Quick Suggestions</Text>
            <View style={styles.suggestionsWrapper}>
              {APP_FEATURES.slice(0, 5).map(feat => (
                <TouchableOpacity
                  key={feat.id}
                  style={styles.suggestionPill}
                  onPress={() => handleItemPress(feat.screen as any, feat.params)}
                >
                  <Text style={styles.suggestionText}>{feat.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => 
              item.type === 'feature' 
                ? `f_${item.item.id}` 
                : `result_${index}`
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Search color="#ddd" size={scale(48)} style={{ marginBottom: verticalScale(16) }} />
            <Text style={styles.noResultsText}>No features found for "{query}"</Text>
            <Text style={styles.noResultsSub}>Try searching for 'medicine', 'inventory', or 'orders'.</Text>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
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
    paddingVertical: 0, // important for Android
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  listContent: {
    padding: scale(16),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: scale(16),
    marginBottom: verticalScale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(21, 114, 183, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  emptyStateContainer: {
    padding: scale(20),
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: verticalScale(16),
  },
  suggestionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  suggestionPill: {
    backgroundColor: '#fff',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  noResultsText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textHeader,
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  noResultsSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
