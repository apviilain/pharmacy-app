import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Boxes,
  ClipboardList,
  Pill,
  ChevronRight,
  Users,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

import HomeHeader from '../components/HomeHeader';
import { SectionHeader } from '../components/SectionHeader';
import { RecentActivity } from '../components/RecentActivity';
import { UpcomingConsultation } from '../components/UpcomingConsultation';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { scale, verticalScale, wp } from '../theme/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeSkeleton } from '../components/HomeSkeleton';
import type { RootStackParamList } from '../navigation/types';
import { locationService } from '../services/locationService';
import { useAuthStore } from '../state/authStore';
import { useLocationSelectionStore } from '../state/locationSelectionStore';

type PharmacySection = Exclude<
  NonNullable<RootStackParamList['Pharmacy']>['section'],
  undefined
>;

interface Service {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  section: PharmacySection;
  gradient: [string, string];
  shadowColor: string;
  tint: string;
}

const Services: Service[] = [
  {
    id: 'medicines',
    title: 'Medicines',
    desc: 'Catalog & availability',
    icon: Pill,
    section: 'medicines',
    gradient: ['#1687D4', '#0E6FAE'],
    shadowColor: '#0E6FAE',
    tint: '#fff',
  },
  {
    id: 'inventory',
    title: 'Inventory',
    desc: 'Stock & batches',
    icon: Boxes,
    section: 'inventory',
    gradient: ['#20A86B', '#148452'],
    shadowColor: '#148452',
    tint: '#fff',
  },
  {
    id: 'orders',
    title: 'Orders',
    desc: 'Track fulfilment',
    icon: ClipboardList,
    section: 'orders',
    gradient: ['#F5A623', '#D9820B'],
    shadowColor: '#D9820B',
    tint: '#fff',
  },
  {
    id: 'customers',
    title: 'Customers',
    desc: 'Profiles & refills',
    icon: Users,
    section: 'customers',
    gradient: ['#ED6A67', '#D94B59'],
    shadowColor: '#D94B59',
    tint: '#fff',
  },
];

const ServiceCard = React.memo(
  ({
    service,
    onPress,
  }: {
    service: Service;
    onPress: (section: PharmacySection) => void;
  }) => {
    const Icon = service.icon;
    return (
      <View
        style={[
          styles.serviceCardWrapper,
          { shadowColor: service.shadowColor },
        ]}
      >
        <TouchableOpacity
          style={styles.serviceCardInner}
          activeOpacity={0.8}
          onPress={() => onPress(service.section)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${service.title}`}
        >
          <Svg
            height="100%"
            width="100%"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              <SvgLinearGradient
                id={`grad-${service.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop
                  offset="0%"
                  stopColor={service.gradient[0]}
                  stopOpacity="1"
                />
                <Stop
                  offset="100%"
                  stopColor={service.gradient[1]}
                  stopOpacity="1"
                />
              </SvgLinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill={`url(#grad-${service.id})`}
            />
          </Svg>
          <View style={styles.decorativeCircle} />
          <View style={styles.serviceIconContainer}>
            <Icon size={scale(24)} color={service.tint} />
          </View>
          <View style={styles.serviceArrow}>
            <ChevronRight size={scale(18)} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={styles.serviceTexts}>
            <Text style={styles.serviceCardTitle}>{service.title}</Text>
            <Text style={styles.serviceCardDesc}>{service.desc}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = React.useState(true);
  const [requestingLocation, setRequestingLocation] = React.useState(false);
  const profileCity = useAuthStore((state) => state.user?.city) || 'Saved';
  const profileState = useAuthStore((state) => state.user?.state) || 'Location';
  const setDeviceLocation = useLocationSelectionStore(
    (state) => state.setDeviceLocation,
  );
  const setProfileLocation = useLocationSelectionStore(
    (state) => state.setProfileLocation,
  );
  const setLocationStatus = useLocationSelectionStore(
    (state) => state.setLocationStatus,
  );
  const scrollY = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    setProfileLocation(profileState, profileCity);
  }, [profileCity, profileState, setProfileLocation]);

  const requestMandatoryLocation = React.useCallback(async () => {
    if (requestingLocation) return;

    setRequestingLocation(true);

    try {
      const result = await locationService.requestCurrentLocation();

      if (result.status === 'granted' && result.coords) {
        setDeviceLocation(result.coords);
        setLocationStatus('granted', '');
        return;
      }

      setLocationStatus(result.status, result.message || '');

      if (result.status === 'unavailable') {
        return;
      }

      Alert.alert(
        'Location Permission Required',
        result.message ||
          'Location access is required to continue from the home screen.',
        [
          {
            text: 'Retry',
            onPress: () => {
              requestMandatoryLocation().catch(() => {});
            },
          },
          {
            text: 'Open Settings',
            onPress: () => {
              locationService.openSettings().catch(() => {
                Alert.alert(
                  'Unable to open settings',
                  'Please open app settings manually and allow location access.',
                );
              });
            },
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to request location permission.';
      setLocationStatus('unavailable', message);

      Alert.alert(
        'Location Permission Required',
        message,
        [
          {
            text: 'Retry',
            onPress: () => {
              requestMandatoryLocation().catch(() => {});
            },
          },
        ],
        { cancelable: false },
      );
    } finally {
      setRequestingLocation(false);
    }
  }, [requestingLocation, setDeviceLocation, setLocationStatus]);

  useFocusEffect(
    React.useCallback(() => {
      requestMandatoryLocation().catch(() => {});
      return undefined;
    }, [requestMandatoryLocation]),
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const insets = useSafeAreaInsets();
  const HEADER_MAX_HEIGHT = 260 + insets.top;

  const handleServicePress = React.useCallback(
    (section: PharmacySection) => {
      navigation.navigate('Pharmacy', {
        section,
        lockedSection: true,
      });
    },
    [navigation],
  );

  const handleViewAllServices = React.useCallback(() => {
    navigation.navigate('PharmacyHub');
  }, [navigation]);

  const handleViewAllActivity = React.useCallback(() => {
    navigation.navigate('HealthVault');
  }, [navigation]);

  const handleRecentActivityPress = React.useCallback(
    (activity: any) => {
      if (activity.type === 'PHARMACY ORDER') {
        navigation.navigate('PharmacyOrders');
        return;
      }

      navigation.navigate('HealthVault');
    },
    [navigation],
  );

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.mainContent}>
          <SectionHeader
            title="Our Services"
            onViewAll={handleViewAllServices}
          />

          <View style={styles.servicesGrid}>
            {Services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={handleServicePress}
              />
            ))}
          </View>

          <RecentActivity
            onViewAll={handleViewAllActivity}
            onActivityPress={handleRecentActivityPress}
          />
          <UpcomingConsultation />
        </View>
      </Animated.ScrollView>
      <HomeHeader scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  headerBackground: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: wp('5%'),
    paddingBottom: verticalScale(24),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconBox: {
    width: scale(34),
    height: scale(34),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  locationTextColumn: {
    flex: 1,
  },
  deliverToText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  locationText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: '#fff',
    marginTop: verticalScale(2),
  },
  bellIconBox: {
    width: scale(42),
    height: scale(42),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    width: scale(8),
    height: scale(8),
    backgroundColor: '#FFAA00',
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },
  greetingContainer: {
    marginTop: verticalScale(28),
    marginBottom: verticalScale(24),
  },
  greetingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(26),
    color: '#fff',
    marginVertical: verticalScale(4),
    letterSpacing: -0.5,
  },
  questionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDEDED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  scrollView: {
    overflow: 'visible',
    zIndex: 1,
  },
  mainContent: {
    marginTop: -verticalScale(40),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingTop: verticalScale(70),
    paddingHorizontal: scale(20),
    paddingBottom: 0,
    zIndex: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(18),
  },
  serviceCardWrapper: {
    width: '48%',
    height: verticalScale(125),
    marginBottom: verticalScale(14),
    borderRadius: scale(20),
    ...shadows.medium,
  },
  serviceCardInner: {
    flex: 1,
    borderRadius: scale(20),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  serviceIconContainer: {
    position: 'absolute',
    top: verticalScale(18),
    left: scale(16),
    width: scale(46),
    height: scale(46),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceArrow: {
    position: 'absolute',
    top: verticalScale(16),
    right: scale(14),
  },
  serviceTexts: {
    position: 'absolute',
    top: verticalScale(74),
    left: scale(16),
    right: scale(8),
  },
  serviceCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: '#fff',
  },
  serviceCardDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: verticalScale(2),
  },
  decorativeCircle: {
    position: 'absolute',
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    top: verticalScale(-20),
    left: scale(101),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primaryBlue,
    letterSpacing: 1,
  },
});
