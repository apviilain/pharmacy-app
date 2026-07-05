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
import { ArrowRight } from 'lucide-react-native';
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
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          <Text style={styles.title}>Welcome Back !</Text>

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
              style={{ marginTop: verticalScale(16) }}
              rightIcon={<ArrowRight size={scale(20)} color="#fff" />}
              loading={loading}
              disabled={loading}
            />
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
    marginBottom: verticalScale(32),
  },
  formContainer: {
    flex: 1,
  },
});
