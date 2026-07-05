import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, MessageCircle, ShoppingBag, Clock, ShieldCheck } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';

const { width } = Dimensions.get('window');

const PHARMACY_IMAGES = [
  require('../../assets/pharmacy/interior_balloons.png'),
  require('../../assets/pharmacy/staff_counter.png'),
  require('../../assets/pharmacy/pharmacist_male.png'),
  require('../../assets/pharmacy/pharmacist_female.png'),
];

export function PharmacyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const phoneNumber = '+917439784727';
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % PHARMACY_IMAGES.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${phoneNumber.replace('+', '')}?text=Hello, I would like to order medicines.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.carousel}
          >
            {PHARMACY_IMAGES.map((img, index) => (
              <Image key={index} source={img} style={styles.carouselImage} />
            ))}
          </ScrollView>
          
          {/* Pagination Indicators */}
          <View style={styles.indicatorContainer}>
            {PHARMACY_IMAGES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === activeIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.pharmacyName}>Main Pharmacy</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Open 24/7</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Your trusted partner for all medical needs. We provide genuine medicines, 
            healthcare products, and expert guidance with doorstep delivery.
          </Text>

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(65,179,74,0.1)' }]}>
                <ShieldCheck size={scale(20)} color={colors.primaryGreen} />
              </View>
              <Text style={styles.featureLabel}>Genuine</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(21,114,183,0.1)' }]}>
                <Clock size={scale(20)} color={colors.primaryBlue} />
              </View>
              <Text style={styles.featureLabel}>24/7 Service</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <ShoppingBag size={scale(20)} color="#F59E0B" />
              </View>
              <Text style={styles.featureLabel}>Fast Delivery</Text>
            </View>
          </View>

          {/* Contact Section */}
          <Text style={styles.sectionTitle}>Contact & Order</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity 
              style={styles.contactCard} 
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1572B7', '#0E5A94']}
                style={styles.gradientCard}
              >
                <View style={styles.iconCircle}>
                  <Phone size={scale(20)} color="#1572B7" />
                </View>
                <Text style={styles.cardTitle}>Call Us</Text>
                <Text style={styles.cardSub}>Speak with our pharmacist</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCard} 
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                style={styles.gradientCard}
              >
                <View style={styles.iconCircle}>
                  <MessageCircle size={scale(20)} color="#25D366" />
                </View>
                <Text style={styles.cardTitle}>WhatsApp</Text>
                <Text style={styles.cardSub}>Order via chat</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Order Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How to Order?</Text>
            <Text style={styles.infoText}>
              1. Click on Call or WhatsApp button above.{"\n"}
              2. Share your prescription or medicine list.{"\n"}
              3. Our team will confirm availability and price.{"\n"}
              4. Get medicines delivered to your doorstep.
            </Text>
          </View>
          
          <View style={{ height: verticalScale(100) }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    backgroundColor: '#fff',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    color: colors.textHeader,
  },
  carousel: {
    height: verticalScale(250),
  },
  carouselImage: {
    width: width,
    height: verticalScale(250),
    resizeMode: 'cover',
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: verticalScale(40),
    alignSelf: 'center',
  },
  indicator: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: 'rgba(21, 114, 183, 0.2)',
    marginHorizontal: scale(4),
  },
  activeIndicator: {
    backgroundColor: colors.primaryBlue,
    width: scale(16),
  },
  content: {
    padding: scale(20),
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    marginTop: verticalScale(-30),
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  pharmacyName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(22),
    color: colors.textHeader,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(65,179,74,0.1)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(20),
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: colors.primaryGreen,
    marginRight: scale(6),
  },
  statusText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(11),
    color: colors.primaryGreen,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(14),
    color: colors.textSecondary,
    lineHeight: scale(20),
    marginBottom: verticalScale(20),
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(30),
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  featureLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: colors.textHeader,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    color: colors.textHeader,
    marginBottom: verticalScale(16),
  },
  contactContainer: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: verticalScale(24),
  },
  contactCard: {
    flex: 1,
  },
  gradientCard: {
    padding: scale(16),
    borderRadius: scale(20),
    height: verticalScale(140),
    justifyContent: 'center',
  },
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(16),
    color: '#fff',
    marginBottom: verticalScale(4),
  },
  cardSub: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: 'rgba(255,255,255,0.8)',
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    padding: scale(20),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(16),
    color: colors.textHeader,
    marginBottom: verticalScale(12),
  },
  infoText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(13),
    color: colors.textSecondary,
    lineHeight: scale(22),
  },
});
