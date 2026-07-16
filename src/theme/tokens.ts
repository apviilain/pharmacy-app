import { colors } from './colors';
import { moderateScale, scale, verticalScale } from './responsive';
import { shadows } from './shadows';
import { typography } from './typography';

export const spacing = {
  xs: scale(8),
  sm: scale(12),
  md: scale(16),
  lg: scale(20),
  xl: scale(24),
};

export const radii = {
  md: moderateScale(16),
  lg: moderateScale(20),
  xl: moderateScale(24),
  pill: moderateScale(999),
};

export const premiumTheme = {
  screen: '#F5F9FD',
  card: '#FFFFFF',
  cardMuted: '#F2F7FC',
  cardBorder: '#D9E7F5',
  text: colors.textHeader,
  subtext: '#6D7A88',
  caption: '#8FA0B2',
  blueTint: '#EAF4FD',
  greenTint: '#EAF8ED',
  orangeTint: '#FFF4E8',
  dangerTint: '#FFF0F0',
  overlay: 'rgba(12, 32, 54, 0.08)',
};

export const gradients = {
  heroBlue: ['#F2F9FF', '#FFFFFF'] as const,
  cardBlue: ['#1C86D1', '#126EAF'] as const,
  cardGreen: ['#1DA768', '#147E50'] as const,
  cardOrange: ['#F4A21A', '#E48709'] as const,
};

export const premiumTypography = {
  hero: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(24),
    lineHeight: verticalScale(30),
    color: premiumTheme.text,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: scale(18),
    lineHeight: verticalScale(24),
    color: premiumTheme.text,
  },
  body: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(14),
    lineHeight: verticalScale(20),
    color: premiumTheme.subtext,
  },
  caption: {
    fontFamily: typography.fontFamily.medium,
    fontSize: scale(12),
    lineHeight: verticalScale(16),
    color: premiumTheme.caption,
  },
};

export const premiumShadows = {
  card: shadows.small,
  floating: shadows.medium,
};
