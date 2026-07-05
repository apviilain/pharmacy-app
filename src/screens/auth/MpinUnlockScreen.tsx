import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { AlertTriangle, LogOut, ShieldCheck } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/types';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { NumericKeypad } from '../../components/auth/NumericKeypad';
import { PinDots } from '../../components/auth/PinDots';
import { useAuthPalette } from '../../components/auth/authPalette';
import { AUTH_SCREEN_SUCCESS_DELAY_MS, MPIN_MAX_RETRIES } from '../../constants/security';
import { useSecurityStore } from '../../state/securityStore';
import { useAuthStore, getCurrentUserId } from '../../state/authStore';
import { biometricAuth } from '../../services/biometricAuth';
import { useSettingsStore } from '../../state/settingsStore';
import { authService } from '../../api/authService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MpinUnlock'>;

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const MpinUnlockScreen = () => {
  const navigation = useNavigation<Nav>();
  const palette = useAuthPalette();
  const { mpinLength, blockedUntil, hasMpin } = useSecurityStore();
  const biometricEnabled = useSettingsStore(s => s.biometricEnabled);
  const [enteredMpin, setEnteredMpin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MPIN_MAX_RETRIES);
  const [remainingBlockMs, setRemainingBlockMs] = useState(0);
  const [biometricInfo, setBiometricInfo] = useState<Awaited<ReturnType<typeof biometricAuth.getAvailability>> | null>(null);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    biometricAuth.getAvailability().then(setBiometricInfo).catch(() => setBiometricInfo(null));
  }, []);

  useEffect(() => {
    if (!blockedUntil) {
      setRemainingBlockMs(0);
      return;
    }

    const tick = () => {
      const remaining = blockedUntil - Date.now();
      setRemainingBlockMs(Math.max(0, remaining));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const proceedAfterUnlock = useCallback(async () => {
    const valid = useAuthStore.getState().validateSession();
    if (!valid) return;

    await useSecurityStore.getState().unlockApp();
    const isProfileComplete = useAuthStore.getState().isProfileComplete;
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: isProfileComplete ? 'MainTabs' : 'CompleteProfile' }],
      });
    }, AUTH_SCREEN_SUCCESS_DELAY_MS / 2);
  }, [navigation]);

  const triggerBiometric = useCallback(async () => {
    if (!biometricEnabled || !hasMpin) return;
    setLoading(true);
    const result = await biometricAuth.prompt('Verify identity to unlock Pharmacy App');
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Authenticated',
        text2: 'Welcome back.',
      });
      await proceedAfterUnlock();
      return;
    }

    if (result.code !== 'cancelled') {
      Toast.show({
        type: 'info',
        text1: 'Use MPIN',
        text2: result.message,
      });
    }
  }, [biometricEnabled, hasMpin, proceedAfterUnlock]);

  useFocusEffect(
    useCallback(() => {
      if (!biometricEnabled || hasAutoPrompted || !biometricInfo?.available) {
        return undefined;
      }
      setHasAutoPrompted(true);
      triggerBiometric();
      return undefined;
    }, [biometricEnabled, hasAutoPrompted, biometricInfo?.available, triggerBiometric]),
  );

  const handleDigitPress = async (digit: string) => {
    if (loading || remainingBlockMs > 0) return;
    setError('');
    if (enteredMpin.length >= mpinLength) return;

    const next = `${enteredMpin}${digit}`;
    setEnteredMpin(next);

    if (next.length === mpinLength) {
      setLoading(true);
      const result = await useSecurityStore.getState().verifyMpin({
        mpin: next,
        userId: getCurrentUserId(),
      });
      setLoading(false);

      if (result.success) {
        setEnteredMpin('');
        setAttemptsLeft(MPIN_MAX_RETRIES);
        await proceedAfterUnlock();
        return;
      }

      setEnteredMpin('');
      setAttemptsLeft(result.attemptsLeft);
      shake();

      if (result.blockedUntil) {
        setError(`Too many attempts. Try again in ${formatDuration(result.blockedUntil - Date.now())}.`);
        return;
      }

      setError(`Incorrect MPIN. ${result.attemptsLeft} attempts left.`);
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setError('');
    setEnteredMpin(value => value.slice(0, -1));
  };

  const handleForgotMpin = async () => {
    setLoading(true);
    await authService.logout();
    setLoading(false);
  };

  const helperText = useMemo(() => {
    if (remainingBlockMs > 0) {
      return `Too many failed attempts. Try again in ${formatDuration(remainingBlockMs)}.`;
    }

    if (error) return error;
    if (biometricEnabled && biometricInfo?.available) {
      return `${biometricInfo.label} will be attempted automatically. You can also use your MPIN.`;
    }

    return 'Enter your MPIN to continue.';
  }, [biometricEnabled, biometricInfo?.available, biometricInfo?.label, error, remainingBlockMs]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={palette.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.background}
      />
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.heroCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              transform: [
                {
                  translateX: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-10, 10],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: palette.accentSoft }]}>
            {remainingBlockMs > 0 ? (
              <AlertTriangle size={scale(28)} color={palette.warning} />
            ) : (
              <ShieldCheck size={scale(28)} color={palette.accent} />
            )}
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Unlock Pharmacy App</Text>
          <Text style={[styles.subtitle, { color: error ? palette.danger : palette.mutedText }]}>{helperText}</Text>

          <PinDots
            length={mpinLength}
            filledCount={enteredMpin.length}
            accentColor={palette.accent}
            mutedColor={palette.border}
          />

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: palette.mutedText }]}>Attempts left: {attemptsLeft}</Text>
            <Pressable onPress={handleForgotMpin} disabled={loading}>
              <Text style={[styles.forgotText, { color: palette.accent }]}>Forgot MPIN?</Text>
            </Pressable>
          </View>

          {loading ? <ActivityIndicator color={palette.accent} style={{ marginTop: verticalScale(10) }} /> : null}
        </Animated.View>

        <View style={styles.keypadWrap}>
          <NumericKeypad
            onDigitPress={handleDigitPress}
            onBackspace={handleBackspace}
            onBiometricPress={biometricEnabled ? triggerBiometric : undefined}
            biometricAvailable={!!(biometricEnabled && biometricInfo?.available)}
            disabled={loading || remainingBlockMs > 0}
            palette={{
              surface: palette.surface,
              card: palette.card,
              text: palette.text,
              accent: palette.accent,
              border: palette.border,
              mutedText: palette.mutedText,
            }}
          />

          <Pressable
            onPress={handleForgotMpin}
            style={[styles.logoutButton, { borderColor: palette.border }]}
          >
            <LogOut size={scale(16)} color={palette.text} />
            <Text style={[styles.logoutText, { color: palette.text }]}>Logout & Reset Login</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === 'android' ? verticalScale(8) : 0,
    paddingBottom: verticalScale(16),
  },
  heroCard: {
    borderRadius: scale(28),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(24),
    borderWidth: 1,
  },
  iconWrap: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: verticalScale(18),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(28),
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    lineHeight: verticalScale(22),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(24),
    textAlign: 'center',
    minHeight: verticalScale(44),
  },
  metaRow: {
    marginTop: verticalScale(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  forgotText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  keypadWrap: {
    marginTop: verticalScale(18),
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: verticalScale(10),
  },
  logoutButton: {
    marginTop: verticalScale(16),
    borderRadius: scale(18),
    paddingVertical: verticalScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    borderWidth: 1,
  },
  logoutText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
});
