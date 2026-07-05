import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, wp } from '../../theme/responsive';
import { useMutation } from '@tanstack/react-query';

import { authService } from '../../api/authService';
import type { ApiError } from '../../api/errorHandler';
import { useAuthStore } from '../../state/authStore';
import { hasCompletedPharmacyProfile, mapPharmacyProfileToUser } from '../../api/pharmyx';
import { pharmacyService } from '../../api/pharmacyService';
import { useSecurityStore } from '../../state/securityStore';
import { useSettingsStore } from '../../state/settingsStore';

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

  const handleOtpComplete = useCallback((val: string) => {
    setOtp(val);
    setError(false);
    setErrorMessage('');
  }, []);

  const [loading, setLoading] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Let server validate the OTP; UI only checks length/format.
      return authService.loginWithOtp({ phone, otp });
    },
    onSuccess: async (_data: any) => {
      setSuccess(true);

      try {
        const profileRes = await pharmacyService.getMyProfile();
        const user = mapPharmacyProfileToUser(profileRes);
        const hasName = hasCompletedPharmacyProfile(profileRes);

        if (user) {
          useAuthStore.getState().setUser(user);
        }

        // Update profile completion flag
        await useAuthStore.getState().setProfileComplete(hasName);

        setTimeout(() => {
          const { hasMpin } = useSecurityStore.getState();
          const { mpinSetupSkipped } = useSettingsStore.getState();

          if (hasMpin || mpinSetupSkipped) {
            navigation.reset({
              index: 0,
              routes: [{ name: hasName ? 'MainTabs' : 'CompleteProfile' }],
            });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'MpinSetup' }] });
          }
        }, 800);
      } catch (profileError) {
        console.error('Failed to fetch profile after login:', profileError);
        setTimeout(() => {
          navigation.navigate('CompleteProfile');
        }, 800);
      }
    },
    onError: (e: unknown) => {
      setError(true);
      setSuccess(false);
      setLoading(false);
      const apiErr = e as Partial<ApiError>;
      setErrorMessage(apiErr.userMessage || 'Request failed');
    },
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = () => {
    setError(false);
    setErrorMessage('');
    if (otp.length !== 4 && otp.length !== 6) {
      setError(true);
      setErrorMessage('Please enter a valid OTP');
      return;
    }

    setLoading(true);
    loginMutation.mutate();
  };

  const handleResend = () => {
    setTimer(56);
    setSuccess(false);
    setError(false);
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            We have sent OTP on your given mobile{'\n'}number{' '}
            <Text style={styles.phoneText}>+91 {phone}</Text>
          </Text>

          <View style={styles.formContainer}>
            <OtpInput length={6} onComplete={handleOtpComplete} error={error} />
            {error ? (
              <Text style={styles.errorText}>
                {errorMessage || 'Please enter a valid OTP'}
              </Text>
            ) : null}

            <View style={styles.resendContainer}>
              <Text style={styles.resendTextBase}>Resend Code in </Text>
              <Text
                style={[styles.resendTimer, timer === 0 && styles.resendActive]}
                onPress={timer === 0 ? handleResend : undefined}
              >
                {timer > 0 ? `00:${timer.toString().padStart(2, '0')}` : 'Now'}
              </Text>
            </View>

            <PrimaryButton
              title="Verify & Continue"
              onPress={handleVerify}
              disabled={loading}
              rightIcon={<ArrowRight size={scale(20)} color="#fff" />}
              loading={loading}
            />

            {success && (
              <View style={styles.successMessage}>
                <View style={styles.successIndicator} />
                <View style={styles.successTextContainer}>
                  <Text style={styles.successTitle}>OTP Sent Successfully</Text>
                  <Text style={styles.successDesc}>Check your SMS inbox</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('5%'),
    paddingBottom: verticalScale(24),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textHeader,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: '#817795',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(24),
  },
  phoneText: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textHeader,
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: verticalScale(-12),
    marginBottom: verticalScale(16),
  },
  resendContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(32),
  },
  resendTextBase: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#817795',
  },
  resendTimer: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
  resendActive: {
    textDecorationLine: 'underline',
  },
  successMessage: {
    marginTop: verticalScale(24),
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#E8FCE6',
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  successIndicator: {
    width: scale(6),
    backgroundColor: '#138808',
  },
  successTextContainer: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
  },
  successTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#138808',
    marginBottom: verticalScale(2),
  },
  successDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
});
