import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  leftIcon,
  isPassword,
  style,
  ...rest
}) => {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : undefined]}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.textLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsSecure(!isSecure)}
          >
            {isSecure ? (
              <EyeOff size={scale(20)} color={colors.textLight} />
            ) : (
              <Eye size={scale(20)} color={colors.textLight} />
            )}
          </TouchableOpacity>
        )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(52),
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: scale(12),
    backgroundColor: colors.background,
    paddingHorizontal: scale(16),
  },
  inputFocused: {
    borderColor: colors.primaryBlue,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textHeader,
  },
  leftIconWrapper: {
    marginRight: scale(10),
  },
  rightIcon: {
    padding: scale(4),
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: verticalScale(4),
  },
});
