import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  CalendarDays,
  ClipboardList,
  ShieldPlus,
  User,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import HomeScreen from '../screens/HomeScreen';
import { AppointmentsScreen } from '../screens/main/AppointmentsScreen';
import { OrdersScreen } from '../screens/main/OrdersScreen';
import { HealthVaultScreen } from '../screens/main/HealthVaultScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { scale, verticalScale } from '../theme/responsive';
import { appointmentService } from '../api/appointmentService';
import { useBadgeStore } from '../state/badgeStore';

import { AppHeader } from '../components/AppHeader';
const Tab = createBottomTabNavigator();
const ICON_SIZE = scale(22);

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : verticalScale(10);

  const { data: appts } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: () => appointmentService.getAppointments({ status: 'All' }),
  });

  const { ordersBadgeCount, clearOrdersBadgeCount } = useBadgeStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => {
          let title = route.name;
          if (route.name === 'HealthVault') title = 'Health Vault';
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
        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: '#9CA3AF',
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
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, focused }) => (
            <CalendarDays
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? color : 'none'}
            />
          ),
          tabBarBadge: ordersBadgeCount > 0 ? ordersBadgeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primaryGreen,
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
        component={HealthVaultScreen}
        options={{
          tabBarLabel: 'Health Vault',
          tabBarIcon: ({ color, focused }) => (
            <ShieldPlus
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? color : 'none'}
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
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
              fill={focused ? color : 'none'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
