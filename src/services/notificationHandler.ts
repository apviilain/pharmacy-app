/**
 * Notification Event Handler — Handles foreground + background notification actions.
 *
 * Action routing:
 *   - "join_now" → navigate to AppointmentDetails screen
 *   - "clear"    → dismiss the notification
 *   - default    → navigate to AppointmentDetails screen (notification body tap)
 */

import type { Event } from '@notifee/react-native';
import { navigationRef } from '../navigation/navigationRef';
import { useNotificationStore } from '../state/notificationStore';

const getNotifeeModule = () => {
  try {
    return require('@notifee/react-native').default;
  } catch {
    return null;
  }
};

const getNotifeeEventType = () => {
  try {
    return require('@notifee/react-native').EventType;
  } catch {
    return null;
  }
};

/* ─────────── Action Handler ─────────── */

async function handleNotificationAction(event: Event): Promise<void> {
  const { type, detail } = event;
  const { notification, pressAction } = detail;
  const EventType = getNotifeeEventType();
  const notifee = getNotifeeModule();

  if (!EventType) return;

  // Handle in-app popup when notification is delivered in foreground
  if (type === EventType.DELIVERED) {
    const appointmentId = notification?.data?.appointmentId as string | undefined;
    const patientName = notification?.data?.patientName as string | undefined;
    const concern = notification?.data?.concern as string | undefined;
    const timeStr = notification?.data?.timeStr as string | undefined;
    const meetingLink = notification?.data?.meetingLink as string | undefined;
    const doctorId = notification?.data?.doctorId as string | undefined;
    const dateLabel = notification?.data?.dateLabel as string | undefined;
    
    // Use the aesthetic custom popup instead of Alert.alert
    useNotificationStore.getState().showNotification({
      id: notification?.id || '',
      title: notification?.title || 'Upcoming Appointment',
      body: notification?.body || '',
      appointmentId: appointmentId || '',
      patientName,
      concern,
      timeStr,
      meetingLink,
      doctorId,
      dateLabel,
    });
    return;
  }

  // Only handle press events for the rest
  if (
    type !== EventType.ACTION_PRESS &&
    type !== EventType.PRESS
  ) {
    return;
  }

  const appointmentId = notification?.data?.appointmentId as string | undefined;
  const actionId = pressAction?.id;

  console.log(
    '[NotificationHandler] Action received:',
    actionId,
    'appointmentId:',
    appointmentId,
  );

  switch (actionId) {
    case 'join_now': {
      // Navigate to appointment details screen
      if (appointmentId && navigationRef.isReady()) {
        navigationRef.navigate('AppointmentDetails' as any, {
          appointmentId,
          fromNotification: true,
        } as any);
      }
      // Dismiss the notification after action
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
      }
      break;
    }

    case 'clear': {
      // Just dismiss the notification
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
      }
      break;
    }

    case 'default':
    default: {
      // Default tap — navigate to appointment details
      if (appointmentId && navigationRef.isReady()) {
        navigationRef.navigate('AppointmentDetails' as any, {
          appointmentId,
          fromNotification: true,
        } as any);
      }
      break;
    }
  }
}

/* ─────────── Foreground Event Registration ─────────── */

/**
 * Registers the foreground event listener.
 * Call this in App.tsx useEffect.
 * Returns an unsubscribe function.
 */
export function registerForegroundHandler(): () => void {
  const notifee = getNotifeeModule();
  if (!notifee?.onForegroundEvent) {
    return () => {};
  }
  return notifee.onForegroundEvent(handleNotificationAction);
}

/* ─────────── Background Event Handler ─────────── */

/**
 * Background event handler — must be registered in index.js
 * BEFORE AppRegistry.registerComponent().
 *
 * This handles notification actions when the app is in the
 * background or has been killed.
 */
export async function onBackgroundEvent(event: Event): Promise<void> {
  await handleNotificationAction(event);
}

/* ─────────── Initial Notification ─────────── */

/**
 * Checks if the app was opened from a notification tap.
 * Call this after navigation is ready to handle cold-start deep links.
 */
export async function handleInitialNotification(): Promise<void> {
  const notifee = getNotifeeModule();
  if (!notifee?.getInitialNotification) {
    return;
  }

  const initialNotification = await notifee.getInitialNotification();

  if (initialNotification) {
    const appointmentId = initialNotification.notification?.data
      ?.appointmentId as string | undefined;

    console.log(
      '[NotificationHandler] App opened from notification:',
      appointmentId,
    );

    if (appointmentId && navigationRef.isReady()) {
      // Small delay to ensure navigation is fully mounted
      setTimeout(() => {
        (navigationRef as any).navigate('AppointmentDetails', {
          appointmentId,
          fromNotification: true,
        });
      }, 500);
    }
  }
}
