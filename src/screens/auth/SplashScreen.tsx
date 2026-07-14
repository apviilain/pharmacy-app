import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { authService } from '../../api/authService';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../state/authStore';
import { useSettingsStore } from '../../state/settingsStore';
import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type AuthNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const MIN_SPLASH_MS = 1900;

export const SplashScreen = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const bootstrapAuth = useAuthStore(s => s.bootstrapAuth);
  const reveal = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const dotValues = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;

  useEffect(() => {
    let cancelled = false;

    const revealAnimation = Animated.parallel([
      Animated.timing(reveal, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 54,
        useNativeDriver: true,
      }),
    ]);
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1450,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1450,
          useNativeDriver: true,
        }),
      ]),
    );
    const dotsAnimation = Animated.loop(
      Animated.stagger(
        150,
        dotValues.map(value =>
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 360,
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0.35,
              duration: 360,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );

    revealAnimation.start();
    pulseAnimation.start();
    floatAnimation.start();
    dotsAnimation.start();

    const run = async () => {
      const startedAt = Date.now();

      await Promise.all([
        bootstrapAuth(),
        useSettingsStore.getState().bootstrapSettings(),
      ]);

      const remainingMs = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt));
      await new Promise<void>(resolve => setTimeout(resolve, remainingMs));

      if (cancelled) return;

      const authState = useAuthStore.getState();
      if (!authState.accessToken) {
        navigation.replace('SignIn');
        return;
      }

      if (!authState.validateSession()) {
        navigation.replace('SignIn');
        return;
      }

      try {
        const { isProfileComplete } = await authService.syncProfileAndCompletion();
        navigation.replace(isProfileComplete ? 'MainTabs' : 'CompleteProfile');
        return;
      } catch (error) {
        console.error('Failed to fetch auth profile on splash:', error);
      }

      navigation.replace(
        authState.isProfileComplete === false ? 'CompleteProfile' : 'MainTabs',
      );
    };

    run().catch(() => {
      if (!cancelled) navigation.replace('SignIn');
    });

    return () => {
      cancelled = true;
      revealAnimation.stop();
      pulseAnimation.stop();
      floatAnimation.stop();
      dotsAnimation.stop();
    };
  }, [bootstrapAuth, dotValues, float, logoScale, navigation, pulse, reveal]);

  const translateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [verticalScale(18), 0],
  });
  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, verticalScale(-7)],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.32],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.28, 0],
  });

  return (
    <View style={styles.container} accessibilityLabel="Pharmyx is loading">
      <StatusBar barStyle="dark-content" backgroundColor="#F4FAFF" />
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={styles.topOrb} />
        <View style={styles.sideOrb} />
        <View style={styles.bottomOrb} />
        <View style={styles.fineRing} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: reveal, transform: [{ translateY }] },
        ]}
      >
        <Animated.View style={[styles.logoStage, { transform: [{ translateY: floatY }] }]}>
          <Animated.View
            style={[
              styles.pulseRing,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
          <View style={styles.orbitRing} />
          <Animated.View style={[styles.logoShadow, { transform: [{ scale: logoScale }] }]}>
            <LinearGradient
              colors={['#2297D4', colors.primaryBlue, '#0D5A92']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCard}
            >
              <View style={styles.crossVertical} />
              <View style={styles.crossHorizontal} />
              <View style={styles.accentDot} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Text style={styles.brandName}>
          Pharm<Text style={styles.brandAccent}>yx</Text>
        </Text>
        <Text style={styles.tagline}>Care that stays close.</Text>
      </Animated.View>

      <Animated.View style={[styles.loader, { opacity: reveal }]}>
        <View style={styles.loadingDots} accessibilityElementsHidden>
          {dotValues.map((value, index) => (
            <Animated.View
              key={index}
              style={[
                styles.loadingDot,
                {
                  opacity: value,
                  transform: [
                    {
                      translateY: value.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [0, verticalScale(-4)],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.loadingText}>Preparing your care</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FAFF',
  },
  backgroundArt: {
    ...StyleSheet.absoluteFillObject,
  },
  topOrb: {
    position: 'absolute',
    top: verticalScale(-105),
    right: scale(-90),
    width: scale(260),
    height: scale(260),
    borderRadius: scale(130),
    backgroundColor: '#DDEFFD',
  },
  sideOrb: {
    position: 'absolute',
    top: '27%',
    left: scale(-78),
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    backgroundColor: '#E8F7EF',
  },
  bottomOrb: {
    position: 'absolute',
    right: scale(-120),
    bottom: verticalScale(-155),
    width: scale(330),
    height: scale(330),
    borderRadius: scale(165),
    backgroundColor: '#E5F3FC',
  },
  fineRing: {
    position: 'absolute',
    right: scale(-72),
    bottom: verticalScale(90),
    width: scale(190),
    height: scale(190),
    borderRadius: scale(95),
    borderWidth: 1,
    borderColor: 'rgba(21, 114, 183, 0.10)',
  },
  content: {
    alignItems: 'center',
    marginTop: verticalScale(-28),
  },
  logoStage: {
    width: scale(150),
    height: scale(150),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(22),
  },
  pulseRing: {
    position: 'absolute',
    width: scale(112),
    height: scale(112),
    borderRadius: scale(36),
    backgroundColor: '#8FCBED',
  },
  orbitRing: {
    position: 'absolute',
    width: scale(136),
    height: scale(136),
    borderRadius: scale(68),
    borderWidth: 1,
    borderColor: 'rgba(21, 114, 183, 0.16)',
    borderStyle: 'dashed',
  },
  logoShadow: {
    shadowColor: '#0D5A92',
    shadowOffset: { width: 0, height: verticalScale(13) },
    shadowOpacity: 0.25,
    shadowRadius: scale(18),
    elevation: 12,
  },
  logoCard: {
    width: scale(94),
    height: scale(94),
    borderRadius: scale(29),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  crossVertical: {
    position: 'absolute',
    width: scale(18),
    height: scale(54),
    borderRadius: scale(9),
    backgroundColor: '#FFFFFF',
  },
  crossHorizontal: {
    position: 'absolute',
    width: scale(54),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: '#FFFFFF',
  },
  accentDot: {
    position: 'absolute',
    right: scale(15),
    top: scale(15),
    width: scale(13),
    height: scale(13),
    borderRadius: scale(7),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#45B36B',
  },
  brandName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(31),
    lineHeight: scale(40),
    letterSpacing: -0.8,
    color: '#102A2A',
  },
  brandAccent: {
    color: colors.primaryBlue,
  },
  tagline: {
    marginTop: verticalScale(5),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    letterSpacing: 0.15,
    color: '#668080',
  },
  loader: {
    position: 'absolute',
    bottom: verticalScale(54),
    alignItems: 'center',
  },
  loadingDots: {
    height: verticalScale(13),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(6),
  },
  loadingDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: colors.primaryBlue,
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#789090',
  },
});
