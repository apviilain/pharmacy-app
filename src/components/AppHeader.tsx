import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

export type AppHeaderProps = {
  title?: string;
  /**
   * If omitted, auto-detects if we can goBack.
   * If true, shows back button. If false, hides it.
   */
  showBack?: boolean;
  onBackPress?: () => void;
  right?: React.ReactNode;
  left?: React.ReactNode;
  /**
   * Status bar style for this screen.
   */
  statusBarStyle?: 'light-content' | 'dark-content';
  /**
   * Background color of header.
   */
  backgroundColor?: string;
  /**
   * If true, adds safe-area top padding automatically.
   */
  safeTop?: boolean;
  /**
   * Optional container style override.
   */
  containerStyle?: ViewStyle;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack,
  onBackPress,
  right,
  left,
  statusBarStyle = 'dark-content',
  backgroundColor = colors.background,
  safeTop = true,
  containerStyle,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const canGoBack = useMemo(() => {
    const navAny = navigation as any;
    return typeof navAny.canGoBack === 'function' ? navAny.canGoBack() : true;
  }, [navigation]);

  const shouldShowBack = showBack ?? canGoBack;

  return (
    <View style={[styles.outer, { backgroundColor, paddingTop: safeTop ? insets.top : 0 }, containerStyle]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />

      <View style={styles.row}>
        <View style={styles.side}>
          {left ? (
            left
          ) : shouldShowBack ? (
            <TouchableOpacity
              onPress={() => (onBackPress ? onBackPress() : navigation.goBack())}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={scale(22)} color={colors.textHeader} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title ?? ''}
        </Text>

        <View style={styles.side}>{right ?? <View style={styles.backBtn} />}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  row: {
    height: verticalScale(54),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  side: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textHeader,
  },
});

