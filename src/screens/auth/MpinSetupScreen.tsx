import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Appearance,
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/types';
import { SCREEN_HEIGHT, scale, verticalScale } from '../../theme/responsive';
import { shadows } from '../../theme/shadows';
import { typography } from '../../theme/typography';
import { NumericKeypad } from '../../components/auth/NumericKeypad';
import { PinDots } from '../../components/auth/PinDots';
import { MPIN_ALLOWED_LENGTHS, AUTH_SCREEN_SUCCESS_DELAY_MS } from '../../constants/security';
import { isValidMpin } from '../../utils/mpin';
import { getCurrentUserId, useAuthStore } from '../../state/authStore';
import { useSecurityStore } from '../../state/securityStore';
import { useSettingsStore } from '../../state/settingsStore';
import { biometricAuth } from '../../services/biometricAuth';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MpinSetup'>;

type MpinSetupScreenProps = {
  navigation: Nav;
  route: {
    params?: RootStackParamList['MpinSetup'];
  };
};

export const MpinSetupScreen = ({ navigation, route }: MpinSetupScreenProps) => {
  const scheme = Appearance.getColorScheme();
  const isDark = scheme === 'dark';
  const palette = {
    isDark,
    background: isDark ? '#07111F' : '#F5F8FC',
    surface: isDark ? '#0E1C2F' : '#FFFFFF',
    card: isDark ? '#16263C' : '#EAF2FB',
    text: isDark ? '#F8FAFC' : '#101828',
    mutedText: isDark ? '#94A3B8' : '#667085',
    accent: '#1572B7',
    accentSoft: isDark ? 'rgba(21,114,183,0.18)' : '#E8F4FD',
    success: '#40B346',
    danger: '#EF4444',
    warning: '#F59E0B',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(16,24,40,0.08)',
  };
  const [mpinLength, setMpinLength] = useState<(typeof MPIN_ALLOWED_LENGTHS)[number]>(4);
  const [primaryMpin, setPrimaryMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailability, setBiometricAvailability] = useState<Awaited<ReturnType<typeof biometricAuth.getAvailability>> | null>(null);
  const [biometricCtaLoading, setBiometricCtaLoading] = useState(false);
  const [showPinPreview, setShowPinPreview] = useState(false);
  const isFromSettings = !!route.params?.fromSettings;
  const hasExistingMpin = useSecurityStore.getState().hasMpin;

  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    biometricAuth.getAvailability().then(setBiometricAvailability).catch(() => setBiometricAvailability(null));
  }, []);

  useEffect(() => {
    if (step !== 'success') return;
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 170,
    }).start();
  }, [step, successAnim]);

  const activeValue = step === 'create' ? primaryMpin : confirmMpin;
  const pinPreviewSlots = Array.from({ length: mpinLength }).map((_, index) => activeValue[index] ?? '');
  const isSixDigitMpin = mpinLength === 6;

  const resetAndGoToApp = () => {
    if (isFromSettings) {
      navigation.goBack();
      return;
    }

    const isProfileComplete = useAuthStore.getState().isProfileComplete;
    navigation.reset({
      index: 0,
      routes: [{ name: isProfileComplete ? 'MainTabs' : 'CompleteProfile' }],
    });
  };

  const completeSetup = async (enableBiometric?: boolean) => {
    if (typeof enableBiometric === 'boolean') {
      await useSettingsStore.getState().setBiometricEnabled(enableBiometric);
    }

    await useSettingsStore.getState().setMpinSetupSkipped(false);
    await useSecurityStore.getState().unlockApp();
    setTimeout(resetAndGoToApp, AUTH_SCREEN_SUCCESS_DELAY_MS);
  };

  const handleSkipForNow = async () => {
    await useSettingsStore.getState().setMpinSetupSkipped(true);
    resetAndGoToApp();
  };

  const handleDigitPress = async (digit: string) => {
    setError('');

    if (step === 'create') {
      if (primaryMpin.length >= mpinLength) return;
      const next = `${primaryMpin}${digit}`;
      setPrimaryMpin(next);
      if (next.length === mpinLength) {
        if (!isValidMpin(next, MPIN_ALLOWED_LENGTHS)) {
          setError('MPIN must be 4 or 6 digits.');
          setPrimaryMpin('');
          return;
        }
        setStep('confirm');
      }
      return;
    }

    if (step === 'confirm') {
      if (confirmMpin.length >= mpinLength || loading) return;
      const next = `${confirmMpin}${digit}`;
      setConfirmMpin(next);
      if (next.length === mpinLength) {
        setLoading(true);
        if (next !== primaryMpin) {
          setLoading(false);
          setError('MPIN does not match. Please try again.');
          setConfirmMpin('');
          return;
        }

        await useSecurityStore.getState().setMpin({
          mpin: next,
          mpinLength,
          userId: getCurrentUserId(),
        });
        setLoading(false);
        setStep('success');
      }
    }
  };

  const handleBackspace = () => {
    setError('');
    if (step === 'create') {
      setPrimaryMpin(value => value.slice(0, -1));
      return;
    }
    if (loading) return;
    setConfirmMpin(value => value.slice(0, -1));
  };

  const handleEnableBiometric = async () => {
    setBiometricCtaLoading(true);
    const result = await biometricAuth.prompt('Verify identity to enable biometric login');
    setBiometricCtaLoading(false);

    if (!result.success) {
      Toast.show({
        type: 'info',
        text1: 'Biometric not enabled',
        text2: result.message,
      });
      await completeSetup(false);
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Biometric Enabled',
      text2: 'You can now unlock Pharmacy App faster.',
    });
    await completeSetup(true);
  };

  const canOfferBiometric = !!biometricAvailability?.available;
  const isCreateStep = step === 'create';
  const isConfirmStep = step === 'confirm';
  const currentStepNumber = isConfirmStep ? 2 : 1;
  const isCompactScreen = SCREEN_HEIGHT < 920;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={palette.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.background}
      />
      <View style={styles.container}>
        <View
          pointerEvents="none"
          style={[styles.backgroundGlow, styles.backgroundGlowTop, { backgroundColor: palette.accentSoft }]}
        />
        <View
          pointerEvents="none"
          style={[styles.backgroundGlow, styles.backgroundGlowBottom, { backgroundColor: palette.accentSoft }]}
        />
        {step === 'success' ? (
          <View style={[styles.heroCard, styles.successCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View
              pointerEvents="none"
              style={[styles.cardOrb, styles.cardOrbLarge, { backgroundColor: palette.accentSoft }]}
            />
            <View
              pointerEvents="none"
              style={[styles.cardOrb, styles.cardOrbSmall, { backgroundColor: palette.accentSoft }]}
            />
            <Animated.View
              style={[
                styles.successState,
                {
                  transform: [
                    {
                      scale: successAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: successAnim,
                },
              ]}
            >
              <View style={[styles.successBadge, { backgroundColor: `${palette.success}14`, borderColor: `${palette.success}26` }]}>
                <Text style={[styles.successBadgeText, { color: palette.success }]}>Security Enabled</Text>
              </View>
              <View style={[styles.successIconWrap, { backgroundColor: `${palette.success}12`, borderColor: `${palette.success}20` }]}>
                <View style={[styles.successIconCore, { backgroundColor: palette.surface }]}>
                  <CheckCircle2 size={scale(56)} color={palette.success} />
                </View>
              </View>
              <Text style={[styles.title, styles.successTitle, { color: palette.text }]}>MPIN Set Successfully</Text>
              <Text style={[styles.successSubtitle, { color: palette.mutedText }]}>Your secure unlock is ready. {canOfferBiometric ? 'Would you like to enable biometric login too?' : 'You can continue to the app now.'}</Text>
              <View style={[styles.successInfoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.successInfoTitle, { color: palette.text }]}>Your app is now protected</Text>
                <Text style={[styles.successInfoText, { color: palette.mutedText }]}>
                  Faster sign-in, safer access, and a smoother unlock experience from here on.
                </Text>
              </View>
              <View style={styles.successActions}>
                {canOfferBiometric ? (
                  <>
                    <Pressable
                      onPress={handleEnableBiometric}
                      style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                    >
                      {biometricCtaLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Enable {biometricAvailability?.label}</Text>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => completeSetup(false)}
                      style={[styles.secondaryButton, { borderColor: palette.border }]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Not Now</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={() => completeSetup(false)}
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.heroCard,
                styles.formCard,
                isCompactScreen && styles.formCardCompact,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <View
                pointerEvents="none"
                style={[styles.cardOrb, styles.cardOrbLarge, { backgroundColor: palette.accentSoft }]}
              />
              <View
                pointerEvents="none"
                style={[styles.cardOrb, styles.cardOrbSmall, { backgroundColor: palette.accentSoft }]}
              />
              <View style={styles.headerTop}>
                <View style={[styles.securityBadge, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
                  <Text style={[styles.securityBadgeText, { color: palette.accent }]}>Secure Access</Text>
                </View>
                <Text style={[styles.stepBadge, { color: palette.mutedText }]}>Step {currentStepNumber} of 2</Text>
              </View>

              <View style={[styles.iconWrap, isCompactScreen && styles.iconWrapCompact, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
                <View style={[styles.iconCore, { backgroundColor: palette.surface }]}>
                  <ShieldCheck size={scale(28)} color={palette.accent} />
                </View>
              </View>

              <View style={[styles.mpinControlPanel, isCompactScreen && styles.mpinControlPanelCompact, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
                <View style={styles.mpinControlTopRow}>
                  <View>
                    <Text style={styles.mpinControlEyebrow}>MPIN FORMAT</Text>
                    <Text style={styles.mpinControlTitle}>{mpinLength}-digit secure code</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowPinPreview(value => !value)}
                    style={[styles.mpinVisibilityButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                  >
                    {showPinPreview ? (
                      <EyeOff size={scale(18)} color={palette.accent} />
                    ) : (
                      <Eye size={scale(18)} color={palette.accent} />
                    )}
                  </Pressable>
                </View>

                <View style={styles.mpinControlBody}>
                  <View style={styles.mpinLengthRail}>
                    {MPIN_ALLOWED_LENGTHS.map(length => {
                      const active = mpinLength === length;
                      const lengthTextStyle = [
                        styles.mpinLengthText,
                        active ? styles.mpinLengthTextActive : styles.mpinLengthTextInactive,
                      ];
                      const lengthSuffixStyle = [
                        styles.mpinLengthSuffix,
                        active ? styles.mpinLengthSuffixActive : styles.mpinLengthSuffixInactive,
                      ];
                      return (
                        <Pressable
                          key={length}
                          disabled={step !== 'create'}
                          onPress={() => {
                            setMpinLength(length);
                            setPrimaryMpin('');
                            setConfirmMpin('');
                            setError('');
                          }}
                          style={[
                            styles.mpinLengthOption,
                            { borderColor: palette.border },
                            active && { backgroundColor: palette.accent },
                            !isCreateStep && styles.segmentDisabled,
                          ]}
                        >
                          <Text style={lengthTextStyle}>{length}</Text>
                          <Text style={lengthSuffixStyle}>digit</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={() => setShowPinPreview(value => !value)}
                    style={styles.mpinPreviewRail}
                  >
                    {showPinPreview ? (
                      <View style={[styles.pinValueRow, isSixDigitMpin && styles.pinValueRowDense]}>
                        {pinPreviewSlots.map((digit, index) => {
                          const valueTextStyle = [
                            styles.pinValueText,
                            isSixDigitMpin && styles.pinValueTextDense,
                            digit ? styles.pinValueTextFilled : styles.pinValueTextEmpty,
                          ];
                          return (
                            <View
                              key={`pin-preview-${index}`}
                              style={[
                                styles.pinValueBox,
                                isSixDigitMpin && styles.pinValueBoxDense,
                                { backgroundColor: palette.surface, borderColor: `${palette.accent}55` },
                              ]}
                            >
                              <Text style={valueTextStyle}>{digit || '-'}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <PinDots
                        length={mpinLength}
                        filledCount={activeValue.length}
                        accentColor={palette.accent}
                        mutedColor={palette.border}
                      />
                    )}
                    <Text style={styles.mpinPreviewHint}>
                      {showPinPreview ? 'Tap eye to hide' : 'Tap panel to reveal'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {error ? <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text> : null}
              {loading ? <ActivityIndicator color={palette.accent} style={{ marginTop: verticalScale(12) }} /> : null}
            </View>

            <View style={[styles.keypadWrap, isCompactScreen && styles.keypadWrapCompact]}>
              {!isFromSettings && !hasExistingMpin ? (
                <Pressable onPress={handleSkipForNow} style={[styles.skipButton, isCompactScreen && styles.skipButtonCompact]}>
                  <Text style={[styles.skipButtonText, { color: palette.mutedText }]}>Skip for now</Text>
                </Pressable>
              ) : null}
              <View style={[styles.keypadShell, isCompactScreen && styles.keypadShellCompact, { backgroundColor: `${palette.surface}B3`, borderColor: palette.border }]}>
                <NumericKeypad
                  onDigitPress={handleDigitPress}
                  onBackspace={handleBackspace}
                  palette={{
                    surface: palette.surface,
                    card: palette.card,
                    text: palette.text,
                    accent: palette.accent,
                    border: palette.border,
                    mutedText: palette.mutedText,
                  }}
                  disabled={loading}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: 0,
    paddingBottom: verticalScale(16),
    position: 'relative',
  },
  backgroundGlow: {
    position: 'absolute',
    borderRadius: scale(999),
    opacity: 0.55,
  },
  backgroundGlowTop: {
    width: scale(180),
    height: scale(180),
    top: verticalScale(-18),
    right: scale(-36),
  },
  backgroundGlowBottom: {
    width: scale(160),
    height: scale(160),
    bottom: verticalScale(140),
    left: scale(-48),
  },
  heroCard: {
    borderRadius: scale(28),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(18),
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.medium,
  },
  successCard: {
    marginTop: verticalScale(24),
    paddingVertical: verticalScale(14),
  },
  formCard: {
    marginTop: verticalScale(-24),
    paddingTop: verticalScale(14),
  },
  formCardCompact: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(12),
  },
  cardOrb: {
    position: 'absolute',
    borderRadius: scale(999),
    opacity: 0,
  },
  cardOrbLarge: {
    width: scale(140),
    height: scale(140),
    top: verticalScale(-66),
    right: scale(-44),
  },
  cardOrbSmall: {
    width: scale(74),
    height: scale(74),
    bottom: verticalScale(-18),
    left: scale(-16),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  securityBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: scale(999),
    borderWidth: 1,
  },
  securityBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    letterSpacing: 0.3,
  },
  stepBadge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
  },
  successState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  successBadge: {
    paddingHorizontal: scale(13),
    paddingVertical: verticalScale(7),
    borderRadius: scale(999),
    borderWidth: 1,
    marginBottom: verticalScale(14),
  },
  successBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    letterSpacing: 0.3,
  },
  successIconWrap: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  successIconCore: {
    width: scale(74),
    height: scale(74),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  successTitle: {
    marginTop: verticalScale(16),
  },
  successSubtitle: {
    marginTop: verticalScale(8),
    maxWidth: '92%',
  },
  successInfoCard: {
    width: '100%',
    marginTop: verticalScale(18),
    borderRadius: scale(18),
    borderWidth: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  successInfoTitle: {
    textAlign: 'center',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    marginBottom: verticalScale(8),
  },
  successInfoText: {
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(13),
    lineHeight: verticalScale(20),
  },
  successActions: {
    width: '100%',
    marginTop: verticalScale(18),
  },
  iconWrap: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: verticalScale(10),
    borderWidth: 1,
  },
  iconWrapCompact: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(14),
    marginBottom: verticalScale(8),
  },
  iconCore: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.tiny,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(28),
    textAlign: 'center',
  },
  segmentDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignSelf: 'center',
    marginBottom: verticalScale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
  },
  skipButtonCompact: {
    marginBottom: verticalScale(8),
    paddingVertical: verticalScale(4),
  },
  skipButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  errorText: {
    marginTop: verticalScale(16),
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  keypadWrap: {
    marginTop: verticalScale(18),
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: verticalScale(6),
  },
  keypadWrapCompact: {
    marginTop: verticalScale(10),
  },
  mpinControlPanel: {
    borderRadius: scale(8),
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    marginTop: verticalScale(2),
    marginBottom: verticalScale(8),
    ...shadows.small,
  },
  mpinControlPanelCompact: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(9),
    marginBottom: verticalScale(6),
  },
  mpinControlTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  mpinControlEyebrow: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(10.5),
    color: '#1572B7',
  },
  mpinControlTitle: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(14),
    color: '#101828',
  },
  mpinVisibilityButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpinControlBody: {
    gap: verticalScale(8),
  },
  mpinLengthRail: {
    width: '100%',
    flexDirection: 'row',
    gap: scale(10),
  },
  mpinLengthOption: {
    flex: 1,
    minHeight: verticalScale(40),
    borderRadius: scale(8),
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(5),
    backgroundColor: '#FFFFFF',
  },
  mpinLengthText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
  },
  mpinLengthTextActive: {
    color: '#fff',
  },
  mpinLengthTextInactive: {
    color: '#101828',
  },
  mpinLengthSuffix: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(10.5),
  },
  mpinLengthSuffixActive: {
    color: '#fff',
  },
  mpinLengthSuffixInactive: {
    color: '#667085',
  },
  mpinPreviewRail: {
    width: '100%',
    minHeight: verticalScale(72),
    borderRadius: scale(8),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
  },
  mpinPreviewHint: {
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: '#667085',
  },
  pinValueRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(8),
  },
  pinValueRowDense: {
    gap: scale(5),
  },
  pinValueBox: {
    width: scale(34),
    height: scale(38),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinValueText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(16),
  },
  pinValueBoxDense: {
    width: scale(26),
    height: scale(34),
    borderRadius: scale(7),
  },
  pinValueTextDense: {
    fontSize: scale(14),
  },
  pinValueTextFilled: {
    color: '#101828',
  },
  pinValueTextEmpty: {
    color: '#98A2B3',
  },
  keypadShell: {
    borderRadius: scale(30),
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
  },
  keypadShellCompact: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(5),
  },
  primaryButton: {
    width: '100%',
    borderRadius: scale(20),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(56),
    ...shadows.small,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: '#fff',
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
    marginTop: verticalScale(12),
    borderRadius: scale(20),
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: verticalScale(56),
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
});
