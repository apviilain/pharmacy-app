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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Bell,
  Search,
  Activity,
  HeartPulse,
  Stethoscope,
  Beaker,
  Truck,
  Pill,
  CheckCircle2,
  ChevronRight,
  Video,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

import HomeHeader from '../components/HomeHeader';
import AllSpecialists from '../components/AllSpecialists';
import { SectionHeader } from '../components/SectionHeader';
import { RecentActivity } from '../components/RecentActivity';
import { UpcomingConsultation } from '../components/UpcomingConsultation';
import { DailyHealthTip } from '../components/DailyHealthTip';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { scale, verticalScale, wp } from '../theme/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeSkeleton } from '../components/HomeSkeleton';

// Using loosely mapped icons for the services
const Services = [
  {
    id: '1',
    title: 'Ambulance',
    desc: '24/7 emergency care',
    icon: Truck,
    gradient: ['#FF5757', '#E53E3E'],
    shadowColor: '#E53E3E',
    tint: '#fff',
  },
  {
    id: '2',
    title: 'Diagnostics',
    desc: 'Home sample pickup',
    icon: Beaker,
    gradient: ['#1E88E5', '#1572B7'],
    shadowColor: '#1572B7',
    tint: '#fff',
  },
  {
    id: '3',
    title: 'Telehealth',
    desc: 'Consult top doctors',
    icon: Stethoscope,
    gradient: ['#46C451', '#40B346'],
    shadowColor: '#40B346',
    tint: '#fff',
  },
  {
    id: '4',
    title: 'Pharmacy',
    desc: 'Delivered in 2 hrs',
    icon: Pill,
    gradient: ['#FFB627', '#F59E0B'],
    shadowColor: '#F59E0B',
    tint: '#fff',
  },
];

const ServiceCard = React.memo(
  ({
    service,
    onPress,
  }: {
    service: (typeof Services)[0];
    onPress: (title: string) => void;
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
          onPress={() => onPress(service.title)}
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
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = React.useState(true);
  const scrollY = useSharedValue(0);

  React.useEffect(() => {
    // Simulate initial data loading for the whole page
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const insets = useSafeAreaInsets();
  const HEADER_MAX_HEIGHT = 260 + insets.top;

  const handleServicePress = React.useCallback(
    (serviceTitle: string) => {
      if (serviceTitle === 'Diagnostics') {
        navigation.navigate('PathkindBooking');
      } else if (serviceTitle === 'Telehealth') {
        navigation.navigate('FindDoctor');
      } else if (serviceTitle === 'Ambulance') {
        navigation.navigate('Ambulance');
      } else if (serviceTitle === 'Pharmacy') {
        navigation.navigate('Pharmacy');
      }
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
        {/* Main Content Area — white card with rounded top */}
        <View style={styles.mainContent}>
          {/* Our Services */}
          <SectionHeader title="Our Services" onViewAll={() => {}} />

          <View style={styles.servicesGrid}>
            {Services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={handleServicePress}
              />
            ))}
          </View>

          {/* All Specialists */}
          <AllSpecialists />

          {/* Recent Activity */}
          <RecentActivity />

          {/* Upcoming Consultation */}
          <UpcomingConsultation />

          {/* Daily Health Tip */}
          <DailyHealthTip />
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
    marginTop: -verticalScale(40), // Pulls the white card up slightly for the overlap effect
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingTop: verticalScale(70), // Ensures the section header "Our Services" is visible below the search bar
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
    height: verticalScale(125), // Adjusted for better aspect ratio on mobile
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
