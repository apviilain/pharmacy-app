import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight, ShieldCheck } from 'lucide-react-native';
import { PhoneInput } from '../../components/PhoneInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, wp } from '../../theme/responsive';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../api/authService';
import { useAuthStore } from '../../state/authStore';
import type { ApiError } from '../../api/errorHandler';

type SignInNavigationProp = NativeStackNavigationProp<any, 'SignIn'>;

export const SignInScreen = () => {
  const navigation = useNavigation<SignInNavigationProp>();
  const defaultPhone = useAuthStore.getState().user?.phone || '';
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      return authService.sendOtp(phone);
    },
    onSuccess: () => {
      navigation.navigate('OtpVerification', { phone });
      // Keep loading true while navigating
    },
    onError: (e: unknown) => {
      setLoading(false);
      const apiErr = e as Partial<ApiError>;
      setError(apiErr.userMessage || 'Failed to send OTP. Please try again.');
    },
  });

  const handleSignIn = () => {
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    sendOtpMutation.mutate();
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
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <View style={styles.crossVertical} />
              <View style={styles.crossHorizontal} />
              <View style={styles.brandDot} />
            </View>
            <View>
              <Text style={styles.brandName}>Pharmacy App</Text>
              <Text style={styles.brandCaption}>Simple care, every day</Text>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number to securely access your account.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <PhoneInput 
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                setError('');
              }}
              error={error}
            />

            <PrimaryButton
              title="Verify & Continue"
              onPress={handleSignIn}
              style={styles.continueButton}
              rightIcon={<ArrowRight size={scale(20)} color="#fff" />}
              loading={loading}
              disabled={loading}
            />

            <View style={styles.securityNote}>
              <ShieldCheck size={scale(16)} color="#3E8D62" />
              <Text style={styles.securityText}>
                Your number is encrypted and kept private.
              </Text>
            </View>
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
    top: verticalScale(-90),
    right: scale(-80),
    width: scale(220),
    height: scale(220),
    borderRadius: scale(110),
    backgroundColor: '#DDEFFC',
  },
  sideOrb: {
    position: 'absolute',
    top: verticalScale(300),
    left: scale(-75),
    width: scale(135),
    height: scale(135),
    borderRadius: scale(68),
    backgroundColor: '#E4F4EA',
  },
  bottomRing: {
    position: 'absolute',
    right: scale(-70),
    bottom: verticalScale(65),
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
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(24),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    backgroundColor: colors.primaryBlue,
    shadowColor: '#0D5A92',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  crossVertical: {
    position: 'absolute',
    width: scale(9),
    height: scale(28),
    borderRadius: scale(5),
    backgroundColor: '#FFFFFF',
  },
  crossHorizontal: {
    position: 'absolute',
    width: scale(28),
    height: scale(9),
    borderRadius: scale(5),
    backgroundColor: '#FFFFFF',
  },
  brandDot: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#47B56B',
  },
  brandName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(16),
    color: '#102A2A',
  },
  brandCaption: {
    marginTop: verticalScale(2),
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(11),
    color: '#789090',
  },
  intro: {
    marginTop: verticalScale(42),
    marginBottom: verticalScale(25),
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(31),
    lineHeight: scale(39),
    letterSpacing: -0.8,
    color: '#102A2A',
  },
  subtitle: {
    maxWidth: scale(310),
    marginTop: verticalScale(8),
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(14),
    lineHeight: scale(21),
    color: '#667B7B',
  },
  formContainer: {
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(18),
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
  continueButton: {
    marginTop: verticalScale(4),
    borderRadius: scale(15),
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(14),
  },
  securityText: {
    marginLeft: scale(6),
    fontFamily: typography.fontFamily.regular,
    fontSize: scale(10.5),
    color: '#6D8580',
  },
});
