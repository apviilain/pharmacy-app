import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  gradients,
  premiumTheme,
  premiumTypography,
  radii,
  spacing,
} from '../../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  heroRight?: React.ReactNode;
};

export function ModuleScreen({
  title,
  subtitle,
  children,
  scroll = true,
  refreshing,
  onRefresh,
  contentContainerStyle,
  heroRight,
}: Props) {
  const content = (
    <>
      <LinearGradient colors={[...gradients.heroBlue]} style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {heroRight ? <View>{heroRight}</View> : null}
      </LinearGradient>
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </>
  );

  if (!scroll) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: premiumTheme.screen,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  hero: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(21, 114, 183, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  title: premiumTypography.hero,
  subtitle: {
    ...premiumTypography.body,
    marginTop: spacing.xs,
    maxWidth: '90%',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
