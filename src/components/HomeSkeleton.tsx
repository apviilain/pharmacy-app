import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Skeleton } from './Skeleton';
import { scale, verticalScale, wp } from '../theme/responsive';
import { colors } from '../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HomeSkeleton = () => {
  const insets = useSafeAreaInsets();
  const HEADER_MAX_HEIGHT = 280 + insets.top;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Mockup */}
        <View style={[styles.header, { height: HEADER_MAX_HEIGHT }]}>
          <LinearGradient
            colors={['#2A77B7', '#1F5F95']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.topRow}>
              <View style={styles.locationRow}>
                <Skeleton
                  width={40}
                  height={40}
                  borderRadius={12}
                  style={styles.headerSkeleton}
                />
                <View style={styles.locationTexts}>
                  <Skeleton
                    width={scale(80)}
                    height={12}
                    borderRadius={4}
                    style={styles.headerSkeleton}
                  />
                  <Skeleton
                    width={scale(120)}
                    height={16}
                    borderRadius={4}
                    style={[styles.headerSkeleton, { marginTop: 6 }]}
                  />
                </View>
              </View>
              <Skeleton
                width={48}
                height={48}
                borderRadius={16}
                style={styles.headerSkeleton}
              />
            </View>

            <View style={styles.greeting}>
              <Skeleton
                width={scale(100)}
                height={18}
                borderRadius={4}
                style={styles.headerSkeleton}
              />
              <Skeleton
                width={scale(180)}
                height={32}
                borderRadius={4}
                style={[styles.headerSkeleton, { marginTop: 10 }]}
              />
              <Skeleton
                width={scale(220)}
                height={16}
                borderRadius={4}
                style={[styles.headerSkeleton, { marginTop: 10 }]}
              />
            </View>

            <View style={styles.searchBar}>
              <Skeleton
                width="100%"
                height={56}
                borderRadius={20}
                style={{ backgroundColor: '#FFF' }}
              />
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Services Section */}
          <View style={styles.sectionHeader}>
            <Skeleton width={scale(120)} height={20} borderRadius={4} />
          </View>
          <View style={styles.servicesGrid}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.serviceCard}>
                <Skeleton width="100%" height="100%" borderRadius={scale(20)} />
              </View>
            ))}
          </View>

          {/* Specialists Section */}
          <View style={styles.sectionHeader}>
            <Skeleton width={scale(140)} height={20} borderRadius={4} />
          </View>
          <View style={styles.specialistsRow}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.specialistItem}>
                <Skeleton
                  width={scale(75)}
                  height={scale(75)}
                  borderRadius={scale(8)}
                />
                <Skeleton
                  width={scale(60)}
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: 8 }}
                />
              </View>
            ))}
          </View>

          {/* Activity Section */}
          <View style={styles.sectionHeader}>
            <Skeleton width={scale(130)} height={20} borderRadius={4} />
          </View>
          <View style={styles.activityCard}>
            <Skeleton
              width="100%"
              height={verticalScale(100)}
              borderRadius={scale(20)}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  header: {
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTexts: {
    marginLeft: 12,
  },
  greeting: {
    marginTop: 25,
  },
  searchBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  sectionHeader: {
    marginVertical: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    height: verticalScale(125),
    marginBottom: 14,
  },
  specialistsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specialistItem: {
    alignItems: 'center',
  },
  activityCard: {
    marginTop: 10,
  },
  headerSkeleton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
