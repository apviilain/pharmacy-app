import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  CalendarDays,
  ClipboardList,
  ShieldPlus,
  User,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';
import type { RootStackParamList } from '../navigation/types';

interface BottomNavBarProps {
  currentTab?: string;
}

const ICON_SIZE = scale(22);

const tabs: {
  name: string;
  icon: typeof Home;
  route: keyof RootStackParamList;
  badge?: number;
}[] = [
  { name: 'Home', icon: Home, route: 'Home' },
  { name: 'Appointments', icon: CalendarDays, route: 'Appointments' },
  { name: 'Orders', icon: ClipboardList, route: 'Orders', badge: 2 },
  { name: 'Health Vault', icon: ShieldPlus, route: 'HealthVault' },
  { name: 'Profile', icon: User, route: 'Profile' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab = 'Home',
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, verticalScale(6)) },
      ]}
    >
      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.name;

        return (
          <TouchableOpacity
            key={idx}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => {
              if (currentTab !== tab.name) {
                navigation.navigate(tab.route as any);
              }
            }}
          >
            <View style={styles.iconWrapper}>
              <Icon
                size={ICON_SIZE}
                color={isActive ? colors.primaryBlue : '#9CA3AF'}
                strokeWidth={isActive ? 2.2 : 1.8}
                fill={isActive ? colors.primaryBlue : 'none'}
              />
              {tab.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: verticalScale(60),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    paddingTop: verticalScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: ICON_SIZE + scale(8),
    height: ICON_SIZE + scale(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -scale(3),
    right: -scale(4),
    backgroundColor: colors.primaryGreen,
    borderRadius: scale(10),
    minWidth: scale(16),
    height: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: scale(8),
    fontFamily: typography.fontFamily.bold,
  },
  tabText: {
    marginTop: verticalScale(3),
    fontSize: scale(10),
    fontFamily: typography.fontFamily.medium,
    color: '#9CA3AF',
  },
  activeTabText: {
    color: colors.primaryBlue,
    fontFamily: typography.fontFamily.semiBold,
  },
});
