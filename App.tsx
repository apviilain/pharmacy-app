import React, { useEffect } from "react";
import { LogBox, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import Toast from "react-native-toast-message";

import { NetworkBanner } from "./src/components/NetworkBanner";
import { AppErrorBoundary } from "./src/error/AppErrorBoundary";
import { installGlobalErrorHandler } from "./src/error/globalErrorHandler";
import { ReactQueryProvider } from "./src/providers/ReactQueryProvider";
import { NetworkProvider } from "./src/providers/NetworkProvider";
import { AppModalProvider } from "./src/providers/AppModalProvider";
import { AppNavigator } from "./src/navigation/AppNavigator";
import {
  setupNotificationChannel,
  requestNotificationPermission,
} from "./src/services/notificationService";
import {
  registerForegroundHandler,
  handleInitialNotification,
} from "./src/services/notificationHandler";
import { NotificationPopup } from "./src/components/NotificationPopup";
import { AppSecurityManager } from "./src/components/AppSecurityManager";
import { logger } from "./src/utils/logger";

// Disable native screens to fix the "DecorView is required but was null" crash on Android
enableScreens(false);

LogBox.ignoreAllLogs(true);
function App() {
  useEffect(() => {
    installGlobalErrorHandler();

    // Initialize notification system
    const initNotifications = async () => {
      try {
        await setupNotificationChannel();
        await requestNotificationPermission();
      } catch (error) {
        logger.error("Notification initialization failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
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
      <AppErrorBoundary>
        <NetworkProvider>
          <ReactQueryProvider>
            <AppModalProvider>
              <NetworkBanner />
              <AppNavigator />
              <AppSecurityManager />
              <NotificationPopup />
              <Toast position="bottom" bottomOffset={80} />
            </AppModalProvider>
          </ReactQueryProvider>
        </NetworkProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
