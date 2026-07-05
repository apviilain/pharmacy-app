import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';

import { useQuery } from '@tanstack/react-query';
import { healthService } from '../api/healthService';

export const DailyHealthTip: React.FC = () => {
  const { data: tips, isLoading } = useQuery({
    queryKey: ['health-tips'],
    queryFn: healthService.getHealthTips,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const tip = tips && tips.length > 0 ? tips[0] : null;

  if (isLoading) {
    return (
      <View style={[styles.healthTipCard, { height: verticalScale(100), justifyContent: 'center', alignItems: 'center' }]}>
         <Text style={[styles.healthTipLabel, { marginBottom: 0 }]}>LOADING TIP...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#EBF7EC', '#D1FAE5']}
      useAngle={true}
      angle={107.54}
      style={styles.healthTipCard}
    >
      <Text style={styles.healthTipLabel}>DAILY HEALTH TIP</Text>
      <Text style={styles.healthTipTitle}>
        {tip ? tip.title : 'Stay Hydrated Today!'}
      </Text>
      <Text style={styles.healthTipDesc}>
        {tip ? tip.description : 'Drink at least 8 glasses of water. Proper hydration boosts your energy and supports kidney health.'}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  healthTipCard: {
    borderRadius: scale(16),
    padding: scale(16),
    borderWidth: 2,
    borderColor: '#40B34633',
    marginBottom: verticalScale(16),
  },
  healthTipLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primaryGreen,
    letterSpacing: 1,
    marginBottom: verticalScale(8),
  },
  healthTipTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: '#111827',
    marginBottom: verticalScale(4),
  },
  healthTipDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    lineHeight: verticalScale(20),
  },
});
