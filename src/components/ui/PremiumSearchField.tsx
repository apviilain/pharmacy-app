import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Mic, Search } from 'lucide-react-native';

import { colors } from '../../theme/colors';
import { scale, verticalScale } from '../../theme/responsive';
import { typography } from '../../theme/typography';
import { premiumTheme, radii, spacing } from '../../theme/tokens';

type Props = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  onVoiceSearch?: () => void;
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
        {props.onVoiceSearch && (
          <TouchableOpacity 
            onPress={props.onVoiceSearch} 
            style={styles.voiceButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Mic size={scale(18)} color={colors.primaryBlue} />
          </TouchableOpacity>
        )}
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
    paddingTop: Platform.OS === 'ios' ? scale(4) : 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
  },
  voiceButton: {
    padding: scale(4),
  },
});
