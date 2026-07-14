import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Clock3, MapPinned, Radio, Siren } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { scale, verticalScale } from '../../theme/responsive';

const palette = {
  heroGradient: [colors.primaryBlue, '#1D5F98', '#0E4F84'],
  heroBadgeBg: 'rgba(255,255,255,0.16)',
  heroBadgeText: '#F5FAFF',
  heroBodyText: 'rgba(245,250,255,0.88)',
  heroEyebrow: 'rgba(245,250,255,0.84)',
  heroStatBg: 'rgba(7, 48, 78, 0.24)',
  tickerBg: '#EDF6FC',
  tickerBorder: '#CFE3F2',
  tickerText: colors.primaryBlue,
  tickerDivider: colors.primaryBlue,
  panelBg: '#FBFDFF',
  panelBorder: '#D8E8F3',
  panelShadow: colors.primaryBlue,
  panelTitle: colors.textHeader,
  itemBorder: '#DFEBF4',
  warmBg: '#EDF6FC',
  coolBg: '#EAF4FB',
  softBg: '#F1F8FD',
};

const ComingSoonTicker = ({
  tickerTranslateX,
  style,
}: {
  tickerTranslateX: Animated.Value;
  style?: object;
}) => (
  <View style={[styles.tickerWrap, style]}>
    <Animated.View
      style={[
        styles.tickerTrack,
        {
          transform: [{ translateX: tickerTranslateX }],
        },
      ]}
    >
      <Text style={styles.tickerText}>
        This service is coming soon
      </Text>
      <Text style={styles.tickerDivider}>•</Text>
      <Text style={styles.tickerText}>
        This service is coming soon
      </Text>
      <Text style={styles.tickerDivider}>•</Text>
      <Text style={styles.tickerText}>
        This service is coming soon
      </Text>
    </Animated.View>
  </View>
);

export const AmbulanceScreen = () => {
  const tickerTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(tickerTranslateX, {
        toValue: -scale(220),
        duration: 7000,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
      tickerTranslateX.setValue(0);
    };
  }, [tickerTranslateX]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ComingSoonTicker tickerTranslateX={tickerTranslateX} />

        <LinearGradient
          colors={palette.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadge}>
              <Radio size={scale(14)} color={palette.heroBadgeText} />
              <Text style={styles.heroBadgeText}>Emergency Network</Text>
            </View>
            <View style={styles.heroPulse}>
              <View style={styles.heroPulseDot} />
              <Text style={styles.heroPulseText}>Preparing</Text>
            </View>
          </View>

          <View style={styles.heroMainRow}>
            <View style={styles.heroCopyWrap}>
              <Text style={styles.heroEyebrow}>Rapid response access</Text>
              <Text style={styles.heroTitle}>Ambulance support is on the way</Text>
              <Text style={styles.heroText}>
                We&apos;re designing a faster, simpler way to request emergency transport directly from Pharmyx.
              </Text>
            </View>

            <View style={styles.heroIconShell}>
              <View style={styles.heroIconInner}>
                <Siren size={scale(34)} color={colors.primaryBlue} />
              </View>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Clock3 size={scale(16)} color={palette.heroBadgeText} />
              <Text style={styles.heroStatLabel}>Live dispatch</Text>
            </View>
            <View style={styles.heroStatCard}>
              <MapPinned size={scale(16)} color={palette.heroBadgeText} />
              <Text style={styles.heroStatLabel}>Location-first flow</Text>
            </View>
          </View>
        </LinearGradient>

        <ComingSoonTicker
          tickerTranslateX={tickerTranslateX}
          style={styles.bottomTicker}
        />

        <View style={styles.signalPanel}>
          <Text style={styles.signalTitle}>What&apos;s being prepared</Text>
          <View style={styles.signalList}>
            <View style={styles.signalItem}>
              <View style={[styles.signalIconWrap, styles.signalIconWarm]}>
                <MapPinned size={scale(18)} color={colors.primaryBlue} />
              </View>
              <View style={styles.signalCopy}>
                <Text style={styles.signalItemTitle}>Smart pickup routing</Text>
                <Text style={styles.signalItemText}>
                  Quicker handoff from your location to the nearest available provider.
                </Text>
              </View>
            </View>

            <View style={styles.signalItem}>
              <View style={[styles.signalIconWrap, styles.signalIconCool]}>
                <Radio size={scale(18)} color={colors.primaryBlue} />
              </View>
              <View style={styles.signalCopy}>
                <Text style={styles.signalItemTitle}>Real-time response updates</Text>
                <Text style={styles.signalItemText}>
                  Clear status visibility so users know when help is being arranged.
                </Text>
              </View>
            </View>

            <View style={styles.signalItem}>
              <View style={[styles.signalIconWrap, styles.signalIconSoft]}>
                <Siren size={scale(18)} color={colors.primaryBlue} />
              </View>
              <View style={styles.signalCopy}>
                <Text style={styles.signalItemTitle}>Faster emergency access</Text>
                <Text style={styles.signalItemText}>
                  Built to reduce friction in urgent moments with a cleaner request flow.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(28),
  },
  tickerWrap: {
    overflow: 'hidden',
    borderRadius: scale(999),
    backgroundColor: palette.tickerBg,
    borderWidth: 1,
    borderColor: palette.tickerBorder,
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  bottomTicker: {
    marginTop: verticalScale(-2),
  },
  tickerTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '200%',
  },
  tickerText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: palette.tickerText,
    letterSpacing: 0.2,
    paddingHorizontal: scale(12),
  },
  tickerDivider: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: palette.tickerDivider,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: scale(28),
    padding: scale(20),
    minHeight: verticalScale(300),
    marginBottom: verticalScale(18),
  },
  heroGlowOne: {
    position: 'absolute',
    width: scale(180),
    height: scale(180),
    borderRadius: scale(90),
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -scale(30),
    right: -scale(40),
  },
  heroGlowTwo: {
    position: 'absolute',
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -scale(36),
    left: -scale(30),
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(999),
    backgroundColor: palette.heroBadgeBg,
  },
  heroBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: palette.heroBadgeText,
  },
  heroPulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  heroPulseDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(999),
    backgroundColor: '#FFFFFF',
  },
  heroPulseText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: palette.heroBadgeText,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(24),
  },
  heroCopyWrap: {
    flex: 1,
    paddingRight: scale(14),
  },
  heroEyebrow: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: palette.heroEyebrow,
    marginBottom: verticalScale(8),
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: '#FFFFFF',
    lineHeight: scale(34),
  },
  heroText: {
    marginTop: verticalScale(12),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: palette.heroBodyText,
    lineHeight: scale(22),
  },
  heroIconShell: {
    width: scale(92),
    height: scale(92),
    borderRadius: scale(28),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  heroIconInner: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(22),
    backgroundColor: '#F8FFFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: verticalScale(22),
  },
  heroStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    borderRadius: scale(18),
    backgroundColor: palette.heroStatBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroStatLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: palette.heroBadgeText,
  },
  signalPanel: {
    backgroundColor: palette.panelBg,
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: palette.panelBorder,
    padding: scale(18),
    shadowColor: palette.panelShadow,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  signalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: palette.panelTitle,
    marginBottom: verticalScale(16),
  },
  signalList: {
    gap: verticalScale(14),
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: scale(14),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.itemBorder,
  },
  signalIconWrap: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  signalIconWarm: {
    backgroundColor: palette.warmBg,
  },
  signalIconCool: {
    backgroundColor: palette.coolBg,
  },
  signalIconSoft: {
    backgroundColor: palette.softBg,
  },
  signalCopy: {
    flex: 1,
  },
  signalItemTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: palette.panelTitle,
  },
  signalItemText: {
    marginTop: verticalScale(4),
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    lineHeight: scale(20),
  },
});
