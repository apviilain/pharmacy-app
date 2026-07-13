import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  ClipboardList,
  Pill,
  Boxes,
  User,
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import { PharmacyScreen } from '../screens/main/PharmacyScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';
import { useBadgeStore } from '../state/badgeStore';

import { AppHeader } from '../components/AppHeader';
const Tab = createBottomTabNavigator();
const ICON_SIZE = scale(22);
const ACTIVE_TAB_COLOR = '#1572B7';
const INACTIVE_TAB_COLOR = '#9CA3AF';

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : verticalScale(10);

  const { ordersBadgeCount, clearOrdersBadgeCount } = useBadgeStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => {
          let title = route.name;
          if (route.name === 'Appointments') title = 'Pharmacy Medicines';
          if (route.name === 'Orders') title = 'Pharmacy Orders';
          if (route.name === 'HealthVault') title = 'Pharmacy Inventory';
          return (
            <AppHeader title={title} showBack={false} backgroundColor="#fff" />
          );
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: verticalScale(60) + bottomInset,
          paddingTop: verticalScale(8),
          paddingBottom: verticalScale(8) + bottomInset,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: ACTIVE_TAB_COLOR,
        tabBarInactiveTintColor: INACTIVE_TAB_COLOR,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: scale(10),
          marginTop: verticalScale(2),
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={ICON_SIZE}
              color={focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? ACTIVE_TAB_COLOR : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={PharmacyScreen}
        initialParams={{ section: 'medicines', lockedSection: true }}
        options={{
          tabBarLabel: 'Medicines',
          tabBarIcon: ({ color, focused }) => (
            <Pill
              size={ICON_SIZE}
              color={focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? ACTIVE_TAB_COLOR : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={PharmacyScreen}
        initialParams={{ section: 'orders', lockedSection: true }}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList
              size={ICON_SIZE}
              color={focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? ACTIVE_TAB_COLOR : 'none'}
            />
          ),
          tabBarBadge: ordersBadgeCount > 0 ? ordersBadgeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: ACTIVE_TAB_COLOR,
            color: '#fff',
            fontSize: scale(9),
            minWidth: scale(16),
            height: scale(16),
            lineHeight: scale(15),
            borderRadius: scale(8),
          },
        }}
        listeners={{
          tabPress: () => {
            clearOrdersBadgeCount();
          },
        }}
      />
      <Tab.Screen
        name="HealthVault"
        component={PharmacyScreen}
        initialParams={{ section: 'inventory', lockedSection: true }}
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <Boxes
              size={ICON_SIZE}
              color={focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? ACTIVE_TAB_COLOR : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User
              size={ICON_SIZE}
              color={focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? ACTIVE_TAB_COLOR : 'none'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
