import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';
import { useAuthStore } from '../../state/authStore';
import { useSettingsStore } from '../../state/settingsStore';
import { useSecurityStore } from '../../state/securityStore';

// Replace 'any' with actual root stack param list when linking
type AuthNavigationProp = NativeStackNavigationProp<any, 'Splash'>;

export const SplashScreen = () => {
  const navigation = useNavigation<AuthNavigationProp>();
  const bootstrapAuth = useAuthStore(s => s.bootstrapAuth);
  const bootstrapSecurity = useSecurityStore(s => s.bootstrapSecurity);

  // Animation values
  const scaleValue = useRef(new Animated.Value(0.5)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    // Start animation
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const run = async () => {
      const startedAt = Date.now();
      
      await Promise.all([
        bootstrapAuth(),
        useSettingsStore.getState().bootstrapSettings(),
        bootstrapSecurity(),
      ]);

      // Keep the animation visible for at least 2.5s.
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, 2500 - elapsed);
      await new Promise<void>(resolve => setTimeout(() => resolve(), remainingMs));

      if (cancelled) return;
      
      const authState = useAuthStore.getState();
      const token = authState.accessToken;
      
      if (token) {
        const validSession = authState.validateSession();
        if (!validSession) {
          navigation.replace('SignIn');
          return;
        }

        const securityState = useSecurityStore.getState();
        const settingsState = useSettingsStore.getState();
        if (!securityState.hasMpin && !settingsState.mpinSetupSkipped) {
          navigation.replace('MpinSetup');
          return;
        }

        if (!securityState.hasMpin) {
          const { isProfileComplete } = authState;
          navigation.replace(isProfileComplete === false ? 'CompleteProfile' : 'MainTabs');
          return;
        }

        const { isProfileComplete } = authState;
        if (isProfileComplete === false) {
          navigation.replace('CompleteProfile');
          return;
        }

        await securityState.lockApp();
        navigation.replace('MpinUnlock');
      } else {
        navigation.replace('SignIn');
      }
    };

    run().catch(() => {
      navigation.replace('SignIn');
    });

    return () => {
      cancelled = true;
    };
  }, [navigation, opacityValue, scaleValue, bootstrapAuth, bootstrapSecurity]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.brandTextTop,
          {
            opacity: opacityValue,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        Pharmacy App
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: scale(200),
    height: scale(200),
  },
  textContainer: {
    marginTop: verticalScale(12),
    alignItems: 'center',
  },
  brandTextTop: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(32),
    color: colors.primaryGreen,
    letterSpacing: 1,
  },
  brandTextBottom: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(16),
    color: colors.primaryBlue,
    marginTop: verticalScale(-4),
    letterSpacing: 0.5,
  },
});
