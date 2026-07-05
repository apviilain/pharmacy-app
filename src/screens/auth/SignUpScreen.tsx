import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CountryFlag from 'react-native-country-flag';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale, wp } from '../../theme/responsive';

type SignUpNavigationProp = NativeStackNavigationProp<any, 'SignUp'>;

export const SignUpScreen = () => {
  const navigation = useNavigation<SignUpNavigationProp>();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    setLoading(true);
    setTimeout(() => {
      navigation.navigate('OtpVerification', { phone });
    }, 500);
  };

  const CountryCodeSelector = () => (
    <View style={styles.countryCodeContainer}>
      <CountryFlag isoCode="in" size={scale(14)} style={styles.flagEmoji} />
      <Text style={styles.countryCodeText}>+91</Text>
    </View>
  );

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

          <Text style={styles.title}>Create Account</Text>

          <View style={styles.formContainer}>
            <CustomInput
              label="Full Name"
              placeholder="Neeharika"
              value={fullName}
              onChangeText={setFullName}
            />

            <CustomInput
              label="Phone Number"
              placeholder="98789 98789"
              keyboardType="phone-pad"
              leftIcon={<CountryCodeSelector />}
              value={phone}
              onChangeText={setPhone}
            />

            <CustomInput
              label="Password"
              placeholder="••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <PrimaryButton
              title="Send OTP & Continue"
              variant="green"
              onPress={handleSignUp}
              style={{ marginTop: verticalScale(24) }}
              loading={loading}
              disabled={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scale(10),
    borderRightWidth: 1,
    borderRightColor: colors.inputBorder,
  },
  flagEmoji: {
    fontSize: scale(16),
  },
  countryCodeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: scale(4),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(24),
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  footerLink: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primaryBlue,
  },
});
