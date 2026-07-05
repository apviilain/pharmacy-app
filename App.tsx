import React, { useEffect } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';

import { ReactQueryProvider } from './src/providers/ReactQueryProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  setupNotificationChannel,
  requestNotificationPermission,
} from './src/services/notificationService';
import {
  registerForegroundHandler,
  handleInitialNotification,
} from './src/services/notificationHandler';
import { NotificationPopup } from './src/components/NotificationPopup';
import { AppSecurityManager } from './src/components/AppSecurityManager';

// Disable native screens to fix the "DecorView is required but was null" crash on Android
enableScreens(false);

LogBox.ignoreAllLogs(true);

function App() {
  useEffect(() => {
    // Initialize notification system
    const initNotifications = async () => {
      await setupNotificationChannel();
      await requestNotificationPermission();
    };
    initNotifications();

    // Register foreground event handler (returns unsubscribe fn)
    const unsubscribeForeground = registerForegroundHandler();

    // Handle cold-start: app opened from notification when killed
    handleInitialNotification();

    return () => {
      unsubscribeForeground();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ReactQueryProvider>
        <AppNavigator />
        <AppSecurityManager />
      </ReactQueryProvider>

      <NotificationPopup />

      <Toast position="bottom" bottomOffset={80} />
    </SafeAreaProvider>
  );
}

export default App;
