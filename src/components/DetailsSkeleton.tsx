import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { scale, verticalScale, wp } from '../theme/responsive';

export const DetailsSkeleton = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.header}>
        <Skeleton width={scale(100)} height={scale(100)} borderRadius={scale(50)} />
        <Skeleton width={scale(200)} height={24} borderRadius={4} style={{ marginTop: 16 }} />
        <Skeleton width={scale(150)} height={16} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Skeleton width={wp('25%')} height={verticalScale(60)} borderRadius={12} />
        <Skeleton width={wp('25%')} height={verticalScale(60)} borderRadius={12} />
        <Skeleton width={wp('25%')} height={verticalScale(60)} borderRadius={12} />
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <Skeleton width={scale(120)} height={20} borderRadius={4} />
        <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 12 }} />
        <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* More Blocks */}
      <View style={styles.section}>
        <Skeleton width={scale(140)} height={20} borderRadius={4} />
        <View style={styles.grid}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width={wp('42%')} height={verticalScale(50)} borderRadius={12} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </View>

      {/* Button at bottom */}
      <View style={styles.footer}>
        <Skeleton width="100%" height={verticalScale(52)} borderRadius={26} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scale(16),
  },
  header: {
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(16),
  },
  section: {
    marginTop: verticalScale(24),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: verticalScale(16),
  },
  footer: {
    marginTop: verticalScale(40),
    marginBottom: verticalScale(20),
  },
});
