import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputKeyPressEventData,
  NativeSyntheticEvent,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (otp: string) => void;
  onComplete: (otp: string) => void;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  value,
  onChange,
  onComplete,
  error,
}) => {
  const [otpChars, setOtpChars] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (value === undefined) return;

    const digits = value.replace(/\D/g, '').slice(0, length);
    const nextOtpChars = Array.from(
      { length },
      (_, index) => digits[index] || ''
    );

    if (otpChars.join('') === nextOtpChars.join('')) return;

    setOtpChars(nextOtpChars);
    if (digits.length === length) onComplete(digits);
  }, [length, onComplete, otpChars, value]);

  const updateOtp = (nextOtpChars: string[]) => {
    setOtpChars(nextOtpChars);
    const nextOtp = nextOtpChars.join('');
    onChange?.(nextOtp);
    if (nextOtp.length === length) onComplete(nextOtp);
  };

  const handleChangeText = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    const newOtpChars = [...otpChars];

    if (!digits) {
      newOtpChars[index] = '';
      updateOtp(newOtpChars);
      return;
    }

    if (digits.length === 1) {
      newOtpChars[index] = digits;
      updateOtp(newOtpChars);
      if (index < length - 1) inputsRef.current[index + 1]?.focus();
      return;
    }

    // OS autofill and clipboard paste can provide the entire code to one field.
    const startIndex = digits.length === length ? 0 : index;
    digits.split('').forEach((digit, offset) => {
      const targetIndex = startIndex + offset;
      if (targetIndex < length) newOtpChars[targetIndex] = digit;
    });
    updateOtp(newOtpChars);
    inputsRef.current[
      Math.min(startIndex + digits.length, length - 1)
    ]?.focus();
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      otpChars[index] === '' &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
      const newOtpChars = [...otpChars];
      newOtpChars[index - 1] = '';
      updateOtp(newOtpChars);
    }
  };

  const inputWidth = length > 4 ? scale(41) : scale(58);
  const inputHeight = length > 4 ? verticalScale(50) : verticalScale(58);
  const fontSize =
    length > 4 ? typography.fontSize.xl : typography.fontSize.xxl;

  return (
    <View style={styles.container}>
      {otpChars.map((char, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputsRef.current[index] = ref;
          }}
          style={[
            styles.input,
            { width: inputWidth, height: inputHeight, fontSize },
            char !== '' && styles.inputFilled,
            error && styles.inputError,
          ]}
          keyboardType="numeric"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          selectTextOnFocus
          autoFocus={index === 0}
          maxLength={length}
          value={char}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(15),
  },
  input: {
    borderRadius: scale(13),
    borderWidth: 1,
    borderColor: '#DCE7EE',
    backgroundColor: '#F8FBFD',
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    color: colors.primaryBlue,
  },
  inputFilled: {
    borderColor: colors.primaryBlue,
    borderWidth: 1.5,
    backgroundColor: '#EDF7FD',
  },
  inputError: {
    borderColor: colors.error,
  },
});
