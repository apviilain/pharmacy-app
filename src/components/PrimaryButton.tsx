import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, hp, verticalScale } from '../theme/responsive';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'blue' | 'green' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'blue',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  rightIcon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.divider;
    switch (variant) {
      case 'green':
        return colors.primaryGreen;
      case 'outline':
        return colors.background;
      case 'blue':
      default:
        return colors.primaryBlue;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textLight;
    if (variant === 'outline') return colors.textHeader;
    return '#fff';
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.googleBtnBorder;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                marginLeft: icon ? scale(10) : 0,
                marginRight: rightIcon ? scale(10) : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: verticalScale(52),
    borderRadius: scale(12),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(8),
    // Added box-shadow: 0px 4px 10px 0px #6224E124
    shadowColor: '#6224E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, // 24 hex is roughly 14%
    shadowRadius: 10,
    elevation: 4, // for Android
  },
  text: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
  },
});
