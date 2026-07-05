import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TextInputKeyPressEventData, NativeSyntheticEvent } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 4, onComplete, error }) => {
  const [otpChars, setOtpChars] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (otpChars.every((char) => char !== '')) {
      onComplete(otpChars.join(''));
    }
  }, [otpChars, onComplete]);

  const handleChangeText = (text: string, index: number) => {
    const newOtpChars = [...otpChars];
    newOtpChars[index] = text;
    setOtpChars(newOtpChars);

    if (text !== '' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otpChars[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
      const newOtpChars = [...otpChars];
      newOtpChars[index - 1] = '';
      setOtpChars(newOtpChars);
    }
  };

  const inputWidth = length > 4 ? scale(48) : scale(60);
  const inputHeight = length > 4 ? verticalScale(55) : verticalScale(60);
  const fontSize = length > 4 ? typography.fontSize.xl : typography.fontSize.xxl;

  return (
    <View style={[styles.container, length > 4 && { paddingHorizontal: scale(5) }]}>
      {otpChars.map((char, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputsRef.current[index] = ref; }}
          style={[
            styles.input,
            { width: inputWidth, height: inputHeight, fontSize },
            char !== '' && styles.inputFilled,
            error && styles.inputError,
          ]}
          keyboardType="numeric"
          maxLength={1}
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
    paddingHorizontal: scale(20),
    marginVertical: verticalScale(20),
  },
  input: {
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: '#EEE9FC',
    backgroundColor: '#F9F7F780',
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    color: colors.primaryBlue,
  },
  inputFilled: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#1572B70D',
  },
  inputError: {
    borderColor: colors.error,
  },
});
