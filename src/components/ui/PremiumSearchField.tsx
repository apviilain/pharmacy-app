import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Search } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { premiumTheme, radii, spacing } from '../../theme/tokens';

type Props = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export const PremiumSearchField = React.forwardRef<TextInput, Props>(
  ({ containerStyle, ...props }, ref) => {
    return (
      <View style={[styles.container, containerStyle]}>
        <Search size={scale(18)} color={premiumTheme.caption} />
        <TextInput
          ref={ref}
          placeholderTextColor={premiumTheme.caption}
          style={styles.input}
          {...props}
        />
      </View>
    );
  },
);

PremiumSearchField.displayName = 'PremiumSearchField';

const styles = StyleSheet.create({
  container: {
    minHeight: verticalScale(52),
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: premiumTheme.cardBorder,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textHeader,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    paddingVertical: 0,
  },
});
