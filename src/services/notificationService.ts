/**
 * Notification Service — Core engine for scheduling appointment reminders.
 *
 * Uses @notifee/react-native for local notifications with:
 *   - Android high-priority channel with sound + vibration
 *   - Dual scheduling: 10 min before + at appointment time
 *   - Action buttons: "Join Now" (deep link) + "Clear" (dismiss)
 *   - Persistence via AsyncStorage to prevent duplicates
 *   - Grouped notifications for multiple appointments
 */

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
  AuthorizationStatus,
  AndroidCategory,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/* ─────────── Types ─────────── */

export interface AppointmentNotificationData {
  id: string;
  patientName: string;
  specialistName: string;
  concern: string;
  appointmentTime: Date;
  meetingLink?: string;
  doctorId?: string;
  dateLabel?: string;
}

/* ─────────── Constants ─────────── */

const CHANNEL_ID = 'appointment-reminders';
const CHANNEL_NAME = 'Appointment Reminders';
const GROUP_ID = 'appointment-group';
const STORAGE_KEY = '@scheduled_notifications';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/* ─────────── Channel Setup ─────────── */

/**
 * Creates Android notification channel with high importance,
 * sound, vibration, and lights enabled.
 * Must be called before any notifications are displayed.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: 'Reminders for upcoming appointments',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#1572B7',
      badge: true,
    });

    // Create notification group for multiple appointments
    await notifee.createChannelGroup({
      id: GROUP_ID,
      name: 'Appointments',
    });
  }
}

/* ─────────── Permissions ─────────── */

/**
 * Requests notification permission from the OS.
 * Android 13+ requires runtime POST_NOTIFICATIONS permission.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();

  if (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  console.warn(
    '[NotificationService] Permission denied:',
    settings.authorizationStatus,
  );
  return false;
}

/* ─────────── Persistence Helpers ─────────── */

async function getScheduledIds(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveScheduledIds(
  map: Record<string, string[]>,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('[NotificationService] Failed to save scheduled IDs:', err);
  }
}

/* ─────────── Time Formatting ─────────── */

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

/* ─────────── Scheduling ─────────── */

/**
 * Schedules TWO notifications for an appointment:
 *   1. 10 minutes before appointment time
 *   2. Exactly at appointment time
 *
 * Edge case: If appointment is < 10 min away, only the
 * immediate notification is scheduled.
 *
 * Prevents duplicate scheduling via AsyncStorage persistence.
 */
export async function scheduleAppointmentReminders(
  appointment: AppointmentNotificationData,
): Promise<boolean> {
  try {
    // Check for duplicate
    const scheduled = await getScheduledIds();
    if (scheduled[appointment.id]?.length > 0) {
      console.log(
        '[NotificationService] Already scheduled for:',
        appointment.id,
      );
      return false;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[NotificationService] No permission — skipping schedule');
      return false;
    }

    const now = Date.now();
    const appointmentMs = appointment.appointmentTime.getTime();
    const tenMinBefore = appointmentMs - TEN_MINUTES_MS;

    const timeStr = formatTime(appointment.appointmentTime);
    const notificationIds: string[] = [];

    // Common notification payload
    const baseNotification = {
      title: '📋 Upcoming Appointment',
      body: `Patient: ${appointment.patientName}\nConcern: ${appointment.concern} at ${timeStr}`,
      data: {
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        concern: appointment.concern,
        timeStr: timeStr,
        meetingLink: appointment.meetingLink || '',
        doctorId: appointment.doctorId || '',
        dateLabel: appointment.dateLabel || '',
        type: 'appointment_reminder',
      },
      android: {
        channelId: CHANNEL_ID,
        groupId: GROUP_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: '🎥 Join Now',
            pressAction: { id: 'join_now' },
          },
          {
            title: '✕ Clear',
            pressAction: { id: 'clear' },
          },
        ],
        sound: 'default',
        vibrationPattern: [0, 300, 200, 300],
        lights: ['#1572B7', 300, 600] as [string, number, number],
        smallIcon: 'ic_launcher',
        color: '#1572B7',
        showTimestamp: true,
        timestamp: appointmentMs,
      },
      ios: {
        sound: 'default',
        categoryId: 'appointment_reminder',
        interruptionLevel: 'timeSensitive' as const,
      },
    };

    // ── Notification 1: 10 minutes before ──
    if (tenMinBefore > now) {
      const earlyId = `${appointment.id}_10min`;
      const earlyTrigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: tenMinBefore,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: earlyId,
          ...baseNotification,
          title: '⏰ Appointment in 10 Minutes',
          body: `Patient: ${appointment.patientName}\nConcern: ${appointment.concern} at ${timeStr}`,
        },
        earlyTrigger,
      );
      notificationIds.push(earlyId);
      console.log(
        '[NotificationService] Scheduled 10-min reminder:',
        new Date(tenMinBefore).toLocaleString(),
      );
    }

    // ── Notification 2: At appointment time ──
    if (appointmentMs > now) {
      const atTimeId = `${appointment.id}_atTime`;
      const atTimeTrigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: appointmentMs,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: atTimeId,
          ...baseNotification,
          title: '🔔 Appointment Now',
          body: `Appointment for ${appointment.patientName} (${appointment.concern}) is starting now!`,
        },
        atTimeTrigger,
      );
      notificationIds.push(atTimeId);
      console.log(
        '[NotificationService] Scheduled at-time reminder:',
        new Date(appointmentMs).toLocaleString(),
      );
    }

    // If nothing was scheduled (appointment already passed)
    if (notificationIds.length === 0) {
      console.log(
        '[NotificationService] Appointment already passed — nothing scheduled',
      );
      return false;
    }

    // Persist scheduled IDs
    scheduled[appointment.id] = notificationIds;
    await saveScheduledIds(scheduled);

    return true;
  } catch (error) {
    console.error('[NotificationService] Schedule error:', error);
    return false;
  }
}

/* ─────────── Cancellation ─────────── */

/**
 * Cancels all scheduled notifications for a specific appointment.
 */
export async function cancelAppointmentReminders(
  appointmentId: string,
): Promise<void> {
  try {
    const scheduled = await getScheduledIds();
    const ids = scheduled[appointmentId];

    if (ids?.length > 0) {
      for (const id of ids) {
        await notifee.cancelNotification(id);
      }
      console.log(
        '[NotificationService] Cancelled reminders for:',
        appointmentId,
      );
    }

    delete scheduled[appointmentId];
    await saveScheduledIds(scheduled);
  } catch (error) {
    console.error('[NotificationService] Cancel error:', error);
  }
}

/**
 * Cancels ALL pending appointment notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await notifee.cancelAllNotifications();
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[NotificationService] All reminders cancelled');
  } catch (error) {
    console.error('[NotificationService] Cancel-all error:', error);
  }
}

/* ─────────── Query Helpers ─────────── */

/**
 * Checks if an appointment already has reminders scheduled.
 */
export async function isReminderScheduled(
  appointmentId: string,
): Promise<boolean> {
  const scheduled = await getScheduledIds();
  return (scheduled[appointmentId]?.length ?? 0) > 0;
}

/**
 * Returns all pending trigger notifications (for debugging).
 */
export async function getPendingNotifications() {
  return notifee.getTriggerNotificationIds();
}
