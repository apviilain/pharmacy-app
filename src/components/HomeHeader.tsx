import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Bell,
  Search,
  ShoppingCart,
  SignalHigh,
  Wifi,
  BatteryFull,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { pharmacyService } from '../api/pharmacyService';
import { mapPharmacyProfileToUser } from '../api/pharmyx';
import { useAuthStore } from '../state/authStore';
import { shadows } from '../theme/shadows';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';
import { pharmacyCartService } from '../api/pharmacyCartService';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
  withTiming,
  withSequence,
  withDelay,
  useSharedValue,
} from 'react-native-reanimated';
import { typography } from '../theme/typography';

interface HomeHeaderProps {
  scrollY: SharedValue<number>;
}

export default function HomeHeader({ scrollY }: HomeHeaderProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userName = useAuthStore(state => state.user?.name) || 'User';
  const locationCity = useAuthStore(state => state.user?.city) || 'Location';
  const locationState = useAuthStore(state => state.user?.state) || 'Your';
  const hasUser = useAuthStore(state => !!state.user);
  const setUser = useAuthStore(state => state.setUser);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const pOpacity = useSharedValue(1);
  const pTranslateY = useSharedValue(0);

  const PLACEHOLDERS = [
    'Search doctors...',
    'Search specializations...',
    'Search features...',
    'Search appointments...',
  ];

  // Dynamic Greeting
  const [greeting, setGreeting] = useState('');
  const [greetingSub, setGreetingSub] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setGreetingSub('Start your day with a healthy routine!');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
      setGreetingSub('How are you feeling today?');
    } else {
      setGreeting('Good evening');
      setGreetingSub('Take care and rest well tonight.');
    }
  }, []);

  useEffect(() => {
    if (hasUser) return;
    const fetchUser = async () => {
      try {
        const response = await pharmacyService.getMyProfile();
        const data = mapPharmacyProfileToUser(response);
        const existingUser = useAuthStore.getState().user;
        if (data) {
          setUser({
            ...existingUser,
            ...data,
            phone: data.phone || existingUser?.phone || '',
            mobile: data.mobile || existingUser?.mobile || existingUser?.phone || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user details', error);
      }
    };
    fetchUser();
  }, [hasUser, setUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Animate out
      pOpacity.value = withTiming(0, { duration: 400 });
      pTranslateY.value = withTiming(-10, { duration: 400 });

      // Change text and animate in
      setTimeout(() => {
        setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length);
        pTranslateY.value = 10;
        pOpacity.value = withTiming(1, { duration: 400 });
        pTranslateY.value = withTiming(0, { duration: 400 });
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const animatedPlaceholderStyle = useAnimatedStyle(() => {
    return {
      opacity: pOpacity.value,
      transform: [{ translateY: pTranslateY.value }],
    };
  });

  const userId = useAuthStore(state => state.user?.id || state.user?._id);
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadNotificationsCount', userId],
    queryFn: () => notificationApi.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30s
  });
  const { data: pharmacyCart } = useQuery({
    queryKey: ['pharmacyCart'],
    queryFn: () => pharmacyCartService.getCart(),
  });
  const cartCount = Number(
    pharmacyCart?.totalItems ??
      pharmacyCart?.totalQuantity ??
      pharmacyCart?.items?.length ??
      0,
  );

  const insets = useSafeAreaInsets();
  const HEADER_MAX_HEIGHT = 280 + insets.top;
  const HEADER_MIN_HEIGHT = 170 + insets.top;
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP,
    );
    const shadowOpacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, 0.15],
      Extrapolation.CLAMP,
    );
    return { height, shadowOpacity };
  });

  // 1. Status Bar fades out rapidly and moves up
  const animatedStatusStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -30],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  // 2. Location row fades out and moves up
  const animatedLocationStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.4],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -30],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  // 3. Greeting Row translations (moves up)
  const animatedGreetingTranslateStyle = useAnimatedStyle(() => {
    // Both Large and Small greetings slide up together
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -65], // Match top of location/notification row (top: 60)
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }] };
  });

  // Phase OUT large greeting
  const animatedLargeGreetingStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Phase IN small row greeting (Flex Direction logic requested by user)
  const animatedSmallGreetingStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_DISTANCE * 0.5, SCROLL_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // 4. Search Bar Row slides up into view compactly
  const animatedSearchStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_DISTANCE],
      [0, -105], // Moved down slightly from -115 to leave more room
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }] };
  });

  return (
    <Animated.View style={[styles.headerContainer, animatedHeaderStyle]}>
      {/* Hide native status bar if translucent applies badly, or just mock it as requested */}
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={['#2A77B7', '#1F5F95']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 2. AREA WRAPPER LOCATION (No longer wraps notification so clicks work independently) */}
      <Animated.View
        style={[
          styles.absoluteRow,
          styles.locationRow,
          { top: 20 + insets.top },
          animatedLocationStyle,
        ]}
        pointerEvents="none"
      >
        <View style={styles.locationLeftRow}>
          <View style={styles.iconSquareBox}>
            <MapPin color="#FFF" size={18} fill="#FFF" />
          </View>
          <View style={styles.locationTextColumn}>
            <Text style={styles.deliverToText}>
              {locationState.toUpperCase()}
            </Text>
            <Text style={styles.locationValueText}>{locationCity}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Anchor Notification unconditionally independent so it retains clickability natively */}
      <View style={[styles.absoluteRow, styles.locationRow, { right: 20, top: 20 + insets.top }]}>
        <View style={styles.headerActionCluster}>
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PharmacyCart')}
          >
            <ShoppingCart color="#FFF" size={20} />
            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.notificationBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#FFF" size={20} fill="#FFF" />
            {unreadCount && unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. GREETING ROW (Crossfade large and small row-layout elements) */}
      <Animated.View
        style={[
          styles.absoluteRow,
          styles.greetingRow,
          { top: 85 + insets.top },
          animatedGreetingTranslateStyle,
        ]}
        pointerEvents="none"
      >
        {/* Large Layout Form */}
        <Animated.View
          style={[StyleSheet.absoluteFill, animatedLargeGreetingStyle]}
        >
          <Text style={styles.greetingLightText}>{greeting},</Text>
          <Text style={styles.greetingBoldText}>{userName || ''}</Text>
          <Text style={styles.greetingSubText}>{greetingSub}</Text>
        </Animated.View>

        {/* Scrolled Column Layout */}
        <Animated.View style={[animatedSmallGreetingStyle]}>
          <Text style={[styles.greetingLightText, { marginBottom: 0 }]}>
            {greeting},{' '}
          </Text>
          <Text
            style={[styles.greetingBoldText, { fontSize: 22, marginBottom: 0 }]}
          >
            {userName || ''}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.absoluteRow,
          styles.searchBarRow,
          { top: 195 + insets.top },
          animatedSearchStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.searchBarContainer}
          onPress={() => navigation.navigate('GlobalSearch')}
        >
          <Search
            color="#888"
            size={20}
            style={{ marginRight: 8 }}
            strokeWidth={2.5}
          />
          <View
            style={{ flex: 1, height: '100%', justifyContent: 'center' }}
            pointerEvents="none"
          >
            <Animated.Text
              style={[
                styles.searchInput,
                { color: '#888', position: 'absolute' },
                animatedPlaceholderStyle,
              ]}
            >
              {PLACEHOLDERS[placeholderIdx]}
            </Animated.Text>
            <TextInput
              placeholder=""
              style={styles.searchInput}
              editable={false}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    ...shadows.strong,
  },
  absoluteRow: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  statusBarRow: {
    top: 20, // Adjust absolute position since we requested padding top ~50 total
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  statusIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    top: 20, // Relative to safe area
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionCluster: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  iconSquareBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextColumn: {
    marginLeft: 12,
  },
  deliverToText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  notificationButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#2169A5',
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#2169A5',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
  },
  greetingRow: {
    top: 85, // Relative to safe area
    height: 90,
    justifyContent: 'flex-start',
  },
  greetingLightText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    fontFamily: typography.fontFamily.regular,
  },
  greetingBoldText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8, // Reduced from 16 to decrease top space for sub greeting
    fontFamily: typography.fontFamily.bold,
  },
  greetingSubText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: typography.fontFamily.regular,
    marginBottom: 12, // Added bottom space
  },
  searchBarRow: {
    top: 195, // Relative to safe area
  },
  searchBarContainer: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
});
