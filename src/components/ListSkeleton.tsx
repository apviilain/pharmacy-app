import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { scale, verticalScale } from '../theme/responsive';

export const ListSkeleton = ({ itemCount = 6 }) => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {[...Array(itemCount)].map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.topRow}>
            <Skeleton
              width={scale(50)}
              height={scale(50)}
              borderRadius={scale(25)}
            />
            <View style={styles.textContainer}>
              <Skeleton width={scale(150)} height={16} borderRadius={4} />
              <Skeleton
                width={scale(100)}
                height={12}
                borderRadius={4}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
          <View style={styles.bottomRow}>
            <Skeleton width={scale(80)} height={14} borderRadius={4} />
            <Skeleton width={scale(60)} height={32} borderRadius={8} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: scale(10) },
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: scale(12),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
});
