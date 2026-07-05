import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

interface PhoneInputProps extends TextInputProps {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Phone Number',
  error,
  value,
  onChangeText,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.phoneInputRow}>
        <View style={styles.countryCodeBox}>
          <View style={styles.flagContainer}>
            <CountryFlag isoCode="IN" size={scale(16)} style={styles.flagImage} />
          </View>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>

        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            error ? styles.inputError : null,
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Enter your number"
            keyboardType="numeric"
            placeholderTextColor={colors.textLight}
            value={value}
            onChangeText={(val) => {
              const cleanVal = val.replace(/[^0-9]/g, '');
              onChangeText(cleanVal);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={10}
            {...rest}
          />
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
    marginBottom: verticalScale(8),
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(52),
    borderWidth: 1,
    borderColor: '#EEE9FC',
    borderRadius: scale(12),
    backgroundColor: '#FCFBFF',
    paddingHorizontal: scale(10),
    marginRight: scale(10),
  },
  flagContainer: {
    width: scale(24),
    height: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 2,
  },
  flagImage: {
    borderRadius: 2,
  },
  countryCodeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: scale(4),
    marginRight: scale(4),
  },
  inputContainer: {
    flex: 1,
    height: verticalScale(52),
    borderWidth: 1,
    borderColor: '#EEE9FC',
    borderRadius: scale(12),
    backgroundColor: '#FCFBFF',
    paddingHorizontal: scale(16),
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: colors.primaryBlue,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: verticalScale(4),
  },
});
