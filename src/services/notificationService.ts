import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { Task } from '@/types';

import { loadReminderMap, saveReminderMap } from './storageService';

/*
 * Local, scheduled notifications only.
 *
 * From SDK 53, Expo Go on Android throws as soon as expo-notifications is
 * imported. A normal `import` here would crash the whole app in Expo Go,
 * because this file is loaded by the root layout. So the module is loaded
 * lazily, and only in a real build (APK/AAB or development build).
 * In Expo Go every function below is a safe no-op, and saving a task with a
 * reminder reports "reminder not set" instead of crashing.
 */

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'task-reminders';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** True when reminders can be scheduled on this device (false in Expo Go). */
export const remindersSupported = !isExpoGo && Platform.OS !== 'web';

let notifications: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
  if (!remindersSupported) return null;
  if (notifications) return notifications;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded: NotificationsModule = require('expo-notifications');
  loaded.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  notifications = loaded;
  return notifications;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancelReminder(taskId: string, map: Record<string, string>): Promise<void> {
  const existing = map[taskId];
  if (!existing) return;
  const Notifications = getNotifications();
  if (Notifications) {
    await Notifications.cancelScheduledNotificationAsync(existing).catch(() => undefined);
  }
  delete map[taskId];
}

/**
 * Brings this device's scheduled reminder in line with the task's current state.
 * Safe to call after every create or update. Returns false if a reminder was
 * wanted but could not be scheduled (Expo Go, permission denied, or the time
 * has already passed).
 */
export async function syncTaskReminder(task: Task, minutesBefore: number): Promise<boolean> {
  const map = await loadReminderMap();
  await cancelReminder(task.id, map);

  const wantsReminder = task.remind && task.due_at !== null && task.status !== 'done';
  if (!wantsReminder || task.due_at === null) {
    await saveReminderMap(map);
    return true;
  }

  const Notifications = getNotifications();
  const fireAt = new Date(new Date(task.due_at).getTime() - minutesBefore * 60 * 1000);
  if (!Notifications || fireAt.getTime() <= Date.now()) {
    await saveReminderMap(map);
    return false;
  }

  if (!(await ensureNotificationPermission())) {
    await saveReminderMap(map);
    return false;
  }

  map[task.id] = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task due soon',
      body: task.title,
      data: { taskId: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: CHANNEL_ID,
    },
  });
  await saveReminderMap(map);
  return true;
}

export async function removeTaskReminder(taskId: string): Promise<void> {
  const map = await loadReminderMap();
  await cancelReminder(taskId, map);
  await saveReminderMap(map);
}

export async function removeAllReminders(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
