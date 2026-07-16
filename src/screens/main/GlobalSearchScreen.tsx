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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
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
  Trash2,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { ModuleScreen } from '../../components/ui/ModuleScreen';
import { PremiumCard } from '../../components/ui/PremiumCard';
import { PremiumSearchField } from '../../components/ui/PremiumSearchField';
import { SectionState } from '../../components/ui/SectionState';
import {
  premiumTheme,
  premiumTypography,
  radii,
  spacing,
} from '../../theme/tokens';

interface AppFeature {
  id: string;
  title: string;
  screen: keyof RootStackParamList;
  icon: any;
  keywords: string[];
  params?: any;
}

type SearchHistoryEntry = {
  featureId: string;
  visitedAt: number;
};

const SEARCH_HISTORY_KEY = '@pharmyx_global_search_history';

const APP_FEATURES: AppFeature[] = [
  { id: '1', title: 'Pharmacy Medicines', screen: 'Pharmacy', icon: Pill, keywords: ['medicine', 'tablet', 'drug', 'catalog', 'pharmacy'], params: { section: 'medicines', lockedSection: true } },
  { id: '1_1', title: 'Find Nearby Medicines', screen: 'NearbyMedicines', icon: Pill, keywords: ['nearby', 'local', 'medicine', 'find', 'search', 'pharmacy near me'] },
  { id: '1_2', title: 'Browse Pharmacies', screen: 'PharmaciesDirectory', icon: BriefcaseMedical, keywords: ['pharmacy list', 'browse pharmacy', 'verified pharmacies', 'medical store'] },
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
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recentHistory, setRecentHistory] = useState<SearchHistoryEntry[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const loadRecentHistory = async () => {
      try {
        const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentHistory(
            parsed.filter(
              (entry): entry is SearchHistoryEntry =>
                !!entry &&
                typeof entry.featureId === 'string' &&
                typeof entry.visitedAt === 'number',
            ),
          );
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    };

    loadRecentHistory();

    return () => clearTimeout(focusTimer);
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

  const recentFeatures = useMemo(
    () =>
      recentHistory
        .map(entry =>
          APP_FEATURES.find(feature => feature.id === entry.featureId),
        )
        .filter((feature): feature is AppFeature => !!feature),
    [recentHistory],
  );

  const persistRecentHistory = async (nextHistory: SearchHistoryEntry[]) => {
    try {
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(nextHistory),
      );
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  };

  const pushRecentHistory = async (featureId: string) => {
    const nextHistory = [
      { featureId, visitedAt: Date.now() },
      ...recentHistory.filter(entry => entry.featureId !== featureId),
    ].slice(0, 6);

    setRecentHistory(nextHistory);
    await persistRecentHistory(nextHistory);
  };

  const clearRecentHistory = async () => {
    setRecentHistory([]);
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  };

  const handleItemPress = async (
    screenName: keyof RootStackParamList,
    params?: RootStackParamList[keyof RootStackParamList],
    featureId?: string,
  ) => {
    if (featureId) {
      await pushRecentHistory(featureId);
    }

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
          onPress={() =>
            handleItemPress(feature.screen as any, feature.params, feature.id)
          }
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === 'android'
                ? Math.max(insets.top, verticalScale(6))
                : verticalScale(6),
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textHeader} size={scale(24)} />
        </TouchableOpacity>
        <PremiumSearchField
          ref={inputRef}
          containerStyle={styles.searchBar}
          placeholder="Search medicines, inventory, orders..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <ModuleScreen
        title="Search workspace"
        subtitle="Jump into medicines, inventory, pharmacies, payments, and patient tools."
        scroll={false}
        contentContainerStyle={styles.moduleContent}
      >
        {query.trim() === '' ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.sectionTitle}>Quick Suggestions</Text>
            <View style={styles.suggestionsWrapper}>
              {APP_FEATURES.slice(0, 5).map(feat => (
                <TouchableOpacity
                  key={feat.id}
                  style={styles.suggestionPill}
                  onPress={() =>
                    handleItemPress(feat.screen as any, feat.params, feat.id)
                  }
                >
                  <Text style={styles.suggestionText}>{feat.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {recentFeatures.length > 0 ? (
              <View style={styles.recentSection}>
                <View style={styles.recentHeaderRow}>
                  <Text style={styles.sectionTitle}>Recent History</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={clearRecentHistory}
                    style={styles.clearHistoryButton}
                  >
                    <Trash2 size={scale(14)} color={colors.textSecondary} />
                    <Text style={styles.clearHistoryText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentList}>
                  {recentFeatures.map(feature => {
                    const Icon = feature.icon;
                    return (
                      <PremiumCard
                        key={`recent_${feature.id}`}
                        style={styles.recentItemCard}
                      >
                        <TouchableOpacity
                          style={styles.recentItem}
                          onPress={() =>
                            handleItemPress(
                              feature.screen as any,
                              feature.params,
                              feature.id,
                            )
                          }
                          activeOpacity={0.75}
                        >
                          <View style={styles.recentIconContainer}>
                            <Icon color={colors.primaryBlue} size={scale(16)} />
                          </View>
                          <Text style={styles.recentItemText}>{feature.title}</Text>
                        </TouchableOpacity>
                      </PremiumCard>
                    );
                  })}
                </View>
              </View>
            ) : null}
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
            <SectionState
              title={`No results for "${query}"`}
              subtitle="Try keywords like medicine, inventory, pharmacy, wallet, or orders."
            />
          </View>
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
  },
  moduleContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: premiumTheme.card,
    padding: spacing.md,
    marginBottom: verticalScale(10),
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: premiumTheme.cardBorder,
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: premiumTheme.blueTint,
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
    gap: spacing.lg,
  },
  recentSection: {
    marginTop: spacing.sm,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...premiumTypography.title,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: verticalScale(16),
  },
  clearHistoryText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  recentList: {
    gap: verticalScale(10),
  },
  recentItemCard: {
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  recentIconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: premiumTheme.blueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  recentItemText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
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
    borderColor: premiumTheme.cardBorder,
  },
  suggestionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textHeader,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
