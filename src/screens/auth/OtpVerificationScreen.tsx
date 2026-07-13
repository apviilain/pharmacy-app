import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  MessageSquareText,
} from 'lucide-react-native';

import { authService } from '../../api/authService';
import type { ApiError } from '../../api/errorHandler';
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';
import { scale, verticalScale, wp } from '../../theme/responsive';
import { typography } from '../../theme/typography';

type ParamList = {
  OtpVerification: { phone: string };
};

type OtpNavigationProp = NativeStackNavigationProp<any, 'OtpVerification'>;

export const OtpVerificationScreen = () => {
  const navigation = useNavigation<OtpNavigationProp>();
  const route = useRoute<RouteProp<ParamList, 'OtpVerification'>>();
  const phone = route.params?.phone || '98789 98789';

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(56);
  const [success, setSuccess] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submittedOtp = useRef('');
  const currentOtp = useRef('');
  const lastClipboardOtp = useRef('');

  const loginMutation = useMutation({
    mutationFn: async (code: string) =>
      authService.loginWithOtp({ phone, otp: code }),
    onSuccess: async () => {
      setSuccess(true);

      try {
        const { isProfileComplete } =
          await authService.syncProfileAndCompletion(phone);

        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [
              { name: isProfileComplete ? 'MainTabs' : 'CompleteProfile' },
            ],
          });
        }, 800);
      } catch (profileError) {
        console.error('Failed to fetch profile after login:', profileError);
        const isProfileComplete = useAuthStore.getState().isProfileComplete;
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [
              { name: isProfileComplete ? 'MainTabs' : 'CompleteProfile' },
            ],
          });
        }, 800);
      }
    },
    onError: (requestError: unknown) => {
      setError(true);
      setSuccess(false);
      setLoading(false);
      const apiError = requestError as Partial<ApiError>;
      setErrorMessage(apiError.userMessage || 'Request failed');
    },
  });

  const submitOtp = useCallback(
    (code: string) => {
      if (code.length !== 6 || loginMutation.isPending) return;
      if (submittedOtp.current === code) return;

      submittedOtp.current = code;
      setLoading(true);
      loginMutation.mutate(code);
    },
    [loginMutation.isPending, loginMutation.mutate]
  );

  const handleOtpChange = useCallback((value: string) => {
    currentOtp.current = value;
    setOtp(value);
    setError(false);
    setErrorMessage('');
    if (value !== submittedOtp.current) submittedOtp.current = '';
  }, []);

  const pasteOtpFromClipboard = useCallback(async () => {
    try {
      // Lazy loading keeps older native builds from crashing before autolinking.
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      const clipboardText = await Clipboard.getString();
      const clipboardOtp = clipboardText.match(/(?:^|\D)(\d{6})(?!\d)/)?.[1];

      if (
        !clipboardOtp ||
        clipboardOtp === currentOtp.current ||
        clipboardOtp === lastClipboardOtp.current
      ) {
        return;
      }

      lastClipboardOtp.current = clipboardOtp;
      currentOtp.current = clipboardOtp;
      setOtp(clipboardOtp);
      setError(false);
      setErrorMessage('');
    } catch (clipboardError) {
      if (__DEV__)
        console.warn('Unable to read OTP from clipboard', clipboardError);
    }
  }, []);

  const handleOtpComplete = useCallback(
    (value: string) => {
      handleOtpChange(value);
      submitOtp(value);
    },
    [handleOtpChange, submitOtp]
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer((previous) => previous - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    pasteOtpFromClipboard();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') pasteOtpFromClipboard();
    });

    return () => subscription.remove();
  }, [pasteOtpFromClipboard]);

  const handleVerify = () => {
    setError(false);
    setErrorMessage('');
    if (otp.length !== 6) {
      setError(true);
      setErrorMessage('Please enter a valid OTP');
      return;
    }

    submittedOtp.current = '';
    submitOtp(otp);
  };

  const handleResend = () => {
    setTimer(56);
    setSuccess(false);
    setError(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F9FC" />
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={styles.topOrb} />
        <View style={styles.sideOrb} />
        <View style={styles.bottomRing} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              activeOpacity={0.75}
              style={styles.backButton}
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.replace('SignIn')
              }
            >
              <ChevronLeft size={scale(21)} color="#173333" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>SECURE VERIFICATION</Text>
          </View>

          <View style={styles.intro}>
            <View style={styles.iconBadge}>
              <MessageSquareText
                size={scale(25)}
                color="#FFFFFF"
                strokeWidth={2}
              />
              <View style={styles.iconDot} />
            </View>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
            <View style={styles.phonePill}>
              <Text style={styles.phoneText}>+91 {phone}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {success ? (
              <View style={styles.successMessage}>
                <CheckCircle2 size={scale(16)} color="#258D57" />
                <Text style={styles.successTitle}>Code sent successfully</Text>
              </View>
            ) : null}

            <Text style={styles.codeLabel}>Verification code</Text>
            <OtpInput
              length={6}
              value={otp}
              onChange={handleOtpChange}
              onComplete={handleOtpComplete}
              error={error}
            />

            {error ? (
              <Text style={styles.errorText}>
                {errorMessage || 'Please enter a valid OTP'}
              </Text>
            ) : null}

            <View style={styles.resendContainer}>
              <Text style={styles.resendTextBase}>
                {timer > 0
                  ? "Didn't receive it? Resend in "
                  : "Didn't receive it? "}
              </Text>
              <Text
                style={[styles.resendTimer, timer === 0 && styles.resendActive]}
                onPress={timer === 0 ? handleResend : undefined}
              >
                {timer > 0
                  ? `00:${timer.toString().padStart(2, '0')}`
                  : 'Resend code'}
              </Text>
            </View>

            <PrimaryButton
              title="Verify & Continue"
              onPress={handleVerify}
              disabled={loading}
              rightIcon={<ArrowRight size={scale(20)} color="#fff" />}
              loading={loading}
              style={styles.verifyButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F9FC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backgroundArt: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topOrb: {
    position: 'absolute',
    top: verticalScale(-105),
    right: scale(-75),
    width: scale(225),
    height: scale(225),
    borderRadius: scale(113),
    backgroundColor: '#DDEFFC',
  },
  sideOrb: {
    position: 'absolute',
    top: verticalScale(330),
    left: scale(-80),
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: '#E4F4EA',
  },
  bottomRing: {
    position: 'absolute',
    right: scale(-70),
    bottom: verticalScale(58),
    width: scale(170),
    height: scale(170),
    borderRadius: scale(85),
    borderWidth: 1,
    borderColor: 'rgba(21, 114, 183, 0.12)',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('6%'),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(24),
  },
  topBar: {
    minHeight: verticalScale(42),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFEAEF',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  stepLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(9.5),
    letterSpacing: 1.15,
    color: '#708888',
  },
  intro: {
    alignItems: 'center',
    marginTop: verticalScale(25),
    marginBottom: verticalScale(25),
  },
  iconBadge: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(17),
    backgroundColor: colors.primaryBlue,
    shadowColor: '#0D5A92',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  iconDot: {
    position: 'absolute',
    top: scale(9),
    right: scale(9),
    width: scale(9),
    height: scale(9),
    borderRadius: scale(5),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#47B56B',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(29),
    lineHeight: scale(37),
    letterSpacing: -0.7,
    color: '#102A2A',
  },
  subtitle: {
    marginTop: verticalScale(7),
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(13),
    color: '#6E8383',
  },
  phonePill: {
    marginTop: verticalScale(11),
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(13),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#D9E9F2',
    backgroundColor: '#FFFFFF',
  },
  phoneText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(13),
    letterSpacing: 0.2,
    color: colors.primaryBlue,
  },
  formContainer: {
    paddingHorizontal: scale(17),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(17),
    borderWidth: 1,
    borderColor: '#E2EDF2',
    borderRadius: scale(22),
    backgroundColor: '#FFFFFF',
    shadowColor: '#174C68',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  successMessage: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(10),
    borderRadius: scale(20),
    backgroundColor: '#EAF8EF',
  },
  successTitle: {
    marginLeft: scale(6),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(10.5),
    color: '#258D57',
  },
  codeLabel: {
    marginTop: verticalScale(16),
    fontFamily: typography.fontFamily.semiBold,
    fontSize: scale(12),
    color: '#304A4A',
  },
  errorText: {
    marginTop: verticalScale(-5),
    marginBottom: verticalScale(12),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(2),
    marginBottom: verticalScale(16),
  },
  resendTextBase: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#708383',
  },
  resendTimer: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  resendActive: {
    textDecorationLine: 'underline',
  },
  verifyButton: {
    marginTop: verticalScale(2),
    borderRadius: scale(15),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
});
